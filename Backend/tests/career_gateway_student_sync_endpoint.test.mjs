import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../src/app.js';
import { query, pool } from '../src/config/db.js';

const S2S_SECRET = process.env.TRAINX_INTEGRATION_SECRET || process.env.CAREER_GATEWAY_SERVICE_SECRET || 'career_gateway_to_trainx_inbound_secret_2026';

function generateS2SToken(claims = {}, secret = S2S_SECRET) {
  const payload = {
    iss: 'career-gateway',
    aud: 'trainx',
    sub: 'career-gateway-integration-service',
    scope: 'student',
    ...claims,
  };
  return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '15m' });
}

// Helper to make local HTTP requests to Express app
function makeRequest(server, path, method = 'POST', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ statusCode: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, body: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

test('On-Demand Student Synchronization Endpoint Test Suite', async (t) => {
  let server;
  let serverPort;

  // Start HTTP server on ephemeral port
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      serverPort = server.address().port;
      resolve();
    });
  });

  // Setup test fixture data
  const testCgStudentId = Math.floor(500000 + Math.random() * 400000);
  const testClgId = `VU3F_TEST_${testCgStudentId}`;
  let testUserId = null;
  let testBatchId = null;
  let testSessionId = null;
  let testAssessmentId = null;
  let testRoadmapId = null;

  try {
    const colRows = await query('SELECT id FROM colleges LIMIT 1');
    const testCollegeId = colRows?.[0]?.id || 1;

    // 1. Create test user
    const userRes = await query(
      `INSERT INTO users (name, email, role, college_id, is_active, is_verified)
       VALUES (?, ?, 'student', ?, 1, 1)`,
      [`Test CG Student ${testCgStudentId}`, `cg_test_${testCgStudentId}@somaiya.edu`, testCollegeId]
    );
    testUserId = userRes.insertId;

    // 2. Create student mapping
    await query(
      `INSERT INTO career_gateway_student_mappings
       (trainx_user_id, career_gateway_student_id, clg_id, eligibility_status, source_system)
       VALUES (?, ?, ?, 'eligible', 'career_gateway')`,
      [testUserId, testCgStudentId, testClgId]
    );

    // 3. Create student profile
    await query(
      `INSERT INTO students
       (user_id, college_id, career_gateway_student_id, clg_id, roll_number, department)
       VALUES (?, ?, ?, ?, ?, 'Computer Engineering')
       ON DUPLICATE KEY UPDATE clg_id = VALUES(clg_id), roll_number = VALUES(roll_number)`,
      [testUserId, testCollegeId, testCgStudentId, testClgId, `ROLL-${testCgStudentId}`]
    );

    // 4. Create batch & enroll student
    const batchRes = await query(
      `INSERT INTO batches (name, topic, college_id, status, date)
       VALUES (?, 'Full Stack Engineering', ?, 'active', '2026-01-15')`,
      [`FSD Batch ${testCgStudentId}`, testCollegeId]
    );
    testBatchId = batchRes.insertId;

    await query(
      `INSERT INTO student_batches (user_id, batch_id) VALUES (?, ?)`,
      [testUserId, testBatchId]
    );

    // 5. Create session & attendance
    const sessionRes = await query(
      `INSERT INTO attendance_sessions
       (college_id, batch_id, title, session_date, start_time, end_time, faculty_id)
       VALUES (?, ?, 'React Hooks & State Management', CURDATE(), '10:00:00', '11:30:00', ?)`,
      [testCollegeId, testBatchId, testUserId]
    );
    testSessionId = sessionRes.insertId;

    await query(
      `INSERT INTO attendance (college_id, batch_id, session_id, user_id, session_date, status, remarks)
       VALUES (?, ?, ?, ?, CURDATE(), 'present', 'Test Attendance')`,
      [testCollegeId, testBatchId, testSessionId, testUserId]
    );

    // 6. Create assessment & attempt
    const asmRes = await query(
      `INSERT INTO assessments (college_id, batch_id, title, category, total_marks, pass_marks)
       VALUES (?, ?, 'React Architecture Quiz', 'quiz', 100, 60)`,
      [testCollegeId, testBatchId]
    );
    testAssessmentId = asmRes.insertId;

    await query(
      `INSERT INTO assessment_attempts (assessment_id, user_id, college_id, score, marks_obtained, total_marks, percentage, status)
       VALUES (?, ?, ?, 85, 85, 100, 85.00, 'completed')`,
      [testAssessmentId, testUserId, testCollegeId]
    );

    // 7. Create roadmap & roadmap item
    const roadmapRes = await query(
      `INSERT INTO roadmaps (student_id, user_id, title, status)
       VALUES (?, ?, 'FSD Learning Roadmap', 'in_progress')`,
      [testUserId, testUserId]
    );
    testRoadmapId = roadmapRes.insertId;

    await query(
      `INSERT INTO roadmap_items (roadmap_id, title, status)
       VALUES (?, 'Component Lifecycle', 'completed')`,
      [testRoadmapId]
    );
  } catch (setupErr) {
    console.warn('[Test Setup Notice]:', setupErr.message);
  }

  t.after(async () => {
    // Cleanup fixtures
    if (testUserId) {
      await query('DELETE FROM roadmap_items WHERE roadmap_id = ?', [testRoadmapId]).catch(() => {});
      await query('DELETE FROM roadmaps WHERE id = ?', [testRoadmapId]).catch(() => {});
      await query('DELETE FROM assessment_attempts WHERE user_id = ?', [testUserId]).catch(() => {});
      await query('DELETE FROM assessments WHERE id = ?', [testAssessmentId]).catch(() => {});
      await query('DELETE FROM attendance WHERE user_id = ?', [testUserId]).catch(() => {});
      await query('DELETE FROM attendance_sessions WHERE id = ?', [testSessionId]).catch(() => {});
      await query('DELETE FROM student_batches WHERE user_id = ?', [testUserId]).catch(() => {});
      await query('DELETE FROM batches WHERE id = ?', [testBatchId]).catch(() => {});
      await query('DELETE FROM career_gateway_student_mappings WHERE trainx_user_id = ?', [testUserId]).catch(() => {});
      await query('DELETE FROM students WHERE user_id = ?', [testUserId]).catch(() => {});
      await query('DELETE FROM users WHERE id = ?', [testUserId]).catch(() => {});
    }
    await new Promise((resolve) => server.close(resolve));
    await pool.end().catch(() => {});
  });

  // Test 1: Authentication failure without token
  await t.test('1. Rejects request without Authorization header with 401', async () => {
    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/student',
      'POST',
      {},
      { student_id: testCgStudentId }
    );
    assert.strictEqual(res.statusCode, 401);
  });

  // Test 2: Authentication failure with invalid secret
  await t.test('2. Rejects request signed with wrong secret with 401', async () => {
    const invalidToken = generateS2SToken({}, 'wrong_secret_key_123456');
    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/student',
      'POST',
      { Authorization: `Bearer ${invalidToken}` },
      { student_id: testCgStudentId }
    );
    assert.strictEqual(res.statusCode, 401);
  });

  // Test 3: Validation failure without student identifier
  await t.test('3. Rejects request missing student identifier with 400', async () => {
    const token = generateS2SToken();
    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/student',
      'POST',
      { Authorization: `Bearer ${token}` },
      { college_id: 'col_somaiya_eng_01' }
    );
    assert.strictEqual(res.statusCode, 400);
  });

  // Test 4: Student not found returns 404
  await t.test('4. Returns 404 if student does not exist', async () => {
    const token = generateS2SToken();
    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/student',
      'POST',
      { Authorization: `Bearer ${token}` },
      { student_id: 999999999 }
    );
    assert.strictEqual(res.statusCode, 404);
  });

  // Test 5: Happy Path - Career Gateway synchronizes student and receives 6 categories in HTTP 200
  await t.test('5. Successfully synchronizes student and returns exact 6 categories synchronously', async () => {
    const token = generateS2SToken();
    const payload = {
      source: 'career_gateway',
      scope: 'student',
      student_id: testCgStudentId,
      career_gateway_student_id: testCgStudentId,
      clg_id: testClgId,
      career_gateway_college_id: 'col_somaiya_eng_01',
      college_id: 'col_somaiya_eng_01',
      requested_by: 15,
      timestamp: new Date().toISOString(),
    };

    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/student',
      'POST',
      { Authorization: `Bearer ${token}` },
      payload
    );

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.message, 'Student training records retrieved successfully');
    assert.ok(res.body.data, 'Response should contain data object');

    const data = res.body.data;
    assert.ok(Array.isArray(data.batches), 'data.batches should be an array');
    assert.ok(Array.isArray(data.sessions), 'data.sessions should be an array');
    assert.ok(Array.isArray(data.attendance), 'data.attendance should be an array');
    assert.ok(Array.isArray(data.assessments), 'data.assessments should be an array');
    assert.ok(Array.isArray(data.assessment_results), 'data.assessment_results should be an array');
    assert.ok(Array.isArray(data.student_progress), 'data.student_progress should be an array');

    // Verify batches structure
    assert.ok(data.batches.length > 0, 'Should return student batch');
    assert.ok(data.batches[0].trainx_batch_id, 'batch should have trainx_batch_id');
    assert.ok(data.batches[0].batch_name, 'batch should have batch_name');
    assert.ok(data.batches[0].course_name, 'batch should have course_name');
    assert.ok(data.batches[0].status, 'batch should have status');

    // Verify sessions structure
    assert.ok(data.sessions.length > 0, 'Should return sessions');
    assert.ok(data.sessions[0].trainx_session_id, 'session should have trainx_session_id');
    assert.ok(data.sessions[0].topic_name, 'session should have topic_name');
    assert.strictEqual(typeof data.sessions[0].duration_minutes, 'number');

    // Verify attendance structure
    assert.ok(data.attendance.length > 0, 'Should return attendance');
    assert.strictEqual(data.attendance[0].student_id, testCgStudentId);
    assert.strictEqual(data.attendance[0].clg_id, testClgId);
    assert.strictEqual(data.attendance[0].attended, 1);
    assert.strictEqual(data.attendance[0].duration_attended_minutes, 90);

    // Verify assessments structure
    assert.ok(data.assessments.length > 0, 'Should return assessments');
    assert.ok(data.assessments[0].trainx_assessment_id);
    assert.strictEqual(data.assessments[0].max_score, 100);
    assert.strictEqual(data.assessments[0].passing_score, 60);

    // Verify assessment_results structure
    assert.ok(data.assessment_results.length > 0, 'Should return assessment_results');
    assert.strictEqual(data.assessment_results[0].student_id, testCgStudentId);
    assert.strictEqual(data.assessment_results[0].score, 85);
    assert.strictEqual(data.assessment_results[0].passed, 1);

    // Verify student_progress structure
    assert.ok(data.student_progress.length > 0, 'Should return student_progress');
    assert.strictEqual(data.student_progress[0].student_id, testCgStudentId);
    assert.strictEqual(data.student_progress[0].clg_id, testClgId);
    assert.ok(data.student_progress[0].total_topics >= 1);
    assert.ok(data.student_progress[0].overall_status);
  });

  // Test 6: Alias route POST /api/v1/integrations/career-gateway/sync-student works identically
  await t.test('6. Alias route /sync-student returns identical 200 format', async () => {
    const token = generateS2SToken();
    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync-student',
      'POST',
      { Authorization: `Bearer ${token}` },
      { student_id: testCgStudentId, clg_id: testClgId }
    );
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.batches));
  });
});
