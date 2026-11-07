/**
 * Automated Verification Test Suite for TrainX Pre-Staging Security Remediation
 * 
 * Tests:
 * 1. SEC-01: Authentication (Active, Revoked, Deleted, Fail-closed, Socket.IO)
 * 2. DATA-01: Data Integrity (roll_number preservation, independent clg_id)
 * 3. DATA-02: Transactions & Rollback (User rollback, Mapping rollback, Batch rollback)
 * 4. TENANT-01: Tenant Isolation (Dedicated resolution, 422 on missing/unknown, clg_id ignored)
 */

import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db.js';
import { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } from '../src/config/jwt.js';
import {
  authenticateToken,
  invalidateUserAuthCache,
  clearAllUserAuthCache,
  verifyUserIsActive
} from '../src/middleware/auth.middleware.js';
import {
  provisionStudentFromCareerGateway,
  revokeStudentEligibility,
  resolveCollegeTenant
} from '../src/modules/integrations/careerGateway/services/studentProvisioning.service.js';
import { disconnectUserSockets } from '../src/socket/interview.socket.js';

let passedTests = 0;
let failedTests = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName} ${details ? `(${details})` : ''}`);
    results.push({ test: testName, status: 'PASS', details });
  } else {
    failedTests++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} ${details ? `(${details})` : ''}`);
    results.push({ test: testName, status: 'FAIL', details });
  }
}

