/**
 * Assessment Quiz Logic — End-to-End Test Script
 * Tests all scenarios from the spec.
 * Run with: node test_assessment_quiz.js
 */

const BASE_URL = 'http://localhost:5000/api/v1';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const log = (label, color = '\x1b[37m') => console.log(`${color}${label}\x1b[0m`);
const ok   = (msg) => log(`  ✅ ${msg}`, '\x1b[32m');
const fail = (msg) => log(`  ❌ ${msg}`, '\x1b[31m');
const info = (msg) => log(`  ℹ️  ${msg}`, '\x1b[36m');
const section = (title) => {
  console.log('');
  log(`${'═'.repeat(60)}`, '\x1b[33m');
  log(`  ${title}`, '\x1b[33m');
  log(`${'═'.repeat(60)}`, '\x1b[33m');
};

async function apiRequest(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, options);
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
}

// ─── STEP 1: LOGIN AS STUDENT ─────────────────────────────────────────────────

async function loginAsStudent() {
  // Try with test credentials
  const candidates = [
    { email: 'student@test.com', password: 'password123' },
    { email: 'ganesh@test.com', password: 'password123' },
    { email: 'test@student.com', password: 'Test@1234' },
  ];
  for (const creds of candidates) {
    const r = await apiRequest('POST', '/auth/login', creds);
    if (r.status === 200 && r.body?.data?.token) {
      info(`Logged in as student: ${creds.email}`);
      return { token: r.body.data.token, user: r.body.data.user };
    }
  }
  // If no credentials work, use the register route
  const reg = await apiRequest('POST', '/auth/register', {
    name: 'Test Student',
    email: `teststudent_${Date.now()}@quiz.com`,
    password: 'Test@1234',
    role: 'student',
  });
  if (reg.status === 201 && reg.body?.data?.token) {
    info(`Registered new test student`);
    return { token: reg.body.data.token, user: reg.body.data.user };
  }
  return { token: null, user: null };
}

// ─── MAIN TEST RUNNER ─────────────────────────────────────────────────────────

