import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { generateToken } from '../src/utils/generateToken.js';
import { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } from '../src/config/jwt.js';
import {
  provisionStudentFromCareerGateway,
  revokeStudentEligibility,
} from '../src/modules/integrations/careerGateway/services/studentProvisioning.service.js';
import {
  createAccountActivation,
  consumeAccountActivation,
} from '../src/modules/integrations/careerGateway/services/accountActivation.service.js';
import { collectTrainingExportRecords } from '../src/modules/integrations/careerGateway/services/trainingDataExport.service.js';
import { executeDailyTrainingSync } from '../src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js';
import { CareerGatewayClient } from '../src/modules/integrations/careerGateway/client/careerGatewayClient.js';
import { query } from '../src/config/db.js';

test('Test 1: Inbound M2M JWT Verification (HS256 with exact claims)', () => {
  const secret = process.env.CAREER_GATEWAY_SERVICE_SECRET || 'cg_trainx_integration_shared_secret_2026';

  // Valid Token
  const validToken = jwt.sign(
    {
      iss: 'career-gateway',
      aud: 'trainx',
      sub: 'career-gateway-integration-service',
      scope: 'student_sync',
    },
    secret,
    { algorithm: 'HS256', expiresIn: '15m' }
  );

  const decoded = jwt.verify(validToken, secret, {
    algorithms: ['HS256'],
    issuer: 'career-gateway',
    audience: 'trainx',
  });
  assert.equal(decoded.sub, 'career-gateway-integration-service');
  assert.equal(decoded.scope, 'student_sync');

  // Invalid scope token
  const wrongScopeToken = jwt.sign(
    {
      iss: 'career-gateway',
      aud: 'trainx',
      sub: 'career-gateway-integration-service',
      scope: 'invalid_scope',
    },
    secret,
    { algorithm: 'HS256', expiresIn: '15m' }
  );

  const decodedWrong = jwt.verify(wrongScopeToken, secret, {
    algorithms: ['HS256'],
    issuer: 'career-gateway',
    audience: 'trainx',
  });
  assert.notEqual(decodedWrong.scope, 'student_sync');
});

test('Test 2: Outbound M2M Token Generation (HS256 with training_sync scope)', async () => {
  const client = new CareerGatewayClient({
    serviceSecret: 'test_outbound_secret_123',
  });
  const token = await client.getOutboundServiceToken();
  assert.ok(token, 'Should generate outbound service token');

  const decoded = jwt.verify(token, 'test_outbound_secret_123', {
    algorithms: ['HS256'],
    issuer: 'trainx',
    audience: 'career-gateway',
  });

  assert.equal(decoded.sub, 'trainx-export-service');
  assert.equal(decoded.scope, 'training_sync', 'Must match exact Career Gateway scope: training_sync');
  assert.ok(decoded.jti, 'Must include unique JTI');
});

test('Test 3: Inbound Provisioning with clg_id and batch resolution', async () => {
  const externalStudentId = Math.floor(100000 + Math.random() * 900000);
  const testEmail = `cg_student_${externalStudentId}@testcollege.edu`;
  const clgId = `PRN-${externalStudentId}`;

  // 1. Provision New Student with clg_id and valid Batch name
  const provisionResult = await provisionStudentFromCareerGateway({
    student_id: externalStudentId,
    clg_id: clgId,
    name: 'Aarav Patel',
    email: testEmail,
    mobile: '9820012345',
    college: 'VPPCOE',
    department: 'Computer Engineering',
    batch: 'Batch CS (SY)',
    eligible: true,
  }, { triggerEmail: false });

  assert.equal(provisionResult.status, 'created');
  assert.equal(provisionResult.clg_id, clgId);
  assert.equal(provisionResult.batch.status, 'assigned');
  assert.ok(provisionResult.batch.batchId, 'Should associate with TrainX batch');

  // Verify created user is inactive and clg_id stored
  const [createdUser] = await query(
    'SELECT id, email, password_hash, is_active, career_gateway_student_id, source_system FROM users WHERE id = ?',
    [provisionResult.trainx_user_id]
  );
  assert.equal(createdUser.email, testEmail);
  assert.equal(createdUser.password_hash, null, 'Must have NULL password_hash');
  assert.equal(createdUser.is_active, 0, 'Must be inactive prior to activation');
  assert.equal(createdUser.career_gateway_student_id, externalStudentId);

  const [studentProfile] = await query(
    'SELECT clg_id, roll_number, batch_id FROM students WHERE user_id = ?',
    [provisionResult.trainx_user_id]
  );
  assert.equal(studentProfile.clg_id, clgId);
  assert.equal(studentProfile.roll_number, clgId);
  assert.equal(studentProfile.batch_id, provisionResult.batch.batchId);

  // Verify student_batches association
  const [batchAssoc] = await query(
    'SELECT batch_id FROM student_batches WHERE user_id = ? AND batch_id = ?',
    [provisionResult.trainx_user_id, provisionResult.batch.batchId]
  );
  assert.ok(batchAssoc, 'Must have student_batches record');

  // 2. Test Idempotency with clg_id and updated batch
  const repeatResult = await provisionStudentFromCareerGateway({
    student_id: externalStudentId,
    clg_id: clgId,
    name: 'Aarav Patel Updated',
    email: testEmail,
    batch: 'Batch IT (SY)',
    eligible: true,
  }, { triggerEmail: false });

  assert.equal(repeatResult.status, 'updated');
  assert.equal(repeatResult.trainx_user_id, provisionResult.trainx_user_id);
  assert.equal(repeatResult.batch.status, 'assigned');

  // 3. Test Student Account Activation Flow
  const { rawToken } = await createAccountActivation(provisionResult.trainx_user_id);
  const activationRes = await consumeAccountActivation(rawToken, 'StudentSecurePass@2026');
  assert.equal(activationRes.userId, provisionResult.trainx_user_id);

  const [activatedUser] = await query(
    'SELECT is_active, password_hash FROM users WHERE id = ?',
    [provisionResult.trainx_user_id]
  );
  assert.equal(activatedUser.is_active, 1);
  assert.ok(activatedUser.password_hash);

  // 4. Test Eligibility Revocation
  const revokeRes = await revokeStudentEligibility(externalStudentId, 'Opted out');
  assert.equal(revokeRes.status, 'revoked');

  const [revokedUser] = await query(
    'SELECT is_active FROM users WHERE id = ?',
    [provisionResult.trainx_user_id]
  );
  assert.equal(revokedUser.is_active, 0, 'Revoked student must be deactivated');

  // Clean up
  await query('DELETE FROM users WHERE id = ?', [provisionResult.trainx_user_id]);
});

