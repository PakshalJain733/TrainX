import { query } from '../config/db.js';

/**
 * Normalizes payment and approval status values.
 */
export const ALLOWED_PAYMENT_STATUSES = ['Pending', 'Part Payment', 'Completed', 'Cancelled'];
export const ALLOWED_APPROVAL_STATUSES = ['Pending', 'Approved', 'Rejected'];
export const ALLOWED_TRAINING_STATUSES = ['Draft', 'Open', 'Closed', 'Completed'];

/**
 * Retrieves all training programs with aggregated registration and payment metrics.
 */
export const getAllTrainings = async (collegeId = null) => {
  const params = [];
  let collegeWhere = '';
  if (collegeId) {
    collegeWhere = 'WHERE (tp.college_id = ? OR tp.college_id IS NULL OR tp.college_id = 1)';
    params.push(collegeId);
  }

  const sql = `
    SELECT
      tp.id,
      tp.college_id,
      tp.name,
      tp.code,
      tp.short_name,
      tp.placement_season_year,
      tp.graduation_year,
      tp.description,
      tp.fee_amount,
      tp.status,
      tp.start_date,
      tp.end_date,
      tp.registration_open_date,
      tp.registration_close_date,
      tp.payment_instructions,
      tp.payment_qr_url,
      tp.eligibility_criteria,
      tp.restrictions,
      tp.google_form_url,
      tp.google_sheet_url,
      tp.upi_id,
      tp.upi_payee_name,
      tp.created_at,
      tp.updated_at,
      COUNT(ce.id) AS total_registrations,
      SUM(CASE WHEN LOWER(COALESCE(ce.approval_status, 'pending')) = 'approved' THEN 1 ELSE 0 END) AS approved_registrations,
      SUM(CASE WHEN LOWER(COALESCE(ce.approval_status, 'pending')) = 'pending' THEN 1 ELSE 0 END) AS pending_approvals,
      SUM(CASE WHEN LOWER(COALESCE(ce.approval_status, 'pending')) = 'rejected' THEN 1 ELSE 0 END) AS rejected_registrations,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) IN ('completed', 'paid') THEN 1 ELSE 0 END) AS completed_payments,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) IN ('part payment', 'partial') THEN 1 ELSE 0 END) AS part_payments,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) IN ('pending', 'unpaid') THEN 1 ELSE 0 END) AS pending_payments,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_payments,
      COALESCE(SUM(ce.amount_paid), 0) AS total_collected
    FROM training_programs tp
    LEFT JOIN c2c_enrollments ce ON ce.training_id = tp.id
    ${collegeWhere}
    GROUP BY tp.id
    ORDER BY tp.id DESC
  `;

  const rows = await query(sql, params);
  return rows.map((r) => ({
    id: r.id,
    collegeId: r.college_id,
    name: r.name,
    code: r.code,
    shortName: r.short_name || r.code,
    placementSeasonYear: r.placement_season_year,
    graduationYear: r.graduation_year,
    description: r.description,
    feeAmount: Number(r.fee_amount || 0),
    status: r.status || 'Open',
    startDate: r.start_date,
    endDate: r.end_date,
    registrationOpenDate: r.registration_open_date,
    registrationCloseDate: r.registration_close_date,
    paymentInstructions: r.payment_instructions,
    paymentQrUrl: r.payment_qr_url,
    eligibilityCriteria: r.eligibility_criteria,
    restrictions: typeof r.restrictions === 'string' ? JSON.parse(r.restrictions || '{}') : (r.restrictions || null),
    googleFormUrl: r.google_form_url,
    googleSheetUrl: r.google_sheet_url,
    upiId: r.upi_id,
    upiPayeeName: r.upi_payee_name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    metrics: {
      totalRegistrations: Number(r.total_registrations || 0),
      approvedRegistrations: Number(r.approved_registrations || 0),
      pendingApprovals: Number(r.pending_approvals || 0),
      rejectedRegistrations: Number(r.rejected_registrations || 0),
      completedPayments: Number(r.completed_payments || 0),
      partPayments: Number(r.part_payments || 0),
      pendingPayments: Number(r.pending_payments || 0),
      cancelledPayments: Number(r.cancelled_payments || 0),
      totalCollected: Number(r.total_collected || 0),
    },
  }));
};

