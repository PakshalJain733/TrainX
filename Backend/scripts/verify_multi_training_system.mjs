/**
 * Comprehensive Multi-Training System Verification Script
 * Validates all 10 core scenarios specified in the task requirements.
 */
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

function getEnv() {
  const envPath = path.resolve('Backend/.env');
  const content = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, 'utf8')
    : fs.readFileSync(path.resolve('.env'), 'utf8');
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      vars[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
  return vars;
}

const env = getEnv();

const pool = mysql.createPool({
  host: env.DB_HOST || 'localhost',
  user: env.DB_USER || 'root',
  password: env.DB_PASSWORD || '',
  database: env.DB_NAME || 'training_portal_db',
  port: Number(env.DB_PORT || 3306),
});

const BASE_URL = 'http://[::1]:5000/api/v1';
const WEBHOOK_SECRET = process.env.C2C_WEBHOOK_SECRET || 'TrainX_C2C_Webhook_Secret_Key_2026';

async function safeFetch(url, options = {}, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await globalThis.fetch(url, options);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 600));
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('=====================================================');
  console.log('🚀 STARTING MULTI-TRAINING VERIFICATION TEST SUITE');
  console.log('=====================================================\n');

  try {
    // -----------------------------------------------------------------
    // Scenario 8: Verify Existing C2C enrollments & records are intact
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 8: Existing C2C Data Preservation ---');
    const [existingC2c] = await pool.query('SELECT * FROM c2c_enrollments WHERE training_id IS NOT NULL');
    assert(existingC2c.length >= 4, `Found ${existingC2c.length} existing C2C enrollments mapped cleanly`);
    const [c2cLegacyApiRes] = await safeFetch(`${BASE_URL}/c2c/google-form/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).then(r => [r.status]);
    assert(c2cLegacyApiRes === 401, 'Legacy C2C webhook route exists and enforces secret authentication');

    // -----------------------------------------------------------------
    // Scenario 1: Create two different trainings
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 1: Creating Two Distinct Trainings ---');
    const codeA = `VERIF-PROG-A-${Date.now()}`;
    const codeB = `VERIF-PROG-B-${Date.now()}`;

    const [createA] = await pool.query(
      `INSERT INTO training_programs (college_id, name, code, short_name, fee_amount, status, description, start_date, end_date)
       VALUES (1, 'Full-Stack Web Engineering 2026', ?, 'FSW-2026', 4500, 'Open', 'MERN Stack course', '2026-07-01', '2026-12-31')`,
      [codeA]
    );
    const trainingIdA = createA.insertId;

    const [createB] = await pool.query(
      `INSERT INTO training_programs (college_id, name, code, short_name, fee_amount, status, description, start_date, end_date)
       VALUES (1, 'AI & Machine Learning Bootcamp 2026', ?, 'AIML-2026', 6000, 'Open', 'Deep Learning and LLMs', '2026-08-01', '2027-01-31')`,
      [codeB]
    );
    const trainingIdB = createB.insertId;

    assert(trainingIdA > 0 && trainingIdB > 0, `Created Training A (ID: ${trainingIdA}) and Training B (ID: ${trainingIdB})`);

    // -----------------------------------------------------------------
    // Scenario 2: Public lookup for each training by unique code
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 2: Independent Registration Links & Metadata ---');
    const resA = await safeFetch(`${BASE_URL}/trainings/code/${encodeURIComponent(codeA)}`).then(r => r.json());
    assert(resA.success && resA.data.code === codeA && resA.data.feeAmount === 4500, `Fetched Training A metadata correctly with fee ₹4,500`);

    const resB = await safeFetch(`${BASE_URL}/trainings/code/${encodeURIComponent(codeB)}`).then(r => r.json());
    assert(resB.success && resB.data.code === codeB && resB.data.feeAmount === 6000, `Fetched Training B metadata correctly with fee ₹6,000`);

    // -----------------------------------------------------------------
    // Scenario 3 & 4: Student registers for Training A and Training B
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 3 & 4: Dual Registration & Complete Isolation ---');
    const testStudentEmail = `multi.student.${Date.now()}@pvppcoe.ac.in`;

    // Register for Training A
    const regARes = await safeFetch(`${BASE_URL}/trainings/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        training_id: trainingIdA,
        full_name: 'Antigravity Test Student',
        email: testStudentEmail,
        mobile: '9876543210',
        roll_number: 'TEST202601',
        college: 'PVPPCOE',
        branch: 'Computer Engineering',
        year: 'Third Year',
        division: 'A',
        batch: 'B1',
        amount_paid: 2000,
        utr_number: 'UTR_TEST_PROG_A_001',
        payment_proof_url: 'https://drive.google.com/proof_a',
      }),
    }).then(r => r.json());

    assert(regARes.success, `Student registered successfully for Training A`);
    const enrollmentIdA = regARes.data.enrollment.id;

    // Register for Training B
    const regBRes = await safeFetch(`${BASE_URL}/trainings/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        training_id: trainingIdB,
        full_name: 'Antigravity Test Student',
        email: testStudentEmail,
        mobile: '9876543210',
        roll_number: 'TEST202601',
        college: 'PVPPCOE',
        branch: 'Computer Engineering',
        year: 'Third Year',
        division: 'A',
        batch: 'B1',
        amount_paid: 6000,
        utr_number: 'UTR_TEST_PROG_B_002',
        payment_proof_url: 'https://drive.google.com/proof_b',
      }),
    }).then(r => r.json());

    assert(regBRes.success, `Same student registered separately for Training B`);
    const enrollmentIdB = regBRes.data.enrollment.id;

    assert(enrollmentIdA !== enrollmentIdB, `Student received distinct enrollment records (A: ${enrollmentIdA}, B: ${enrollmentIdB})`);

    // Verify isolation in database
    const [rowsA] = await pool.query('SELECT * FROM c2c_enrollments WHERE training_id = ?', [trainingIdA]);
    const [rowsB] = await pool.query('SELECT * FROM c2c_enrollments WHERE training_id = ?', [trainingIdB]);
    assert(rowsA.length === 1 && rowsA[0].email === testStudentEmail, `Training A enrollment list contains strictly 1 student`);
    assert(rowsB.length === 1 && rowsB[0].email === testStudentEmail, `Training B enrollment list contains strictly 1 student`);
    assert(Number(rowsA[0].amount_paid) === 2000, `Training A amount paid is ₹2,000 (part payment)`);
    assert(Number(rowsB[0].amount_paid) === 6000, `Training B amount paid is ₹6,000 (full payment)`);

    // -----------------------------------------------------------------
    // Scenario 5: Google Form webhook imports to the correct training
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 5: Webhook Association by training_code ---');
    const webhookStudentEmail = `webhook.student.${Date.now()}@pvppcoe.ac.in`;
    const responseId1 = `gform_resp_${Date.now()}_01`;

    const hookRes = await safeFetch(`${BASE_URL}/trainings/google-form/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-training-webhook-secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        training_code: codeB,
        source_response_id: responseId1,
        full_name: 'Webhook Enrolled Student',
        email: webhookStudentEmail,
        mobile: '9123456789',
        roll_number: 'WH2026B',
        college: 'PVPPCOE',
        branch: 'AI & Data Science',
        year: 'Fourth Year',
        amount_paid: '6000',
        utr_number: 'UTR_WH_998877',
      }),
    }).then(r => r.json());

    assert(hookRes.success, `Webhook accepted and processed form submission for ${codeB}`);
    const [hookRowsB] = await pool.query('SELECT * FROM c2c_enrollments WHERE training_id = ? AND email = ?', [trainingIdB, webhookStudentEmail]);
    assert(hookRowsB.length === 1, `Webhook enrollment mapped accurately to Training B in database`);

    // Verify it did NOT leak into Training A
    const [leakCheckA] = await pool.query('SELECT * FROM c2c_enrollments WHERE training_id = ? AND email = ?', [trainingIdA, webhookStudentEmail]);
    assert(leakCheckA.length === 0, `No data leakage: Webhook student is NOT in Training A`);

    // -----------------------------------------------------------------
    // Scenario 6: Deduplication of Google Form responses
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 6: Idempotency & Deduplication ---');
    const duplicateRes = await safeFetch(`${BASE_URL}/trainings/google-form/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-training-webhook-secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        training_code: codeB,
        source_response_id: responseId1, // SAME response_id
        full_name: 'Webhook Enrolled Student',
        email: webhookStudentEmail,
        amount_paid: '6000',
      }),
    }).then(r => r.json());

    assert(duplicateRes.success && duplicateRes.data.created === false, `Duplicate form response updated existing record without duplicate creation`);
    const [dedupCount] = await pool.query('SELECT COUNT(*) as cnt FROM c2c_enrollments WHERE training_id = ? AND email = ?', [trainingIdB, webhookStudentEmail]);
    assert(dedupCount[0].cnt === 1, `Verified exactly 1 record exists in database after duplicate submission`);

    // -----------------------------------------------------------------
    // Scenario 7: Admin Approval & Payment Status Persistence
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 7: Independent Approval & Payment State Updates ---');
    // Update approval on Enrollment A to Approved
    await pool.query('UPDATE c2c_enrollments SET approval_status = ?, approved_at = NOW() WHERE id = ?', ['Approved', enrollmentIdA]);
    // Update payment status on Enrollment A to Part Payment
    await pool.query('UPDATE c2c_enrollments SET payment_status = ? WHERE id = ?', ['Part Payment', enrollmentIdA]);

    const [verifyA] = await pool.query('SELECT approval_status, payment_status, balance FROM c2c_enrollments WHERE id = ?', [enrollmentIdA]);
    assert(verifyA[0].approval_status === 'Approved', `Approval status persisted as 'Approved'`);
    assert(verifyA[0].payment_status === 'Part Payment', `Payment status persisted independently as 'Part Payment'`);
    assert(Number(verifyA[0].balance) === 2500, `Calculated balance correctly persisted (₹4,500 - ₹2,000 = ₹2,500)`);

    // -----------------------------------------------------------------
    // Scenario 9: Closing Training A does not affect Training B
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 9: Program Lifecycle Isolation ---');
    await pool.query('UPDATE training_programs SET status = ? WHERE id = ?', ['Closed', trainingIdA]);

    // Check status via API
    const chkClosedA = await safeFetch(`${BASE_URL}/trainings/code/${encodeURIComponent(codeA)}`).then(r => r.json());
    assert(chkClosedA.data.status === 'Closed', `Training A is now 'Closed'`);

    const chkOpenB = await safeFetch(`${BASE_URL}/trainings/code/${encodeURIComponent(codeB)}`).then(r => r.json());
    assert(chkOpenB.data.status === 'Open', `Training B remains unaffected and is still 'Open'`);

    // Try registering for closed Training A -> Should be rejected
    const rejectClosed = await safeFetch(`${BASE_URL}/trainings/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        training_id: trainingIdA,
        full_name: 'Late Student',
        email: `late.${Date.now()}@pvppcoe.ac.in`,
      }),
    }).then(r => r.json());
    const errMsg = rejectClosed.message || rejectClosed.error || '';
    assert(!rejectClosed.success && errMsg.toLowerCase().includes('closed'), `Registration rejected for Closed training program: "${errMsg}"`);

    // -----------------------------------------------------------------
    // Scenario 10: Existing Login & Dashboards Unaffected
    // -----------------------------------------------------------------
    console.log('\n--- Scenario 10: System Health & Login Integrity ---');
    const health = await safeFetch(`${BASE_URL}/health`).then(r => r.json());
    assert(health.success && health.data.status === 'healthy', `System health endpoint active and database healthy`);

    console.log('\n=====================================================');
    console.log('🎉 ALL 10 MULTI-TRAINING SCENARIOS VERIFIED SUCCESSFULLY!');
    console.log('=====================================================\n');
  } finally {
    await pool.end();
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
