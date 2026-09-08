import { generateToken } from './src/utils/generateToken.js';
import { ROLES } from './src/utils/constants.js';
import app from './src/app.js';
import http from 'http';

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

// Generate tokens for testing all 5 roles and multi-colleges
const tokens = {
  superAdmin: generateToken({ userId: 1, email: 'superadmin@trainingportal.com', role: ROLES.SUPER_ADMIN, collegeId: null, college_id: null }),
  collegeAdmin1: generateToken({ userId: 2, email: 'admin@pvppcoe.ac.in', role: ROLES.COLLEGE_ADMIN, collegeId: 1, college_id: 1 }),
  collegeAdmin2: generateToken({ userId: 3, email: 'admin@dbit.ac.in', role: ROLES.COLLEGE_ADMIN, collegeId: 2, college_id: 2 }),
  coordinator1: generateToken({ userId: 4, email: 'coordinator@pvppcoe.ac.in', role: ROLES.COORDINATOR, collegeId: 1, college_id: 1 }),
  mentor1: generateToken({ userId: 5, email: 'mentor@pvppcoe.ac.in', role: ROLES.MENTOR, collegeId: 1, college_id: 1 }),
  student1: generateToken({ userId: 6, email: 'ganesh@student.pvppcoe.ac.in', role: ROLES.STUDENT, collegeId: 1, college_id: 1 }),
  student2: generateToken({ userId: 7, email: 'rahul@student.dbit.ac.in', role: ROLES.STUDENT, collegeId: 2, college_id: 2 }),
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
  await startServer();
  console.log('\n================================================================');
  console.log('--- RUNNING TEST SUITE: 4 CORE PRIORITIES ---');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------
    // PRIORITY 1: Protect APIs & Test All 5 Roles
    // -------------------------------------------------------------
    console.log('\n--- [PRIORITY 1] Testing API Protection & 5-Role Authorization ---');
    
    // 1.1 Unauthenticated Request
    const noAuthRes = await request('/admin/users');
    assert(noAuthRes.status === 401, 'Unauthenticated access to /admin/users returns 401 Unauthorized', `Got ${noAuthRes.status}`);

    // 1.2 Student tries /admin/users -> 403 Forbidden
    const studentAdminRes = await request('/admin/users', { token: tokens.student1 });
    assert(studentAdminRes.status === 403, 'Role: STUDENT access to /admin/users is blocked with 403 Forbidden', `Got ${studentAdminRes.status}`);

    // 1.3 Mentor tries /admin/users -> 403 Forbidden
    const mentorAdminRes = await request('/admin/users', { token: tokens.mentor1 });
    assert(mentorAdminRes.status === 403, 'Role: MENTOR access to /admin/users is blocked with 403 Forbidden', `Got ${mentorAdminRes.status}`);

    // 1.4 Coordinator tries /admin/users -> 403 Forbidden
    const coordAdminRes = await request('/admin/users', { token: tokens.coordinator1 });
    assert(coordAdminRes.status === 403, 'Role: COORDINATOR access to /admin/users is blocked with 403 Forbidden', `Got ${coordAdminRes.status}`);

    // 1.5 College Admin tries /admin/users -> 200 Allowed
    const collegeAdminRes = await request('/admin/users', { token: tokens.collegeAdmin1 });
    assert(collegeAdminRes.status === 200, 'Role: COLLEGE_ADMIN access to /admin/users is Allowed (200 OK)', `Got ${collegeAdminRes.status}`);

    // 1.6 Super Admin tries /admin/users -> 200 Allowed
    const superAdminRes = await request('/admin/users', { token: tokens.superAdmin });
    assert(superAdminRes.status === 200, 'Role: SUPER_ADMIN access to /admin/users is Allowed (200 OK)', `Got ${superAdminRes.status}`);

    // -------------------------------------------------------------
    // PRIORITY 2: Multi-College Isolation
    // -------------------------------------------------------------
    console.log('\n--- [PRIORITY 2] Testing Multi-College Data Isolation ---');

    // 2.1 College 1 Admin only sees College 1 users
    const c1Users = await request('/admin/users', { token: tokens.collegeAdmin1 });
    const allC1 = c1Users.data.data.every(u => u.college_id === 1);
    const hasC2InC1 = c1Users.data.data.some(u => u.college_id === 2);
    assert(allC1 && !hasC2InC1, 'College 1 Admin only sees College 1 users (College 2 hidden)', `Users: ${JSON.stringify(c1Users.data.data.map(u => ({ id: u.id, cId: u.college_id })))}`);

    // 2.2 College 2 Admin only sees College 2 users
    const c2Users = await request('/admin/users', { token: tokens.collegeAdmin2 });
    const allC2 = c2Users.data.data.every(u => u.college_id === 2);
    const hasC1InC2 = c2Users.data.data.some(u => u.college_id === 1);
    assert(allC2 && !hasC1InC2, 'College 2 Admin only sees College 2 users (College 1 hidden)', `Users: ${JSON.stringify(c2Users.data.data.map(u => ({ id: u.id, cId: u.college_id })))}`);

    // 2.3 College 1 Admin cannot modify College 2 User (ID: 7 is DBIT student)
    const crossCollegeUpdate = await request('/admin/users/7', {
      method: 'PUT',
      token: tokens.collegeAdmin1,
      body: { name: 'Hacked DBIT Student' },
    });
    assert(crossCollegeUpdate.status === 403, 'College 1 Admin cannot modify user belonging to College 2 (403 Forbidden)', `Got ${crossCollegeUpdate.status}`);

    // -------------------------------------------------------------
    // PRIORITY 3: User Assignment Hierarchy (User -> College -> Department -> Batch -> Role)
    // -------------------------------------------------------------
    console.log('\n--- [PRIORITY 3] Testing User Assignment Hierarchy ---');

    const timestamp = Date.now();
    const uniqueEmail = `student_${timestamp}@pvppcoe.ac.in`;
    const uniqueMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

    // 3.1 College 1 Admin creates and assigns a new student to College 1, Department 1, Batch 1
    const createStudentRes = await request('/admin/users', {
      method: 'POST',
      token: tokens.collegeAdmin1,
      body: {
        name: `Aarav Sharma ${timestamp}`,
        email: uniqueEmail,
        mobile_number: uniqueMobile,
        role: 'student',
        department_id: 1, // Computer Engineering
        batch_id: 1,      // COMP-TE-A-2026
        roll_number: `ROLL_${timestamp}`,
        year: 'TE',
        division: 'A',
        semester: 'Semester 6',
        cgpa: '9.10',
        skills: 'React, Node.js, Python, DSA',
      },
    });

    assert(createStudentRes.status === 201, 'College Admin creates new student with full hierarchy (201 Created)', `Got ${createStudentRes.status}`);
    const createdUser = createStudentRes.data.data;
    assert(createdUser.college_id === 1, 'Assigned user college_id is strictly College 1', `Got ${createdUser?.college_id}`);
    assert(createdUser.studentProfile?.batch_id === 1, 'Assigned user batch_id is 1', `Got ${createdUser?.studentProfile?.batch_id}`);
    assert(createdUser.studentProfile?.department_id === 1, 'Assigned user department_id is 1', `Got ${createdUser?.studentProfile?.department_id}`);

    // 3.2 Block cross-college assignment: College 1 Admin tries to assign user to College 2's department (ID: 5)
    const crossAssignRes = await request('/admin/users', {
      method: 'POST',
      token: tokens.collegeAdmin1,
      body: {
        name: 'Illegal Student',
        email: `illegal_${timestamp}@pvppcoe.ac.in`,
        role: 'student',
        department_id: 5, // DBIT Department
      },
    });
    assert(crossAssignRes.status === 403, 'Cross-college department assignment blocked with 403 Forbidden', `Got ${crossAssignRes.status}`);

    // -------------------------------------------------------------
    // PRIORITY 4: Quiz / Assessment Calculation Engine
    // -------------------------------------------------------------
    console.log('\n--- [PRIORITY 4] Testing Quiz Calculation Engine ---');

    // 4.1 Fetch Assessments List
    const assessmentsRes = await request('/assessments', { token: tokens.student1 });
    assert(assessmentsRes.status === 200 && assessmentsRes.data.data.length > 0, 'Student retrieves available assessments (200 OK)', `Count: ${assessmentsRes.data.data?.length}`);

    // 4.2 Fetch Assessment 1 Details for student (strips answers)
    const quizDetailsRes = await request('/assessments/1', { token: tokens.student1 });
    assert(quizDetailsRes.status === 200, 'Student fetches Assessment 1 details', `Got ${quizDetailsRes.status}`);
    const q1 = quizDetailsRes.data.data.questions[0];
    assert(q1.correct_option === undefined, 'Quiz questions for student do NOT reveal correct answers', `Found correct_option: ${q1.correct_option}`);

    // 4.3 Student Submits Quiz:
    // Assessment 1 has 5 questions (10 marks each, total 50 marks, passing 60% = 30 marks):
    // Q1 correct ('B'), Q2 correct ('C'), Q3 correct ('C'), Q4 incorrect ('A' vs correct 'B'), Q5 unattempted
    const submitQuizRes = await request('/assessments/1/attempts', {
      method: 'POST',
      token: tokens.student1,
      body: {
        answers: [
          { question_id: 1, selected_option: 'B' }, // Correct -> 10 marks
          { question_id: 2, selected_option: 'C' }, // Correct -> 10 marks
          { question_id: 3, selected_option: 'C' }, // Correct -> 10 marks
          { question_id: 4, selected_option: 'A' }, // Incorrect -> 0 marks (correct is B)
          // Q5 is unattempted -> 0 marks
        ],
      },
    });

    assert(submitQuizRes.status === 201, 'Quiz submission evaluated successfully (201 Created)', `Got ${submitQuizRes.status}`);
    const scoring = submitQuizRes.data.data.scoring;
    console.log('    Calculated Scoring Result:', JSON.stringify(scoring, null, 2));

    assert(scoring.total_questions === 5, 'Scoring: total_questions is 5', `Got ${scoring?.total_questions}`);
    assert(scoring.attempted_questions === 4, 'Scoring: attempted_questions is 4', `Got ${scoring?.attempted_questions}`);
    assert(scoring.correct_count === 3, 'Scoring: correct_count is 3', `Got ${scoring?.correct_count}`);
    assert(scoring.incorrect_count === 1, 'Scoring: incorrect_count is 1', `Got ${scoring?.incorrect_count}`);
    assert(scoring.unattempted_count === 1, 'Scoring: unattempted_count is 1', `Got ${scoring?.unattempted_count}`);
    assert(scoring.marks_obtained === 30, 'Scoring: marks_obtained is 30 / 50', `Got ${scoring?.marks_obtained}`);
    assert(scoring.percentage === '60%', 'Scoring: percentage is 60%', `Got ${scoring?.percentage}`);
    assert(scoring.status === 'passed', 'Scoring: passing criteria met (status: passed)', `Got ${scoring?.status}`);

    // 4.4 Student retrieves past attempts history
    const myAttemptsRes = await request('/assessments/my-attempts', { token: tokens.student1 });
    assert(myAttemptsRes.status === 200 && myAttemptsRes.data.data.length >= 1, 'Student can retrieve saved attempt history', `Attempts count: ${myAttemptsRes.data.data?.length}`);

  } catch (err) {
    console.error('Unexpected test failure:', err);
  } finally {
    await stopServer();
    console.log('\n================================================================');
    console.log(`--- TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED ---`);
    console.log('================================================================\n');
    if (passedTests === totalTests) {
      console.log('🎉 ALL 4 PRIORITIES VERIFIED SUCCESSFULLY!\n');
    } else {
      process.exit(1);
    }
  }
}

runTests();