/**
 * Retrieves a single training program by its ID.
 */
export const getTrainingById = async (id) => {
  const rows = await query('SELECT * FROM training_programs WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) return null;
  const r = rows[0];

  const countRows = await query(
    `SELECT
      COUNT(ce.id) AS total_registrations,
      SUM(CASE WHEN LOWER(COALESCE(ce.approval_status, 'pending')) = 'approved' THEN 1 ELSE 0 END) AS approved_registrations,
      SUM(CASE WHEN LOWER(COALESCE(ce.approval_status, 'pending')) = 'pending' THEN 1 ELSE 0 END) AS pending_approvals,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) IN ('completed', 'paid') THEN 1 ELSE 0 END) AS completed_payments,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) IN ('pending', 'unpaid') THEN 1 ELSE 0 END) AS pending_payments,
      COALESCE(SUM(ce.amount_paid), 0) AS total_collected
    FROM c2c_enrollments ce WHERE ce.training_id = ?`,
    [id]
  );
  const metrics = countRows[0] || {};

  return {
    id: r.id,
    collegeId: r.college_id,
    name: r.name,
    code: r.code,
    shortName: r.short_name || r.code,
    placementSeasonYear: r.placement_season_year,
    graduationYear: r.graduation_year,
    description: r.description,
    feeAmount: Number(r.fee_amount || 0),
    status: r.status || 'Open',
    startDate: r.start_date,
    endDate: r.end_date,
    registrationOpenDate: r.registration_open_date,
    registrationCloseDate: r.registration_close_date,
    paymentInstructions: r.payment_instructions,
    paymentQrUrl: r.payment_qr_url,
    eligibilityCriteria: r.eligibility_criteria,
    restrictions: typeof r.restrictions === 'string' ? JSON.parse(r.restrictions || '{}') : (r.restrictions || null),
    googleFormUrl: r.google_form_url,
    googleSheetUrl: r.google_sheet_url,
    upiId: r.upi_id,
    upiPayeeName: r.upi_payee_name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    metrics: {
      totalRegistrations: Number(metrics.total_registrations || 0),
      approvedRegistrations: Number(metrics.approved_registrations || 0),
      pendingApprovals: Number(metrics.pending_approvals || 0),
      completedPayments: Number(metrics.completed_payments || 0),
      pendingPayments: Number(metrics.pending_payments || 0),
      totalCollected: Number(metrics.total_collected || 0),
    },
  };
};

/**
 * Retrieves a training program by its unique code (case-insensitive).
 */
export const getTrainingByCode = async (code) => {
  if (!code) return null;
  const cleanCode = String(code).trim().toLowerCase();
  const rows = await query('SELECT * FROM training_programs WHERE LOWER(code) = ? LIMIT 1', [cleanCode]);
  if (!rows || rows.length === 0) return null;
  return getTrainingById(rows[0].id);
};

/**
 * Creates a new training program.
 */
export const createTraining = async (data, callerCollegeId = 1) => {
  const {
    name,
    code,
    short_name,
    description,
    fee_amount,
    status = 'Open',
    start_date,
    end_date,
    registration_open_date,
    registration_close_date,
    payment_instructions,
    payment_qr_url,
    eligibility_criteria,
    restrictions,
    google_form_url,
    google_sheet_url,
    upi_id,
    upi_payee_name,
    college_id,
  } = data;

  if (!name || !name.trim()) throw new Error('Training Name is required');
  if (!code || !code.trim()) throw new Error('Training Code is required');

  const cleanCode = code.trim().toUpperCase();
  const existing = await query('SELECT id FROM training_programs WHERE UPPER(code) = ? LIMIT 1', [cleanCode]);
  if (existing && existing.length > 0) {
    throw new Error(`A training program with code '${cleanCode}' already exists. Please choose a unique code.`);
  }

  const parsedFee = parseFloat(fee_amount);
  const feeAmount = isNaN(parsedFee) ? 0.0 : Math.max(0, parsedFee);
  const targetCollegeId = college_id || callerCollegeId || 1;

  const result = await query(
    `INSERT INTO training_programs
      (college_id, name, code, short_name, description, fee_amount, status,
       start_date, end_date, registration_open_date, registration_close_date,
       payment_instructions, payment_qr_url, eligibility_criteria, restrictions,
       google_form_url, google_sheet_url, upi_id, upi_payee_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      targetCollegeId,
      name.trim(),
      cleanCode,
      (short_name || cleanCode).trim(),
      description || null,
      feeAmount,
      status || 'Open',
      start_date || null,
      end_date || null,
      registration_open_date || null,
      registration_close_date || null,
      payment_instructions || null,
      payment_qr_url || null,
      eligibility_criteria || null,
      restrictions ? JSON.stringify(restrictions) : null,
      google_form_url || null,
      google_sheet_url || null,
      upi_id || null,
      upi_payee_name || null,
    ]
  );

  return await getTrainingById(result.insertId);
};

/**
 * Updates an existing training program.
 */
export const updateTraining = async (id, data) => {
  const training = await getTrainingById(id);
  if (!training) throw new Error(`Training with ID ${id} not found`);

  const {
    name,
    code,
    short_name,
    description,
    fee_amount,
    status,
    start_date,
    end_date,
    registration_open_date,
    registration_close_date,
    payment_instructions,
    payment_qr_url,
    eligibility_criteria,
    restrictions,
    google_form_url,
    google_sheet_url,
    upi_id,
    upi_payee_name,
  } = data;

  if (code && code.trim().toUpperCase() !== training.code) {
    const cleanCode = code.trim().toUpperCase();
    const existing = await query('SELECT id FROM training_programs WHERE UPPER(code) = ? AND id != ? LIMIT 1', [cleanCode, id]);
    if (existing && existing.length > 0) {
      throw new Error(`Training code '${cleanCode}' is already in use by another program.`);
    }
  }

  const updatedCode = code ? code.trim().toUpperCase() : training.code;
  const updatedFee = fee_amount !== undefined ? Math.max(0, parseFloat(fee_amount) || 0) : training.feeAmount;

  await query(
    `UPDATE training_programs SET
      name = COALESCE(?, name),
      code = COALESCE(?, code),
      short_name = COALESCE(?, short_name),
      description = COALESCE(?, description),
      fee_amount = ?,
      status = COALESCE(?, status),
      start_date = ?,
      end_date = ?,
      registration_open_date = ?,
      registration_close_date = ?,
      payment_instructions = COALESCE(?, payment_instructions),
      payment_qr_url = COALESCE(?, payment_qr_url),
      eligibility_criteria = COALESCE(?, eligibility_criteria),
      restrictions = ?,
      google_form_url = COALESCE(?, google_form_url),
      google_sheet_url = COALESCE(?, google_sheet_url),
      upi_id = COALESCE(?, upi_id),
      upi_payee_name = COALESCE(?, upi_payee_name),
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      name ? name.trim() : null,
      updatedCode,
      short_name ? short_name.trim() : null,
      description !== undefined ? description : null,
      updatedFee,
      status || null,
      start_date || null,
      end_date || null,
      registration_open_date || null,
      registration_close_date || null,
      payment_instructions !== undefined ? payment_instructions : null,
      payment_qr_url !== undefined ? payment_qr_url : null,
      eligibility_criteria !== undefined ? eligibility_criteria : null,
      restrictions !== undefined ? JSON.stringify(restrictions) : (training.restrictions ? JSON.stringify(training.restrictions) : null),
      google_form_url !== undefined ? google_form_url : null,
      google_sheet_url !== undefined ? google_sheet_url : null,
      upi_id !== undefined ? upi_id : null,
      upi_payee_name !== undefined ? upi_payee_name : null,
      id,
    ]
  );

  return await getTrainingById(id);
};

