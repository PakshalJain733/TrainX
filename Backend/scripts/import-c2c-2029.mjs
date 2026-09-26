import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, pool } from '../src/config/db.js';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '..');
const FILE = path.join(BACKEND_ROOT, 'data', 'c2c_2029.xlsx');

const COLLEGE_CODE = 'PVPPCOE';
const PROGRAM_NAME = 'Campus to Corporate Training Program';
const PROGRAM_CODE = 'C2C 2029';
const FEE = 3500;
const EXPECTED = {
  students: 162,
  mentors: 15,
  branch: { CS: 74, ECS: 40, AIML: 21, IT: 20, MEC: 7 },
  assignments: 162,
  enrollments: 162,
  paymentsFull: 159,
  paymentsPartial: 3,
  paymentsUnpaid: 0,
  whatsappYes: 162,
};

const BRANCH_MAP = {
  'CS': { code: 'CS', name: 'Computer Science' },
  'ECS': { code: 'ECS', name: 'Electronics and Computer Science' },
  'AI & ML': { code: 'AIML', name: 'Artificial Intelligence & Machine Learning' },
  'IT': { code: 'IT', name: 'Information Technology' },
  'Mechatronics': { code: 'MEC', name: 'Mechatronics' },
};

const BATCH_NAME = { CS: 'C2C 2029 - CS', ECS: 'C2C 2029 - ECS', AIML: 'C2C 2029 - AI & ML', IT: 'C2C 2029 - IT', MEC: 'C2C 2029 - Mechatronics' };

const norm = (s) => String(s ?? '').trim();
const normID = (s) => norm(s).toUpperCase();
const normEmail = (s) => norm(s).toLowerCase();
const normKey = (s) => norm(s).toLowerCase().replace(/\s+/g, ' ');
const digits = (s) => String(s ?? '').replace(/\D/g, '');
const digitize = (s) => digits(String(s ?? '').split('/')[0]).slice(0, 20);
const amountNum = (s) => { const n = digits(s); return n ? parseInt(n, 10) : 0; };

const stats = {
  studentsImported: 0,
  studentsUpdated: 0,
  mentorsImported: 0,
  mentorsUpdated: 0,
  assignments: 0,
  enrollments: 0,
  paymentsFull: 0,
  paymentsPartial: 0,
  paymentsUnpaid: 0,
  whatsappYes: 0,
  branchCounts: {},
  warnings: [],
};

const wb = XLSX.readFile(FILE);
function sheetRows(sheetName, headerIdx) {
  return XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '', raw: false })
    .slice(headerIdx)
    .filter((r) => r && normID(r[2]));
}

const registered = sheetRows('Registered Students', 5);
const mentorRaw = sheetRows('Mentor Allocation', 6);
const form = sheetRows('Form Responses 1', 1);
const payment = sheetRows('Payment Status', 1);

if ([registered.length, form.length, payment.length, mentorRaw.length].some((n) => n !== EXPECTED.students)) {
  console.error(`Sheet row counts invalid: registered=${registered.length} form=${form.length} payment=${payment.length} mentor=${mentorRaw.length} (expected ${EXPECTED.students})`);
  process.exit(1);
}
for (let i = 0; i < EXPECTED.students; i++) {
  if (normID(form[i][2]) !== normID(payment[i][2])) {
    console.error(`Payment Status row order mismatch at index ${i}`);
    process.exit(1);
  }
}

const registeredByID = new Map(registered.map((r) => [normID(r[2]), r]));

const students = [];
for (let i = 0; i < EXPECTED.students; i++) {
  const f = form[i];
  const reg = registeredByID.get(normID(f[2]));
  const branch = norm(f[7]);
  const bm = BRANCH_MAP[branch];
  if (!bm) {
    console.error(`Unknown branch "${branch}" for student ${normID(f[2])}`);
    process.exit(1);
  }
  const existing = students.find((s) => s.id === normID(f[2]));
  const rec = {
    id: normID(f[2]),
    name: norm(reg ? reg[3] : f[4]),
    email: normEmail(f[3]),
    mobile: digits(f[5]),
    yearOfStudy: norm(f[6]),
    branchCode: bm.code,
    branchName: bm.name,
    trainingOpted: norm(f[8]),
    proofUrl: norm(f[10]),
    srcTimestamp: norm(f[0]),
    amountPaid: amountNum(payment[i][10]),
    paidTo: norm(payment[i][11]),
    waGroup: norm(payment[i][12]),
    srcStatus: norm(payment[i][13]),
    mentorKey: '',
    mentorName: '',
    mentorPhone: '',
  };
  if (existing) Object.assign(existing, rec);
  else students.push(rec);
}

