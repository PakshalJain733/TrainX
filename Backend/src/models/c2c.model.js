import crypto from 'crypto';
import { query } from '../config/db.js';
import { config } from '../config/env.js';
import {
  C2C_PROGRAM_CODE,
  C2C_PAYMENT_STATUS,
  C2C_PAYMENT_STATUS_VALUES,
  C2C_ACCESS_STATUS,
  C2C_REGISTRATION_STATUS,
} from '../utils/constants.js';


/**
 * C2C (Campus to Corporate) enrollment data access.
 *
 * Flow this module supports:
 *   1. Admin creates a C2C lead (`c2c_registrations`) for a student identifier.
 *      A placeholder `users` row is created up front so the account already
 *      exists when the student redeems the registration link.
 *   2. A UPI payment QR is rendered from the lead's stored coordinates.
 *   3. Admin records the initial payment information (amount, UTR, date, status)
 *      BEFORE the student has registered on TrainX.
 *   4. Once payment is full or part, the registration link is released.
 *   5. Student registers via that link; Admin approves the account; the C2C
 *      Enrollment is created automatically carrying the payment information.
 *
 * Everything is persisted in MySQL. There is no in-memory or client-side state.
 */

const toInt = (value) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
};

const normalizeEmail = (value) => {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return email || null;
};

const cleanText = (value, maxLength = 255) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  return text.slice(0, maxLength);
};

/**
 * Normalizes an incoming payment status onto the four mutually-exclusive values.
 * Returns null when the value is not recognised so callers can reject it rather
 * than silently persisting something unexpected.
 */
export const normalizePaymentStatus = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const key = String(value).trim().toLowerCase().replace(/[\s-]+/g, '_');
  const aliases = {
    pending: C2C_PAYMENT_STATUS.PENDING,
    unpaid: C2C_PAYMENT_STATUS.PENDING,
    part_payment: C2C_PAYMENT_STATUS.PART_PAYMENT,
    partpayment: C2C_PAYMENT_STATUS.PART_PAYMENT,
    part: C2C_PAYMENT_STATUS.PART_PAYMENT,
    partial: C2C_PAYMENT_STATUS.PART_PAYMENT,
    completed: C2C_PAYMENT_STATUS.COMPLETED,
    complete: C2C_PAYMENT_STATUS.COMPLETED,
    paid: C2C_PAYMENT_STATUS.COMPLETED,
    full: C2C_PAYMENT_STATUS.COMPLETED,
    full_payment: C2C_PAYMENT_STATUS.COMPLETED,
    cancelled: C2C_PAYMENT_STATUS.CANCELLED,
    canceled: C2C_PAYMENT_STATUS.CANCELLED,
  };
  return aliases[key] || null;
};

export const isPaymentStatus = (value) => C2C_PAYMENT_STATUS_VALUES.includes(normalizePaymentStatus(value));

/**
 * Derives the status an amount implies. Used when the Admin changes the amount
 * without explicitly picking a new status.
 */
export const derivePaymentStatus = (amountPaid, feeAmount) => {
  const paid = toInt(amountPaid) || 0;
  const fee = toInt(feeAmount) || 0;
  if (fee > 0 && paid >= fee) return C2C_PAYMENT_STATUS.COMPLETED;
  if (paid > 0) return C2C_PAYMENT_STATUS.PART_PAYMENT;
  return C2C_PAYMENT_STATUS.PENDING;
};

const generateRegistrationToken = () => crypto.randomBytes(24).toString('hex');

/**
 * Builds a standard UPI intent URI. Amount is intentionally omitted when the
 * student is expected to pay only part of the fee, so any UPI app still lets
 * them type an amount while pre-filling the payee.
 */
export const buildUpiPayload = ({ upiId, payeeName, amount, note, transactionRef }) => {
  if (!upiId) return null;
  const params = new URLSearchParams();
  params.set('pa', upiId);
  if (payeeName) params.set('pn', payeeName);
  if (amount && Number(amount) > 0) params.set('am', String(amount));
  params.set('cu', 'INR');
  if (note) params.set('tn', note.slice(0, 80));
  if (transactionRef) params.set('tr', transactionRef);
  return `upi://pay?${params.toString()}`;
};

// ---------------------------------------------------------------------------
// Program
// ---------------------------------------------------------------------------

/**
 * Returns the C2C program row, creating it on first use so the workflow works
 * on a database where the spreadsheet importer has never been run.
 */