/**
 * Updates training program registration/lifecycle status.
 */
export const updateTrainingStatus = async (id, newStatus) => {
  const allowed = ['Draft', 'Open', 'Closed', 'Completed', 'Active', 'Inactive'];
  const formatted = allowed.find((s) => s.toLowerCase() === (newStatus || '').toLowerCase().trim());
  if (!formatted) {
    throw new Error(`Invalid training status '${newStatus}'. Allowed: Draft, Open, Closed, Completed`);
  }

  await query('UPDATE training_programs SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [formatted, id]);
  return await getTrainingById(id);
};

/**
 * Retrieves aggregate overview metrics across all training programs for the Admin dashboard.
 */
export const getOverallTrainingStats = async (collegeId = null) => {
  const params = [];
  let collegeWhere = '';
  if (collegeId) {
    collegeWhere = 'WHERE (tp.college_id = ? OR tp.college_id IS NULL OR tp.college_id = 1)';
    params.push(collegeId);
  }

  const sql = `
    SELECT
      COUNT(DISTINCT tp.id) AS total_trainings,
      SUM(CASE WHEN LOWER(tp.status) IN ('open', 'active') THEN 1 ELSE 0 END) AS open_trainings,
      COUNT(ce.id) AS total_registrations,
      SUM(CASE WHEN LOWER(COALESCE(ce.approval_status, 'pending')) = 'pending' THEN 1 ELSE 0 END) AS pending_approvals,
      SUM(CASE WHEN LOWER(COALESCE(ce.approval_status, 'pending')) = 'approved' THEN 1 ELSE 0 END) AS approved_registrations,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) IN ('pending', 'unpaid') THEN 1 ELSE 0 END) AS pending_payments,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) IN ('completed', 'paid') THEN 1 ELSE 0 END) AS completed_payments,
      SUM(CASE WHEN LOWER(COALESCE(ce.payment_status, 'pending')) IN ('part payment', 'partial') THEN 1 ELSE 0 END) AS part_payments,
      COALESCE(SUM(ce.amount_paid), 0) AS total_collected
    FROM training_programs tp
    LEFT JOIN c2c_enrollments ce ON ce.training_id = tp.id
    ${collegeWhere}
  `;

  const rows = await query(sql, params);
  const r = rows[0] || {};
  return {
    totalTrainings: Number(r.total_trainings || 0),
    openTrainings: Number(r.open_trainings || 0),
    totalRegistrations: Number(r.total_registrations || 0),
    pendingApprovals: Number(r.pending_approvals || 0),
    approvedRegistrations: Number(r.approved_registrations || 0),
    pendingPayments: Number(r.pending_payments || 0),
    completedPayments: Number(r.completed_payments || 0),
    partPayments: Number(r.part_payments || 0),
    totalCollected: Number(r.total_collected || 0),
  };
};

/**
 * Retrieves all enrollment records for a specific training program with filtering and metrics.
 */
export const getEnrollmentsByTrainingId = async (trainingId, filters = {}) => {
  const training = await getTrainingById(trainingId);
  if (!training) {
    throw new Error(`Training program with ID ${trainingId} does not exist`);
  }

  const { search = '', branch = 'all', paymentStatus = 'all', approvalStatus = 'all' } = filters;

  const rows = await query(
    'SELECT * FROM c2c_enrollments WHERE training_id = ? ORDER BY created_at DESC',
    [trainingId]
  );

  const total = rows.length;
  const approved = rows.filter((r) => String(r.approval_status || 'Pending').toLowerCase() === 'approved').length;
  const pendingApproval = rows.filter((r) => String(r.approval_status || 'Pending').toLowerCase() === 'pending').length;
  const rejected = rows.filter((r) => String(r.approval_status || 'Pending').toLowerCase() === 'rejected').length;

  const completedPayment = rows.filter((r) => ['completed', 'paid'].includes(String(r.payment_status || 'Pending').toLowerCase())).length;
  const partPayment = rows.filter((r) => ['part payment', 'partial'].includes(String(r.payment_status || 'Pending').toLowerCase())).length;
  const pendingPayment = rows.filter((r) => ['pending', 'unpaid'].includes(String(r.payment_status || 'Pending').toLowerCase())).length;
  const cancelledPayment = rows.filter((r) => String(r.payment_status || 'Pending').toLowerCase() === 'cancelled').length;

  const totalCollected = rows.reduce((sum, r) => sum + Number(r.amount_paid || 0), 0);
  const totalOutstanding = rows.reduce((sum, r) => sum + Number(r.balance || 0), 0);

  const formattedRows = rows.map((r) => {
    const totalFee = Number(r.total_fee !== undefined ? r.total_fee : training.feeAmount);
    const amountPaid = Number(r.amount_paid || 0);
    const balance = Number(r.balance !== undefined && r.balance !== null ? r.balance : Math.max(0, totalFee - amountPaid));
    return {
      id: r.id,
      enrollmentId: r.id,
      trainingId: r.training_id,
      trainingCode: r.training_code || training.code,
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
      paymentStatus: r.payment_status || 'Pending',
      payment_status: r.payment_status || 'Pending',
      approvalStatus: r.approval_status || 'Pending',
      approval_status: r.approval_status || 'Pending',
      approvedAt: r.approved_at,
      approvedBy: r.approved_by,
      rejectionReason: r.rejection_reason,
      utrNumber: r.utr_number,
      utr_number: r.utr_number,
      paymentDate: r.payment_date,
      payment_date: r.payment_date,
      paymentProofUrl: r.payment_proof_url,
      payment_proof_url: r.payment_proof_url,
      source: r.source || 'portal',
      createdAt: r.created_at,
      created_at: r.created_at,
    };
  });

  // In-memory filter pipeline
  let filtered = formattedRows;
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter((r) =>
      [r.full_name, r.email, r.mobile, r.roll_number, r.utr_number, r.branch, r.batch]
        .filter(Boolean)
        .some((val) => String(val).toLowerCase().includes(q))
    );
  }

  if (branch && branch !== 'all') {
    filtered = filtered.filter((r) => String(r.branch).toLowerCase() === branch.toLowerCase());
  }

  if (paymentStatus && paymentStatus !== 'all') {
    const ps = paymentStatus.toLowerCase();
    filtered = filtered.filter((r) => {
      const cur = String(r.payment_status).toLowerCase();
      if (ps === 'pending') return cur === 'pending' || cur === 'unpaid';
      if (ps === 'part payment') return cur === 'part payment' || cur === 'partial';
      if (ps === 'completed') return cur === 'completed' || cur === 'paid';
      if (ps === 'cancelled') return cur === 'cancelled';
      return cur === ps;
    });
  }

  if (approvalStatus && approvalStatus !== 'all') {
    const as = approvalStatus.toLowerCase();
    filtered = filtered.filter((r) => String(r.approval_status).toLowerCase() === as);
  }

  return {
    training,
    enrollments: filtered,
    counts: {
      total,
      approved,
      pendingApproval,
      rejected,
      completedPayment,
      partPayment,
      pendingPayment,
      cancelledPayment,
      totalCollected,
      totalOutstanding,
      filteredCount: filtered.length,
    },
  };
};

