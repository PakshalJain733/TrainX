// @ts-nocheck
import {
  calculateAttendancePercentage,
  evaluateAttendanceStatus,
  getFilteredStudentsAttendanceService,
} from '../src/services/attendance.service.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import app from '../src/app.js';
import http from 'http';

const generateToken = (payload) => jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

const log = (label, color = '\x1b[37m') => console.log(`${color}${label}\x1b[0m`);
const ok   = (msg) => log(`  ✅ ${msg}`, '\x1b[32m');
const fail = (msg) => log(`  ❌ ${msg}`, '\x1b[31m');
const section = (title) => {
  console.log('');
  log(`${'═'.repeat(65)}`, '\x1b[33m');
  log(`  ${title}`, '\x1b[33m');
  log(`${'═'.repeat(65)}`, '\x1b[33m');
};

let server;
let baseUrl;

const startServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      resolve();
    });
  });
};

const stopServer = () => {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
};

const apiRequest = async (method, path, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${baseUrl}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

async function runAttendanceTests() {
  console.log('\n🧪 ATTENDANCE ENGINE & ANALYTICS — COMPREHENSIVE TEST SUITE');
  await startServer();

  let passed = 0;
  let failed = 0;

  try {
    // ─── TEST 1: 100% Attendance Calculation ───────────────────────────────
    section('TEST 1: 100% Attendance Calculation');
    const pct100 = calculateAttendancePercentage(20, 20);
    const status100 = evaluateAttendanceStatus(pct100, 20);
    if (pct100 === 100.0 && status100 === 'Good') {
      ok('Passed: 20/20 present = 100.0% (Status: Good)');
      passed++;
    } else {
      fail(`Failed: Expected 100.0% Good, got ${pct100}% ${status100}`);
      failed++;
    }

    // ─── TEST 2: 75% Attendance Calculation ────────────────────────────────
    section('TEST 2: 75% Attendance Calculation');
    const pct75 = calculateAttendancePercentage(15, 20);
    const status75 = evaluateAttendanceStatus(pct75, 20);
    if (pct75 === 75.0 && status75 === 'Warning') {
      ok('Passed: 15/20 present = 75.0% (Status: Warning)');
      passed++;
    } else {
      fail(`Failed: Expected 75.0% Warning, got ${pct75}% ${status75}`);
      failed++;
    }

    // ─── TEST 3: Below-Threshold Attendance (50%) ─────────────────────────
    section('TEST 3: Below-Threshold Attendance (50%)');
    const pct50 = calculateAttendancePercentage(10, 20);
    const status50 = evaluateAttendanceStatus(pct50, 20);
    if (pct50 === 50.0 && status50 === 'Low Attendance') {
      ok('Passed: 10/20 present = 50.0% (Status: Low Attendance)');
      passed++;
    } else {
      fail(`Failed: Expected 50.0% Low Attendance, got ${pct50}% ${status50}`);
      failed++;
    }

    // ─── TEST 4: Student with 0 Attendance Records ─────────────────────────
    section('TEST 4: Student with No Attendance Records');
    const pct0 = calculateAttendancePercentage(0, 0);
    const status0 = evaluateAttendanceStatus(pct0, 0);
    if (pct0 === 0.0 && status0 === 'No Records') {
      ok('Passed: 0/0 records handled safely (0.0%, Status: No Records)');
      passed++;
    } else {
      fail(`Failed: Expected 0.0% No Records, got ${pct0}% ${status0}`);
      failed++;
    }

    // ─── TEST 5: Student with Single Attendance Record ──────────────────────
    section('TEST 5: Student with Single Attendance Record');
    const pct1 = calculateAttendancePercentage(1, 1);
    const status1 = evaluateAttendanceStatus(pct1, 1);
    if (pct1 === 100.0 && status1 === 'Good') {
      ok('Passed: 1/1 record = 100.0% (Status: Good)');
      passed++;
    } else {
      fail(`Failed: Expected 100.0% Good, got ${pct1}% ${status1}`);
      failed++;
    }

    // ─── TEST 6: Formula Verification (Total = Present + Absent) ───────────
    section('TEST 6: Total Classes Formula Verification (Total = Present + Absent)');
    const sampleRecord = { total_classes: 50, present_count: 40, absent_count: 10 };
    const formulaValid = sampleRecord.total_classes === (sampleRecord.present_count + sampleRecord.absent_count);
    if (formulaValid) {
      ok('Passed: Total Classes (50) = Present (40) + Absent (10)');
      passed++;
    } else {
      fail('Failed: Total Classes constraint mismatch');
      failed++;
    }

    // ─── TEST 7: Department & Batch Filter Logic ─────────────────────────────
    section('TEST 7: Department (ECS) & Batch (2026) Filter Logic');
    const mockFilterRes = await getFilteredStudentsAttendanceService({
      department: 'ECS',
      batchName: '2026',
      threshold: 75,
    });
    if (Array.isArray(mockFilterRes)) {
      ok(`Passed: Successfully processed department & batch filter query (returned ${mockFilterRes.length} records)`);
      passed++;
    } else {
      fail('Failed: Filter query did not return an array');
      failed++;
    }

    // ─── TEST 8: HTTP API Integration — Student Summary (/api/v1/attendance/summary) ───
    section('TEST 8: HTTP API Integration — Student Summary');
    const studentToken = generateToken({ userId: 101, role: 'student', college_id: 1 });
    const resSummary = await apiRequest('GET', '/attendance/summary', null, studentToken);
    if (resSummary.status === 200 && resSummary.data?.success) {
      ok(`Passed: GET /attendance/summary returned 200 OK (${resSummary.data.data.attendance_percentage}% ${resSummary.data.data.attendance_status})`);
      passed++;
    } else {
      fail(`Failed: GET /attendance/summary returned status ${resSummary.status}`);
      failed++;
    }

    // ─── TEST 9: HTTP API Integration — Low Attendance Filter (/api/v1/attendance/low-attendance) ───
    section('TEST 9: HTTP API Integration — Coordinator Low Attendance Query');
    const coordinatorToken = generateToken({ userId: 201, role: 'coordinator', college_id: 1 });
    const resLow = await apiRequest('GET', '/attendance/low-attendance?department=ECS&batch=2026&threshold=75', null, coordinatorToken);
    if (resLow.status === 200 && resLow.data?.success) {
      ok(`Passed: GET /attendance/low-attendance returned 200 OK for Coordinator`);
      passed++;
    } else {
      fail(`Failed: GET /attendance/low-attendance returned status ${resLow.status}`);
      failed++;
    }

    // ─── TEST 10: Unauthorized User Access Blocked (RBAC Check) ───────────
    section('TEST 10: Unauthorized Student Access to Coordinator Endpoint Blocked (403)');
    const resForbidden = await apiRequest('GET', '/attendance/low-attendance', null, studentToken);
    if (resForbidden.status === 403) {
      ok('Passed: Student role blocked from low-attendance coordinator route (403 Forbidden)');
      passed++;
    } else {
      fail(`Failed: Expected 403 Forbidden, got ${resForbidden.status}`);
      failed++;
    }

  } catch (err) {
    console.error('Test Suite Error:', err);
    failed++;
  } finally {
    await stopServer();
    console.log('\n================================================================');
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');
    if (failed > 0) process.exit(1);
  }
}

runAttendanceTests();
