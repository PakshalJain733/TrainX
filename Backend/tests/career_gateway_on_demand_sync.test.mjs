import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query, pool } from '../src/config/db.js';
import {
  executeOnDemandSync,
  getSyncExecutions,
  getSyncExecutionById,
  retrySyncExecution,
} from '../src/modules/integrations/careerGateway/services/onDemandSync.service.js';
import { collectTrainingExportRecords } from '../src/modules/integrations/careerGateway/services/trainingDataExport.service.js';
import { executeDailyTrainingSync } from '../src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js';
import { authenticateCareerGatewayService } from '../src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js';

const S2S_SECRET = process.env.TRAINX_INTEGRATION_SECRET || process.env.CAREER_GATEWAY_SERVICE_SECRET || 'career_gateway_trainx_s2s_secret_key_2026';

// Helper to sign S2S JWT
function makeS2SToken(overrides = {}) {
  const claims = {
    iss: 'career-gateway',
    aud: 'trainx',
    sub: 'career-gateway-integration-service',
    scope: 'training_sync',
    ...overrides,
  };
  return jwt.sign(claims, S2S_SECRET, { algorithm: 'HS256', expiresIn: '15m' });
}

// Mock Receiver Client that simulates Career Gateway receiver responses
class MockCareerGatewayClient {
  constructor(behavior = 'success') {
    this.behavior = behavior;
    this.lastPayload = null;
  }

  async sendTrainingRecords(payload) {
    this.lastPayload = payload;
    if (this.behavior === 'success') {
      return { success: true, acknowledged: true, records_ingested: payload.records_count };
    }
    if (this.behavior === 'timeout') {
      throw new Error('Career Gateway API request timed out after 15000ms');
    }
    throw new Error('Career Gateway receiver returned HTTP 500 Internal Error');
  }
}

