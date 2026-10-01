import mysql from 'mysql2/promise';
import { config } from '../src/config/env.js';

const conn = await mysql.createConnection({ host: config.db.host, port: config.db.port, user: config.db.user, password: config.db.password, database: config.db.database, connectTimeout: config.db.connectTimeout });
const q = async (sql, p = []) => (await conn.query(sql, p))[0];
const out = [];
const expect = (label, got, want) => { const pass = got === want; out.push(`${pass ? 'PASS' : 'FAIL'} | ${label}: got=${got} expected=${want}`); };

// 1. Students
const stu = (await q(`SELECT COUNT(*) c FROM users u JOIN students s ON s.user_id=u.id WHERE u.role='student' AND u.college_id=1 AND u.target_track='C2C 2029'`))[0].c;
expect('students (users+students, C2C 2029, college 1)', stu, 162);

const branchRows = await q(`SELECT d.code code, COUNT(*) c FROM students s JOIN users u ON u.id=s.user_id JOIN departments d ON d.id=s.department_id WHERE u.target_track='C2C 2029' GROUP BY d.code`);
const bc = Object.fromEntries(branchRows.map(b => [b.code, b.c]));
for (const [code, exp] of Object.entries({ CS: 74, ECS: 40, AIML: 21, IT: 20, MEC: 7 })) expect(`branch ${code}`, bc[code], exp);

// Roll-number (student id) uniqueness & email uniqueness (non-null)
const dupRoll = (await q(`SELECT roll_number, COUNT(*) c FROM students s JOIN users u ON u.id=s.user_id WHERE u.target_track='C2C 2029' GROUP BY roll_number HAVING c>1`)).length;
expect('unique student IDs in students table', dupRoll, 0);
const dupEmail = (await q(`SELECT email, COUNT(*) c FROM users WHERE target_track='C2C 2029' AND email IS NOT NULL GROUP BY email HAVING c>1`)).length;
expect('unique non-null emails within C2C students', dupEmail, 0);

// 2. Mentors
const mentors = (await q(`SELECT id FROM users WHERE role='mentor' AND target_track='C2C 2029'`)).map(r => r.id);
expect('mentors (C2C 2029)', mentors.length, 15);

// 3. Assignments
const asg = (await q(`SELECT COUNT(*) c FROM mentor_student_assignments msa JOIN users s ON s.id=msa.student_id WHERE s.target_track='C2C 2029'`))[0].c;
expect('mentor_student_assignments (162 students)', asg, 162);
const msaMentors = await q(`SELECT COUNT(DISTINCT msa.mentor_id) c FROM mentor_student_assignments msa JOIN users m ON m.id=msa.mentor_id WHERE m.target_track='C2C 2029'`);
expect('distinct mentors used in assignments', msaMentors[0].c, 15);

// 4. Enrollments
const enroll = (await q(`SELECT COUNT(*) c FROM training_enrollments te JOIN users u ON u.id=te.student_user_id WHERE u.target_track='C2C 2029'`))[0].c;
expect('training_enrollments', enroll, 162);
const paid = (await q(`SELECT COUNT(*) c FROM training_enrollments te JOIN users u ON u.id=te.student_user_id WHERE u.target_track='C2C 2029' AND te.payment_status='paid'`))[0].c;
const partial = (await q(`SELECT COUNT(*) c FROM training_enrollments te JOIN users u ON u.id=te.student_user_id WHERE u.target_track='C2C 2029' AND te.payment_status='partial'`))[0].c;
const unpaid = (await q(`SELECT COUNT(*) c FROM training_enrollments te JOIN users u ON u.id=te.student_user_id WHERE u.target_track='C2C 2029' AND te.payment_status='unpaid'`))[0].c;
expect('payments paid (>=3500)', paid, 159);
expect('payments partial', partial, 3);
expect('payments unpaid', unpaid, 0);

// Payment received by split
const pb = await q(`SELECT payment_received_by r, COUNT(*) c FROM training_enrollments te JOIN users u ON u.id=te.student_user_id WHERE u.target_track='C2C 2029' AND payment_received_by <> '' GROUP BY r`);
const prb = Object.fromEntries(pb.map(b => [b.r, b.c]));
expect('paid to Vedant', prb['Vedant'] || 0, 82);
expect('paid to Shanmukh', prb['Shanmukh'] || 0, 80);

// WhatsApp
const wa = (await q(`SELECT COUNT(*) c FROM training_enrollments te JOIN users u ON u.id=te.student_user_id WHERE u.target_track='C2C 2029' AND LOWER(whatsapp_group_added) LIKE 'yes%'`))[0].c;
expect('whatsapp added yes', wa, 162);

// 5. Batches / departments / program / college
const batches = (await q(`SELECT COUNT(*) c FROM batches WHERE college_id=1 AND name LIKE 'C2C 2029 - %'`))[0].c;
expect('C2C batches', batches, 5);
const depts = (await q(`SELECT d.code FROM departments d WHERE d.college_id=1`)).map(r => r.code);
for (const code of ['CS','ECS','AIML','IT','MEC']) expect(`dept ${code} exists`, depts.includes(code), true);
expect('total depts college 1 (no dup)', depts.length, 6);
const prog = (await q(`SELECT COUNT(*) c FROM training_programs WHERE college_id=1 AND code='C2C 2029'`))[0].c;
expect('training_program C2C 2029 (single)', prog, 1);
const collegeC = (await q(`SELECT code FROM colleges`)).map(r => r.code);
expect('PVPPCOE college not duplicated', collegeC.filter(c => c === 'PVPPCOE').length, 1);

// Orphan checks
const orphanPay = (await q(`SELECT COUNT(*) c FROM training_enrollments te LEFT JOIN users u ON u.id=te.student_user_id WHERE u.id IS NULL`))[0].c;
expect('enrollments orphan users', orphanPay, 0);
const orphanAsg = (await q(`SELECT COUNT(*) c FROM mentor_student_assignments msa LEFT JOIN users u ON u.id=msa.student_id WHERE u.id IS NULL`))[0].c;
expect('assignments orphan students', orphanAsg, 0);

// 6. mentor_assignments populated for coordinator scope
const ma = (await q(`SELECT COUNT(*) c FROM mentor_assignments ma JOIN users m ON m.id=ma.mentor_id WHERE m.target_track='C2C 2029'`))[0].c;
expect('mentor_assignments (mentor,batch) rows', ma >= 15, true);

console.log(out.join('\n'));
const failed = out.filter(l => l.startsWith('FAIL')).length;
console.log(`\nVALIDATION RESULT: ${failed === 0 ? 'ALL PASS' : `${failed} FAILED`}`);
await conn.end();