export const ensureC2cProgram = async (collegeId = 1) => {
  const code = config.c2c.programCode || C2C_PROGRAM_CODE;
  const existing = await query(
    `SELECT id, college_id, name, code, fee_amount, status, upi_id, upi_payee_name
       FROM training_programs
      WHERE college_id = ? AND code = ?
      LIMIT 1`,
    [collegeId, code]
  );
  if (existing && existing[0]) return existing[0];

  await query(
    `INSERT INTO training_programs
      (college_id, name, code, short_name, placement_season_year, graduation_year, description, fee_amount, status, upi_id, upi_payee_name)
     VALUES (?, ?, ?, ?, 2026, 2026, ?, ?, 'Active', ?, ?)`,
    [
      collegeId,
      config.c2c.programName,
      code,
      code,
      `${config.c2c.programName} placement training cohort`,
      config.c2c.feeAmount,
      config.c2c.upiId || null,
      config.c2c.payeeName || null,
    ]
  );

  const created = await query(
    `SELECT id, college_id, name, code, fee_amount, status, upi_id, upi_payee_name
       FROM training_programs
      WHERE college_id = ? AND code = ?
      LIMIT 1`,
    [collegeId, code]
  );
  return created && created[0] ? created[0] : null;
};

export const getC2cProgram = async (collegeId = 1) => {
  const code = config.c2c.programCode || C2C_PROGRAM_CODE;
  const rows = await query(
    `SELECT id, college_id, name, code, short_name, fee_amount, status, upi_id, upi_payee_name
       FROM training_programs
      WHERE college_id = ? AND code = ?
      LIMIT 1`,
    [collegeId, code]
  );
  return rows && rows[0] ? rows[0] : null;
};

export const updateC2cProgram = async (programId, { feeAmount, upiId, payeeName, status }) => {
  const current = await query(
    `SELECT fee_amount, upi_id, upi_payee_name, status FROM training_programs WHERE id = ? LIMIT 1`,
    [programId]
  );
  if (!current || !current[0]) return null;
  const row = current[0];
  await query(
    `UPDATE training_programs
        SET fee_amount = ?, upi_id = ?, upi_payee_name = ?, status = ?
      WHERE id = ?`,
    [
      toInt(feeAmount) ?? toInt(row.fee_amount) ?? 0,
      cleanText(upiId, 128) ?? row.upi_id ?? null,
      cleanText(payeeName, 128) ?? row.upi_payee_name ?? null,
      cleanText(status, 50) ?? row.status ?? 'Active',
      programId,
    ]
  );
  return getC2cProgramById(programId);
};

export const getC2cProgramById = async (programId) => {
  const rows = await query(
    `SELECT id, college_id, name, code, short_name, fee_amount, status, upi_id, upi_payee_name
       FROM training_programs WHERE id = ? LIMIT 1`,
    [programId]
  );
  return rows && rows[0] ? rows[0] : null;
};

// ---------------------------------------------------------------------------
// Placeholder user
// ---------------------------------------------------------------------------

/**
 * Returns the user id for a C2C lead's student identifier, creating a
 * placeholder account when one does not exist yet. The placeholder has no
 * password and is inactive, so the student can only complete it by redeeming
 * the registration link.
 */
