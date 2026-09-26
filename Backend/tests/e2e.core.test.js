/**
 * E2E RUNTIME CORE TEST — verifies real cross-role API workflows against the
 * live backend (http://localhost:5000) and the configured MySQL database.
 *
 * Roles exercised: super_admin, college_admin, student
 * Flows:
 *   T1  college_admin creates a coding task via shared-content  → 201 + real DB id
 *   T2  student sees that coding task via shared-content?type=coding
 *   T3  college_admin creates a practice problem (admin route)    → 201
 *   T4  student sees that practice problem (student route)        -> PRIORITY BUG
 *   T5  RBAC: student is rejected on /admin/practice-problems     → 403
 *   T6  college isolation: super_admin creates for college 2,     -> college-1
 *       student must NOT see it                                     student hidden
 *   T7  college_admin broadcast create + list                     → visible to admin
 *   T15 code run — reachable; sandbox needs Docker (graceful 503)
 *   T16 assessment create (admin) → visible to student via /assessments/available
 *   T17 shared quiz (type=quiz) → visible to student
 *   T18 learning material (mentor create) → mentor list + student list
 *   T19 leave approval cycle: student applies → coordinator approves → student sees Approved
 *   T20 broadcast → visible in student notifications
 *   T21 security: assessment / batch / secure-codes reject unauthenticated callers
 *
 * Uses REAL users from the DB (no synthetic test data except temp rows that are
 * cleaned up in finally). Tokens are minted with the backend's own generateToken.
 */

import { generateToken } from '../src/utils/generateToken.js';
import { query } from '../src/config/db.js';

const BASE = process.env.E2E_BASE || 'http://localhost:5000/api/v1';
const TAG = `E2E${Date.now()}`;

const collate = (title, result) => {
  const ok = result.ok;
  console.log(
    `${ok ? '✅ PASS' : '❌ FAIL'}  ${title}    ${result.detail || ''}`
  );
  return { title: `Core: ${title}`, ok, ...result };
};

const results = [];
const record = (title, ok, detail = '') =>
  results.push({ title: `Core: ${title}`, ok, detail });

const h = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const api = async (method, path, token, body, asRaw) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h(token),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (asRaw) return res;
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
};

const adminDbId = 1531;
const studentDbId = 1534;
const superDbId = 1530;

const tokens = {
  admin: generateToken({
    userId: adminDbId,
    email: 'collegeadmin.dev@pvppcoe.ac.in',
    mobile: '',
    role: 'college_admin',
    collegeId: 1,
  }),
  student: generateToken({
    userId: studentDbId,
    email: 'student.dev@pvppcoe.ac.in',
    mobile: '',
    role: 'student',
    collegeId: 1,
  }),
  super: generateToken({
    userId: superDbId,
    email: 'superadmin.dev@pvppcoe.ac.in',
    mobile: '',
    role: 'super_admin',
    collegeId: 1,
  }),
  mentor: generateToken({
    userId: 1533,
    email: 'mentor.dev@pvppcoe.ac.in',
    mobile: '',
    role: 'mentor',
    collegeId: 1,
  }),
  coord: generateToken({
    userId: 1532,
    email: 'coordinator.dev@pvppcoe.ac.in',
    mobile: '',
    role: 'coordinator',
    collegeId: 1,
  }),
};

const codingTitle = `E2E Coding Task ${TAG}`;
const practiceTitle1 = `E2E Practice Problem ${TAG}`;
const practiceTitle2 = `E2E CrossCollege Problem ${TAG}`;
const broadcastTitle = `E2E Broadcast ${TAG}`;
const assessmentTitle = `E2E Assessment ${TAG}`;
const quizTitle = `E2E Shared Quiz ${TAG}`;
const materialTitle = `E2E Learning Material ${TAG}`;
const leaveReason2 = `E2E leave approve ${TAG}`;

const created = { sharedId: null, practiceId1: null, practiceId2: null, broadcastId: null, leaveId: null, assessmentId: null, sharedQuizId: null, materialId: null, leaveId2: null };

