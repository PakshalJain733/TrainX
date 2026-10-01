import { query } from '../config/db.js';

/**
 * Upserts a C2C Google Form response into the database.
 * Ensures idempotency: duplicate form submissions with the same response_id or (email + utr)
 * will update existing records without creating duplicates.
 */
export const upsertGoogleFormEnrollment = async (payload) => {
  const {
    full_name,
    email,
    mobile,
    roll_number,
    college,
    branch,
    year,
    division,
    batch,
    amount_paid,
    utr_number,
    payment_date,
    payment_proof_url,
    response_id,
  } = payload;

  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanFullName = (full_name || 'Student').trim();
  const cleanMobile = (mobile || '').trim();
  const cleanRoll = (roll_number || '').trim();
  const cleanCollege = (college || '').trim();
  const cleanBranch = (branch || '').trim();
  const cleanYear = (year || '').trim();
  const cleanDivision = (division || '').trim();
  const cleanBatch = (batch || '').trim();
  const cleanUtr = (utr_number || '').trim();
  const cleanDate = (payment_date || new Date().toISOString()).trim();
  const cleanProof = (payment_proof_url || '').trim();
  const cleanResponseId = (response_id || '').trim();

  const totalFee = 3500.00;
  const parsedPaid = parseFloat(amount_paid);
  const amountPaid = isNaN(parsedPaid) ? 0.00 : Math.max(0, parsedPaid);
  const balance = Math.max(0, totalFee - amountPaid);

  // Initial payment status is always 'Pending' on webhook submission
  const initialStatus = 'Pending';

  // Idempotency check: look up existing record by response_id, (email + utr), or email
  let existing = null;
  if (cleanResponseId) {
    const rows = await query('SELECT * FROM c2c_enrollments WHERE response_id = ? LIMIT 1', [cleanResponseId]);
    if (rows && rows.length > 0) existing = rows[0];
  }

  if (!existing && cleanEmail && cleanUtr) {
    const rows = await query('SELECT * FROM c2c_enrollments WHERE email = ? AND utr_number = ? LIMIT 1', [cleanEmail, cleanUtr]);
    if (rows && rows.length > 0) existing = rows[0];
  }

  if (!existing && cleanEmail) {
    const rows = await query('SELECT * FROM c2c_enrollments WHERE email = ? LIMIT 1', [cleanEmail]);
    if (rows && rows.length > 0) existing = rows[0];
  }

  if (existing) {
    // Update fields without resetting payment_status if admin already modified it
    await query(
      `UPDATE c2c_enrollments SET
        full_name = ?,
        mobile = ?,
        roll_number = ?,
        college = ?,
        branch = ?,
        year = ?,
        division = ?,
        batch = ?,
        utr_number = COALESCE(NULLIF(?, ''), utr_number),
        payment_date = COALESCE(NULLIF(?, ''), payment_date),
        payment_proof_url = COALESCE(NULLIF(?, ''), payment_proof_url),
        raw_payload = ?
       WHERE id = ?`,
      [
        cleanFullName,
        cleanMobile,
        cleanRoll,
        cleanCollege,
        cleanBranch,
        cleanYear,
        cleanDivision,
        cleanBatch,
        cleanUtr,
        cleanDate,
        cleanProof,
        JSON.stringify(payload),
        existing.id,
      ]
    );

    const updatedRows = await query('SELECT * FROM c2c_enrollments WHERE id = ?', [existing.id]);
    return { created: false, updated: true, enrollment: updatedRows[0] };
  }

  // Insert new enrollment record
  const result = await query(
    `INSERT INTO c2c_enrollments
      (response_id, full_name, email, mobile, roll_number, college, branch, year, division, batch, total_fee, amount_paid, balance, payment_status, utr_number, payment_date, payment_proof_url, source, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'google_form', ?)`,
    [
      cleanResponseId || null,
      cleanFullName,
      cleanEmail,
      cleanMobile,
      cleanRoll,
      cleanCollege,
      cleanBranch,
      cleanYear,
      cleanDivision,
      cleanBatch,
      totalFee,
      amountPaid,
      balance,
      initialStatus,
      cleanUtr,
      cleanDate,
      cleanProof,
      JSON.stringify(payload),
    ]
  );

  const newRows = await query('SELECT * FROM c2c_enrollments WHERE id = ?', [result.insertId]);
  return { created: true, updated: false, enrollment: newRows[0] };
};

