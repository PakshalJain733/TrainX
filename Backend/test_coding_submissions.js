/**
 * Comprehensive Automated Tests for Coding Submissions & Marks Calculation
 * Run with: node test_coding_submissions.js
 */

import http from 'http';
import app from './src/app.js';
import { generateToken } from './src/utils/generateToken.js';
import { ROLES } from './src/utils/constants.js';
import { ensureCodingTablesExist } from './src/models/codingSubmission.model.js';

let server;
let baseUrl;

const startServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      console.log(`[TEST SERVER] Running on ${baseUrl}`);
      resolve();
    });
  });
};

const stopServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
};

const request = async (endpoint, { method = 'GET', token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

// Generate test JWT tokens
const tokens = {
  student1: generateToken({ userId: 6, id: 6, email: 'student1@pvppcoe.ac.in', role: ROLES.STUDENT, collegeId: 1 }),
  student2: generateToken({ userId: 7, id: 7, email: 'student2@dbit.ac.in', role: ROLES.STUDENT, collegeId: 2 }),
  mentor: generateToken({ userId: 5, id: 5, email: 'mentor@pvppcoe.ac.in', role: ROLES.MENTOR, collegeId: 1 }),
  admin: generateToken({ userId: 1, id: 1, email: 'admin@trainingportal.com', role: ROLES.SUPER_ADMIN, collegeId: 1 }),
};

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${details}`);
  }
}

async function runTests() {
  await ensureCodingTablesExist();
  await startServer();

  console.log('\n================================================================');
  console.log('--- CODING SUBMISSIONS & MARKS CALCULATION TEST SUITE ---');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated access blocked
    // -------------------------------------------------------------
    console.log('--- [TEST 1] Authentication Enforcement ---');
    const noAuthRes = await request('/coding-submissions', { method: 'POST', body: { problem_id: 1, submitted_code: 'print("hi")', language: 'python' } });
    assert(noAuthRes.status === 401, 'POST /coding-submissions without token returns 401 Unauthorized', `Got ${noAuthRes.status}`);

    const noAuthGetRes = await request('/coding-submissions/1');
    assert(noAuthGetRes.status === 401, 'GET /coding-submissions/:id without token returns 401 Unauthorized', `Got ${noAuthGetRes.status}`);

    // -------------------------------------------------------------
    // TEST 2: Missing Fields Validation
    // -------------------------------------------------------------
    console.log('\n--- [TEST 2] Missing Fields Validation ---');
    
    // 2.1 Missing problem_id
    const missingProblemRes = await request('/coding-submissions', {
      method: 'POST',
      token: tokens.student1,
      body: { submitted_code: 'def solve(): pass', language: 'python' },
    });
    assert(missingProblemRes.status === 400, 'Missing problem_id returns 400 Bad Request', `Got ${missingProblemRes.status} : ${JSON.stringify(missingProblemRes.data)}`);

    // 2.2 Missing submitted_code
    const missingCodeRes = await request('/coding-submissions', {
      method: 'POST',
      token: tokens.student1,
      body: { problem_id: 1, language: 'python' },
    });
    assert(missingCodeRes.status === 400, 'Missing submitted_code returns 400 Bad Request', `Got ${missingCodeRes.status}`);

    // 2.3 Missing language
    const missingLangRes = await request('/coding-submissions', {
      method: 'POST',
      token: tokens.student1,
      body: { problem_id: 1, submitted_code: 'def solve(): pass' },
    });
    assert(missingLangRes.status === 400, 'Missing language returns 400 Bad Request', `Got ${missingLangRes.status}`);

    // -------------------------------------------------------------
    // TEST 3: Invalid Student / Problem Validation
    // -------------------------------------------------------------
    console.log('\n--- [TEST 3] Invalid Student & Problem Validation ---');
    
    // 3.1 Invalid Problem ID (e.g. 99999)
    const invalidProblemRes = await request('/coding-submissions', {
      method: 'POST',
      token: tokens.student1,
      body: { problem_id: 99999, submitted_code: 'print("hello")', language: 'python' },
    });
    assert(invalidProblemRes.status === 404, 'Invalid problem_id returns 404 Not Found', `Got ${invalidProblemRes.status} : ${JSON.stringify(invalidProblemRes.data)}`);

    // 3.2 Invalid Student ID in GET /coding-submissions/student/:studentId (e.g. non-numeric / invalid)
    const invalidStudentGetRes = await request('/coding-submissions/student/invalid_id_abc', {
      token: tokens.student1,
    });
    assert(invalidStudentGetRes.status === 400 || invalidStudentGetRes.status === 404, 'Invalid studentId in history query returns 400/404', `Got ${invalidStudentGetRes.status}`);

    // -------------------------------------------------------------
    // TEST 4: Successful Attempt Save & Marks Calculation
    // -------------------------------------------------------------
    console.log('\n--- [TEST 4] Successful Attempt Save & Marks Calculation ---');

    // 4.1 Save full score submission (5/5 passed, problem total marks = 100)
    const fullScorePayload = {
      problem_id: 1,
      submitted_code: 'def twoSum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        if target - num in lookup:\n            return [lookup[target - num], i]\n        lookup[num] = i\n    return []',
      language: 'python',
      passed_test_cases: 5,
      total_test_cases: 5,
    };

    const fullScoreRes = await request('/coding-submissions', {
      method: 'POST',
      token: tokens.student1,
      body: fullScorePayload,
    });

    assert(fullScoreRes.status === 201, 'Full-score attempt saved successfully (201 Created)', `Got ${fullScoreRes.status}`);
    const sub1 = fullScoreRes.data?.data;
    assert(sub1 && sub1.id !== undefined, 'Submission returns assigned ID', `Got ${sub1?.id}`);
    assert(parseFloat(sub1?.score) === 100 && parseFloat(sub1?.percentage) === 100, '100% test cases passed results in 100 score and 100 percentage', `Score: ${sub1?.score}, Percentage: ${sub1?.percentage}`);
    assert(sub1?.status === 'passed', 'Status is "passed" for all test cases passed', `Got ${sub1?.status}`);
    assert(sub1?.submitted_code === fullScorePayload.submitted_code, 'Submitted code is preserved accurately');
    assert(sub1?.language === 'python', 'Language is preserved accurately');

    const createdSubmissionId1 = sub1?.id;

    // 4.2 Save partial score submission (3/5 passed on problem 3 with 150 total marks)
    // 3/5 * 150 = 90 score, 60%
    const partialScorePayload = {
      problem_id: 3,
      submitted_code: 'function lengthOfLongestSubstring(s) { return s.length; }',
      language: 'javascript',
      passed_test_cases: 3,
      total_test_cases: 5,
    };

    const partialScoreRes = await request('/coding-submissions', {
      method: 'POST',
      token: tokens.student1,
      body: partialScorePayload,
    });

    assert(partialScoreRes.status === 201, 'Partial-score attempt saved successfully (201 Created)', `Got ${partialScoreRes.status}`);
    const sub2 = partialScoreRes.data?.data;
    assert(parseFloat(sub2?.score) === 90 && parseFloat(sub2?.percentage) === 60, '3/5 test cases on 150 marks gives score=90.00 and percentage=60.00', `Score: ${sub2?.score}, Percentage: ${sub2?.percentage}`);
    assert(sub2?.status === 'partial', 'Status is "partial" for partially passed test cases', `Got ${sub2?.status}`);

    // 4.3 Save zero score submission (0/5 passed on problem 2 with 100 total marks)
    const zeroScorePayload = {
      problem_id: 2,
      submitted_code: 'def isPalindrome(s): return False',
      language: 'python',
      passed_test_cases: 0,
      total_test_cases: 5,
    };

    const zeroScoreRes = await request('/coding-submissions', {
      method: 'POST',
      token: tokens.student1,
      body: zeroScorePayload,
    });

    assert(zeroScoreRes.status === 201, 'Zero-score attempt saved successfully (201 Created)', `Got ${zeroScoreRes.status}`);
    const sub3 = zeroScoreRes.data?.data;
    assert(parseFloat(sub3?.score) === 0 && parseFloat(sub3?.percentage) === 0, '0/5 test cases gives score=0.00 and percentage=0.00', `Score: ${sub3?.score}, Percentage: ${sub3?.percentage}`);
    assert(sub3?.status === 'failed', 'Status is "failed" for zero passed test cases', `Got ${sub3?.status}`);

    // -------------------------------------------------------------
    // TEST 5: Fetch Submission By ID
    // -------------------------------------------------------------
    console.log('\n--- [TEST 5] Fetch Submission By ID ---');
    const getSubRes = await request(`/coding-submissions/${createdSubmissionId1}`, {
      token: tokens.student1,
    });

    assert(getSubRes.status === 200, 'GET /coding-submissions/:id returns 200 OK', `Got ${getSubRes.status}`);
    const fetchedSub = getSubRes.data?.data;
    assert(fetchedSub?.id === createdSubmissionId1, 'Fetched submission ID matches requested ID', `Expected ${createdSubmissionId1}, got ${fetchedSub?.id}`);
    assert(fetchedSub?.problem_title === 'Two Sum', 'Submission joined problem title properly', `Got ${fetchedSub?.problem_title}`);
    assert(fetchedSub?.student_id === 6, 'Submission student_id matches student 6', `Got ${fetchedSub?.student_id}`);
    assert(fetchedSub?.submitted_at !== undefined, 'Submission contains submitted_at timestamp');

    // 5.1 Non-existent submission ID
    const notFoundSubRes = await request('/coding-submissions/999999', {
      token: tokens.student1,
    });
    assert(notFoundSubRes.status === 404, 'Non-existent submission ID returns 404 Not Found', `Got ${notFoundSubRes.status}`);

    // -------------------------------------------------------------
    // TEST 6: Fetch Student Submission History
    // -------------------------------------------------------------
    console.log('\n--- [TEST 6] Fetch Student Submission History ---');
    const historyRes = await request('/coding-submissions/student/6', {
      token: tokens.student1,
    });

    assert(historyRes.status === 200, 'GET /coding-submissions/student/:studentId returns 200 OK', `Got ${historyRes.status}`);
    const historyData = historyRes.data?.data;
    assert(Array.isArray(historyData?.submissions), 'History contains submissions array');
    assert(historyData?.submissions.length >= 3, `History contains at least 3 saved submissions (found ${historyData?.submissions.length})`);
    assert(historyData?.summary?.totalSubmissions >= 3, `Summary reports correct total submissions count (${historyData?.summary?.totalSubmissions})`);
    assert(historyData?.summary?.totalScoreEarned >= 190, `Summary reports correct total score earned (${historyData?.summary?.totalScoreEarned})`);
    assert(historyData?.student?.id === 6, 'Summary includes student profile details');

  } catch (err) {
    console.error('Fatal Test Exception:', err);
  } finally {
    await stopServer();
    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
    console.log('================================================================\n');

    if (passedTests === totalTests) {
      console.log('🎉 ALL CODING SUBMISSIONS & MARKS TESTS PASSED!\n');
      process.exit(0);
    } else {
      console.error(`💥 SOME TESTS FAILED: ${totalTests - passedTests} failure(s)\n`);
      process.exit(1);
    }
  }
}

runTests();