test('Career Gateway On-Demand Synchronization Comprehensive Test Suite', async (t) => {
  // Test Fixture Setup
  const batchRows = await query('SELECT id, college_id FROM batches LIMIT 1');
  const validBatchId = batchRows?.[0]?.id || 1;
  const testCollegeId = batchRows?.[0]?.college_id || 1;

  const testExternalCgId = Math.floor(200000 + Math.random() * 700000);
  const testExternalCgId2 = Math.floor(200000 + Math.random() * 700000);

  // Create test user and student mappings
  const user1Res = await query(
    `INSERT INTO users (name, email, role, college_id, is_active, is_verified)
     VALUES (?, ?, 'student', ?, 1, 1)`,
    [`Test Sync Student 1`, `sync_test_user1_${testExternalCgId}@somaiya.edu`, testCollegeId]
  );
  const testUserId1 = user1Res.insertId;

  const user2Res = await query(
    `INSERT INTO users (name, email, role, college_id, is_active, is_verified)
     VALUES (?, ?, 'student', ?, 1, 1)`,
    [`Test Sync Student 2`, `sync_test_user2_${testExternalCgId2}@somaiya.edu`, testCollegeId]
  );
  const testUserId2 = user2Res.insertId;

  await query(
    `INSERT INTO career_gateway_student_mappings
     (trainx_user_id, career_gateway_student_id, clg_id, eligibility_status)
     VALUES (?, ?, ?, 'eligible'), (?, ?, ?, 'eligible')
     ON DUPLICATE KEY UPDATE eligibility_status = 'eligible'`,
    [testUserId1, testExternalCgId, `SOM-${testExternalCgId}`, testUserId2, testExternalCgId2, `SOM-${testExternalCgId2}`]
  );

  // Add sample records for student 1 (Category: attendance)
  await query(
    `INSERT INTO attendance (college_id, batch_id, user_id, session_date, status, remarks)
     VALUES (?, ?, ?, CURDATE(), 'present', 'On-Demand Sync Test')`,
    [testCollegeId, validBatchId, testUserId1]
  );

  t.after(async () => {
    // Cleanup fixture data
    await query('DELETE FROM attendance WHERE remarks = ?', ['On-Demand Sync Test']).catch(() => {});
    await query('DELETE FROM career_gateway_student_mappings WHERE career_gateway_student_id IN (?, ?)', [testExternalCgId, testExternalCgId2]).catch(() => {});
    await query('DELETE FROM users WHERE id IN (?, ?)', [testUserId1, testUserId2]).catch(() => {});
    await query('DELETE FROM career_gateway_sync_executions WHERE career_gateway_student_id IN (?, ?)', [testExternalCgId, testExternalCgId2]).catch(() => {});
  });

  // --------------------------------------------------------------------------
  // Requirement 1 & 14: Career Gateway triggers individual student sync (Mode A)
  // --------------------------------------------------------------------------
  await t.test('1 & 14: Mode A: Career Gateway can trigger individual student sync and succeed on acknowledgment', async () => {
    const mockClient = new MockCareerGatewayClient('success');
    const result = await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'career_gateway',
      requestedBy: 'career-gateway-integration-service',
      careerGatewayStudentId: testExternalCgId,
      collegeId: testCollegeId,
      requestId: `REQ-TEST-${Date.now()}`,
      client: mockClient,
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.student_id, testExternalCgId);
    assert.ok(result.sync_id.startsWith('SYNC-MAN-'));
    assert.ok(result.records_processed >= 1, 'Should process at least the test attendance record');
    assert.equal(result.records_failed, 0);

    // Verify record in database
    const dbRecord = await getSyncExecutionById(result.sync_id);
    assert.equal(dbRecord.status, 'completed');
    assert.equal(dbRecord.trigger_source, 'career_gateway');
    assert.ok(dbRecord.completed_at !== null);
  });

  // --------------------------------------------------------------------------
  // Requirement 2: Individual sync returns ONLY requested student's records
  // --------------------------------------------------------------------------
  await t.test('2: Individual sync returns only the requested student records with zero data leakage', async () => {
    const mockClient = new MockCareerGatewayClient('success');
    await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'career_gateway',
      careerGatewayStudentId: testExternalCgId,
      collegeId: testCollegeId,
      client: mockClient,
    });

    const payload = mockClient.lastPayload;
    assert.ok(payload, 'Payload must be dispatched to client');
    assert.equal(payload.source, 'trainx');
    assert.equal(payload.schema_version, '1.0');

    // Attendance records in payload must only belong to student 1
    for (const att of payload.data.attendance) {
      assert.equal(att.student_id, testExternalCgId, 'Attendance must belong strictly to requested student');
      assert.notEqual(att.student_id, testExternalCgId2, 'Must not leak other student records');
    }

    // Assessment results must only belong to student 1
    for (const res of payload.data.assessment_results) {
      assert.equal(res.student_id, testExternalCgId);
    }
  });

  // --------------------------------------------------------------------------
  // Requirement 3 & 17: College-wide sync returns only selected tenant's records
  // --------------------------------------------------------------------------
  await t.test('3 & 17: College-wide sync isolates tenant records strictly', async () => {
    const mockClient = new MockCareerGatewayClient('success');
    const result = await executeOnDemandSync({
      syncType: 'manual_college',
      triggerSource: 'trainx_admin',
      requestedBy: 'admin@somaiya.edu',
      collegeId: testCollegeId,
      isAsync: false,
      client: mockClient,
    });

    assert.equal(result.status, 'completed');
    const payload = mockClient.lastPayload;
    assert.ok(payload);
    // Batches in payload must strictly match requested college
    for (const b of payload.data.batches) {
      assert.equal(b.college_id, testCollegeId, 'All exported batches must belong to requested college');
    }
  });

  // --------------------------------------------------------------------------
  // Requirement 4: TrainX Administrator can initiate manual sync (Mode B)
  // --------------------------------------------------------------------------
  await t.test('4: TrainX administrator can initiate manual student and college sync', async () => {
    const mockClient = new MockCareerGatewayClient('success');
    const result = await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'trainx_admin',
      requestedBy: 'admin_officer@trainx.io',
      trainxUserId: testUserId1,
      collegeId: testCollegeId,
      client: mockClient,
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.sync_type, 'manual_student');

    const dbRecord = await getSyncExecutionById(result.sync_id);
    assert.equal(dbRecord.trigger_source, 'trainx_admin');
    assert.equal(dbRecord.requested_by, 'admin_officer@trainx.io');
  });

  // --------------------------------------------------------------------------
  // Requirement 6: Invalid S2S token is rejected (401)
  // --------------------------------------------------------------------------
  await t.test('6: S2S Authentication rejects missing or invalid tokens', async () => {
    let statusCode = null;
    let errorMsg = null;
    const mockRes = {
      status(code) { statusCode = code; return this; },
      json(obj) { errorMsg = obj.message; return this; }
    };

    // Missing token
    authenticateCareerGatewayService({ headers: {} }, mockRes, () => {});
    assert.equal(statusCode, 401);
    assert.match(errorMsg, /Missing Career Gateway service authorization/i);

    // Tampered / invalid token
    statusCode = null;
    authenticateCareerGatewayService(
      { headers: { authorization: 'Bearer invalid.tampered.token' } },
      mockRes,
      () => {}
    );
    assert.equal(statusCode, 401);
    assert.match(errorMsg, /Invalid service token/i);
  });

  // --------------------------------------------------------------------------
  // Requirement 7: Wrong issuer, audience, subject or scope is rejected (403)
  // --------------------------------------------------------------------------
  await t.test('7: S2S Authentication enforces exact issuer, audience, subject and scope', async () => {
    let statusCode = null;
    let errorMsg = null;
    const mockRes = {
      status(code) { statusCode = code; return this; },
      json(obj) { errorMsg = obj.message; return this; }
    };

    // Wrong subject
    const badSubToken = makeS2SToken({ sub: 'unauthorized_subject' });
    authenticateCareerGatewayService({ headers: { authorization: `Bearer ${badSubToken}` } }, mockRes, () => {});
    assert.equal(statusCode, 403);
    assert.match(errorMsg, /Invalid or missing service token subject/i);

    // Wrong scope
    statusCode = null;
    const badScopeToken = makeS2SToken({ scope: 'read_only_public' });
    authenticateCareerGatewayService({ headers: { authorization: `Bearer ${badScopeToken}` } }, mockRes, () => {});
    assert.equal(statusCode, 403);
    assert.match(errorMsg, /Insufficient token scope/i);
  });

  // --------------------------------------------------------------------------
  // Requirement 8 & 9: Duplicate request ID / double clicks handled idempotently
  // --------------------------------------------------------------------------
  await t.test('8 & 9: Stable request_id is idempotent and prevents duplicate execution', async () => {
    const fixedRequestId = `IDEMP-${Date.now()}-${Math.random()}`;
    const mockClient = new MockCareerGatewayClient('success');

    const firstRun = await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'career_gateway',
      careerGatewayStudentId: testExternalCgId,
      collegeId: testCollegeId,
      requestId: fixedRequestId,
      client: mockClient,
    });

    assert.equal(firstRun.status, 'completed');
    const firstSyncId = firstRun.sync_id;

    // Second call with same request_id
    const secondRun = await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'career_gateway',
      careerGatewayStudentId: testExternalCgId,
      collegeId: testCollegeId,
      requestId: fixedRequestId,
      client: mockClient,
    });

    assert.equal(secondRun.idempotent, true);
    assert.equal(secondRun.sync_id, firstSyncId, 'Must return the existing sync execution record');
  });

  // --------------------------------------------------------------------------
  // Requirement 10: Manual sync does NOT advance the global scheduler checkpoint
  // --------------------------------------------------------------------------
  await t.test('10: Critical Safeguard: Manual sync does not advance scheduled checkpoint cursor', async () => {
    // Read checkpoint before manual sync
    const [beforeCp] = await query(
      "SELECT last_successful_sync_at, last_successful_cursor FROM career_gateway_sync_checkpoints WHERE sync_type = 'daily_training_sync' LIMIT 1"
    );

    const mockClient = new MockCareerGatewayClient('success');
    await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'career_gateway',
      careerGatewayStudentId: testExternalCgId,
      collegeId: testCollegeId,
      client: mockClient,
    });

    // Read checkpoint after manual sync
    const [afterCp] = await query(
      "SELECT last_successful_sync_at, last_successful_cursor FROM career_gateway_sync_checkpoints WHERE sync_type = 'daily_training_sync' LIMIT 1"
    );

    if (beforeCp) {
      assert.equal(
        new Date(afterCp.last_successful_sync_at).getTime(),
        new Date(beforeCp.last_successful_sync_at).getTime(),
        'Manual sync must NEVER modify last_successful_sync_at in scheduled checkpoint table'
      );
      assert.equal(afterCp.last_successful_cursor, beforeCp.last_successful_cursor);
    }
  });

  // --------------------------------------------------------------------------
  // Requirement 13 & 15: Failed receiver delivery preserves retryability and reports error
  // --------------------------------------------------------------------------
  await t.test('13 & 15: Failed receiver delivery records status and preserves retryability', async () => {
    const failingClient = new MockCareerGatewayClient('error');
    const result = await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'career_gateway',
      careerGatewayStudentId: testExternalCgId,
      collegeId: testCollegeId,
      client: failingClient,
    });

    assert.equal(result.status, 'failed');
    assert.ok(result.error);
    assert.equal(result.records_processed, 0);

    const dbRecord = await getSyncExecutionById(result.sync_id);
    assert.equal(dbRecord.status, 'failed');
    assert.ok(dbRecord.error_summary);

    // Test retry execution
    const successClient = new MockCareerGatewayClient('success');
    const retryResult = await retrySyncExecution(result.sync_id, 'admin_retry_tester', testCollegeId);
    assert.ok(retryResult.sync_id);
  });

  // --------------------------------------------------------------------------
  // Requirement 16: Empty export handled cleanly without failure
  // --------------------------------------------------------------------------
  await t.test('16: Empty export is handled cleanly and marked completed without failure', async () => {
    // Student 2 has zero attendance/assessments
    const mockClient = new MockCareerGatewayClient('success');
    const result = await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'career_gateway',
      careerGatewayStudentId: testExternalCgId2,
      collegeId: testCollegeId,
      client: mockClient,
    });

    assert.equal(result.status, 'completed');
    assert.equal(result.records_processed, 0);
    assert.equal(result.records_failed, 0);
  });

  // --------------------------------------------------------------------------
  // Requirement 18: Synchronization history is strictly tenant-scoped
  // --------------------------------------------------------------------------
  await t.test('18: Synchronization history queries enforce tenant boundaries', async () => {
    const history = await getSyncExecutions({ collegeId: testCollegeId, page: 1, limit: 10 });
    assert.ok(Array.isArray(history.executions));
    for (const exec of history.executions) {
      if (exec.college_id) {
        assert.equal(exec.college_id, testCollegeId, 'History execution must belong strictly to requested tenant');
      }
    }
  });

  // --------------------------------------------------------------------------
  // Requirement 20: All 6 canonical export categories are present in envelope
  // --------------------------------------------------------------------------
  await t.test('20: Export envelope contains all 6 canonical categories with correct structure', async () => {
    const mockClient = new MockCareerGatewayClient('success');
    await executeOnDemandSync({
      syncType: 'manual_student',
      triggerSource: 'career_gateway',
      careerGatewayStudentId: testExternalCgId,
      collegeId: testCollegeId,
      client: mockClient,
    });

    const payload = mockClient.lastPayload;
    assert.ok(payload.data, 'Payload data container must exist');
    assert.ok(Array.isArray(payload.data.batches), 'batches category must exist');
    assert.ok(Array.isArray(payload.data.sessions), 'sessions category must exist');
    assert.ok(Array.isArray(payload.data.attendance), 'attendance category must exist');
    assert.ok(Array.isArray(payload.data.assessments), 'assessments category must exist');
    assert.ok(Array.isArray(payload.data.assessment_results), 'assessment_results category must exist');
    assert.ok(Array.isArray(payload.data.student_progress), 'student_progress category must exist');
  });
});

test.after(async () => {
  await pool.end();
});