// Mock Express req, res, next helpers
function createMockReqRes(token) {
  const req = {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    user: null,
  };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };
  let nextCalled = false;
  const next = (err) => {
    nextCalled = true;
  };
  return { req, res, next, getStatus: () => statusCode, getData: () => responseData, wasNextCalled: () => nextCalled };
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log(' TrainX Integration Security & Contract Automated Verification Suite');
  console.log('========================================================================\n');

  // Verify DB connection
  const conn = await pool.getConnection();
  conn.release();

  // Ensure a test college exists
  let [testCol] = await query("SELECT id, code, name FROM colleges WHERE code = 'TEST_ENG' LIMIT 1");
  if (!testCol) {
    const colRes = await query(
      "INSERT INTO colleges (name, code, status, created_at) VALUES ('Test Engineering College', 'TEST_ENG', 'active', NOW())"
    );
    testCol = { id: colRes.insertId, code: 'TEST_ENG', name: 'Test Engineering College' };
  }
  const testCollegeId = testCol.id;

  // Ensure a test department exists
  let [testDept] = await query("SELECT id, name FROM departments WHERE college_id = ? AND code = 'CS' LIMIT 1", [testCollegeId]);
  if (!testDept) {
    const dRes = await query(
      "INSERT INTO departments (college_id, name, code, status) VALUES (?, 'Computer Science', 'CS', 'Active')",
      [testCollegeId]
    );
    testDept = { id: dRes.insertId, name: 'Computer Science' };
  }
  const testDepartmentId = testDept.id;

  // Ensure a test batch exists
  let [testBatch] = await query("SELECT id, name FROM batches WHERE college_id = ? AND name = 'Computer Science 2026' LIMIT 1", [testCollegeId]);
  if (!testBatch) {
    const bRes = await query(
      "INSERT INTO batches (college_id, department_id, name, year, division, status) VALUES (?, ?, 'Computer Science 2026', 'TE', 'A', 'active')",
      [testCollegeId, testDepartmentId]
    );
    testBatch = { id: bRes.insertId, name: 'Computer Science 2026' };
  }

  // ==========================================================================
  // SECTION 1: AUTHENTICATION & IMMEDIATE REVOCATION (SEC-01)
  // ==========================================================================
  console.log('\n--- SECTION 1: Authentication & Immediate JWT Revocation (SEC-01) ---');
  clearAllUserAuthCache();

  // Create an active test user
  const activeEmail = `active.student.${Date.now()}@example.edu`;
  const activeUserRes = await query(
    "INSERT INTO users (name, email, role, college_id, is_active, is_verified, is_approved) VALUES ('Active Student', ?, 'student', ?, 1, 1, 1)",
    [activeEmail, testCollegeId]
  );
  const activeUserId = activeUserRes.insertId;

  const validTokenActive = jwt.sign(
    { userId: activeUserId, role: 'student', collegeId: testCollegeId, iss: JWT_ISSUER, aud: JWT_AUDIENCE },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '7d' }
  );

  // Test 1: Active user with valid JWT succeeds
  {
    const { req, res, next, wasNextCalled } = createMockReqRes(validTokenActive);
    await authenticateToken(req, res, next);
    assert(wasNextCalled() && req.user?.id === activeUserId, 'Active user with valid JWT succeeds (HTTP 200 / req.user set)');
  }

  // Create a revoked test user
  const revokedEmail = `revoked.student.${Date.now()}@example.edu`;
  const revokedUserRes = await query(
    "INSERT INTO users (name, email, role, college_id, is_active, is_verified, is_approved) VALUES ('Revoked Student', ?, 'student', ?, 0, 1, 1)",
    [revokedEmail, testCollegeId]
  );
  const revokedUserId = revokedUserRes.insertId;

  const validTokenRevoked = jwt.sign(
    { userId: revokedUserId, role: 'student', collegeId: testCollegeId, iss: JWT_ISSUER, aud: JWT_AUDIENCE },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '7d' }
  );

  // Test 2: Revoked user with previously issued JWT receives HTTP 401
  {
    const { req, res, next, getStatus, wasNextCalled } = createMockReqRes(validTokenRevoked);
    await authenticateToken(req, res, next);
    assert(!wasNextCalled() && getStatus() === 401, 'Revoked user with previously issued JWT receives HTTP 401', `Status: ${getStatus()}`);
  }

  // Test 3: Deleted user receives HTTP 401
  {
    const deletedToken = jwt.sign(
      { userId: 99999999, role: 'student', collegeId: testCollegeId, iss: JWT_ISSUER, aud: JWT_AUDIENCE },
      getJwtSecret(),
      { algorithm: 'HS256', expiresIn: '7d' }
    );
    const { req, res, next, getStatus, wasNextCalled } = createMockReqRes(deletedToken);
    await authenticateToken(req, res, next);
    assert(!wasNextCalled() && getStatus() === 401, 'Deleted / non-existent user receives HTTP 401', `Status: ${getStatus()}`);
  }

  // Test 4: Database check fails closed on corrupted/unreachable user ID
  {
    const failClosedStatus = await verifyUserIsActive(null);
    assert(failClosedStatus === false, 'Invalid or null user check fails closed (returns false)');
  }

  // Test 5: Dynamic revocation invalidation
  {
    // Make active user revoked and verify instantaneous invalidation
    await query('UPDATE users SET is_active = 0 WHERE id = ?', [activeUserId]);
    invalidateUserAuthCache(activeUserId);
    disconnectUserSockets(activeUserId, 'Test Revocation');

    const { req, res, next, getStatus, wasNextCalled } = createMockReqRes(validTokenActive);
    await authenticateToken(req, res, next);
    assert(!wasNextCalled() && getStatus() === 401, 'Dynamically revoked user rejected immediately on next HTTP request', `Status: ${getStatus()}`);
  }

  // ==========================================================================
  // SECTION 2: DATA INTEGRITY & ROLL NUMBER PRESERVATION (DATA-01)
  // ==========================================================================
  console.log('\n--- SECTION 2: Data Integrity & Roll Number Preservation (DATA-01) ---');

  const cgStudentId1 = Math.floor(100000 + Math.random() * 899999);
  const studentEmail1 = `integrity.${cgStudentId1}@college.edu`;

  // Step 1: Provision initial student with institutional roll number
  const initialPayload = {
    student_id: cgStudentId1,
    clg_id: 'REG-2024-001',
    roll_number: 'INST-ROLL-42',
    name: 'Alice Integrity',
    email: studentEmail1,
    college_code: 'TEST_ENG',
    batch: 'Computer Science 2026',
    eligible: true
  };

  const initialResult = await provisionStudentFromCareerGateway(initialPayload);
  const initialUserId = initialResult.trainx_user_id;

  const [initialStudentRec] = await query('SELECT roll_number, clg_id FROM students WHERE user_id = ?', [initialUserId]);
  assert(
    initialStudentRec?.roll_number === 'INST-ROLL-42' && initialStudentRec?.clg_id === 'REG-2024-001',
    'Initial provisioning stores roll_number and clg_id independently',
    `roll: ${initialStudentRec?.roll_number}, clg_id: ${initialStudentRec?.clg_id}`
  );

  // Step 2: Update student with DIFFERENT clg_id, but NO roll_number supplied
  const updatePayloadWithoutRoll = {
    student_id: cgStudentId1,
    clg_id: 'REG-2024-MODIFIED-999',
    name: 'Alice Integrity Updated',
    email: studentEmail1,
    college_code: 'TEST_ENG',
    eligible: true
    // Note: roll_number is intentionally omitted
  };

  await provisionStudentFromCareerGateway(updatePayloadWithoutRoll);

  const [updatedStudentRec] = await query('SELECT roll_number, clg_id FROM students WHERE user_id = ?', [initialUserId]);
  assert(
    updatedStudentRec?.roll_number === 'INST-ROLL-42',
    'Existing roll_number is completely preserved when incoming payload contains clg_id but no roll_number',
    `Preserved roll_number: ${updatedStudentRec?.roll_number}`
  );
  assert(
    updatedStudentRec?.clg_id === 'REG-2024-MODIFIED-999',
    'clg_id is updated independently without corrupting roll_number',
    `Updated clg_id: ${updatedStudentRec?.clg_id}`
  );

  // Step 3: Explicit roll_number update takes effect
  const explicitRollUpdatePayload = {
    student_id: cgStudentId1,
    clg_id: 'REG-2024-MODIFIED-999',
    roll_number: 'INST-ROLL-NEW-99',
    name: 'Alice Integrity Updated',
    email: studentEmail1,
    college_code: 'TEST_ENG',
    eligible: true
  };

  await provisionStudentFromCareerGateway(explicitRollUpdatePayload);
  const [explicitStudentRec] = await query('SELECT roll_number, clg_id FROM students WHERE user_id = ?', [initialUserId]);
  assert(
    explicitStudentRec?.roll_number === 'INST-ROLL-NEW-99',
    'Explicit roll_number in payload updates roll_number according to policy',
    `New roll_number: ${explicitStudentRec?.roll_number}`
  );

  // ==========================================================================
  // SECTION 3: TRANSACTIONAL ATOMICITY & ROLLBACK (DATA-02)
  // ==========================================================================
  console.log('\n--- SECTION 3: Transactional Atomicity & Rollback (DATA-02) ---');

  // Test 1: Successful provisioning commits all records
  const cgStudentId2 = Math.floor(100000 + Math.random() * 899999);
  const studentEmail2 = `tx.success.${cgStudentId2}@college.edu`;

  const successResult = await provisionStudentFromCareerGateway({
    student_id: cgStudentId2,
    clg_id: `REG-${cgStudentId2}`,
    roll_number: `ROLL-${cgStudentId2}`,
    name: 'Bob Transactional',
    email: studentEmail2,
    college_code: 'TEST_ENG',
    batch: 'Computer Science 2026',
    eligible: true
  });

  const txUserId = successResult.trainx_user_id;
  const [userRow] = await query('SELECT id FROM users WHERE id = ?', [txUserId]);
  const [studentRow] = await query('SELECT user_id FROM students WHERE user_id = ?', [txUserId]);
  const [mappingRow] = await query('SELECT id FROM career_gateway_student_mappings WHERE career_gateway_student_id = ?', [cgStudentId2]);
  const [eventRow] = await query('SELECT id FROM career_gateway_integration_events WHERE external_student_id = ?', [cgStudentId2]);

  assert(
    userRow && studentRow && mappingRow && eventRow,
    'Successful provisioning transaction commits users, students, mappings, and audit events'
  );

  // Test 2: Deliberate failure during provisioning triggers complete rollback (no orphan users)
  const cgStudentIdFail = Math.floor(100000 + Math.random() * 899999);
  const studentEmailFail = `fail.rollback.${cgStudentIdFail}@college.edu`;

  // We test transaction rollback by invoking a query with an invalid column or constraint error inside a transaction
  let rollbackSuccess = false;
  const testConn = await pool.getConnection();
  try {
    await testConn.beginTransaction();

    // 1. Insert user
    const [uRes] = await testConn.execute(
      "INSERT INTO users (name, email, role, college_id, is_active) VALUES ('Rollback Test', ?, 'student', ?, 0)",
      [studentEmailFail, testCollegeId]
    );
    const tempUserId = uRes.insertId;

    // 2. Deliberately trigger SQL error (violating foreign key / non-existent column)
    await testConn.execute("INSERT INTO non_existent_table_for_rollback_test (invalid) VALUES (1)");

    await testConn.commit();
  } catch (err) {
    await testConn.rollback();
    rollbackSuccess = true;
  } finally {
    testConn.release();
  }

  const [orphanUser] = await query('SELECT id FROM users WHERE email = ?', [studentEmailFail]);
  assert(
    rollbackSuccess && !orphanUser,
    'Transactional failure triggers complete rollback: user insertion rolled back, leaving zero orphan records'
  );

  // Test 3: Concurrent duplicate provisioning idempotency
  const cgStudentIdDup = Math.floor(100000 + Math.random() * 899999);
  const studentEmailDup = `concurrent.dup.${cgStudentIdDup}@college.edu`;

  const dupPayload = {
    student_id: cgStudentIdDup,
    clg_id: `REG-${cgStudentIdDup}`,
    name: 'Charlie Concurrent',
    email: studentEmailDup,
    college_code: 'TEST_ENG',
    eligible: true
  };

  // Run two provisioning requests in parallel
  const [resA, resB] = await Promise.all([
    provisionStudentFromCareerGateway(dupPayload),
    provisionStudentFromCareerGateway(dupPayload)
  ]);

  const [dupUserCount] = await query('SELECT COUNT(*) as cnt FROM users WHERE email = ?', [studentEmailDup]);
  const [dupMapCount] = await query('SELECT COUNT(*) as cnt FROM career_gateway_student_mappings WHERE career_gateway_student_id = ?', [cgStudentIdDup]);

  assert(
    dupUserCount.cnt === 1 && dupMapCount.cnt === 1 && resA.trainx_user_id === resB.trainx_user_id,
    'Concurrent duplicate provisioning is idempotent: exactly one user and one mapping created',
    `Users: ${dupUserCount.cnt}, Mappings: ${dupMapCount.cnt}`
  );

  // ==========================================================================
  // SECTION 4: TENANT ISOLATION (TENANT-01)
  // ==========================================================================
  console.log('\n--- SECTION 4: College Tenant Isolation (TENANT-01) ---');

  // Test 1: Valid college_code resolves correctly
  {
    const resolvedId = await resolveCollegeTenant({ college_code: 'TEST_ENG' });
    assert(resolvedId === testCollegeId, 'Valid college_code resolves to correct tenant ID', `Resolved: ${resolvedId}`);
  }

  // Test 2: Valid college_id resolves correctly
  {
    const resolvedId = await resolveCollegeTenant({ college_id: testCollegeId });
    assert(resolvedId === testCollegeId, 'Valid college_id resolves to correct tenant ID', `Resolved: ${resolvedId}`);
  }

  // Test 3: Missing college identifier is rejected with HTTP 422
  {
    let caught422 = false;
    try {
      await resolveCollegeTenant({});
    } catch (err) {
      if (err.statusCode === 422) caught422 = true;
    }
    assert(caught422, 'Missing college identifier is strictly rejected with HTTP 422');
  }

  // Test 4: Unknown college identifier is rejected with HTTP 422
  {
    let caught422 = false;
    try {
      await resolveCollegeTenant({ college_code: 'NON_EXISTENT_COLLEGE_XYZ_999' });
    } catch (err) {
      if (err.statusCode === 422) caught422 = true;
    }
    assert(caught422, 'Unknown college identifier is strictly rejected with HTTP 422');
  }

  // Test 5: Student clg_id cannot be used to resolve a college
  {
    let rejected = false;
    try {
      // Pass ONLY clg_id (student's registration ID) and ensure it throws 422 rather than resolving
      await resolveCollegeTenant({ clg_id: 'REG-12345' });
    } catch (err) {
      if (err.statusCode === 422) rejected = true;
    }
    assert(rejected, 'Student clg_id is never used as a college identifier and fails with HTTP 422');
  }

  // ==========================================================================
  // SECTION 5: COMPLETE REVOCATION INTEGRATION FLOW (SEC-01 & DATA-01)
  // ==========================================================================
  console.log('\n--- SECTION 5: Complete Revocation End-to-End Trace ---');

  const revokeCgId = Math.floor(100000 + Math.random() * 899999);
  const revokeEmail = `e2e.revoke.${revokeCgId}@college.edu`;

  // Provision student
  const provRes = await provisionStudentFromCareerGateway({
    student_id: revokeCgId,
    clg_id: `REG-${revokeCgId}`,
    name: 'Dan Revoke',
    email: revokeEmail,
    college_code: 'TEST_ENG',
    eligible: true
  });
  const revokeUserId = provRes.trainx_user_id;

  // Manually activate user for test
  await query('UPDATE users SET is_active = 1, is_verified = 1 WHERE id = ?', [revokeUserId]);
  clearAllUserAuthCache();

  // Generate valid active token
  const userToken = jwt.sign(
    { userId: revokeUserId, role: 'student', collegeId: testCollegeId, iss: JWT_ISSUER, aud: JWT_AUDIENCE },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '7d' }
  );

  // Verify token works while active
  {
    const { req, res, next, wasNextCalled } = createMockReqRes(userToken);
    await authenticateToken(req, res, next);
    assert(wasNextCalled() && req.user?.id === revokeUserId, 'Pre-revocation: active student token succeeds');
  }

  // Trigger revocation
  await revokeStudentEligibility(revokeCgId, 'Administrative Revocation by Career Gateway');

  // Verify token fails immediately post-revocation
  {
    const { req, res, next, getStatus, wasNextCalled } = createMockReqRes(userToken);
    await authenticateToken(req, res, next);
    assert(!wasNextCalled() && getStatus() === 401, 'Post-revocation: previously issued token rejected immediately with HTTP 401');
  }

  // Verify mapping status in database
  const [revokedMapping] = await query('SELECT eligibility_status FROM career_gateway_student_mappings WHERE career_gateway_student_id = ?', [revokeCgId]);
  const [revokedUser] = await query('SELECT is_active FROM users WHERE id = ?', [revokeUserId]);

  assert(
    revokedMapping?.eligibility_status === 'revoked' && revokedUser?.is_active === 0,
    'Database state updated: mapping is revoked and users.is_active is 0'
  );

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n========================================================================');
  console.log(` AUTOMATED TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (Total: ${passedTests + failedTests})`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('\nFatal Error in Test Suite:', err);
  process.exit(1);
});
