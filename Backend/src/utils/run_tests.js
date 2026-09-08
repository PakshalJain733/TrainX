import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function run() {
  console.log('=== STEP 1: INITIALIZING ASSESSMENT TABLES IN MYSQL ===');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assessments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      college_id INT,
      batch_id INT,
      created_by INT,
      duration_minutes INT DEFAULT NULL,
      total_marks INT DEFAULT 0,
      pass_marks INT DEFAULT 0,
      status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL,
      FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS assessment_questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      assessment_id INT NOT NULL,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT,
      option_d TEXT,
      correct_option ENUM('a', 'b', 'c', 'd') NOT NULL,
      marks INT DEFAULT 1,
      question_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS assessment_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      assessment_id INT NOT NULL,
      score INT DEFAULT 0,
      percentage DECIMAL(5, 2) DEFAULT 0.00,
      total_questions INT DEFAULT 0,
      correct_answers INT DEFAULT 0,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      submitted_at TIMESTAMP NULL,
      status ENUM('in_progress', 'completed') DEFAULT 'in_progress',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS assessment_answers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_id INT NOT NULL,
      question_id INT NOT NULL,
      selected_option ENUM('a', 'b', 'c', 'd') NULL,
      is_correct BOOLEAN DEFAULT FALSE,
      marks_awarded INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES assessment_attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ Tables created or verified.');

  console.log('\n=== STEP 2: RUNNING BATCH & ASSESSMENT API SUITE ===');
  const BASE_URL = 'http://localhost:5000/api/v1';

  // Setup test tokens
  const adminPayload = { id: 1, name: 'Admin Tester', email: 'admin@test.com', role: 'college_admin', college_id: 1 };
  const studentPayload = { id: 2, name: 'Student Tester', email: 'student@test.com', role: 'student', college_id: 1 };
  const mentorPayload = { id: 3, name: 'Mentor Tester', email: 'mentor@test.com', role: 'mentor', college_id: 1 };

  const adminToken = jwt.sign(adminPayload, config.jwt.secret, { expiresIn: '1h' });
  const studentToken = jwt.sign(studentPayload, config.jwt.secret, { expiresIn: '1h' });
  const mentorToken = jwt.sign(mentorPayload, config.jwt.secret, { expiresIn: '1h' });

  // Ensure default college and test department exist
  let [colleges] = await pool.query('SELECT * FROM colleges LIMIT 1');
  let collegeId = 1;
  if (!colleges.length) {
    const [cRes] = await pool.query("INSERT INTO colleges (name, code) VALUES ('Test College', 'TC01')");
    collegeId = cRes.insertId;
  } else {
    collegeId = colleges[0].id;
  }

  // Ensure a test department exists
  let [deptRows] = await pool.query('SELECT * FROM departments WHERE college_id = ? LIMIT 1', [collegeId]);
  let departmentId;
  let tempDeptCreated = false;
  if (!deptRows.length) {
    const [dRes] = await pool.query('INSERT INTO departments (college_id, name, code) VALUES (?, ?, ?)', [
      collegeId,
      'Computer Engineering',
      'CMPN_' + Date.now(),
    ]);
    departmentId = dRes.insertId;
    tempDeptCreated = true;
  } else {
    departmentId = deptRows[0].id;
  }

  // Ensure test users exist in DB for foreign keys
  await pool.query("INSERT IGNORE INTO users (id, name, email, role, college_id) VALUES (1, 'Admin Tester', 'admin@test.com', 'college_admin', ?)", [collegeId]);
  await pool.query("INSERT IGNORE INTO users (id, name, email, role, college_id) VALUES (2, 'Student Tester', 'student@test.com', 'student', ?)", [collegeId]);
  await pool.query("INSERT IGNORE INTO users (id, name, email, role, college_id) VALUES (3, 'Mentor Tester', 'mentor@test.com', 'mentor', ?)", [collegeId]);

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failedTests++;
    }
  }

  // ----------------------------------------------------
  // BATCH MODULE TESTS
  // ----------------------------------------------------
  console.log('\n--- Testing Batch Module ---');

  // Test Missing Fields
  let res = await fetch(`${BASE_URL}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Incomplete Batch' })
  });
  let data = await res.json();
  assert(res.status === 400 && data.success === false, 'Batch Create - Missing Required Fields rejected (400)');

  // Test Invalid College / Dept
  res = await fetch(`${BASE_URL}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ college_id: 999999, department_id: departmentId, name: 'Invalid College Batch' })
  });
  data = await res.json();
  assert(res.status === 400 && data.success === false, 'Batch Create - Invalid College ID rejected (400)');

  // Test Valid Create Batch
  res = await fetch(`${BASE_URL}/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      college_id: collegeId,
      department_id: departmentId,
      name: 'Batch 2026 CS-A',
      academic_year: '2025-2026',
      start_year: 2022,
      end_year: 2026,
      status: 'active'
    })
  });
  data = await res.json();
  assert(res.status === 201 && data.success === true && data.data.name === 'Batch 2026 CS-A', 'Batch Create - Success (201)');
  const createdBatchId = data.data?.id;

  // Test Get All Batches
  res = await fetch(`${BASE_URL}/batches`);
  data = await res.json();
  assert(res.status === 200 && Array.isArray(data.data) && data.data.some(b => b.id === createdBatchId), 'Batch Get All (200)');

  // Test Get Batch By ID
  res = await fetch(`${BASE_URL}/batches/${createdBatchId}`);
  data = await res.json();
  assert(res.status === 200 && data.data.id === createdBatchId, 'Batch Get By ID (200)');

  // Test Filter by College
  res = await fetch(`${BASE_URL}/batches?college_id=${collegeId}`);
  data = await res.json();
  assert(res.status === 200 && Array.isArray(data.data) && data.data.length > 0, 'Batch Filter by college_id (200)');

  // Test Filter by Department
  res = await fetch(`${BASE_URL}/batches?department_id=${departmentId}`);
  data = await res.json();
  assert(res.status === 200 && Array.isArray(data.data) && data.data.length > 0, 'Batch Filter by department_id (200)');

  // Test Update Batch
  res = await fetch(`${BASE_URL}/batches/${createdBatchId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Batch 2026 CS-A Updated', status: 'inactive' })
  });
  data = await res.json();
  assert(res.status === 200 && data.data.name === 'Batch 2026 CS-A Updated' && data.data.status === 'inactive', 'Batch Update - Success (200)');

  // Test Delete Batch
  res = await fetch(`${BASE_URL}/batches/${createdBatchId}`, { method: 'DELETE' });
  data = await res.json();
  assert(res.status === 200 && data.success === true, 'Batch Delete - Success (200)');

  // Test Get Deleted Batch (404)
  res = await fetch(`${BASE_URL}/batches/${createdBatchId}`);
  data = await res.json();
  assert(res.status === 404 && data.success === false, 'Batch Get by ID - 404 for deleted ID');

  // Create a persistent batch for assessment tests
  const [bRes] = await pool.query(
    'INSERT INTO batches (college_id, department_id, name, academic_year, start_year, end_year, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [collegeId, departmentId, 'Assessment Test Batch', '2025-2026', 2022, 2026, 'active']
  );
  const testBatchId = bRes.insertId;

  // ----------------------------------------------------
  // ASSESSMENT MODULE TESTS
  // ----------------------------------------------------
  console.log('\n--- Testing Assessment Module ---');

  // Test 1: Unauthorized access to create assessment (no token)
  res = await fetch(`${BASE_URL}/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Unauthorized Assessment' })
  });
  data = await res.json();
  assert(res.status === 401, 'Assessment Create - Rejected without auth token (401)');

  // Test 2: Student forbidden to create assessment (Role authorization)
  res = await fetch(`${BASE_URL}/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({ title: 'Student Creating Assessment' })
  });
  data = await res.json();
  assert(res.status === 403, 'Assessment Create - Forbidden for student role (403)');

  // Test 3: Mentor/Admin create assessment
  res = await fetch(`${BASE_URL}/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      title: 'JavaScript & Node.js Core Assessment',
      description: 'Test your backend knowledge',
      college_id: collegeId,
      batch_id: testBatchId,
      duration_minutes: 30,
      total_marks: 20,
      pass_marks: 10
    })
  });
  data = await res.json();
  assert(res.status === 201 && data.success === true && data.data.status === 'draft', 'Assessment Create - Mentor Success (201, draft status)');
  const assessmentId = data.data?.id;

  // Test 4: Cannot publish without questions
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/publish`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  data = await res.json();
  assert(res.status === 400 && data.success === false, 'Assessment Publish - Rejects publishing with 0 questions (400)');

  // Test 5: Add Questions
  // Q1
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      question_text: 'Which keyword is used to declare a constant in JavaScript?',
      option_a: 'var',
      option_b: 'let',
      option_c: 'const',
      option_d: 'constant',
      correct_option: 'c',
      marks: 5,
      question_order: 1
    })
  });
  data = await res.json();
  assert(res.status === 201 && data.data.correct_option === 'c', 'Question 1 Added (201)');
  const q1Id = data.data.id;

  // Q2
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      question_text: 'What does npm stand for?',
      option_a: 'Node Package Manager',
      option_b: 'New Project Model',
      option_c: 'Node Protocol Mode',
      option_d: 'None of the above',
      correct_option: 'a',
      marks: 5,
      question_order: 2
    })
  });
  data = await res.json();
  assert(res.status === 201 && data.data.correct_option === 'a', 'Question 2 Added (201)');
  const q2Id = data.data.id;

  // Q3
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      question_text: 'Which HTTP method is idempotent?',
      option_a: 'POST',
      option_b: 'GET',
      option_c: 'PATCH',
      option_d: 'CONNECT',
      correct_option: 'b',
      marks: 5,
      question_order: 3
    })
  });
  data = await res.json();
  assert(res.status === 201 && data.data.correct_option === 'b', 'Question 3 Added (201)');
  const q3Id = data.data.id;

  // Q4
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${mentorToken}`
    },
    body: JSON.stringify({
      question_text: 'Which module system is standard in ES6?',
      option_a: 'CommonJS',
      option_b: 'AMD',
      option_c: 'ES Modules (import/export)',
      option_d: 'UMD',
      correct_option: 'c',
      marks: 5,
      question_order: 4
    })
  });
  data = await res.json();
  assert(res.status === 201 && data.data.correct_option === 'c', 'Question 4 Added (201)');
  const q4Id = data.data.id;

  // Test 6: Publish Assessment
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/publish`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  data = await res.json();
  assert(res.status === 200 && data.data.status === 'published', 'Assessment Published (200, published status)');

  // Test 7: Student views available published assessments
  res = await fetch(`${BASE_URL}/assessments/available`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  data = await res.json();
  assert(res.status === 200 && data.data.some(a => a.id === assessmentId), 'Student views available assessments (200)');

  // Test 8: Student starts assessment - CRITICAL SECURITY: verify correct answers are NOT exposed
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/start`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  data = await res.json();
  const attemptId = data.data?.attempt_id;
  const returnedQuestions = data.data?.questions || [];
  const correctOptionExposed = returnedQuestions.some(q => q.correct_option !== undefined);
  assert(res.status === 200 && attemptId && !correctOptionExposed, 'Student Starts Assessment - Correct answers NOT exposed (Security Check Passed)');

  // Test 9: Invalid question submission validation
  res = await fetch(`${BASE_URL}/assessments/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      answers: [
        { question_id: 99999, selected_option: 'a' }
      ]
    })
  });
  data = await res.json();
  assert(res.status === 400 && data.success === false, 'Submit - Rejects non-belonging question (400)');

  // Test 10: Invalid option submission validation
  res = await fetch(`${BASE_URL}/assessments/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      answers: [
        { question_id: q1Id, selected_option: 'z' }
      ]
    })
  });
  data = await res.json();
  assert(res.status === 400 && data.success === false, 'Submit - Rejects invalid option value (400)');

  // Test 11: Partially-correct & blank submission
  // Q1: 'c' (correct - 5 marks)
  // Q2: 'b' (wrong - 0 marks)
  // Q3: 'b' (correct - 5 marks)
  // Q4: unanswered (0 marks)
  // Total score should be 10/20 (50%), passed: true (pass_marks=10)
  res = await fetch(`${BASE_URL}/assessments/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      answers: [
        { question_id: q1Id, selected_option: 'c' },
        { question_id: q2Id, selected_option: 'b' },
        { question_id: q3Id, selected_option: 'b' }
        // q4 left blank intentionally
      ]
    })
  });
  data = await res.json();
  const subResult = data.data;
  assert(
    res.status === 200 &&
    subResult.score === 10 &&
    subResult.total_marks === 20 &&
    subResult.percentage === 50 &&
    subResult.correct_answers === 2 &&
    subResult.total_questions === 4 &&
    subResult.passed === true,
    'Submit - Partial & Blank Answers Scored Accurately (10/20, 50%)'
  );

  // Test 12: Duplicate submission prevention
  res = await fetch(`${BASE_URL}/assessments/attempts/${attemptId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      answers: [{ question_id: q1Id, selected_option: 'c' }]
    })
  });
  data = await res.json();
  assert(res.status === 400 && data.success === false, 'Submit - Duplicate Submission Prevented (400)');

  // Test 13: Student cannot restart completed assessment
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/start`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  data = await res.json();
  assert(res.status === 400 && data.success === false, 'Student Cannot Re-start Completed Assessment (400)');

  // Test 14: Student retrieves their own result with answers breakdown
  res = await fetch(`${BASE_URL}/assessments/attempts/${attemptId}/result`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  data = await res.json();
  assert(
    res.status === 200 &&
    data.data.attempt.score === 10 &&
    data.data.answers.length === 4,
    'Student Retrieves Result & Answers Breakdown (200)'
  );

  // Test 15: Student views their attempt history
  res = await fetch(`${BASE_URL}/assessments/my-attempts`, {
    headers: { 'Authorization': `Bearer ${studentToken}` }
  });
  data = await res.json();
  assert(res.status === 200 && data.data.some(att => att.id === attemptId), 'Student Views My Attempts History (200)');

  // Test 16: Mentor/Admin views overall assessment results leaderboard
  res = await fetch(`${BASE_URL}/assessments/${assessmentId}/results`, {
    headers: { 'Authorization': `Bearer ${mentorToken}` }
  });
  data = await res.json();
  assert(
    res.status === 200 &&
    data.data.results.some(r => r.id === attemptId),
    'Admin/Mentor Views Assessment Results Summary (200)'
  );

  // Clean up test data
  console.log('\n--- Cleaning up temporary test records ---');
  await pool.query('DELETE FROM assessments WHERE id = ?', [assessmentId]);
  await pool.query('DELETE FROM batches WHERE id = ?', [testBatchId]);
  if (tempDeptCreated) {
    await pool.query('DELETE FROM departments WHERE id = ?', [departmentId]);
  }
  console.log('✅ Temporary test data cleaned up cleanly.');

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log(`========================================`);

  await pool.end();
  process.exit(failedTests > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
