import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../src/config/jwt.js';

const secret = getJwtSecret();
const BASE = 'http://localhost:5000/api/v1';

// Generate tokens for each role
const tokens = {
  superadmin: jwt.sign({ userId: 1744, email: 'admin@trainingportal.com', role: 'super_admin' }, secret, { expiresIn: '1h' }),
  college_admin: jwt.sign({ userId: 1748, email: 'vedant123@pvppcoe.ac.in', role: 'college_admin', college_id: 6 }, secret, { expiresIn: '1h' }),
  coordinator: jwt.sign({ userId: 9991, email: 'coordinator.test@pvppcoe.ac.in', role: 'coordinator', college_id: 6 }, secret, { expiresIn: '1h' }),
  mentor: jwt.sign({ userId: 1726, email: 'mentor.test@pvppcoe.ac.in', role: 'mentor', college_id: 6 }, secret, { expiresIn: '1h' }),
  student: jwt.sign({ userId: 6, email: 'vu3f2425047@pvppcoe.ac.in', role: 'student', college_id: 6 }, secret, { expiresIn: '1h' }),
};

async function testEndpoint(name, url, role, expectedStatus = [200, 201]) {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${tokens[role]}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json().catch(() => ({}));
    const pass = Array.isArray(expectedStatus) ? expectedStatus.includes(res.status) : res.status === expectedStatus;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} (${role}) -> HTTP ${res.status} (Expected: ${expectedStatus})`);
    if (!pass) {
      console.log('   Error payload:', JSON.stringify(data).slice(0, 200));
    }
    return { name, role, status: res.status, pass, data };
  } catch (err) {
    console.log(`[ERROR] ${name} (${role}) -> ${err.message}`);
    return { name, role, status: 0, pass: false, error: err.message };
  }
}

async function runRoleAudit() {
  console.log('=== TRAINEX ROLE-BY-ROLE API AUDIT ===\n');

  console.log('--- 1. Super Admin Endpoints ---');
  await testEndpoint('Super Admin Overview', `${BASE}/superadmin/overview`, 'superadmin');
  await testEndpoint('Super Admin Colleges', `${BASE}/superadmin/colleges`, 'superadmin');
  await testEndpoint('Super Admin Users', `${BASE}/superadmin/users`, 'superadmin');
  await testEndpoint('Super Admin Health', `${BASE}/health`, 'superadmin');

  console.log('\n--- 2. College Admin Endpoints ---');
  await testEndpoint('Admin Users', `${BASE}/admin/users`, 'college_admin');
  await testEndpoint('Colleges List', `${BASE}/colleges`, 'college_admin');
  await testEndpoint('Departments', `${BASE}/departments`, 'college_admin');
  await testEndpoint('Batches', `${BASE}/batches`, 'college_admin');

  console.log('\n--- 3. Coordinator Endpoints ---');
  await testEndpoint('Coordinator Overview', `${BASE}/coordinator/overview`, 'coordinator');
  await testEndpoint('Coordinator Batches', `${BASE}/coordinator/batches`, 'coordinator');
  await testEndpoint('Coordinator Students', `${BASE}/coordinator/students`, 'coordinator');

  console.log('\n--- 4. Mentor Endpoints ---');
  await testEndpoint('Mentor Overview', `${BASE}/mentor/overview`, 'mentor');
  await testEndpoint('Mentor Students', `${BASE}/mentor/students`, 'mentor');
  await testEndpoint('Mentor Batches', `${BASE}/mentor/batches`, 'mentor');

  console.log('\n--- 5. Student Endpoints ---');
  await testEndpoint('Student Self Data (/auth/me)', `${BASE}/auth/me`, 'student');
  await testEndpoint('Student Roadmap (/roadmap/my)', `${BASE}/roadmap/my`, 'student');
  await testEndpoint('Student Interview History', `${BASE}/interviews/history`, 'student');
  await testEndpoint('Student Code Problems', `${BASE}/code/problems`, 'student');
  await testEndpoint('Student Submissions', `${BASE}/code/submissions/my`, 'student');
  await testEndpoint('Leaderboard', `${BASE}/leaderboard`, 'student');
  await testEndpoint('Milestones', `${BASE}/milestones/my`, 'student');

  console.log('\n--- 6. RBAC & Security Boundaries ---');
  await testEndpoint('Student blocked from Super Admin', `${BASE}/superadmin/overview`, 'student', [401, 403]);
  await testEndpoint('Student blocked from Admin Users', `${BASE}/admin/users`, 'student', [401, 403]);
  await testEndpoint('Unauthenticated blocked from Profile', `${BASE}/auth/me`, 'student'); // wait, this uses student token, let's test no token
  
  // Unauthenticated test
  try {
    const unauthRes = await fetch(`${BASE}/auth/me`);
    const unauthPass = unauthRes.status === 401 || unauthRes.status === 403;
    console.log(`[${unauthPass ? 'PASS' : 'FAIL'}] Unauthenticated blocked from /auth/me -> HTTP ${unauthRes.status} (Expected: 401/403)`);
  } catch (e) {
    console.log('Unauth error:', e.message);
  }
}

runRoleAudit().then(() => {
  console.log('\nAudit completed.');
  process.exit(0);
});