export const findOrCreateC2cPlaceholderUser = async ({
  name,
  email,
  mobile,
  collegeId,
  programCode,
}) => {
  const normalizedEmail = normalizeEmail(email);
  const cleanMobile = cleanText(mobile, 20);

  let existing = null;
  if (normalizedEmail) {
    const rows = await query('SELECT id, name, email, mobile_number, role, is_active FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    existing = rows && rows[0] ? rows[0] : null;
  }
  if (!existing && cleanMobile) {
    const rows = await query('SELECT id, name, email, mobile_number, role, is_active FROM users WHERE mobile_number = ? LIMIT 1', [cleanMobile]);
    existing = rows && rows[0] ? rows[0] : null;
  }
  if (existing) return { userId: existing.id, created: false, user: existing };

  const result = await query(
    `INSERT INTO users
      (name, email, mobile_number, password, password_hash, role, college_id, target_track, is_active, is_profile_updated)
     VALUES (?, ?, ?, NULL, NULL, 'student', ?, ?, 0, 0)`,
    [cleanText(name, 255) || 'C2C Student', normalizedEmail, cleanMobile, collegeId, programCode]
  );

  return { userId: result.insertId, created: true, user: null };
};

// ---------------------------------------------------------------------------
// C2C registrations (leads)
// ---------------------------------------------------------------------------

/**
 * Creates a C2C lead and its placeholder user. Rejects a duplicate for the same
 * student identifier within the same program, and refuses to create a lead for a
 * student who already has a C2C enrollment (for example one imported from the
 * legacy spreadsheet).
 */
export const createC2cRegistration = async (payload) => {
  const {
    collegeId = 1,
    name,
    email,
    mobile,
    rollNumber,
    branch,
    departmentId,
    batchId,
    feeAmount,
    createdBy,
  } = payload;

  const program = await ensureC2cProgram(collegeId);
  if (!program) return { error: 'C2C program is not available' };

  const normalizedEmail = normalizeEmail(email);
  const cleanMobile = cleanText(mobile, 20);
  const cleanName = cleanText(name, 255);
  const programCode = program.code;

  const duplicateByEmail = await query(
    `SELECT id FROM c2c_registrations WHERE program_id = ? AND email IS NOT NULL AND email = ? LIMIT 1`,
    [program.id, normalizedEmail]
  );
  if (duplicateByEmail && duplicateByEmail[0]) {
    return { error: 'A C2C registration already exists for this email for this program.' };
  }

  const { userId, created: userCreated } = await findOrCreateC2cPlaceholderUser({
    name: cleanName,
    email: normalizedEmail,
    mobile: cleanMobile,
    collegeId,
    programCode,
  });

  const alreadyEnrolled = await query(
    `SELECT id FROM training_enrollments WHERE student_user_id = ? AND program_id = ? LIMIT 1`,
    [userId, program.id]
  );
  if (alreadyEnrolled && alreadyEnrolled[0]) {
    if (userCreated) {
      await query('DELETE FROM users WHERE id = ?', [userId]);
    }
    return { error: 'This student is already enrolled in the C2C program.' };
  }

  const existingLead = await query(
    `SELECT id FROM c2c_registrations WHERE program_id = ? AND user_id = ? LIMIT 1`,
    [program.id, userId]
  );
  if (existingLead && existingLead[0]) {
    if (userCreated) {
      await query('DELETE FROM users WHERE id = ?', [userId]);
    }
    return { error: 'A C2C registration already exists for this student.' };
  }

  const fee = toInt(feeAmount) ?? toInt(program.fee_amount) ?? 0;
  const upiId = program.upi_id || config.c2c.upiId || null;
  const upiPayeeName = program.upi_payee_name || config.c2c.payeeName || null;
  const qrPayload = buildUpiPayload({
    upiId,
    payeeName: upiPayeeName,
    amount: fee,
    note: `${programCode} program fee`,
    transactionRef: `C2C${Date.now().toString().slice(-8)}`,
  });

  const result = await query(
    `INSERT INTO c2c_registrations
      (program_id, college_id, name, email, mobile, roll_number, branch, department_id, batch_id,
       fee_amount, amount_paid, payment_status, upi_id, upi_payee_name, qr_payload, qr_issued_at,
       user_id, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
    [
      program.id,
      collegeId,
      cleanName || 'C2C Student',
      normalizedEmail,
      cleanMobile,
      cleanText(rollNumber, 100),
      cleanText(branch, 150),
      toInt(departmentId),
      toInt(batchId),
      fee,
      C2C_PAYMENT_STATUS.PENDING,
      upiId,
      upiPayeeName,
      qrPayload,
      userId,
      C2C_REGISTRATION_STATUS.AWAITING_PAYMENT,
      toInt(createdBy),
    ]
  );

  return {
    created: true,
    registrationId: result.insertId,
    programId: program.id,
    userId,
    qrPayload,
  };
};

const REGISTRATION_SELECT = `
  SELECT cr.id, cr.program_id, cr.college_id, cr.name, cr.email, cr.mobile, cr.roll_number,
         cr.branch, cr.department_id, cr.batch_id, cr.fee_amount, cr.amount_paid, cr.utr,
         cr.payment_date, cr.payment_status, cr.payment_mode, cr.payment_note,
         cr.upi_id, cr.upi_payee_name, cr.qr_payload, cr.qr_issued_at,
         cr.registration_token, cr.registration_link_sent_at, cr.registered_at,
         cr.user_id, cr.enrollment_id, cr.status, cr.created_by, cr.approved_by, cr.approved_at,
         cr.created_at, cr.updated_at,
         p.code AS program_code, p.name AS program_name, p.fee_amount AS program_fee,
         u.name AS user_name, u.email AS user_email, u.is_active AS user_is_active,
         d.name AS branch_name, b.name AS batch_name,
         te.id AS existing_enrollment_id,
         (te.fee_amount - te.amount_paid) AS existing_balance
    FROM c2c_registrations cr
    JOIN training_programs p ON p.id = cr.program_id
    LEFT JOIN users u ON u.id = cr.user_id
    LEFT JOIN departments d ON d.id = cr.department_id
    LEFT JOIN batches b ON b.id = cr.batch_id
    LEFT JOIN training_enrollments te ON te.c2c_registration_id = cr.id
`;

const mapRegistration = (r) => ({
  registrationId: r.id,
  programId: r.program_id,
  programCode: r.program_code,
  programName: r.program_name,
  collegeId: r.college_id,
  name: r.name,
  email: r.email,
  mobile: r.mobile,
  rollNumber: r.roll_number,
  branch: r.branch_name || r.branch,
  branchId: r.department_id,
  batchId: r.batch_id,
  batchName: r.batch_name,
  feeAmount: r.fee_amount,
  amountPaid: r.amount_paid,
  balance: Math.max((r.fee_amount || 0) - (r.amount_paid || 0), 0),
  utr: r.utr,
  paymentDate: r.payment_date,
  paymentStatus: r.payment_status,
  paymentMode: r.payment_mode,
  paymentNote: r.payment_note,
  upiId: r.upi_id,
  upiPayeeName: r.upi_payee_name,
  qrPayload: r.qr_payload,
  qrIssuedAt: r.qr_issued_at,
  registrationToken: r.registration_token,
  registrationLinkSentAt: r.registration_link_sent_at,
  registeredAt: r.registered_at,
  userId: r.user_id,
  userIsActive: r.user_is_active === null || r.user_is_active === undefined ? null : Boolean(r.user_is_active),
  enrollmentId: r.existing_enrollment_id || r.enrollment_id,
  status: r.status,
  approvedAt: r.approved_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const listC2cRegistrations = async ({ collegeId = 1, programCode, search, status, paymentStatus } = {}) => {
  const params = [collegeId];
  let sql = `${REGISTRATION_SELECT} WHERE cr.college_id = ?`;

  if (programCode) {
    sql += ` AND p.code = ?`;
    params.push(programCode);
  }
  if (status) {
    sql += ` AND cr.status = ?`;
    params.push(status);
  }
  if (paymentStatus) {
    sql += ` AND cr.payment_status = ?`;
    params.push(paymentStatus);
  }
  if (search) {
    const q = `%${String(search).trim()}%`;
    sql += ` AND (cr.name LIKE ? OR cr.email LIKE ? OR cr.mobile LIKE ? OR cr.roll_number LIKE ? OR cr.utr LIKE ?)`;
    params.push(q, q, q, q, q);
  }
  sql += ` ORDER BY cr.created_at DESC, cr.id DESC`;

  const rows = await query(sql, params);
  return (rows || []).map(mapRegistration);
};

export const getC2cRegistrationById = async (registrationId, collegeId = null) => {
  const params = [registrationId];
  let sql = `${REGISTRATION_SELECT} WHERE cr.id = ?`;
  if (collegeId) {
    sql += ` AND cr.college_id = ?`;
    params.push(collegeId);
  }
  const rows = await query(sql, params);
  return rows && rows[0] ? mapRegistration(rows[0]) : null;
};

export const getC2cRegistrationByToken = async (token) => {
  const rows = await query(`${REGISTRATION_SELECT} WHERE cr.registration_token = ? LIMIT 1`, [token]);
  return rows && rows[0] ? mapRegistration(rows[0]) : null;
};

export const getC2cRegistrationByUserId = async (userId, programId = null) => {
  const params = [userId];
  let sql = `${REGISTRATION_SELECT} WHERE cr.user_id = ?`;
  if (programId) {
    sql += ` AND cr.program_id = ?`;
    params.push(programId);
  }
  sql += ` ORDER BY cr.id DESC LIMIT 1`;
  const rows = await query(sql, params);
  return rows && rows[0] ? mapRegistration(rows[0]) : null;
};

/**
 * Records or updates the initial payment information for a lead. This is
 * explicitly allowed BEFORE the student has registered on TrainX, which is the
 * whole point of the intake record.
 *
 * When the caller supplies an amount but no status, the status is derived. When
 * the status is set to `completed` and no amount is given, the amount is
 * filled up to the fee so balance lands on zero.
 */
export const updateC2cPayment = async (registrationId, { amountPaid, utr, paymentDate, paymentStatus, paymentMode, paymentNote }) => {
  const current = await query(
    `SELECT id, fee_amount, amount_paid, payment_status FROM c2c_registrations WHERE id = ? LIMIT 1`,
    [registrationId]
  );
  if (!current || !current[0]) return { error: 'C2C registration not found' };
  const row = current[0];
  const fee = toInt(row.fee_amount) || 0;

  const status = normalizePaymentStatus(paymentStatus) || row.payment_status;
  const hasAmount = amountPaid !== undefined && amountPaid !== null && amountPaid !== '';
  let paid = hasAmount ? toInt(amountPaid) : toInt(row.amount_paid) || 0;
  if (paid < 0) paid = 0;
  if (fee > 0 && paid > fee) paid = fee;
  if (!hasAmount && status === C2C_PAYMENT_STATUS.COMPLETED) paid = fee;

  const resolvedStatus = hasAmount && paymentStatus === undefined ? derivePaymentStatus(paid, fee) : status;

  const nextRegistrationStatus =
    resolvedStatus === C2C_PAYMENT_STATUS.CANCELLED
      ? C2C_REGISTRATION_STATUS.CANCELLED
      : resolvedStatus === C2C_PAYMENT_STATUS.PENDING
        ? C2C_REGISTRATION_STATUS.AWAITING_PAYMENT
        : (await resolveRegistrationStatus(registrationId, resolvedStatus));

  await query(
    `UPDATE c2c_registrations
        SET amount_paid = ?, payment_status = ?, utr = COALESCE(?, utr),
            payment_date = COALESCE(?, payment_date),
            payment_mode = COALESCE(?, payment_mode),
            payment_note = COALESCE(?, payment_note),
            status = ?
      WHERE id = ?`,
    [
      paid,
      resolvedStatus,
      cleanText(utr, 128),
      paymentDate || null,
      cleanText(paymentMode, 64),
      cleanText(paymentNote, 500),
      nextRegistrationStatus,
      registrationId,
    ]
  );

  await syncPaymentToEnrollment(registrationId, {
    amountPaid: paid,
    utr: cleanText(utr, 128),
    paymentDate: paymentDate || null,
    paymentStatus: resolvedStatus,
  });

  return { updated: true, paymentStatus: resolvedStatus, amountPaid: paid };
};

/**
 * Keeps an already-created enrollment in step when the Admin corrects the
 * payment information on the lead. Best effort: a lead that has not been
 * approved yet simply has no enrollment to update.
 */
const syncPaymentToEnrollment = async (registrationId, { amountPaid, utr, paymentDate, paymentStatus }) => {
  const rows = await query('SELECT id FROM training_enrollments WHERE c2c_registration_id = ? LIMIT 1', [registrationId]);
  if (!rows || !rows[0]) return;
  await query(
    `UPDATE training_enrollments
        SET amount_paid = COALESCE(?, amount_paid),
            payment_status = ?,
            utr = COALESCE(?, utr),
            payment_date = COALESCE(?, payment_date)
      WHERE id = ?`,
    [amountPaid, paymentStatus, utr, paymentDate, rows[0].id]
  );
};

/**
 * Works out whether a paid lead should now be waiting on a registration link,
 * on approval, or is already enrolled. Never downgrades a lead that has
 * progressed past registration.
 */
const resolveRegistrationStatus = async (registrationId, paymentStatus) => {
  const rows = await query('SELECT status, registered_at, enrollment_id FROM c2c_registrations WHERE id = ? LIMIT 1', [registrationId]);
  if (!rows || !rows[0]) return C2C_REGISTRATION_STATUS.AWAITING_PAYMENT;
  const row = rows[0];
  if (row.status === C2C_REGISTRATION_STATUS.ENROLLED) return C2C_REGISTRATION_STATUS.ENROLLED;
  if (row.enrollment_id) return C2C_REGISTRATION_STATUS.ENROLLED;
  if (row.registered_at) return C2C_REGISTRATION_STATUS.AWAITING_APPROVAL;
  if (paymentStatus === C2C_PAYMENT_STATUS.PART_PAYMENT || paymentStatus === C2C_PAYMENT_STATUS.COMPLETED) {
    return C2C_REGISTRATION_STATUS.AWAITING_REGISTRATION;
  }
  return C2C_REGISTRATION_STATUS.AWAITING_PAYMENT;
};

/**
 * Issues (or re-issues) the TrainX registration link for a lead. Only permitted
 * once a full or part payment has been recorded.
 */
export const issueC2cRegistrationLink = async (registrationId) => {
  const rows = await query(
    `SELECT id, fee_amount, payment_status, registration_token, status FROM c2c_registrations WHERE id = ? LIMIT 1`,
    [registrationId]
  );
  if (!rows || !rows[0]) return { error: 'C2C registration not found' };
  const row = rows[0];

  const qualifies = [C2C_PAYMENT_STATUS.PART_PAYMENT, C2C_PAYMENT_STATUS.COMPLETED].includes(row.payment_status);
  if (!qualifies) {
    return {
      error:
        'A registration link can only be released after a full or part payment is recorded. Record the payment first.',
    };
  }

  const token = row.registration_token || generateRegistrationToken();
  await query(
    `UPDATE c2c_registrations
        SET registration_token = ?, registration_link_sent_at = NOW(),
            status = CASE WHEN registered_at IS NOT NULL THEN status ELSE ? END
      WHERE id = ?`,
    [token, C2C_REGISTRATION_STATUS.AWAITING_REGISTRATION, registrationId]
  );

  return { token, updated: true };
};

/**
 * Validates a registration token without consuming it, so the registration page
 * can prefill the student's details.
 */
export const peekC2cRegistrationToken = async (token) => {
  const clean = cleanText(token, 64);
  if (!clean) return null;
  return getC2cRegistrationByToken(clean);
};

/**
 * Consumes a registration token at account creation time and stamps the
 * placeholder user as having completed TrainX registration.
 */
export const consumeC2cRegistrationToken = async (token, userId) => {
  const clean = cleanText(token, 64);
  if (!clean) return null;
  const lead = await getC2cRegistrationByToken(clean);
  if (!lead) return null;
  if (lead.userId && userId && Number(lead.userId) !== Number(userId)) {
    return { ...lead, mismatch: true };
  }
  await query(
    `UPDATE c2c_registrations
        SET registered_at = COALESCE(registered_at, NOW()), status = ?
      WHERE id = ?`,
    [C2C_REGISTRATION_STATUS.AWAITING_APPROVAL, lead.registrationId]
  );
  return { ...lead, userId: userId || lead.userId };
};

/**
 * Cancels a lead that never enrolled. Any enrollment it produced is left alone
 * so historical records are not silently destroyed.
 */
export const cancelC2cRegistration = async (registrationId) => {
  const result = await query(
    `UPDATE c2c_registrations
        SET status = ?, payment_status = ?
      WHERE id = ? AND enrollment_id IS NULL`,
    [C2C_REGISTRATION_STATUS.CANCELLED, C2C_PAYMENT_STATUS.CANCELLED, registrationId]
  );
  if (!result || result.affectedRows === 0) {
    const existing = await query('SELECT enrollment_id FROM c2c_registrations WHERE id = ? LIMIT 1', [registrationId]);
    if (!existing || !existing[0]) return { error: 'C2C registration not found' };
    return { error: 'This registration is already enrolled and cannot be cancelled from here.' };
  }
  return { updated: true };
};

// ---------------------------------------------------------------------------
// C2C enrollments (admin-only reporting surface)
// ---------------------------------------------------------------------------

const ENROLLMENT_SELECT = `
  SELECT te.id AS enrollment_id, te.student_user_id AS user_id, te.program_id, te.batch_id,
         te.c2c_registration_id, te.training_option, te.fee_amount, te.amount_paid,
         GREATEST(COALESCE(te.fee_amount, 0) - COALESCE(te.amount_paid, 0), 0) AS balance,
         te.payment_status, te.access_status, te.payment_mode, te.utr, te.payment_date,
         te.payment_proof_url, te.payment_received_by, te.whatsapp_group_added,
         te.approved_by, te.approved_at, te.created_at, te.updated_at,
         u.name, u.email, u.mobile_number, u.is_active,
         s.roll_number, s.department, s.department_id, s.year, s.division,
         b.id AS batch_id_resolved, b.name AS batch_name,
         cr.status AS registration_status, cr.registration_token
    FROM training_enrollments te
    JOIN users u ON u.id = te.student_user_id
    LEFT JOIN students s ON s.user_id = u.id
    LEFT JOIN batches b ON b.id = COALESCE(te.batch_id, s.batch_id)
    LEFT JOIN c2c_registrations cr ON cr.id = te.c2c_registration_id
`;

const mapEnrollment = (r) => ({
  enrollmentId: r.enrollment_id,
  userId: r.user_id,
  programId: r.program_id,
  batchId: r.batch_id_resolved || r.batch_id,
  batchName: r.batch_name,
  c2cRegistrationId: r.c2c_registration_id,
  registrationStatus: r.registration_status,
  name: r.name,
  email: r.email,
  mobile: r.mobile_number,
  rollNumber: r.roll_number,
  branch: r.department,
  departmentId: r.department_id,
  year: r.year,
  division: r.division,
  isActive: r.is_active === null || r.is_active === undefined ? null : Boolean(r.is_active),
  trainingOption: r.training_option,
  totalFee: r.fee_amount,
  amountPaid: r.amount_paid,
  balance: r.balance,
  paymentStatus: r.payment_status,
  accessStatus: r.access_status,
  paymentMode: r.payment_mode,
  utr: r.utr,
  paymentDate: r.payment_date,
  paymentProofUrl: r.payment_proof_url,
  paymentReceivedBy: r.payment_received_by,
  whatsappGroupAdded: r.whatsapp_group_added,
  approvedAt: r.approved_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const listC2cEnrollments = async ({ collegeId = 1, programCode, search, branch, paymentStatus, accessStatus } = {}) => {
  const params = [collegeId];
  let sql = `${ENROLLMENT_SELECT} WHERE u.college_id = ?`;

  if (programCode) {
    sql += ` AND te.program_id IN (SELECT id FROM training_programs WHERE code = ?)`;
    params.push(programCode);
  }
  if (paymentStatus) {
    sql += ` AND te.payment_status = ?`;
    params.push(paymentStatus);
  }
  if (accessStatus) {
    sql += ` AND te.access_status = ?`;
    params.push(accessStatus);
  }
  if (branch) {
    sql += ` AND s.department_id = ?`;
    params.push(toInt(branch));
  }
  if (search) {
    const q = `%${String(search).trim()}%`;
    sql += ` AND (u.name LIKE ? OR s.roll_number LIKE ? OR u.email LIKE ? OR u.mobile_number LIKE ? OR te.utr LIKE ?)`;
    params.push(q, q, q, q, q);
  }
  sql += ` ORDER BY s.department IS NULL, u.name ASC`;

  const rows = await query(sql, params);
  return (rows || []).map(mapEnrollment);
};

export const getC2cEnrollmentById = async (enrollmentId) => {
  const rows = await query(`${ENROLLMENT_SELECT} WHERE te.id = ? LIMIT 1`, [enrollmentId]);
  return rows && rows[0] ? mapEnrollment(rows[0]) : null;
};

/**
 * College-scoped lookup, so a college admin can only ever touch enrollments
 * belonging to their own college.
 */
export const getC2cEnrollmentForCollege = async (enrollmentId, collegeId, programCode = null) => {
  const params = [enrollmentId, collegeId];
  let sql = `${ENROLLMENT_SELECT} WHERE te.id = ? AND u.college_id = ?`;
  if (programCode) {
    sql += ` AND te.program_id IN (SELECT id FROM training_programs WHERE code = ?)`;
    params.push(programCode);
  }
  const rows = await query(sql, params);
  return rows && rows[0] ? mapEnrollment(rows[0]) : null;
};

/**
 * Admin-only manual override of the mutually-exclusive payment status. The
 * amount and the derived balance are kept consistent with the chosen status.
 */
export const updateC2cEnrollmentPayment = async (enrollmentId, { paymentStatus, amountPaid, utr, paymentDate, paymentMode }) => {
  const current = await query(
    `SELECT id, fee_amount, amount_paid, payment_status FROM training_enrollments WHERE id = ? LIMIT 1`,
    [enrollmentId]
  );
  if (!current || !current[0]) return { error: 'C2C enrollment not found' };
  const row = current[0];

  const status = normalizePaymentStatus(paymentStatus) || row.payment_status;
  if (!isPaymentStatus(status)) return { error: 'Invalid payment status' };

  const fee = toInt(row.fee_amount) || 0;
  const hasAmount = amountPaid !== undefined && amountPaid !== null && amountPaid !== '';
  let paid = hasAmount ? toInt(amountPaid) : toInt(row.amount_paid) || 0;
  if (paid < 0) paid = 0;
  if (fee > 0 && paid > fee) paid = fee;
  if (!hasAmount && status === C2C_PAYMENT_STATUS.COMPLETED) paid = fee;
  if (status === C2C_PAYMENT_STATUS.PENDING && !hasAmount) paid = 0;
  if (status === C2C_PAYMENT_STATUS.CANCELLED && !hasAmount) paid = 0;

  await query(
    `UPDATE training_enrollments
        SET payment_status = ?, amount_paid = ?,
            utr = COALESCE(?, utr),
            payment_date = COALESCE(?, payment_date),
            payment_mode = COALESCE(?, payment_mode)
      WHERE id = ?`,
    [status, paid, cleanText(utr, 128), paymentDate || null, cleanText(paymentMode, 64), enrollmentId]
  );

  return { updated: true, paymentStatus: status, amountPaid: paid, balance: Math.max(fee - paid, 0) };
};

/** Admin-only manual override of the TrainX software / access state. */
export const updateC2cEnrollmentAccess = async (enrollmentId, { accessStatus }) => {
  const status = String(accessStatus || '').trim().toLowerCase();
  const allowed = ['not_activated', 'pending', 'active', 'suspended', 'revoked'];
  if (!allowed.includes(status)) return { error: 'Invalid access status' };
  const current = await query('SELECT id FROM training_enrollments WHERE id = ? LIMIT 1', [enrollmentId]);
  if (!current || !current[0]) return { error: 'C2C enrollment not found' };
  await query('UPDATE training_enrollments SET access_status = ? WHERE id = ?', [status, enrollmentId]);
  return { updated: true, accessStatus: status };
};

/**
 * Creates the C2C Enrollment for an approved student, carrying the payment
 * information captured on the intake record. Idempotent: a second call for the
 * same student/program reports the existing enrollment instead of creating a
 * duplicate.
 */
export const createC2cEnrollmentFromRegistration = async ({ registration, userId, batchId, approvedBy, approvedAt }) => {
  const programId = registration.programId;
  const studentUserId = userId || registration.userId;
  if (!studentUserId) return { error: 'No TrainX user is linked to this C2C registration yet' };

  const existing = await query(
    'SELECT id FROM training_enrollments WHERE student_user_id = ? AND program_id = ? LIMIT 1',
    [studentUserId, programId]
  );
  if (existing && existing[0]) {
    return { enrollmentId: existing[0].id, created: false, duplicate: true };
  }

  const fee = toInt(registration.feeAmount) || 0;
  const paid = Math.min(Math.max(toInt(registration.amountPaid) || 0, 0), fee || Number.MAX_SAFE_INTEGER);
  const paymentStatus = isPaymentStatus(registration.paymentStatus)
    ? registration.paymentStatus
    : derivePaymentStatus(paid, fee);
  const accessStatus =
    paymentStatus === C2C_PAYMENT_STATUS.CANCELLED ? C2C_ACCESS_STATUS.REVOKED : C2C_ACCESS_STATUS.ACTIVE;

  const result = await query(
    `INSERT INTO training_enrollments
      (student_user_id, program_id, batch_id, c2c_registration_id, training_option,
       fee_amount, amount_paid, payment_status, access_status, payment_mode, utr, payment_date,
       approved_by, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentUserId,
      programId,
      toInt(batchId) || toInt(registration.batchId),
      registration.registrationId,
      registration.programCode || C2C_PROGRAM_CODE,
      fee,
      paid,
      paymentStatus,
      accessStatus,
      registration.paymentMode || null,
      registration.utr || null,
      registration.paymentDate || null,
      toInt(approvedBy),
      approvedAt || new Date(),
    ]
  );

  const enrollmentId = result.insertId;
  await query(
    `UPDATE c2c_registrations
        SET enrollment_id = ?, status = ?, approved_by = ?, approved_at = ?
      WHERE id = ?`,
    [enrollmentId, C2C_REGISTRATION_STATUS.ENROLLED, toInt(approvedBy), approvedAt || new Date(), registration.registrationId]
  );

  return { enrollmentId, created: true, duplicate: false };
};

/** Dashboard card counters for the Admin C2C page. */
export const getC2cDashboardStats = async ({ collegeId = 1, programCode } = {}) => {
  const params = [collegeId];
  let sql = `
    SELECT
      COUNT(*) AS total_enrolled,
      COALESCE(SUM(te.fee_amount), 0) AS total_fees,
      COALESCE(SUM(te.amount_paid), 0) AS total_collected,
      COALESCE(SUM(GREATEST(COALESCE(te.fee_amount, 0) - COALESCE(te.amount_paid, 0), 0)), 0) AS total_outstanding,
      COALESCE(SUM(te.payment_status = 'completed'), 0) AS completed,
      COALESCE(SUM(te.payment_status = 'part_payment'), 0) AS part_payment,
      COALESCE(SUM(te.payment_status = 'pending'), 0) AS pending,
      COALESCE(SUM(te.payment_status = 'cancelled'), 0) AS cancelled
    FROM training_enrollments te
    JOIN users u ON u.id = te.student_user_id
    WHERE u.college_id = ?
  `;
  if (programCode) {
    sql += ` AND te.program_id IN (SELECT id FROM training_programs WHERE code = ?)`;
    params.push(programCode);
  }

  const rows = await query(sql, params);
  const row = (rows && rows[0]) || {};
  return {
    totalEnrolled: toInt(row.total_enrolled) || 0,
    totalFees: toInt(row.total_fees) || 0,
    totalCollected: toInt(row.total_collected) || 0,
    totalOutstanding: toInt(row.total_outstanding) || 0,
    completed: toInt(row.completed) || 0,
    partPayment: toInt(row.part_payment) || 0,
    pending: toInt(row.pending) || 0,
    cancelled: toInt(row.cancelled) || 0,
  };
};

/** Counts for the intake tab, so the Admin can see where each lead sits. */
export const getC2cRegistrationStats = async ({ collegeId = 1, programCode } = {}) => {
  const params = [collegeId];
  let sql = `
    SELECT
      COUNT(*) AS total,
      COALESCE(SUM(cr.status = 'awaiting_payment'), 0) AS awaiting_payment,
      COALESCE(SUM(cr.status = 'awaiting_registration'), 0) AS awaiting_registration,
      COALESCE(SUM(cr.status = 'awaiting_approval'), 0) AS awaiting_approval,
      COALESCE(SUM(cr.status = 'enrolled'), 0) AS enrolled,
      COALESCE(SUM(cr.status = 'cancelled'), 0) AS cancelled,
      COALESCE(SUM(cr.amount_paid), 0) AS collected
    FROM c2c_registrations cr
    WHERE cr.college_id = ?
  `;
  if (programCode) {
    sql += ` AND cr.program_id IN (SELECT id FROM training_programs WHERE code = ?)`;
    params.push(programCode);
  }

  const rows = await query(sql, params);
  const row = (rows && rows[0]) || {};
  return {
    total: toInt(row.total) || 0,
    awaitingPayment: toInt(row.awaiting_payment) || 0,
    awaitingRegistration: toInt(row.awaiting_registration) || 0,
    awaitingApproval: toInt(row.awaiting_approval) || 0,
    enrolled: toInt(row.enrolled) || 0,
    cancelled: toInt(row.cancelled) || 0,
    collected: toInt(row.collected) || 0,
  };
};

/** Distinct branches that have enrollments, for the filter dropdown. */
export const listC2cBranches = async ({ collegeId = 1, programCode } = {}) => {
  const params = [collegeId];
  let sql = `
    SELECT DISTINCT s.department_id AS id, s.department AS name
      FROM training_enrollments te
      JOIN users u ON u.id = te.student_user_id
      JOIN students s ON s.user_id = u.id
     WHERE u.college_id = ? AND s.department IS NOT NULL AND s.department <> ''
  `;
  if (programCode) {
    sql += ` AND te.program_id IN (SELECT id FROM training_programs WHERE code = ?)`;
    params.push(programCode);
  }
  sql += ` ORDER BY s.department ASC`;

  const rows = await query(sql, params);
  return (rows || [])
    .filter((r) => r.name)
    .map((r) => ({ id: toInt(r.id), name: r.name }));
};
