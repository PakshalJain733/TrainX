import test from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { query } from '../src/config/db.js';

const INBOUND_SECRET = process.env.TRAINX_INTEGRATION_SECRET || 'career_gateway_to_trainx_inbound_secret_2026';
const PARTNER_API_KEY = process.env.TRAINX_API_KEY || 'trainx_cg_partner_api_key_2026';

function generateS2SToken(overrides = {}) {
  const payload = {
    iss: 'career-gateway',
    aud: 'trainx',
    sub: 'career-gateway-integration-service',
    scope: 'training_sync',
    exp: Math.floor(Date.now() / 1000) + 900,
    ...overrides,
  };
  return jwt.sign(payload, INBOUND_SECRET, { algorithm: 'HS256' });
}

function makeRequest(server, path, method = 'POST', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    const postData = body ? JSON.stringify(body) : null;
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

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
          let parsedBody = null;
          try {
            parsedBody = JSON.parse(rawData);
          } catch (_) {
            parsedBody = rawData;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedBody,
          });
        });
      }
    );

    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

test('Career Gateway Batch Training Analytics & Synchronization Support Suite', async (t) => {
  let server;
  let testCollegeId = 1;
  let testUserId;
  let testCgStudentId = 884411;
  let testClgId = 'VU3F2425070';
  let testEmail = 'analytics_test_student@pvppcoe.ac.in';
  let testBatchId;

  t.before(async () => {
    // 1. Ensure college tenant exists
    try {
      const colleges = await query(
        `SELECT id FROM colleges WHERE LOWER(career_gateway_college_id) = 'pvppcoe' OR LOWER(code) = 'pvppcoe' LIMIT 1`
      );
      if (colleges.length > 0) {
        testCollegeId = colleges[0].id;
      } else {
        const ins = await query(
          `INSERT INTO colleges (name, code, career_gateway_college_id, is_active)
           VALUES ('PVPPCOE College of Engineering', 'pvppcoe', 'pvppcoe', 1)`
        );
        testCollegeId = ins.insertId;
      }
    } catch (_) {}

    // 2. Ensure test batch exists
    const [batchRow] = await query(
      `SELECT id FROM batches WHERE college_id = ? LIMIT 1`,
      [testCollegeId]
    );
    if (batchRow) {
      testBatchId = batchRow.id;
    } else {
      const insB = await query(
        `INSERT INTO batches (college_id, name, topic, status, date)
         VALUES (?, 'Python Full Stack 2026', 'Full Stack Engineering', 'active', '2026-01-15')`,
        [testCollegeId]
      );
      testBatchId = insB.insertId;
    }

    // 3. Ensure test student exists
    const [existingUser] = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [testEmail]);
    if (existingUser) {
      testUserId = existingUser.id;
    } else {
      const insU = await query(
        `INSERT INTO users (name, email, role, college_id, career_gateway_student_id, source_system, is_active, is_verified, is_approved)
         VALUES ('Test Student', ?, 'student', ?, ?, 'career_gateway', 1, 1, 1)`,
        [testEmail, testCollegeId, testCgStudentId]
      );
      testUserId = insU.insertId;
    }

    // Ensure student record
    await query(
      `INSERT INTO students (user_id, college_id, batch_id, roll_number, clg_id, career_gateway_student_id, source_system)
       VALUES (?, ?, ?, ?, ?, ?, 'career_gateway')
       ON DUPLICATE KEY UPDATE batch_id = VALUES(batch_id), roll_number = VALUES(roll_number)`,
      [testUserId, testCollegeId, testBatchId, testClgId, testClgId, testCgStudentId]
    ).catch(() => {});

    // Ensure mapping
    await query(
      `INSERT INTO career_gateway_student_mappings (trainx_user_id, career_gateway_student_id, clg_id, eligibility_status, source_system)
       VALUES (?, ?, ?, 'eligible', 'career_gateway')
       ON DUPLICATE KEY UPDATE clg_id = VALUES(clg_id), eligibility_status = 'eligible'`,
      [testUserId, testCgStudentId, testClgId]
    ).catch(() => {});

    // 4. Start local HTTP test server
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // Test 1: S2S Authentication - Rejects request without Authorization header
  await t.test('1. Rejects sync request without Authorization header with 401', async () => {
    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/college',
      'POST',
      {},
      { college_id: 'pvppcoe' }
    );
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  // Test 2: S2S Authentication - Rejects request with invalid token
  await t.test('2. Rejects request with invalid authorization token with 401', async () => {
    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/college',
      'POST',
      { Authorization: 'Bearer totally_invalid_random_secret_token_abc' },
      { college_id: 'pvppcoe' }
    );
    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  // Test 3: College Sync with S2S JWT
  await t.test('3. Successfully executes college-wide sync via S2S Bearer JWT', async () => {
    const token = generateS2SToken({ scope: 'training_sync' });
    const payload = {
      source: 'career_gateway',
      scope: 'college',
      college_id: 'pvppcoe',
      career_gateway_college_id: 'pvppcoe',
      requested_by: 15,
      timestamp: '2026-11-10T02:00:00.000Z',
    };

    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/college',
      'POST',
      {
        Authorization: `Bearer ${token}`,
        'X-Correlation-ID': 'corr-college-sync-101',
      },
      payload
    );

    if (res.statusCode !== 200) {
      console.error('Test 3 Failed response:', res.statusCode, res.body);
    }
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'completed');
    assert.strictEqual(res.body.college_id, 'pvppcoe');
    assert.ok(res.body.timestamp, 'timestamp should be present');
    assert.ok(res.body.data, 'data should be present');

    const data = res.body.data;
    assert.ok(Array.isArray(data.batches), 'batches must be an array');
    assert.ok(Array.isArray(data.sessions), 'sessions must be an array');
    assert.ok(Array.isArray(data.attendance), 'attendance must be an array');
    assert.ok(Array.isArray(data.assessments), 'assessments must be an array');
    assert.ok(Array.isArray(data.assessment_results), 'assessment_results must be an array');
    assert.ok(Array.isArray(data.student_progress), 'student_progress must be an array');

    // Verify batches structure
    assert.ok(data.batches.length > 0);
    assert.ok(data.batches[0].trainx_batch_id);
    assert.ok(data.batches[0].batch_name);
    assert.ok(data.batches[0].course_name);
    assert.ok(data.batches[0].status);
  });

  // Test 4: College Sync with Static Partner API Key
  await t.test('4. Successfully executes college-wide sync via Bearer TRAINX_API_KEY', async () => {
    const payload = {
      source: 'career_gateway',
      scope: 'college',
      college_id: 'pvppcoe',
    };

    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/college',
      'POST',
      {
        Authorization: `Bearer ${PARTNER_API_KEY}`,
      },
      payload
    );

    if (res.statusCode !== 200) {
      console.error('Test 3 Failed response:', res.statusCode, res.body);
    }
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'completed');
    assert.ok(res.body.data.batches);
  });

  // Test 5: Single Student Sync by Roll Number with Career Gateway Envelope
  await t.test('5. Successfully synchronizes student by roll_number and returns standard envelope', async () => {
    const payload = {
      source: 'career_gateway',
      scope: 'student',
      roll_number: testClgId,
      college_id: 'pvppcoe',
      timestamp: '2026-11-10T02:00:00.000Z',
    };

    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/student',
      'POST',
      {
        Authorization: `Bearer ${PARTNER_API_KEY}`,
        'X-Correlation-ID': 'corr-student-sync-202',
      },
      payload
    );

    if (res.statusCode !== 200) {
      console.error('Test 3 Failed response:', res.statusCode, res.body);
    }
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'completed');
    assert.strictEqual(res.body.student_id, testClgId);
    assert.ok(res.body.data);
    assert.ok(Array.isArray(res.body.data.batches));
    assert.ok(Array.isArray(res.body.data.sessions));
    assert.ok(Array.isArray(res.body.data.attendance));
    assert.ok(Array.isArray(res.body.data.assessments));
    assert.ok(Array.isArray(res.body.data.assessment_results));
    assert.ok(Array.isArray(res.body.data.student_progress));
  });

  // Test 6: Single Student Sync by Email
  await t.test('6. Successfully synchronizes student by email', async () => {
    const token = generateS2SToken({ scope: 'training_sync' });
    const payload = {
      source: 'career_gateway',
      scope: 'student',
      email: testEmail,
      college_id: 'pvppcoe',
    };

    const res = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync/student',
      'POST',
      { Authorization: `Bearer ${token}` },
      payload
    );

    if (res.statusCode !== 200) {
      console.error('Test 3 Failed response:', res.statusCode, res.body);
    }
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.status, 'completed');
    assert.ok(res.body.data.batches.length > 0);
  });

  // Test 7: Alias Routes /sync-college and /sync-student
  await t.test('7. Alias routes /sync-college and /sync-student return identical 200 format', async () => {
    const resCol = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync-college',
      'POST',
      { Authorization: `Bearer ${PARTNER_API_KEY}` },
      { college_id: 'pvppcoe' }
    );
    assert.strictEqual(resCol.statusCode, 200);
    assert.strictEqual(resCol.body.status, 'completed');

    const resStu = await makeRequest(
      server,
      '/api/v1/integrations/career-gateway/sync-student',
      'POST',
      { Authorization: `Bearer ${PARTNER_API_KEY}` },
      { roll_number: testClgId }
    );
    assert.strictEqual(resStu.statusCode, 200);
    assert.strictEqual(resStu.body.status, 'completed');
  });
});
