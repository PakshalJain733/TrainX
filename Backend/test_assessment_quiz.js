/**
 * Assessment Quiz Logic — Full End-to-End Test Suite
 * Task 1: Complete Quiz Attempt + Result Flow
 * Task 2: Role Access & College Isolation Checks
 * Task 3: Comprehensive Validation & Edge Cases
 * 
 * Run with: node test_assessment_quiz.js
 */

import { generateToken } from './src/utils/generateToken.js';

const BASE_URL = 'http://localhost:5000/api/v1';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const log = (label, color = '\x1b[37m') => console.log(`${color}${label}\x1b[0m`);
const ok   = (msg) => log(`  ✅ ${msg}`, '\x1b[32m');
const fail = (msg) => log(`  ❌ ${msg}`, '\x1b[31m');
const info = (msg) => log(`  ℹ️  ${msg}`, '\x1b[36m');
const section = (title) => {
  console.log('');
  log(`${'═'.repeat(65)}`, '\x1b[33m');
  log(`  ${title}`, '\x1b[33m');
  log(`${'═'.repeat(65)}`, '\x1b[33m');
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

// ─── MAIN TEST RUNNER ─────────────────────────────────────────────────────────

async function runTests() {
  log('\n🧪 ASSESSMENT QUIZ — COMPREHENSIVE E2E & VALIDATION TEST SUITE', '\x1b[35m');
  log(`   Target: ${BASE_URL}`, '\x1b[35m');

  let passed = 0;
  let failed = 0;

  // Generate Tokens for various test personas
  const studentAToken = generateToken({ userId: 101, role: 'student', college_id: 1 });
  const studentBToken = generateToken({ userId: 102, role: 'student', college_id: 2 }); // Cross-college student
  const mentorToken   = generateToken({ userId: 201, role: 'mentor', college_id: 1 });
  const collegeAdminToken = generateToken({ userId: 301, role: 'college_admin', college_id: 1 });
  const superAdminToken   = generateToken({ userId: 401, role: 'super_admin', college_id: null });

  // ── 0. Health check ────────────────────────────────────────────────────────
  section('TEST 0: Health Check');
  const health = await apiRequest('GET', '/health');
  if (health.status === 200) { ok('Server is healthy'); passed++; }
  else { fail(`Server not healthy: ${health.status}`); failed++; }

  // ── 1. Mentor creates Quiz & adds Questions ─────────────────────────────
  section('TEST 1: Mentor Creates Quiz (College 1) & Adds Questions');
  const quizTitle = `E2E Tech Quiz ${Date.now()}`;
  const createRes = await apiRequest('POST', '/assessments', {
    title: quizTitle,
    description: 'Node.js & Express Fundamentals',
    college_id: 1,
    duration_minutes: 20,
    total_marks: 30,
    pass_marks: 18,
    status: 'draft',
  }, mentorToken);

  let targetQuizId;
  if (createRes.status === 201 && createRes.body?.data?.id) {
    targetQuizId = createRes.body.data.id;
    ok(`Mentor created Quiz ID: ${targetQuizId} (Status: Draft)`);
    passed++;
  } else {
    fail(`Mentor quiz creation failed: ${createRes.status} — ${JSON.stringify(createRes.body)}`);
    failed++;
    return;
  }

  // Add 3 Questions
  const questionsData = [
    { question_text: "What is Express.js?", option_a: "Web Framework", option_b: "Database", option_c: "CSS Tool", option_d: "OS", correct_option: "a", marks: 10 },
    { question_text: "Which HTTP code indicates Success?", option_a: "404", option_b: "200", option_c: "500", option_d: "301", correct_option: "b", marks: 10 },
    { question_text: "What is package.json?", option_a: "Compiler", option_b: "Manifest file", option_c: "Text editor", option_d: "Database query", correct_option: "b", marks: 10 },
  ];

  const createdQuestions = [];
  for (const q of questionsData) {
    const qRes = await apiRequest('POST', `/assessments/${targetQuizId}/questions`, q, mentorToken);
    if (qRes.status === 201 && qRes.body?.data?.id) {
      createdQuestions.push(qRes.body.data);
    }
  }

  if (createdQuestions.length === 3) {
    ok(`Added ${createdQuestions.length} questions to Quiz ID ${targetQuizId}`);
    passed++;
  } else {
    fail(`Failed adding questions: got ${createdQuestions.length}/3`);
    failed++;
  }

  // ── 2. Publish Quiz ────────────────────────────────────────────────────────
  section('TEST 2: Publish Quiz');
  const pubRes = await apiRequest('PATCH', `/assessments/${targetQuizId}/publish`, {}, mentorToken);
  if (pubRes.status === 200 && pubRes.body?.data?.status === 'published') {
    ok(`Quiz ID ${targetQuizId} published successfully`);
    passed++;
  } else {
    fail(`Publish failed: ${pubRes.status}`);
    failed++;
  }

  // ── 3. Student A starts Quiz ───────────────────────────────────────────────
  section('TEST 3: Student A Starts Quiz (POST /assessments/:id/start)');
  const startRes = await apiRequest('POST', `/assessments/${targetQuizId}/start`, {}, studentAToken);
  let attemptIdA;

  if (startRes.status === 200 && startRes.body?.data?.attempt?.id) {
    attemptIdA = startRes.body.data.attempt.id;
    ok(`Attempt started successfully (Attempt ID: ${attemptIdA})`);
    passed++;

    // Security Check: Correct answers MUST NOT be revealed before submission
    const qList = startRes.body.data.questions || [];
    const leaksCorrectOption = qList.some((q) => 'correct_option' in q || 'explanation' in q);
    if (!leaksCorrectOption) {
      ok(`Security Verified: correct answers are NOT sent before submission ✓`);
      passed++;
    } else {
      fail(`SECURITY VULNERABILITY: correct answers revealed in start response!`);
      failed++;
    }
  } else {
    fail(`Start quiz failed: ${startRes.status} — ${JSON.stringify(startRes.body)}`);
    failed++;
  }

  // ── 4. Full Marks Submission (100%) ────────────────────────────────────────
  section('TEST 4: Student A Submits — Full Marks (100%)');
  if (attemptIdA && createdQuestions.length === 3) {
    const fullMarksPayload = [
      { question_id: createdQuestions[0].id, selected_option: 'a' },
      { question_id: createdQuestions[1].id, selected_option: 'b' },
      { question_id: createdQuestions[2].id, selected_option: 'b' },
    ];

    const submitRes = await apiRequest('POST', `/assessments/attempts/${attemptIdA}/submit`, { answers: fullMarksPayload }, studentAToken);
    if (submitRes.status === 200 && submitRes.body?.data?.scoring) {
      const s = submitRes.body.data.scoring;
      if (s.marks_obtained === 30 && s.percentage === '100%' && s.status === 'passed') {
        ok(`Submitted! Full Marks: 30/30 (100%) — Status: ${s.status} ✓`);
        passed++;
      } else {
        fail(`Score calculation incorrect: ${JSON.stringify(s)}`);
        failed++;
      }
    } else {
      fail(`Submission failed: ${submitRes.status}`);
      failed++;
    }
  }

  // ── 5. Fetch Result After Completion ──────────────────────────────────────
  section('TEST 5: Fetch Result After Completion (GET /attempts/:attemptId/result)');
  if (attemptIdA) {
    const resRes = await apiRequest('GET', `/assessments/attempts/${attemptIdA}/result`, null, studentAToken);
    if (resRes.status === 200 && resRes.body?.data?.score) {
      const d = resRes.body.data;
      ok(`Result retrieved! Student ID: ${d.student.user_id}, Marks: ${d.score.marks_obtained}/${d.score.total_marks} (${d.score.percentage})`);
      ok(`Per-question breakdown returned ${d.breakdown.length} items`);
      passed++;
    } else {
      fail(`Get result failed: ${resRes.status}`);
      failed++;
    }
  }

  // ── 6. Duplicate Submission Guard ─────────────────────────────────────────
  section('TEST 6: Duplicate Submission Guard (submit again → 409)');
  if (attemptIdA) {
    const dupRes = await apiRequest('POST', `/assessments/attempts/${attemptIdA}/submit`, { answers: [] }, studentAToken);
    if (dupRes.status === 409) {
      ok(`Completed quiz submitted again correctly rejected with 409 Conflict ✓`);
      passed++;
    } else {
      fail(`Expected 409, got ${dupRes.status}`);
      failed++;
    }
  }

  // ── 7. Partial Marks & Blank Answers ──────────────────────────────────────
  section('TEST 7: Partial Marks & Blank Answers');
  // Create Quiz 2 for partial marks test
  const createQuiz2 = await apiRequest('POST', '/assessments', {
    title: `Partial Marks Quiz ${Date.now()}`,
    college_id: 1,
    status: 'published',
    duration_minutes: 15,
    total_marks: 20,
  }, mentorToken);

  const quiz2Id = createQuiz2.body?.data?.id;
  if (quiz2Id) {
    const q1 = await apiRequest('POST', `/assessments/${quiz2Id}/questions`, { question_text: "Q1", option_a: "A", option_b: "B", correct_option: "a", marks: 10 }, mentorToken);
    const q2 = await apiRequest('POST', `/assessments/${quiz2Id}/questions`, { question_text: "Q2", option_a: "A", option_b: "B", correct_option: "b", marks: 10 }, mentorToken);

    const startQuiz2 = await apiRequest('POST', `/assessments/${quiz2Id}/start`, {}, studentAToken);
    const attempt2Id = startQuiz2.body?.data?.attempt?.id;

    if (attempt2Id && q1.body?.data?.id && q2.body?.data?.id) {
      // Q1 correct ("a"), Q2 left blank (unattempted)
      const partialPayload = [
        { question_id: q1.body.data.id, selected_option: 'a' },
        { question_id: q2.body.data.id, selected_option: null },
      ];

      const sub2 = await apiRequest('POST', `/assessments/attempts/${attempt2Id}/submit`, { answers: partialPayload }, studentAToken);
      if (sub2.status === 200 && sub2.body?.data?.scoring) {
        const s = sub2.body.data.scoring;
        if (s.marks_obtained === 10 && s.correct_count === 1 && s.unattempted_count === 1) {
          ok(`Partial Marks & Blank Answer evaluated correctly: 10/20 marks (1 correct, 1 blank) ✓`);
          passed++;
        } else {
          fail(`Partial score evaluation unexpected: ${JSON.stringify(s)}`);
          failed++;
        }
      } else {
        fail(`Partial marks submission failed: ${sub2.status}`);
        failed++;
      }
    }
  }

  // ── 8. Validation Edge Cases: Invalid Question ID & Invalid Option ────────
  section('TEST 8: Validation — Invalid Question ID & Invalid Option');
  // Create Quiz 3 for validation tests
  const createQuiz3 = await apiRequest('POST', '/assessments', {
    title: `Validation Quiz ${Date.now()}`,
    college_id: 1,
    status: 'published',
  }, mentorToken);
  const quiz3Id = createQuiz3.body?.data?.id;

  if (quiz3Id) {
    await apiRequest('POST', `/assessments/${quiz3Id}/questions`, { question_text: "Valid Q", option_a: "A", option_b: "B", correct_option: "a", marks: 10 }, mentorToken);
    const start3 = await apiRequest('POST', `/assessments/${quiz3Id}/start`, {}, studentAToken);
    const attempt3Id = start3.body?.data?.attempt?.id;

    if (attempt3Id) {
      // Case 8A: Invalid Question ID
      const badQIdRes = await apiRequest('POST', `/assessments/attempts/${attempt3Id}/submit`, {
        answers: [{ question_id: 99999, selected_option: 'a' }]
      }, studentAToken);

      if (badQIdRes.status === 400) {
        ok(`Invalid question ID rejected with 400 Bad Request ✓`);
        passed++;
      } else {
        fail(`Expected 400 for invalid question ID, got ${badQIdRes.status}`);
        failed++;
      }

      // Case 8B: Invalid Option ('Z')
      const badOptRes = await apiRequest('POST', `/assessments/attempts/${attempt3Id}/submit`, {
        answers: [{ question_id: start3.body.data.questions[0].id, selected_option: 'Z' }]
      }, studentAToken);

      if (badOptRes.status === 400) {
        ok(`Invalid option 'Z' rejected with 400 Bad Request ✓`);
        passed++;
      } else {
        fail(`Expected 400 for invalid option 'Z', got ${badOptRes.status}`);
        failed++;
      }
    }
  }

  // ── 9. Role Access Checks ──────────────────────────────────────────────────
  section('TEST 9: Role Access Checks');

  // 9A. Non-student (Mentor) trying to start quiz attempt -> 403
  const mentorStart = await apiRequest('POST', `/assessments/${targetQuizId}/start`, {}, mentorToken);
  if (mentorStart.status === 403) {
    ok(`Role Check: Mentor prevented from starting quiz attempt (403) ✓`);
    passed++;
  } else {
    fail(`Expected 403 for mentor starting attempt, got ${mentorStart.status}`);
    failed++;
  }

  // 9B. Student B trying to submit Student A's attempt -> 403
  if (attemptIdA) {
    const stealSubmit = await apiRequest('POST', `/assessments/attempts/${attemptIdA}/submit`, { answers: [] }, studentBToken);
    if (stealSubmit.status === 403) {
      ok(`Unauthorized user submitting another student's attempt blocked (403) ✓`);
      passed++;
    } else {
      fail(`Expected 403 for cross-student submission, got ${stealSubmit.status}`);
      failed++;
    }
  }

  // 9C. Student B trying to view Student A's result -> 403
  if (attemptIdA) {
    const stealResult = await apiRequest('GET', `/assessments/attempts/${attemptIdA}/result`, null, studentBToken);
    if (stealResult.status === 403) {
      ok(`Unauthorized user viewing another student's result blocked (403) ✓`);
      passed++;
    } else {
      fail(`Expected 403 for cross-student result fetch, got ${stealResult.status}`);
      failed++;
    }
  }

  // ── 10. College Data Isolation Checks ─────────────────────────────────────
  section('TEST 10: College Isolation Checks');

  // Student B (College 2) trying to start College 1's Quiz -> 403
  const crossColStart = await apiRequest('POST', `/assessments/${targetQuizId}/start`, {}, studentBToken);
  if (crossColStart.status === 403) {
    ok(`College Isolation: Student from College 2 blocked from College 1's Quiz (403) ✓`);
    passed++;
  } else {
    fail(`Expected 403 for cross-college quiz access, got ${crossColStart.status}`);
    failed++;
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  section('TEST SUMMARY');
  log(`  Total Passed: ${passed}`, '\x1b[32m');
  log(`  Total Failed: ${failed}`, failed > 0 ? '\x1b[31m' : '\x1b[32m');
  if (failed === 0) {
    log('\n  🎉 ALL TESTS PASSED SUCCESSFULLY! Quiz Flow & Access Control Verified!', '\x1b[32m');
  } else {
    log(`\n  ⚠️  ${failed} test(s) failed.`, '\x1b[31m');
  }
  console.log('');
}

runTests().catch((err) => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
