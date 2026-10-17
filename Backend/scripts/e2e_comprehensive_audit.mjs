import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { query } from '../src/config/db.js';

const BASE_URL = 'http://localhost:5000/api/v1';
const JWT_SECRET = process.env.JWT_SECRET || 'trainx_dev_secret_2026_ganesh_shinde_training_portal';

function makeToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      id: user.id,
      email: user.email || 'user@test.com',
      role: user.role,
      collegeId: user.college_id || 1,
      college_id: user.college_id || 1
    },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

async function testEndpoint(name, url, options = {}, expectedStatus = [200, 201]) {
  try {
    const res = await fetch(url, options);
    const isExpected = Array.isArray(expectedStatus) ? expectedStatus.includes(res.status) : res.status === expectedStatus;
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (isExpected) {
      console.log(`[PASS] ${name} (Status: ${res.status})`);
      return { pass: true, status: res.status, data };
    } else {
      console.error(`[FAIL] ${name} (Expected: ${expectedStatus}, Got: ${res.status})`, typeof data === 'object' ? data?.message || data : data);
      return { pass: false, status: res.status, data };
    }
  } catch (err) {
    console.error(`[ERR] ${name} (${err.message})`);
    return { pass: false, error: err.message };
  }
}

async function main() {
  console.log('=== STARTING COMPREHENSIVE E2E AUDIT ===\n');

  // Fetch users for each role
  const superAdminUser = (await query("SELECT * FROM users WHERE role = 'super_admin' LIMIT 1"))[0];
  const collegeAdminUser = (await query("SELECT * FROM users WHERE role = 'college_admin' LIMIT 1"))[0];
  const mentorUser = (await query("SELECT * FROM users WHERE role = 'mentor' LIMIT 1"))[0];
  const studentUser = (await query("SELECT * FROM users WHERE role = 'student' LIMIT 1"))[0];

  const saToken = makeToken(superAdminUser);
  const caToken = makeToken(collegeAdminUser);
  const mentorToken = makeToken(mentorUser);
  const studentToken = makeToken(studentUser);

  const saAuth = { Authorization: `Bearer ${saToken}` };
  const caAuth = { Authorization: `Bearer ${caToken}` };
  const mAuth = { Authorization: `Bearer ${mentorToken}` };
  const sAuth = { Authorization: `Bearer ${studentToken}` };

  console.log('--- 1. SYSTEM HEALTH & MONITORING ---');
  await testEndpoint('Health /live (Unauth)', `${BASE_URL}/health/live`, {}, 200);
  await testEndpoint('Health /ready (Unauth)', `${BASE_URL}/health/ready`, {}, 200);
  await testEndpoint('Health root / (Unauth probe)', `${BASE_URL}/health`, {}, 200);
  await testEndpoint('Health /detailed (Super Admin)', `${BASE_URL}/health/detailed`, { headers: saAuth }, 200);

  console.log('\n--- 2. SUPER ADMIN OPERATIONS ---');
  await testEndpoint('Get Colleges (Unauth)', `${BASE_URL}/colleges`, {}, 200);
  await testEndpoint('Get Colleges (Super Admin)', `${BASE_URL}/colleges`, { headers: saAuth }, 200);
  await testEndpoint('Get Users (Super Admin)', `${BASE_URL}/admin/users`, { headers: saAuth }, 200);
  await testEndpoint('Get Secure Codes (Super Admin)', `${BASE_URL}/secure-codes`, { headers: saAuth }, 200);
  await testEndpoint('Get Feature Switches (Super Admin)', `${BASE_URL}/feature-switches`, { headers: saAuth }, 200);

  console.log('\n--- 3. COLLEGE ADMIN / COORDINATOR OPERATIONS ---');
  await testEndpoint('Get Departments (College Admin)', `${BASE_URL}/departments`, { headers: caAuth }, 200);
  await testEndpoint('Get Batches (College Admin)', `${BASE_URL}/batches`, { headers: caAuth }, 200);
  await testEndpoint('Get Assessments (College Admin)', `${BASE_URL}/assessments`, { headers: caAuth }, 200);
  await testEndpoint('Get Leave Requests (College Admin)', `${BASE_URL}/attendance/leave-requests`, { headers: caAuth }, 200);

  console.log('\n--- 4. MENTOR OPERATIONS ---');
  await testEndpoint('Mentor Overview', `${BASE_URL}/mentor/overview`, { headers: mAuth }, 200);
  await testEndpoint('Mentor Batches', `${BASE_URL}/mentor/batches`, { headers: mAuth }, 200);
  await testEndpoint('Mentor Students', `${BASE_URL}/mentor/students`, { headers: mAuth }, 200);
  await testEndpoint('Mentor Study Materials', `${BASE_URL}/mentor/materials`, { headers: mAuth }, 200);

  console.log('\n--- 5. STUDENT OPERATIONS ---');
  await testEndpoint('Student Profile /me', `${BASE_URL}/students/me`, { headers: sAuth }, [200, 404]);
  await testEndpoint('Student Practice Problems', `${BASE_URL}/practice-problems`, { headers: sAuth }, 200);
  await testEndpoint('Student Available Assessments', `${BASE_URL}/assessments/available`, { headers: sAuth }, 200);
  await testEndpoint('Student Attendance Summary', `${BASE_URL}/attendance/summary`, { headers: sAuth }, 200);
  await testEndpoint('Student Attendance Scans', `${BASE_URL}/attendance/scans`, { headers: sAuth }, 200);
  await testEndpoint('Student Shared Content', `${BASE_URL}/shared-content`, { headers: sAuth }, 200);

  console.log('\n--- 6. SECURITY & AUTHORIZATION GUARDS ---');
  await testEndpoint('Student denied Super Admin Users', `${BASE_URL}/admin/users`, { headers: sAuth }, 403);
  await testEndpoint('Student denied Secure Codes generation', `${BASE_URL}/secure-codes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...sAuth },
    body: JSON.stringify({ role: 'admin' })
  }, 403);
  await testEndpoint('Unauthenticated denied Protected Batches', `${BASE_URL}/batches`, {}, 401);

  console.log('\n=== AUDIT RUN COMPLETE ===');
  process.exit(0);
}

main().catch(e => {
  console.error('Audit run failed:', e);
  process.exit(1);
});