/**
 * Retrieves all C2C enrollments formatted for the admin dashboard.
 */
export const getC2CEnrollments = async () => {
  const sql = 'SELECT * FROM c2c_enrollments ORDER BY created_at DESC';
  const rows = await query(sql);

  const total = rows.length;
  const completed = rows.filter(r => (r.payment_status || '').toLowerCase() === 'completed').length;
  const partPayment = rows.filter(r => (r.payment_status || '').toLowerCase() === 'part payment' || (r.payment_status || '').toLowerCase() === 'partial').length;
  const pending = rows.filter(r => (r.payment_status || '').toLowerCase() === 'pending' || (r.payment_status || '').toLowerCase() === 'unpaid').length;
  const cancelled = rows.filter(r => (r.payment_status || '').toLowerCase() === 'cancelled').length;

  return {
    enrollments: rows.map(r => {
      const amountPaid = Number(r.amount_paid || 0);
      const totalFee = Number(r.total_fee || 3500);
      const balance = Number(r.balance !== undefined && r.balance !== null ? r.balance : Math.max(0, totalFee - amountPaid));
      return {
        id: r.id,
        enrollmentId: r.id,
        response_id: r.response_id,
        name: r.full_name,
        full_name: r.full_name,
        email: r.email,
        mobile: r.mobile,
        rollNumber: r.roll_number,
        roll_number: r.roll_number,
        college: r.college,
        branch: r.branch,
        department: r.branch,
        year: r.year,
        division: r.division,
        batch: r.batch,
        batchName: r.batch,
        totalFee,
        total_fee: totalFee,
        amountPaid,
        amount_paid: amountPaid,
        balance,
        paymentStatus: r.payment_status,
        payment_status: r.payment_status,
        utrNumber: r.utr_number,
        utr_number: r.utr_number,
        paymentDate: r.payment_date,
        payment_date: r.payment_date,
        paymentProofUrl: r.payment_proof_url,
        payment_proof_url: r.payment_proof_url,
        source: r.source,
        createdAt: r.created_at,
        created_at: r.created_at,
      };
    }),
    counts: {
      total,
      completed,
      paid: completed,
      partPayment,
      partial: partPayment,
      pending,
      unpaid: pending,
      cancelled,
    },
  };
};

/**
 * Updates payment status and recalculates balance for a C2C enrollment.
 */
export const updateC2CPaymentStatus = async (id, newStatus, newAmountPaid) => {
  const allowed = ['Pending', 'Part Payment', 'Completed', 'Cancelled'];
  const formattedStatus = allowed.find(s => s.toLowerCase() === (newStatus || '').toLowerCase().trim()) || newStatus;

  const rows = await query('SELECT * FROM c2c_enrollments WHERE id = ?', [id]);
  if (!rows || rows.length === 0) {
    throw new Error(`Enrollment with ID ${id} not found`);
  }

  const existing = rows[0];
  const totalFee = Number(existing.total_fee || 3500.00);
  let amountPaid = Number(existing.amount_paid || 0.00);

  if (newAmountPaid !== undefined && newAmountPaid !== null && newAmountPaid !== '') {
    amountPaid = parseFloat(newAmountPaid) || 0.00;
  } else if (formattedStatus === 'Completed') {
    amountPaid = totalFee;
  }

  const balance = Math.max(0, totalFee - amountPaid);

  await query(
    'UPDATE c2c_enrollments SET payment_status = ?, amount_paid = ?, balance = ? WHERE id = ?',
    [formattedStatus, amountPaid, balance, id]
  );

  const updatedRows = await query('SELECT * FROM c2c_enrollments WHERE id = ?', [id]);
  return updatedRows[0];
};