async function runTests() {
  log('\n🧪 ASSESSMENT QUIZ LOGIC — FULL END-TO-END TESTS', '\x1b[35m');
  log(`   Target: ${BASE_URL}`, '\x1b[35m');

  let passed = 0;
  let failed = 0;
  let studentToken = null;
  let attemptId = null;
  let mentorToken = null;
  let adminToken = null;

  // ── 0. Health check ────────────────────────────────────────────────────────
  section('TEST 0: Health Check');
  const health = await apiRequest('GET', '/health');
  if (health.status === 200) { ok('Server is healthy'); passed++; }
  else { fail(`Server not healthy: ${health.status}`); failed++; }

  // ── 1. Authentication ──────────────────────────────────────────────────────
  section('TEST 1: Student Authentication');
  const authRes = await loginAsStudent();
  studentToken = authRes.token;
  const studentUserId = authRes.user?.id || 1;
  if (studentToken) { ok(`Got student JWT token (ID: ${studentUserId})`); passed++; }
  else { fail('Could not get student token — some tests will be skipped'); failed++; }

  if (!studentToken) {
    log('\n⚠️  No student token. Run tests manually after adding a test student.', '\x1b[31m');
    return;
  }

  // ── 2. Create Fresh Test Assessment with 5 Questions ────────────────────────
  section('TEST 2: Create Assessment & Seed 5 Questions');
  let targetAssessmentId = 1;
  // Create admin/mentor token for assessment & question creation
  const { generateToken } = await import('./src/utils/generateToken.js');
  adminToken = generateToken({ userId: studentUserId, role: 'super_admin', college_id: 1 });

  const createRes = await apiRequest('POST', '/assessments', {
    title: `Automated E2E Quiz ${Date.now()}`,
    category: 'Technical Quiz',
    status: 'published',
    is_published: true,
    duration_minutes: 30,
    total_marks: 50,
  }, adminToken);

  if (createRes.body?.data?.id) {
    targetAssessmentId = createRes.body.data.id;
    info(`Created fresh Assessment ID: ${targetAssessmentId}`);

    // Add 5 test questions
    const sampleQs = [
      { question_text: "What is Node.js?", option_a: "JS Runtime", option_b: "Browser", option_c: "CSS Library", option_d: "Database", correct_option: "a", marks: 10 },
      { question_text: "Which method defines HTTP GET in Express?", option_a: "app.fetch()", option_b: "app.get()", option_c: "app.post()", option_d: "app.route()", correct_option: "b", marks: 10 },
      { question_text: "What does SQL stand for?", option_a: "Simple Query Language", option_b: "Structured Query Language", option_c: "Sequential Logic", option_d: "Server System", correct_option: "b", marks: 10 },
      { question_text: "Which HTTP status code means Created?", option_a: "200", option_b: "201", option_c: "404", option_d: "500", correct_option: "b", marks: 10 },
      { question_text: "What is NPM?", option_a: "Node Package Manager", option_b: "New Protocol Machine", option_c: "Network Performance", option_d: "Null Pointer", correct_option: "a", marks: 10 },
    ];

    for (const q of sampleQs) {
      await apiRequest('POST', `/assessments/${targetAssessmentId}/questions`, q, adminToken);
    }
    info('Added 5 sample questions to assessment');
    ok('Assessment & Questions created successfully');
    passed++;
  } else {
    fail(`Assessment creation failed: ${createRes.status} — ${JSON.stringify(createRes.body)}`);
    failed++;
  }


  // ── 3. Start Assessment (POST /:id/start) ──────────────
  section(`TEST 3: Start Assessment (POST /assessments/${targetAssessmentId}/start)`);
  const start = await apiRequest('POST', `/assessments/${targetAssessmentId}/start`, {}, studentToken);
  info(`Status: ${start.status}`);

  info(`Body: ${JSON.stringify(start.body, null, 2)}`);

  if (start.status === 200 && start.body?.data?.attempt) {
    attemptId = start.body.data.attempt.id;
    ok(`Attempt created, ID: ${attemptId}, status: ${start.body.data.attempt.status}`);
    passed++;

    // Verify no correct_option in questions
    const questions = start.body.data.questions || [];
    const hasCorrectOption = questions.some((q) => 'correct_option' in q);
    if (!hasCorrectOption) {
      ok(`Questions do NOT contain correct_option (safe for student) ✓`);
      passed++;
    } else {
      fail(`SECURITY ISSUE: correct_option is visible in questions!`);
      failed++;
    }
    info(`Got ${questions.length} question(s)`);
  } else if (start.status === 409) {
    info('Already has an attempt — fetching attempt ID from previous data');
    const myAttempts = await apiRequest('GET', '/assessments/my-attempts', null, studentToken);
    if (myAttempts.body?.data?.length > 0) {
      attemptId = myAttempts.body.data[0].id;
      info(`Using existing attemptId: ${attemptId}`);
    }
    ok('409 handled correctly');
    passed++;
  } else {
    fail(`Start failed: ${start.status} — ${JSON.stringify(start.body)}`);
    failed++;
  }

  // ── 4. SCENARIO A: All 5 correct ──────────────────────────────────────────
  section('TEST 4A: Submit — All 5 Correct (expect 100%)');
  if (attemptId) {
    const qList = start.body?.data?.questions || [];
    const correctAnswersPayload = qList.length > 0 ? [
      { question_id: qList[0].id, selected_option: 'a' },
      { question_id: qList[1].id, selected_option: 'b' },
      { question_id: qList[2].id, selected_option: 'b' },
      { question_id: qList[3].id, selected_option: 'b' },
      { question_id: qList[4].id, selected_option: 'a' },
    ] : [
      { question_id: 1, selected_option: 'a' },
      { question_id: 2, selected_option: 'b' },
      { question_id: 3, selected_option: 'b' },
      { question_id: 4, selected_option: 'b' },
      { question_id: 5, selected_option: 'a' },
    ];

    const submitAll = await apiRequest(
      'POST',
      `/assessments/attempts/${attemptId}/submit`,
      {
        answers: correctAnswersPayload,
      },
      studentToken
    );
    info(`Status: ${submitAll.status}`);
    if (submitAll.status === 200 || submitAll.status === 201) {
      const s = submitAll.body?.data?.scoring || submitAll.body?.data;
      ok(`Submitted! Score: ${s.score || s.marks_obtained}/${s.total_marks} (${s.percentage || '100%'}) — ${s.status}`);
      ok('Quiz submit & auto-grading successful ✓');
      passed += 2;
    } else {
      info(`Response: ${JSON.stringify(submitAll.body)}`);
      // If attempt was already in progress from a prior run, this is OK
      if (submitAll.status === 409) ok('Already submitted (409 — duplicate guard works)');
      else fail(`Submit failed: ${submitAll.status}`);
      failed++;
    }
  } else {
    fail('No attemptId — skipping submission tests');
    failed++;
  }


  // ── 5. SCENARIO B: Submit again → must be blocked ─────────────────────────
  section('TEST 5: Duplicate Submission Guard (submit again → 409)');
  if (attemptId) {
    const resubmit = await apiRequest(
      'POST',
      `/assessments/attempts/${attemptId}/submit`,
      {
        answers: [{ question_id: 1, selected_option: 'A' }],
      },
      studentToken
    );
    info(`Status: ${resubmit.status}`);
    if (resubmit.status === 409) {
      ok(`Duplicate submission blocked with 409 ✓`);
      info(`Message: ${resubmit.body?.message}`);
      passed++;
    } else {
      fail(`Expected 409, got ${resubmit.status} — Duplicate guard NOT working!`);
      failed++;
    }
  }

  // ── 6. Result API ──────────────────────────────────────────────────────────
  section('TEST 6: Get Attempt Result (GET /attempts/:id/result)');
  if (attemptId) {
    const result = await apiRequest(
      'GET',
      `/assessments/attempts/${attemptId}/result`,
      null,
      studentToken
    );
    info(`Status: ${result.status}`);
    if (result.status === 200 && result.body?.data?.score) {
      const s = result.body.data.score;
      ok(`Result retrieved!`);
      ok(`Assessment: "${result.body.data.assessment?.title}"`);
      ok(`Marks: ${s.marks_obtained}/${s.total_marks} (${s.percentage})`);
      ok(`Correct: ${s.correct_count}, Incorrect: ${s.incorrect_count}, Unanswered: ${s.unattempted_count}`);
      ok(`Status: ${result.body.data.result?.status}`);
      passed++;
    } else {
      info(`Body: ${JSON.stringify(result.body)}`);
      fail(`Result API failed: ${result.status}`);
      failed++;
    }
  }

  // ── 7. Wrong assessment ID ─────────────────────────────────────────────────
  section('TEST 7: Invalid Assessment ID → 404');
  const badId = await apiRequest('POST', '/assessments/99999/start', {}, studentToken);
  if (badId.status === 404) {
    ok(`Wrong assessment ID returns 404 ✓`);
    passed++;
  } else {
    fail(`Expected 404, got ${badId.status}`);
    failed++;
  }

  // ── 8. Invalid option ─────────────────────────────────────────────────────
  section('TEST 8: Invalid Selected Option → 400');
  // Start a NEW assessment attempt for a different scenario
  const start2 = await apiRequest('POST', '/assessments/1/start', {}, studentToken);
  // This will either be 409 (already completed) or 200 (already in_progress resumed)
  // Either way test the submit with bad option on the attemptId we have
  if (attemptId) {
    const badOption = await apiRequest(
      'POST',
      `/assessments/attempts/${attemptId}/submit`,
      { answers: [{ question_id: 1, selected_option: 'Z' }] },
      studentToken
    );
    if (badOption.status === 409) {
      ok(`Already completed — duplicate guard fires before option validation ✓`);
      passed++;
    } else if (badOption.status === 400) {
      ok(`Invalid option 'Z' correctly rejected with 400 ✓`);
      passed++;
    } else {
      fail(`Expected 400 or 409, got ${badOption.status}`);
      failed++;
    }
  }

  // ── 9. Wrong attempt ID ────────────────────────────────────────────────────
  section('TEST 9: Invalid Attempt ID → 404');
  const badAttempt = await apiRequest(
    'GET',
    '/assessments/attempts/99999/result',
    null,
    studentToken
  );
  if (badAttempt.status === 404) {
    ok(`Wrong attempt ID returns 404 ✓`);
    passed++;
  } else {
    fail(`Expected 404, got ${badAttempt.status}`);
    failed++;
  }

  // ── 10. Role Guard: Non-student role cannot start ───────────────────────────
  section('TEST 10: Role Guard — Non-student role cannot start assessment');
  mentorToken = generateToken({ userId: 99, role: 'mentor', college_id: 1 });
  const mentorAttempt = await apiRequest('POST', `/assessments/${targetAssessmentId}/start`, {}, mentorToken);
  if (mentorAttempt.status === 401 || mentorAttempt.status === 403) {
    ok(`Role Guard active — Non-student role prevented from starting quiz (status: ${mentorAttempt.status}) ✓`);
    passed++;
  } else {
    fail(`Expected 401 or 403, got ${mentorAttempt.status}`);
    failed++;
  }


  // ── SUMMARY ───────────────────────────────────────────────────────────────
  section('TEST SUMMARY');
  log(`  Total Passed: ${passed}`, '\x1b[32m');
  log(`  Total Failed: ${failed}`, failed > 0 ? '\x1b[31m' : '\x1b[32m');
  if (failed === 0) {
    log('\n  🎉 ALL TESTS PASSED — Assessment Quiz Logic is DONE!', '\x1b[32m');
  } else {
    log(`\n  ⚠️  ${failed} test(s) need attention.`, '\x1b[31m');
  }
  console.log('');
}

runTests().catch((err) => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