/**
 * Registers a student for a specific training program via the portal or direct link.
 * Ensures:
 *  1. Training exists and is not closed/completed.
 *  2. Prevents duplicate enrollment for the same student/email for THIS training.
 *  3. Allows student to enroll in other trainings separately.
 */
export const registerStudentForTraining = async (payload) => {
  const {
    training_id,
    training_code,
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
    student_id,
  } = payload;

  if (!email || !email.trim()) throw new Error('Email Address is required');
  if (!full_name || !full_name.trim()) throw new Error('Full Name is required');

  const cleanEmail = email.trim().toLowerCase();
  const cleanFullName = full_name.trim();

  // Find training by ID or Code
  let training = null;
  if (training_id) {
    training = await getTrainingById(training_id);
  } else if (training_code) {
    training = await getTrainingByCode(training_code);
  }

  if (!training) {
    throw new Error(`Training program not found. Please verify the training link or code.`);
  }

  // Lifecycle check
  const statusLower = String(training.status || '').toLowerCase();
  if (statusLower === 'closed' || statusLower === 'completed') {
    throw new Error(`Registrations for '${training.name}' are currently closed.`);
  }

  // Duplicate enrollment check for THIS training
  const existing = await query(
    'SELECT * FROM c2c_enrollments WHERE training_id = ? AND LOWER(email) = ? LIMIT 1',
    [training.id, cleanEmail]
  );

  if (existing && existing.length > 0) {
    const prev = existing[0];
    throw new Error(
      `You are already registered for '${training.name}' with email ${cleanEmail}. Registration status: ${prev.approval_status || 'Pending'}, Payment status: ${prev.payment_status || 'Pending'}.`
    );
  }

  const totalFee = Number(training.feeAmount || 0);
  const parsedPaid = parseFloat(amount_paid);
  const amountPaid = isNaN(parsedPaid) ? 0.0 : Math.max(0, parsedPaid);
  const balance = Math.max(0, totalFee - amountPaid);

  let initialPaymentStatus = 'Pending';
  if (amountPaid >= totalFee && totalFee > 0) {
    initialPaymentStatus = 'Part Payment'; // Requires Admin verification to mark Completed
  } else if (amountPaid > 0) {
    initialPaymentStatus = 'Part Payment';
  }

  const result = await query(
    `INSERT INTO c2c_enrollments
      (training_id, training_code, student_id, full_name, email, mobile, roll_number,
       college, branch, year, division, batch, total_fee, amount_paid, balance,
       payment_status, approval_status, utr_number, payment_date, payment_proof_url,
       source, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, 'portal', ?)`,
    [
      training.id,
      training.code,
      student_id || null,
      cleanFullName,
      cleanEmail,
      mobile ? mobile.trim() : null,
      roll_number ? roll_number.trim() : null,
      college ? college.trim() : null,
      branch ? branch.trim() : null,
      year ? year.trim() : null,
      division ? division.trim() : null,
      batch ? batch.trim() : null,
      totalFee,
      amountPaid,
      balance,
      initialPaymentStatus,
      utr_number ? utr_number.trim() : null,
      payment_date ? payment_date.trim() : new Date().toISOString().split('T')[0],
      payment_proof_url ? payment_proof_url.trim() : null,
      JSON.stringify(payload),
    ]
  );

  const newRows = await query('SELECT * FROM c2c_enrollments WHERE id = ?', [result.insertId]);
  return { created: true, enrollment: newRows[0], training };
};