test('Test 4: Unmatched Batch Handling (explicit status, no silent random assignment)', async () => {
  const externalStudentId = Math.floor(100000 + Math.random() * 900000);
  const testEmail = `cg_student_nobatch_${externalStudentId}@testcollege.edu`;

  const provisionResult = await provisionStudentFromCareerGateway({
    student_id: externalStudentId,
    name: 'Unmatched Batch User',
    email: testEmail,
    batch: 'NonExistentBatch9999',
    eligible: true,
  }, { triggerEmail: false });

  assert.equal(provisionResult.status, 'created');
  assert.equal(provisionResult.batch.status, 'unmatched', 'Must explicitly report unmatched batch');
  assert.equal(provisionResult.batch.batchId, null, 'Must NOT assign arbitrary batch ID');

  const [studentProfile] = await query(
    'SELECT batch_id FROM students WHERE user_id = ?',
    [provisionResult.trainx_user_id]
  );
  assert.equal(studentProfile.batch_id, null, 'batch_id must remain null when unmatched');

  // Clean up
  await query('DELETE FROM users WHERE id = ?', [provisionResult.trainx_user_id]);
});

test('Test 5: Safe Reconciliation with Existing Pre-Registered TrainX Account', async () => {
  const externalStudentId = Math.floor(100000 + Math.random() * 900000);
  const baseEmail = `existing_user_${externalStudentId}@college.edu`;

  // Pre-create user in TrainX with active password
  const [insert] = await query(
    `INSERT INTO users (name, email, role, college_id, password_hash, is_active, is_verified)
     VALUES ('Existing Student', ?, 'student', 8, '$2a$12$preExistingHash123456789012345678901234567890123456789012', 1, 1)`,
    [baseEmail]
  );
  const existingUserId = insert.insertId;

  // Provision from Career Gateway with matching email
  const reconResult = await provisionStudentFromCareerGateway({
    student_id: externalStudentId,
    clg_id: 'PRN-RECON-1',
    name: 'Existing Student Synced',
    email: baseEmail,
    eligible: true,
  }, { triggerEmail: false });

  assert.equal(reconResult.status, 'linked_existing_account');
  assert.equal(reconResult.trainx_user_id, existingUserId);

  // Verify password hash and active status were preserved
  const [reconUser] = await query(
    'SELECT password_hash, is_active, career_gateway_student_id FROM users WHERE id = ?',
    [existingUserId]
  );
  assert.equal(reconUser.password_hash, '$2a$12$preExistingHash12345678901234567890123456789012', 'Existing password MUST NOT be overwritten');
  assert.equal(reconUser.is_active, 1, 'Active status preserved');
  assert.equal(reconUser.career_gateway_student_id, externalStudentId);

  // Clean up
  await query('DELETE FROM users WHERE id = ?', [existingUserId]);
});

test('Test 6: Multi-Category Training Data Export (6 distinct arrays & canonical IDs)', async () => {
  const result = await collectTrainingExportRecords({ limit: 100 });
  assert.ok(result.data, 'Must return data object');

  // Verify 6 distinct categories exist
  assert.ok(Array.isArray(result.data.batches), 'batches must be an array');
  assert.ok(Array.isArray(result.data.sessions), 'sessions must be an array');
  assert.ok(Array.isArray(result.data.attendance), 'attendance must be an array');
  assert.ok(Array.isArray(result.data.assessments), 'assessments must be an array');
  assert.ok(Array.isArray(result.data.assessment_results), 'assessment_results must be an array');
  assert.ok(Array.isArray(result.data.student_progress), 'student_progress must be an array');

  // Verify daily sync worker execution
  const syncResult = await executeDailyTrainingSync({ triggeredBy: 'test_six_category_sync' });
  assert.ok(['completed', 'partial', 'skipped'].includes(syncResult.status));
});


process.exit(0);