let cur = '';
const mentorMeta = new Map();
for (let i = 0; i < students.length; i++) {
  const s = students[i];
  const cell = norm(mentorRaw[i][6]);
  if (cell) {
    const m = cell.match(/^(.+?)\s*\(\d+\s*Students?\)\s*(.*)$/i) || cell.match(/^(.+?)\s+(\([^)]*\))\s*(.*)$/i);
    const rawName = (m ? m[1] : cell).trim();
    const phonePart = (m ? (m[2]) : '').trim().split('/')[0];
    const key = normKey(rawName);
    if (!mentorMeta.has(key)) mentorMeta.set(key, { name: rawName, phone: digitize(phonePart) });
    cur = key;
  }
  const meta = mentorMeta.get(cur);
  s.mentorKey = cur;
  s.mentorName = meta ? meta.name : cur;
  s.mentorPhone = meta ? meta.phone : '';
}

for (const s of students) stats.branchCounts[s.branchCode] = (stats.branchCounts[s.branchCode] || 0) + 1;

async function run() {
  const conn = await pool.getConnection();
  try {
    const origQuery = conn.query.bind(conn);
    conn.query = async (sql, params) => {
      try { return await origQuery(sql, params); }
      catch (e) { e.message = `SQL: ${sql} | params: ${JSON.stringify(params)} | ${e.message}`; throw e; }
    };
    await conn.beginTransaction();

    const college = (await conn.query('SELECT id FROM colleges WHERE code = ?', [COLLEGE_CODE]))[0][0];
    if (!college) throw new Error(`College code ${COLLEGE_CODE} not found in DB`);
    const collegeId = college.id;

    const deptIds = {};
    for (const bm of Object.values(BRANCH_MAP)) {
      const found = (await conn.query('SELECT id FROM departments WHERE college_id = ? AND code = ?', [collegeId, bm.code]))[0][0];
      if (found) deptIds[bm.code] = found.id;
      else {
        const r = await conn.query('INSERT INTO departments (college_id, name, code, status) VALUES (?, ?, ?, ?)', [collegeId, bm.name, bm.code, 'Active']);
        deptIds[bm.code] = r[0].insertId;
      }
    }

    const prog = (await conn.query('SELECT id FROM training_programs WHERE college_id = ? AND code = ?', [collegeId, PROGRAM_CODE]))[0][0];
    const programId = prog
      ? prog.id
      : (await conn.query(
          `INSERT INTO training_programs (college_id, name, code, short_name, placement_season_year, graduation_year, description, fee_amount, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [collegeId, PROGRAM_NAME, PROGRAM_CODE, PROGRAM_CODE, 2029, 2029, 'Campus to Corporate (C2C) Placement Season 2029 training cohort', FEE, 'Active']
        ))[0].insertId;

    const batchIds = {};
    for (const [code, name] of Object.entries(BATCH_NAME)) {
      const found = (await conn.query('SELECT id FROM batches WHERE college_id = ? AND department_id = ? AND name = ?', [collegeId, deptIds[code], name]))[0][0];
      if (found) batchIds[code] = found.id;
      else {
        const r = await conn.query(
          `INSERT INTO batches (college_id, department_id, name, academic_year, start_year, end_year, status, year, code, students)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [collegeId, deptIds[code], name, '2026-2029', 2026, 2029, 'active', 'C2C 2029', code, 0]
        );
        batchIds[code] = r[0].insertId;
      }
    }

    for (const meta of mentorMeta.values()) {
      let mentorId = null;
      if (meta.phone) {
        const byPhone = (await conn.query('SELECT id FROM users WHERE role = ? AND mobile_number = ?', ['mentor', meta.phone]))[0][0];
        if (byPhone) mentorId = byPhone.id;
      }
      if (!mentorId) {
        const r = await conn.query(
          `INSERT INTO users (name, email, mobile_number, role, college_id, is_active, is_profile_updated, target_track)
           VALUES (?, NULL, ?, 'mentor', ?, 0, 0, ?)`,
          [meta.name, meta.phone, collegeId, PROGRAM_CODE]
        );
        mentorId = r[0].insertId;
        stats.mentorsImported += 1;
      } else {
        await conn.query('UPDATE users SET is_active = COALESCE(is_active, 0), target_track = ?, college_id = ? WHERE id = ?', [PROGRAM_CODE, collegeId, mentorId]);
        stats.mentorsUpdated += 1;
      }
      meta.id = mentorId;
    }

    const [existingUserEmails] = await conn.query(`SELECT LOWER(email) AS email FROM users WHERE email IS NOT NULL AND email <> ''`);
    const emailsUsed = new Set(existingUserEmails.map((e) => e.email));
    const assignedEmails = new Set();

    for (const s of students) {
      const emailTaken = s.email && (emailsUsed.has(s.email) || assignedEmails.has(s.email));
      const targetEmail = !emailTaken ? (s.email || null) : null;

      let user = s.mobile ? (await conn.query('SELECT id FROM users WHERE mobile_number = ?', [s.mobile]))[0][0] : undefined;
      let userId;
      if (!user) {
        const r = await conn.query(
          `INSERT INTO users (name, email, mobile_number, role, college_id, is_active, is_profile_updated, target_track)
           VALUES (?, ?, ?, 'student', ?, 1, 1, ?)`,
          [s.name, targetEmail, s.mobile, collegeId, PROGRAM_CODE]
        );
        userId = r[0].insertId;
        stats.studentsImported += 1;
      } else {
        userId = user.id;
        await conn.query('UPDATE users SET name = ?, college_id = ?, is_active = 1, is_profile_updated = 1, target_track = ? WHERE id = ?',
          [s.name, collegeId, PROGRAM_CODE, userId]);
        if (targetEmail) {
          await conn.query('UPDATE users SET email = ? WHERE id = ? AND (email IS NULL OR email = ? OR email = ?)', [targetEmail, userId, '', targetEmail]);
        }
        stats.studentsUpdated += 1;
      }
      if (targetEmail) assignedEmails.add(targetEmail);
      s.userId = userId;

      const studentRow = (await conn.query('SELECT id FROM students WHERE user_id = ?', [userId]))[0][0];
      if (studentRow) {
        await conn.query(
          `UPDATE students SET college_id = ?, department_id = ?, batch_id = ?, roll_number = ?, department = ?, year = ?, is_profile_updated = 1, target_track = ? WHERE user_id = ?`,
          [collegeId, deptIds[s.branchCode], batchIds[s.branchCode], s.id, s.branchName, 'SY', PROGRAM_CODE, userId]
        );
      } else {
        await conn.query(
          `INSERT INTO students (user_id, college_id, department_id, batch_id, roll_number, department, year, target_track, is_profile_updated)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [userId, collegeId, deptIds[s.branchCode], batchIds[s.branchCode], s.id, s.branchName, 'SY', PROGRAM_CODE]
        );
      }

      await conn.query(
        `INSERT INTO student_batches (user_id, batch_id) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE batch_id = VALUES(batch_id)`,
        [userId, batchIds[s.branchCode]]
      );

      const msa = (await conn.query('SELECT id FROM mentor_student_assignments WHERE student_id = ?', [userId]))[0][0];
      const meta = mentorMeta.get(s.mentorKey);
      if (meta) {
        if (msa) await conn.query('UPDATE mentor_student_assignments SET mentor_id = ?, batch_id = ? WHERE id = ?', [meta.id, batchIds[s.branchCode], msa.id]);
        else await conn.query('INSERT INTO mentor_student_assignments (mentor_id, student_id, batch_id) VALUES (?, ?, ?)', [meta.id, userId, batchIds[s.branchCode]]);
        stats.assignments += 1;
      } else {
        stats.warnings.push(`No mentor resolved for ${s.id}`);
      }

      const status = s.amountPaid >= FEE ? 'paid' : (s.amountPaid > 0 ? 'partial' : 'unpaid');
      if (status === 'paid') stats.paymentsFull += 1;
      else if (status === 'partial') stats.paymentsPartial += 1;
      else stats.paymentsUnpaid += 1;
      if (digits(s.waGroup).length > 0 || norm(s.waGroup).toLowerCase().startsWith('yes')) stats.whatsappYes += 1;

      await conn.query(
        `INSERT INTO training_enrollments
           (student_user_id, program_id, batch_id, training_option, fee_amount, amount_paid, payment_status, payment_proof_url, payment_received_by, whatsapp_group_added, source_status, source_timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           batch_id = VALUES(batch_id), training_option = VALUES(training_option), fee_amount = VALUES(fee_amount),
           amount_paid = VALUES(amount_paid), payment_status = VALUES(payment_status), payment_proof_url = VALUES(payment_proof_url),
           payment_received_by = VALUES(payment_received_by), whatsapp_group_added = VALUES(whatsapp_group_added),
           source_status = VALUES(source_status), source_timestamp = VALUES(source_timestamp)`,
        [userId, programId, batchIds[s.branchCode], s.trainingOpted, FEE, s.amountPaid, status, s.proofUrl, s.paidTo, norm(s.waGroup).toLowerCase().startsWith('yes') || digits(s.waGroup).length > 0 ? 'Yes' : 'No', s.srcStatus, s.srcTimestamp]
      );
      stats.enrollments += 1;
    }

    for (const [code, batchId] of Object.entries(batchIds)) {
      const mentorIds = new Set();
      for (const s of students) if (s.branchCode === code && mentorMeta.get(s.mentorKey)) mentorIds.add(mentorMeta.get(s.mentorKey).id);
      for (const mid of mentorIds) {
        const existing = (await conn.query('SELECT id FROM mentor_assignments WHERE mentor_id = ? AND batch_id = ?', [mid, batchId]))[0][0];
        if (!existing) await conn.query('INSERT INTO mentor_assignments (mentor_id, batch_id) VALUES (?, ?)', [mid, batchId]);
      }
      const cnt = (await conn.query('SELECT COUNT(*) c FROM student_batches WHERE batch_id = ?', [batchId]))[0][0].c;
      await conn.query('UPDATE batches SET students = ? WHERE id = ?', [cnt, batchId]);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

try {
  await query(`
    CREATE TABLE IF NOT EXISTS training_programs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      college_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      short_name VARCHAR(100) DEFAULT NULL,
      placement_season_year INT DEFAULT NULL,
      graduation_year INT DEFAULT NULL,
      description TEXT,
      fee_amount INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'Active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_program_college_code (college_id, code)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS training_enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      student_user_id INT NOT NULL,
      program_id INT NOT NULL,
      batch_id INT DEFAULT NULL,
      training_option VARCHAR(255) DEFAULT NULL,
      fee_amount INT DEFAULT 0,
      amount_paid INT DEFAULT 0,
      payment_status ENUM('paid', 'partial', 'unpaid') DEFAULT 'unpaid',
      payment_proof_url VARCHAR(2048) DEFAULT NULL,
      payment_received_by VARCHAR(255) DEFAULT NULL,
      whatsapp_group_added VARCHAR(10) DEFAULT 'No',
      source_status VARCHAR(255) DEFAULT NULL,
      source_timestamp VARCHAR(64) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_enroll (student_user_id, program_id)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS mentor_student_assignments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      mentor_id INT NOT NULL,
      student_id INT NOT NULL,
      batch_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_mentor_student (student_id)
    )
  `);
  try {
    await query(`ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL`);
  } catch (e) {
    if (!/Duplicate/i.test(e.message)) throw e;
  }
  await run();
} catch (err) {
  console.error('Import failed:', err.message);
  process.exit(1);
}

const reportLines = [];
reportLines.push('', '========================================', ' C2C IMPORT REPORT', '========================================');
reportLines.push(` File          : ${FILE}`);
reportLines.push(` College       : ${COLLEGE_CODE}`);
reportLines.push(` Program       : ${PROGRAM_CODE} (fee ${FEE})`);
reportLines.push('');
reportLines.push(` STUDENTS  | Expected: ${EXPECTED.students} | Parsed: ${students.length} | New users: ${stats.studentsImported} | Existing updated: ${stats.studentsUpdated}`);
for (const [code, exp] of Object.entries(EXPECTED.branch)) {
  const got = stats.branchCounts[code] || 0;
  reportLines.push(`     ${code}: ${got} (expected ${exp}) ${got === exp ? 'OK' : 'MISMATCH'}`);
}
reportLines.push('');
reportLines.push(` MENTORS   | Expected: ${EXPECTED.mentors} | Unique parsed: ${mentorMeta.size} | New: ${stats.mentorsImported} | Existing updated: ${stats.mentorsUpdated}`);
for (const meta of mentorMeta.values()) {
  const assigned = students.filter((s) => s.mentorKey === normKey(meta.name)).length;
  reportLines.push(`     - ${meta.name} (${assigned} students) ${meta.phone}`);
}
reportLines.push('');
reportLines.push(` ASSIGNMENTS | ${stats.assignments} (expected ${EXPECTED.assignments})`);
reportLines.push(` ENROLLMENTS | ${stats.enrollments} (expected ${EXPECTED.enrollments})`);
reportLines.push(`   Paid    : ${stats.paymentsFull} (expected ${EXPECTED.paymentsFull})`);
reportLines.push(`   Partial : ${stats.paymentsPartial} (expected ${EXPECTED.paymentsPartial})`);
reportLines.push(`   Unpaid  : ${stats.paymentsUnpaid} (expected ${EXPECTED.paymentsUnpaid})`);
reportLines.push(`   WhatsApp: ${stats.whatsappYes} (expected ${EXPECTED.whatsappYes})`);
if (stats.warnings.length) {
  reportLines.push('');
  reportLines.push(' WARNINGS');
  for (const w of stats.warnings) reportLines.push('   - ' + w);
}
reportLines.push('========================================');
console.log(reportLines.join('\n'));
await pool.end();