/**
 * Handles Google Form submissions via Webhook for any configured training program.
 * Validates training_id or training_code.
 * Backward compatible: if training identifier is missing, safely defaults to C2C (ID 4).
 * Prevents duplicate imports based on source_response_id or (training_id + email + utr).
 */
export const upsertWebhookTrainingEnrollment = async (payload) => {
  const {
    training_id,
    training_code,
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

  // 1. Resolve Target Training Program
  let training = null;
  if (training_id) {
    training = await getTrainingById(training_id);
    if (!training) {
      throw new Error(`Invalid training_id '${training_id}': No training program found matching this ID.`);
    }
  } else if (training_code) {
    training = await getTrainingByCode(training_code);
    if (!training) {
      throw new Error(`Invalid training_code '${training_code}': No training program found matching this Code.`);
    }
  } else {
    // Backward-compatibility fallback: map to existing C2C program (ID 4 or first C2C)
    const fallbackRows = await query("SELECT id FROM training_programs WHERE UPPER(code) LIKE '%C2C%' ORDER BY id DESC LIMIT 1");
    if (fallbackRows && fallbackRows.length > 0) {
      training = await getTrainingById(fallbackRows[0].id);
    } else {
      training = await getTrainingById(4) || (await getAllTrainings())[0];
    }
  }

  if (!training) {
    throw new Error('Could not resolve target training program for incoming webhook response.');
  }

  const targetTrainingId = training.id;
  const targetTrainingCode = training.code;
  const totalFee = Number(training.feeAmount || 3500.0);
  const parsedPaid = parseFloat(amount_paid);
  const amountPaid = isNaN(parsedPaid) ? 0.0 : Math.max(0, parsedPaid);
  const balance = Math.max(0, totalFee - amountPaid);
  const initialPaymentStatus = 'Pending';

  // 2. Idempotency Check: look up existing record for THIS training
  let existing = null;
  if (cleanResponseId) {
    const rows = await query('SELECT * FROM c2c_enrollments WHERE response_id = ? LIMIT 1', [cleanResponseId]);
    if (rows && rows.length > 0) existing = rows[0];
  }

  if (!existing && cleanEmail && cleanUtr) {
    const rows = await query(
      'SELECT * FROM c2c_enrollments WHERE training_id = ? AND email = ? AND utr_number = ? LIMIT 1',
      [targetTrainingId, cleanEmail, cleanUtr]
    );
    if (rows && rows.length > 0) existing = rows[0];
  }

  if (!existing && cleanEmail) {
    const rows = await query(
      'SELECT * FROM c2c_enrollments WHERE training_id = ? AND email = ? LIMIT 1',
      [targetTrainingId, cleanEmail]
    );
    if (rows && rows.length > 0) existing = rows[0];
  }

  if (existing) {
    // Update fields without overwriting status if already approved or updated by Admin
    await query(
      `UPDATE c2c_enrollments SET
        training_id = ?,
        training_code = ?,
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
        raw_payload = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        targetTrainingId,
        targetTrainingCode,
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
    return { created: false, updated: true, enrollment: updatedRows[0], training };
  }

  // Insert new training enrollment record
  const result = await query(
    `INSERT INTO c2c_enrollments
      (training_id, training_code, response_id, full_name, email, mobile, roll_number,
       college, branch, year, division, batch, total_fee, amount_paid, balance,
       payment_status, approval_status, utr_number, payment_date, payment_proof_url,
       source, raw_payload)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, 'google_form', ?)`,
    [
      targetTrainingId,
      targetTrainingCode,
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
      initialPaymentStatus,
      cleanUtr,
      cleanDate,
      cleanProof,
      JSON.stringify(payload),
    ]
  );

  const newRows = await query('SELECT * FROM c2c_enrollments WHERE id = ?', [result.insertId]);
  return { created: true, updated: false, enrollment: newRows[0], training };
};

/**
 * Updates payment status and recalculates outstanding balance for an enrollment record.
 */
export const updateEnrollmentPayment = async (id, newStatus, newAmountPaid) => {
  const allowed = ['Pending', 'Part Payment', 'Completed', 'Cancelled'];
  const formattedStatus = allowed.find((s) => s.toLowerCase() === (newStatus || '').toLowerCase().trim());
  if (!formattedStatus) {
    throw new Error(`Invalid payment status '${newStatus}'. Allowed: Pending, Part Payment, Completed, Cancelled.`);
  }

  const rows = await query('SELECT * FROM c2c_enrollments WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) {
    throw new Error(`Enrollment record with ID ${id} not found.`);
  }

  const existing = rows[0];
  const totalFee = Number(existing.total_fee || 0);
  let amountPaid = Number(existing.amount_paid || 0);

  if (newAmountPaid !== undefined && newAmountPaid !== null && newAmountPaid !== '') {
    amountPaid = Math.max(0, parseFloat(newAmountPaid) || 0);
  } else if (formattedStatus === 'Completed') {
    amountPaid = totalFee;
  }

  const balance = Math.max(0, totalFee - amountPaid);

  await query(
    'UPDATE c2c_enrollments SET payment_status = ?, amount_paid = ?, balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [formattedStatus, amountPaid, balance, id]
  );

  const updatedRows = await query('SELECT * FROM c2c_enrollments WHERE id = ?', [id]);
  return updatedRows[0];
};

/**
 * Updates registration approval status independently of payment status.
 */
export const updateEnrollmentApproval = async (id, newApprovalStatus, adminUserId = null, rejectionReason = null) => {
  const allowed = ['Pending', 'Approved', 'Rejected'];
  const formatted = allowed.find((s) => s.toLowerCase() === (newApprovalStatus || '').toLowerCase().trim());
  if (!formatted) {
    throw new Error(`Invalid approval status '${newApprovalStatus}'. Allowed: Pending, Approved, Rejected.`);
  }

  const rows = await query('SELECT * FROM c2c_enrollments WHERE id = ? LIMIT 1', [id]);
  if (!rows || rows.length === 0) {
    throw new Error(`Enrollment record with ID ${id} not found.`);
  }

  const isApproved = formatted === 'Approved';
  const approvedAt = isApproved ? new Date() : null;
  const approvedBy = isApproved ? (adminUserId || null) : null;

  await query(
    `UPDATE c2c_enrollments SET
      approval_status = ?,
      approved_at = ?,
      approved_by = ?,
      rejection_reason = ?,
      updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [formatted, approvedAt, approvedBy, rejectionReason || null, id]
  );

  const updatedRows = await query('SELECT * FROM c2c_enrollments WHERE id = ?', [id]);
  return updatedRows[0];
};

/**
 * Compatibility alias for legacy calls.
 */
export const findtrainings = async () => {
  return await query('SELECT * FROM training_programs ORDER BY id DESC');
};