const run = async () => {
  const out = [];

  // Wait for the backend to be up (nodemon may be restarting)
  let up = false;
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`${BASE.replace(/\/api\/v1$/, '')}/api/v1/health`);
      if (r.ok) { up = true; break; }
    } catch {}
    await new Promise((res) => setTimeout(res, 500));
  }
  if (!up) {
    console.error('❌ Backend not reachable for E2E. Start it first (npm run dev).');
    process.exit(2);
  }

  // ── T1: admin creates coding task via shared-content ─────────────────────
  const t1 = await api('POST', '/shared-content', tokens.admin, {
    type: 'coding',
    title: codingTitle,
    description: 'E2E runtime generated',
    data: { difficulty: 'Medium', category: 'E2E Test', points: 100 },
    batch_name: 'All Batches',
    status: 'Active',
  });
  if (t1.json?.success && t1.json?.data?.id) {
    created.sharedId = t1.json.data.id;
    record('Admin creates shared coding task', t1.status === 201, `status=${t1.status} id=${created.sharedId}`);
  } else {
    record('Admin creates shared coding task', false, `status=${t1.status} msg=${t1.json?.message || 'no data'}`);
  }

  // ── T2: student sees the shared coding task ──────────────────────────────
  const t2 = await api('GET', `/shared-content?type=coding`, tokens.student);
  const t2found = Array.isArray(t2.json?.data) && t2.json.data.some((x) => x.title === codingTitle);
  record('Student sees shared coding task', t2found, t2found ? 'found in student list' : 'NOT in student list');

  // ── T3: admin creates practice problem via admin route ───────────────────
  const t3 = await api('POST', '/admin/practice-problems', tokens.admin, {
    title: practiceTitle1,
    batch: 'All Batches',
    batch_id: null,
    difficulty: 'Easy',
    category: 'DSA E2E',
    tags: ['e2e'],
    description: 'E2E runtime generated',
    points: 50,
  });
  if (t3.json?.success && t3.json?.data?.id) {
    created.practiceId1 = t3.json.data.id;
    record('Admin creates practice problem', t3.status === 201, `status=${t3.status} id=${created.practiceId1}`);
  } else {
    record('Admin creates practice problem', false, `status=${t3.status} msg=${t3.json?.message || 'no data'}`);
  }

  // ── T4 (PRIORITY): student sees the admin-created practice problem ───────
  const t4 = await api('GET', '/student/practice-problems', tokens.student);
  const t4arr = Array.isArray(t4.json?.data) ? t4.json.data : [];
  const t4found = t4arr.some((p) => p.title === practiceTitle1);
  record('PRIORITY: Student sees admin practice problem', t4found, t4found ? 'found in student list' : 'NOT in student list');

  // ── T5: RBAC — student must be rejected on admin route ───────────────────
  const t5 = await api('GET', '/admin/practice-problems', tokens.student);
  record('RBAC: student blocked from /admin/practice-problems', t5.status === 403, `status=${t5.status}`);

  // ── T8: Solve-detail leg — student can fetch a practice problem by id ─────
  if (created.practiceId1) {
    const t8 = await api('GET', `/student/practice-problems/${created.practiceId1}`, tokens.student);
    const t8ok = t8.status === 200 && t8.json?.data?.title === practiceTitle1;
    record('Student fetches practice problem by id (Solve deep link)', t8ok, t8ok ? `id=${created.practiceId1} resolved` : `status=${t8.status} msg=${t8.json?.message || 'mismatch'}`);
  } else {
    record('Student fetches practice problem by id (Solve deep link)', false, 'skip - no practice id');
  }

  // ── T6: college isolation — college 2 problem hidden from college 1 student ─
  const t6 = await api('POST', '/admin/practice-problems?collegeId=2', tokens.super, {
    title: practiceTitle2,
    batch: 'All Batches',
    batch_id: null,
    difficulty: 'Medium',
    category: 'Isolation E2E',
    tags: ['e2e'],
    points: 100,
  });
  if (t6.json?.success && t6.json?.data?.id) {
    created.practiceId2 = t6.json.data.id;
    const t6b = await api('GET', '/student/practice-problems', tokens.student);
    const t6arr = Array.isArray(t6b.json?.data) ? t6b.json.data : [];
    const t6Leaked = t6arr.some((p) => p.title === practiceTitle2);
    record('College isolation: college-2 problem hidden from college-1 student', !t6Leaked, t6Leaked ? 'LEAKED to student' : 'hidden correctly');
  } else {
    record('College isolation: create college-2 problem (setup)', false, `status=${t6.status} msg=${t6.json?.message || 'no data'}`);
  }

  // ── T7: admin broadcast create + list ────────────────────────────────────
  const t7 = await api('POST', '/admin/broadcast', tokens.admin, {
    title: broadcastTitle,
    message: 'E2E runtime generated broadcast',
    type: 'alert',
  });
  if (t7.json?.success && t7.json?.data?.id) {
    created.broadcastId = t7.json.data.id;
    const t7b = await api('GET', '/admin/broadcast', tokens.admin);
    const t7arr = Array.isArray(t7b.json?.data) ? t7b.json.data : [];
    const t7found = t7arr.some((b) => b.title === broadcastTitle);
    record('Admin broadcast create + list', t7found, t7found ? 'visible in admin list' : 'NOT visible after create');
  } else {
    record('Admin broadcast create + list', false, `status=${t7.status} msg=${t7.json?.message || 'no data'}`);
  }

  // ── T20: broadcast → student notifications (college-scoped) ───────────────
  const t20 = await api('GET', '/student/notifications', tokens.student);
  const t20arr = Array.isArray(t20.json?.data) ? t20.json.data : [];
  record('Broadcast visible to student notifications', t20arr.some((b) => b.title === broadcastTitle), t20arr.some((b) => b.title === broadcastTitle) ? 'found in student list' : 'NOT in student notifications');

  // ── T9-T11: previously-unmounted role portals ─────────────────────────────
  for (const [ep, tok, label] of [
    ['/mentor/materials', tokens.mentor, 'Mentor portal: study materials list'],
    ['/coordinator/students', tokens.coord, 'Coordinator portal: students list'],
    ['/superadmin/overview', tokens.super, 'Superadmin portal: overview'],
    ['/coding-submissions/student/1534', tokens.student, 'Student coding submissions list'],
  ]) {
    const r = await api('GET', ep, tok);
    record(label, r.status === 200, `status=${r.status}`);
  }

  // ── T12: RBAC — mentor must be rejected on superadmin portal ──────────────
  const t12 = await api('GET', '/superadmin/overview', tokens.mentor);
  record('RBAC: mentor blocked from /superadmin/overview', t12.status === 403, `status=${t12.status}`);

  // ── T13: leave application → persisted to leave_requests ─────────────────
  const leaveReason = `E2E leave ${TAG}`;
  const t13 = await api('POST', '/student/attendance/leave', tokens.student, {
    category: 'Medical Leave',
    startDate: '2026-09-25',
    endDate: '2026-09-26',
    days: 2,
    reason: leaveReason,
  });
  if (t13.status === 201 && t13.json?.data?.id) {
    const leaveId = String(t13.json.data.id).replace(/^LV-/, '');
    created.leaveId = leaveId;
    const t13b = await api('GET', '/student/attendance', tokens.student);
    const verifs = Array.isArray(t13b.json?.data?.verifications) ? t13b.json.data.verifications : [];
    const found = verifs.some((v) => v.id === `LV-${leaveId}` && v.status === 'Pending');
    record('Leave application persisted + visible to student', found, found ? `id=LV-${leaveId}` : `NOT visible after apply (${verifs.length} verifications)`);
  } else {
    record('Leave application persisted + visible to student', false, `status=${t13.status} msg=${t13.json?.message || 'no data'}`);
  }

  // ── T14: student attendance summary ─────────────────────────────────────
  const t14 = await api('GET', '/student/attendance', tokens.student);
  record('Student attendance summary', t14.status === 200, `status=${t14.status}`);

  // ── T15: code run — reachable; sandbox needs Docker ──────────────────────
  const t15 = await api('POST', '/code/run', tokens.student, {
    language: 'python',
    code: 'print(1+1)',
  });
  const t15Ok =
    (t15.status === 200 && t15.json?.success && String(t15.json?.data?.stdout || t15.json?.data?.output || '').includes('2')) ||
    (t15.status === 503 && /compiler service unavailable/i.test(t15.json?.message || ''));
  record('Coding: /code/run reachable (graceful)', t15Ok, t15Ok ? `status=${t15.status} (Docker sandbox required for live output)` : `status=${t15.status} msg=${t15.json?.message || 'no output'}`);

  // ── T16: assessment create (admin) → visible to student ───────────────────
  const t16 = await api('POST', '/assessments', tokens.admin, {
    title: assessmentTitle,
    category: 'Technical Quiz',
    description: 'E2E runtime generated',
    status: 'published',
    is_published: true,
    total_marks: 100,
    pass_marks: 60,
    duration_minutes: 30,
  });
  if (t16.status === 201 && t16.json?.data?.id) {
    created.assessmentId = t16.json.data.id;
    const t16b = await api('GET', '/assessments/available', tokens.student);
    const t16arr = Array.isArray(t16b.json?.data) ? t16b.json.data : [];
    const t16found = t16arr.some((a) => a.title === assessmentTitle);
    record('Assessment: admin create → student eligible list', t16found, t16found ? `id=${created.assessmentId} visible` : 'NOT visible to student');
  } else {
    record('Assessment: admin create → student eligible list', false, `status=${t16.status} msg=${t16.json?.message || 'no data'}`);
  }

  // ── T17: shared quiz (type=quiz) → visible to student ─────────────────────
  const t17 = await api('POST', '/shared-content', tokens.admin, {
    type: 'quiz',
    title: quizTitle,
    description: 'E2E runtime generated quiz',
    data: { inputs: ['10', '20'] },
    batch_name: 'All Batches',
    status: 'Active',
  });
  if (t17.json?.success && t17.json?.data?.id) {
    created.sharedQuizId = t17.json.data.id;
    const t17b = await api('GET', '/shared-content?type=quiz', tokens.student);
    const t17arr = Array.isArray(t17b.json?.data) ? t17b.json.data : [];
    const t17found = t17arr.some((q) => q.title === quizTitle);
    record('Shared quiz (type=quiz) visible to student', t17found, t17found ? `id=${created.sharedQuizId} visible` : 'NOT in student quiz list');
  } else {
    record('Shared quiz (type=quiz) visible to student', false, `status=${t17.status} msg=${t17.json?.message || 'no data'}`);
  }

  // ── T18: learning material (mentor create) → mentor + student lists ───────
  const t18 = await api('POST', '/mentor/materials', tokens.mentor, {
    title: materialTitle,
    description: 'E2E runtime generated material',
    subject: 'E2E Subject',
    batch: 'All Batches',
    type: 'PDF',
    link: 'https://example.com/e2e.pdf',
  });
  if (t18.status === 201 && t18.json?.data?.id) {
    created.materialId = t18.json.data.id;
    const t18b = await api('GET', '/mentor/materials', tokens.mentor);
    const t18m = Array.isArray(t18b.json?.data) ? t18b.json.data : [];
    const t18c = await api('GET', '/student/materials', tokens.student);
    const t18s = Array.isArray(t18c.json?.data) ? t18c.json.data : [];
    const mentorSees = t18m.some((mt) => mt.title === materialTitle);
    const studentSees = t18s.some((mt) => mt.title === materialTitle);
    record('Learning material: mentor create → mentor sees', mentorSees, mentorSees ? `id=${created.materialId}` : 'NOT in mentor list');
    record('Learning material: student sees shared material', studentSees, studentSees ? 'visible in student list' : 'NOT in student list');
  } else {
    record('Learning material: mentor create → mentor sees', false, `status=${t18.status} msg=${t18.json?.message || 'no data'}`);
    record('Learning material: student sees shared material', false, 'create failed — skipped');
  }

  // ── T19: leave approval cycle (student → coordinator → student) ───────────
  const t19 = await api('POST', '/student/attendance/leave', tokens.student, {
    category: 'Medical Leave',
    startDate: '2026-09-25',
    endDate: '2026-09-26',
    days: 2,
    reason: leaveReason2,
  });
  if (t19.status === 201 && t19.json?.data?.id) {
    const t19b = await api('GET', '/coordinator/requests', tokens.coord);
    const t19list = Array.isArray(t19b.json?.data?.requests) ? t19b.json.data.requests : [];
    const t19row = t19list.find((r) => r.reason === leaveReason2);
    if (t19row && t19row.id != null) {
      created.leaveId2 = t19row.id;
      const t19c = await api('PUT', `/coordinator/requests/${t19row.id}`, tokens.coord, {
        status: 'Approved',
        remarks: 'E2E approved',
      });
      const t19d = await api('GET', '/student/attendance', tokens.student);
      const t19v = Array.isArray(t19d.json?.data?.verifications) ? t19d.json.data.verifications : [];
      const t19found = t19v.some((v) => v.id === `LV-${t19row.id}` && v.status === 'Approved');
      record('Leave approval: coordinator approved → student sees status', t19c.status === 200 && t19found, `put=${t19c.status} ${t19found ? 'student sees Approved' : `student status=${t19v.find((v) => v.id === `LV-${t19row.id}`)?.status || 'missing'}`}`);
    } else {
      record('Leave approval: coordinator approved → student sees status', false, 'leave not listed in coordinator requests');
    }
  } else {
    record('Leave approval: coordinator approved → student sees status', false, `apply status=${t19.status} msg=${t19.json?.message || 'no data'}`);
  }

  // ── T21: security — unguarded routers now require auth ────────────────────
  const t21a = await api('GET', '/assessments/available', null);
  const t21b = await api('POST', '/batches', null, { title: 'E2E should not create' });
  const t21c = await api('GET', '/secure-codes', null);
  record('Security: /assessments rejects unauthenticated (was open)', t21a.status === 401, `status=${t21a.status}`);
  record('Security: /batches rejects unauthenticated (was open)', t21b.status === 401, `status=${t21b.status}`);
  record('Security: /secure-codes rejects unauthenticated (was open)', t21c.status === 401, `status=${t21c.status}`);

  out.push({
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
  });

  console.log('\n===== E2E CORE RESULTS =====');
  for (const r of results) {
    console.log(`${r.ok ? '✅ PASS' : '❌ FAIL'}  ${r.title}${r.detail ? '  -> ' + r.detail : ''}`);
  }
  console.log(`SUMMARY: ${results.filter((r) => r.ok).length} PASSED, ${results.filter((r) => !r.ok).length} FAILED`);
  return out;
};

