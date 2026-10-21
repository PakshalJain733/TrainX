import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import {
  getAllTrainings,
  getTrainingById,
  getTrainingByCode,
  createTraining,
  updateTraining,
  updateTrainingStatus,
  getOverallTrainingStats,
  getEnrollmentsByTrainingId,
  registerStudentForTraining,
  upsertWebhookTrainingEnrollment,
  updateEnrollmentPayment,
  updateEnrollmentApproval,
  transferEnrollmentTraining,
} from '../models/training.model.js';

/**
 * Helper to extract college filter from authenticated user.
 */
const getCallerCollegeId = (req) => {
  if (req.user?.role === 'super_admin') return null;
  return req.user?.college_id || req.user?.collegeId || null;
};

/**
 * GET /api/v1/trainings
 * List all training programs with aggregated metrics for the Admin Dashboard.
 */
export const getTrainings = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeId(req);
    const trainings = await getAllTrainings(collegeId);
    return sendSuccess(res, 'Training programs retrieved successfully', trainings);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/trainings/overview-stats
 * High-level summary metrics across all trainings for Admin Overview.
 */
export const getOverviewStats = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeId(req);
    const stats = await getOverallTrainingStats(collegeId);
    return sendSuccess(res, 'Training overview stats retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/trainings/:id
 * Retrieve details for a single training program by ID.
 */
export const getTraining = async (req, res, next) => {
  try {
    const { id } = req.params;
    const training = await getTrainingById(id);
    if (!training) {
      return sendError(res, `Training program with ID ${id} not found`, 404);
    }
    return sendSuccess(res, 'Training details retrieved successfully', training);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/trainings/code/:code
 * Public endpoint: Retrieve training details by unique code for the registration link.
 */
export const getTrainingByCodePublic = async (req, res, next) => {
  try {
    const { code } = req.params;
    const training = await getTrainingByCode(code);
    if (!training) {
      return sendError(res, `No training program found matching code '${code}'`, 404);
    }
    return sendSuccess(res, 'Training program retrieved successfully', training);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/trainings
 * Admin: Create a new training program.
 */
export const createNewTraining = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeId(req) || 1;
    const training = await createTraining(req.body, collegeId);
    return sendSuccess(res, 'Training program created successfully', training, 201);
  } catch (error) {
    if (error.message.includes('already exists')) {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
};

/**
 * PUT /api/v1/trainings/:id
 * Admin: Update training details.
 */
export const updateTrainingDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateTraining(id, req.body);
    return sendSuccess(res, 'Training program updated successfully', updated);
  } catch (error) {
    if (error.message.includes('already in use')) {
      return sendError(res, error.message, 409);
    }
    next(error);
  }
};

/**
 * PATCH /api/v1/trainings/:id/status
 * Admin: Update training lifecycle status (Draft, Open, Closed, Completed).
 */
export const changeTrainingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return sendError(res, 'status is required', 400);
    }
    const updated = await updateTrainingStatus(id, status);
    return sendSuccess(res, `Training status updated to '${updated.status}'`, updated);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/trainings/:id/enrollments
 * Admin: Retrieve all enrollments and metrics for a specific training program.
 */
export const getTrainingEnrollments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filters = {
      search: req.query.search || '',
      branch: req.query.branch || 'all',
      paymentStatus: req.query.payment_status || req.query.paymentStatus || 'all',
      approvalStatus: req.query.approval_status || req.query.approvalStatus || 'all',
    };
    const data = await getEnrollmentsByTrainingId(id, filters);
    return sendSuccess(res, `Enrollments for '${data.training.name}' retrieved successfully`, data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/trainings/register or POST /api/v1/trainings/:id/register
 * Public & Student: Register for a specific training program.
 */
export const registerForTraining = async (req, res, next) => {
  try {
    const trainingId = req.params.id || req.body.training_id || req.body.trainingId;
    const payload = {
      ...req.body,
      training_id: trainingId,
      student_id: req.user?.id || req.user?.userId || req.body.student_id || null,
    };
    const result = await registerStudentForTraining(payload);
    return sendSuccess(res, `Registration submitted successfully for '${result.training.name}'!`, result, 201);
  } catch (error) {
    if (error.message.includes('already registered')) {
      return sendError(res, error.message, 409);
    }
    if (error.message.includes('closed')) {
      return sendError(res, error.message, 403);
    }
    next(error);
  }
};

/**
 * PATCH /api/v1/trainings/enrollments/:enrollmentId/payment
 * Admin: Update payment status and amount paid for a student's enrollment record.
 */
export const updatePaymentStatus = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { payment_status, paymentStatus, amount_paid, amountPaid } = req.body;
    const newStatus = payment_status || paymentStatus;
    const newAmount = amount_paid !== undefined ? amount_paid : amountPaid;

    if (!newStatus) {
      return sendError(res, 'payment_status is required', 400);
    }

    const updated = await updateEnrollmentPayment(enrollmentId, newStatus, newAmount);
    return sendSuccess(res, 'Payment status updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/trainings/enrollments/:enrollmentId/approval
 * Admin: Approve or Reject a student's registration for a training program.
 */
export const updateApprovalStatus = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { approval_status, approvalStatus, rejection_reason, rejectionReason } = req.body;
    const newApproval = approval_status || approvalStatus;

    if (!newApproval) {
      return sendError(res, 'approval_status is required (Pending, Approved, or Rejected)', 400);
    }

    const adminId = req.user?.id || req.user?.userId || null;
    const updated = await updateEnrollmentApproval(enrollmentId, newApproval, adminId, rejection_reason || rejectionReason);
    return sendSuccess(res, `Registration ${newApproval.toLowerCase()} successfully`, updated);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/trainings/enrollments/:enrollmentId/transfer
 * Admin: Move/Transfer an enrolled student to another training program (e.g. from Aptitude to Technical).
 */
export const transferStudentTraining = async (req, res, next) => {
  try {
    const { enrollmentId } = req.params;
    const { target_training_id, targetTrainingId } = req.body;
    const newTrainingId = target_training_id || targetTrainingId;

    if (!newTrainingId) {
      return sendError(res, 'target_training_id is required', 400);
    }

    const result = await transferEnrollmentTraining(enrollmentId, newTrainingId);
    return sendSuccess(
      res,
      `Student successfully transferred to '${result.targetTraining.name}'`,
      result
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/trainings/google-form/webhook
 * Public Webhook for Google Form responses across any training program.
 */
export const handleMultiTrainingWebhook = async (req, res, next) => {
  try {
    const expectedSecret = process.env.C2C_WEBHOOK_SECRET || 'TrainX_C2C_Webhook_Secret_Key_2026';
    const providedSecret =
      req.headers['x-c2c-secret'] ||
      req.headers['x-c2c-webhook-secret'] ||
      req.headers['x-training-webhook-secret'] ||
      req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
      req.query.secret ||
      req.body.webhook_secret ||
      req.body.secret;

    if (!providedSecret || String(providedSecret).trim() !== String(expectedSecret).trim()) {
      return sendError(res, 'Unauthorized: Invalid or missing Webhook Secret.', 401);
    }

    const payload = req.body || {};
    const training_id = payload.training_id || payload.trainingId || req.query.training_id || req.query.trainingId;
    const training_code = payload.training_code || payload.trainingCode || req.query.training_code || req.query.trainingCode;

    const full_name = payload.full_name || payload.name || payload['Full Name'] || payload['Name'];
    const email = payload.email || payload['Email Address'] || payload['Email'];
    const mobile = payload.mobile || payload.phone || payload['Mobile Number'] || payload['Phone Number'];
    const roll_number = payload.roll_number || payload.prn || payload['Roll Number'] || payload['PRN'] || payload['Roll Number / PRN'];
    const college = payload.college || payload['College Name'] || payload['College'];
    const branch = payload.branch || payload.department || payload['Branch'] || payload['Department'];
    const year = payload.year || payload['Year'];
    const division = payload.division || payload['Division'];
    const batch = payload.batch || payload['Batch'];
    const amount_paid = payload.amount_paid !== undefined ? payload.amount_paid : payload['Amount Paid'];
    const utr_number = payload.utr_number || payload.utr || payload['UTR Number'] || payload['Transaction ID'] || payload['UTR / Transaction ID'];
    const payment_date = payload.payment_date || payload.response_timestamp || payload.form_response_timestamp || payload['Payment Date'] || payload['Timestamp'];
    const payment_proof_url = payload.payment_proof_url || payload['Payment Proof'] || payload['Upload Payment Proof'];
    const response_id = payload.source_response_id || payload.response_id || payload.responseId || payload.id;

    if (!email && !full_name) {
      return sendError(res, 'Bad Request: Full name or email is required.', 400);
    }

    const normalizedData = {
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
      raw_payload: payload,
    };

    const result = await upsertWebhookTrainingEnrollment(normalizedData);
    return sendSuccess(
      res,
      result.created
        ? `Form submission processed successfully for '${result.training.name}'`
        : `Enrollment record updated successfully for '${result.training.name}'`,
      result,
      result.created ? 201 : 200
    );
  } catch (error) {
    console.error('[Multi-Training Webhook Error]', error);
    if (error.message.includes('Invalid training_') || error.message.includes('No training program')) {
      return sendError(res, error.message, 400);
    }
    next(error);
  }
};

/**
 * Legacy Student Training Data (Preserved for Student Overview page).
 */
export const getTrainingData = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    let training = { program: null, enrollment: null, mentor: null };
    try {
      const rows = await query(
        `SELECT
           tp.id AS program_id, tp.name AS program_name, tp.code AS program_code, tp.short_name,
           tp.placement_season_year, tp.graduation_year, tp.description, tp.fee_amount AS program_fee, tp.status AS program_status,
           te.id AS enrollment_id, te.training_option, te.fee_amount, te.amount_paid, te.payment_status,
           te.whatsapp_group_added, te.source_status, te.source_timestamp,
           te.batch_id, b.name AS batch_name,
           mu.name AS mentor_name, mu.mobile_number AS mentor_mobile
         FROM training_enrollments te
         JOIN training_programs tp ON tp.id = te.program_id
         LEFT JOIN batches b ON b.id = te.batch_id
         LEFT JOIN mentor_student_assignments msa ON msa.student_id = te.student_user_id
         LEFT JOIN users mu ON mu.id = msa.mentor_id
         WHERE te.student_user_id = ?
         ORDER BY te.id DESC
         LIMIT 1`,
        [userId]
      );
      if (rows && rows.length > 0) {
        const r = rows[0];
        training = {
          program: {
            id: r.program_id,
            name: r.program_name,
            code: r.program_code,
            shortName: r.short_name || r.program_code,
            placementSeasonYear: r.placement_season_year,
            graduationYear: r.graduation_year,
            description: r.description,
            feeAmount: r.program_fee,
            status: r.program_status,
          },
          enrollment: {
            id: r.enrollment_id,
            trainingOption: r.training_option,
            feeAmount: r.fee_amount,
            amountPaid: r.amount_paid,
            paymentStatus: r.payment_status,
            whatsappGroupAdded: r.whatsapp_group_added,
            sourceStatus: r.source_status,
            sourceTimestamp: r.source_timestamp,
            batchId: r.batch_id,
            batchName: r.batch_name,
          },
          mentor: r.mentor_name ? { name: r.mentor_name, mobile: r.mentor_mobile } : null,
        };
      }
    } catch (e) {
      console.warn('[getTrainingData DB error]', e.message);
    }
    return sendSuccess(res, 'training data retrieved successfully', training);
  } catch (error) {
    next(error);
  }
};