const cleanup = async () => {
  try {
    if (created.sharedId) {
      const res = await api('DELETE', `/shared-content/${created.sharedId}`, tokens.admin);
      console.log(`🧹 cleanup shared-content id=${created.sharedId} status=${res.status}`);
    }
  } catch {}
  try {
    if (created.practiceId2) {
      const res = await api('DELETE', `/admin/practice-problems/${created.practiceId2}`, tokens.super);
      console.log(`🧹 cleanup practice#${created.practiceId2} status=${res.status}`);
    }
  } catch {}
  try {
    if (created.practiceId1) {
      const res = await api('DELETE', `/admin/practice-problems/${created.practiceId1}`, tokens.admin);
      console.log(`🧹 cleanup practice#${created.practiceId1} status=${res.status}`);
    }
  } catch {}
  try {
    if (created.broadcastId) {
      const res = await api('DELETE', `/admin/broadcast/${created.broadcastId}`, tokens.admin);
      console.log(`🧹 cleanup broadcast#${created.broadcastId} status=${res.status}`);
    }
  } catch {}
  try {
    if (created.leaveId) {
      await query('DELETE FROM leave_requests WHERE id = ?', [created.leaveId]);
      console.log(`🧹 cleanup leave_requests#${created.leaveId}`);
    }
  } catch (e) {
    console.log('🧹 cleanup leave failed:', e.message);
  }
  try {
    if (created.assessmentId) {
      const res = await api('DELETE', `/assessments/${created.assessmentId}`, tokens.admin);
      console.log(`🧹 cleanup assessment#${created.assessmentId} status=${res.status}`);
    }
  } catch {}
  try {
    if (created.sharedQuizId) {
      const res = await api('DELETE', `/shared-content/${created.sharedQuizId}`, tokens.admin);
      console.log(`🧹 cleanup shared quiz#${created.sharedQuizId} status=${res.status}`);
    }
  } catch {}
  try {
    if (created.materialId) {
      const res = await api('DELETE', `/mentor/materials/${created.materialId}`, tokens.mentor);
      console.log(`🧹 cleanup material#${created.materialId} status=${res.status}`);
    }
  } catch {}
  try {
    if (created.leaveId2) {
      await query('DELETE FROM leave_requests WHERE id = ?', [created.leaveId2]);
      console.log(`🧹 cleanup leave_requests#${created.leaveId2}`);
    }
  } catch (e) {
    console.log('🧹 cleanup leave2 failed:', e.message);
  }
};

const main = async () => {
  try {
    await run();
  } finally {
    await cleanup();
  }
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
};

main();