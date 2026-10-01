import QRCode from 'qrcode';
import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES, C2C_PAYMENT_STATUS, C2C_ACCESS_STATUS, C2C_REGISTRATION_STATUS } from '../utils/constants.js';
import {
  ensureC2cProgram,
  getC2cProgram,
  updateC2cProgram,
  createC2cRegistration,
  listC2cRegistrations,
  getC2cRegistrationById,
  getC2cRegistrationByToken,
  updateC2cPayment,
  issueC2cRegistrationLink,
  cancelC2cRegistration,
  listC2cEnrollments,
  getC2cEnrollmentForCollege,
  updateC2cEnrollmentPayment,
  updateC2cEnrollmentAccess,
  getC2cDashboardStats,
  getC2cRegistrationStats,
  listC2cBranches,
  normalizePaymentStatus,
  buildUpiPayload,
} from '../models/c2c.model.js';
import {
  buildC2cRegistrationLink,
  deliverC2cRegistrationLink,
  finalizeC2cEnrollmentForUser,
} from '../services/c2cEnrollment.service.js';

/**
 * C2C enrollment controller.
 *
 * Every /admin/c2c route is restricted to college admins and super admins by
 * the router. C2C Enrollment is deliberately admin-only: there is no
 * student-facing enrollment page. A student only ever sees the public
 * /register form pre-filled from their registration link.
 */

/** Multi-tenant isolation filter, mirroring the other admin controllers. */
const getCallerCollegeFilter = (req) => {
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return req.query.collegeId ? parseInt(req.query.collegeId, 10) : null;
  }
  return req.user.collegeId;
};

const programCodeOf = (req) => req.query.program_code || req.query.programCode || undefined;

/** 404 for missing records, 409 for state conflicts, 400 for anything else. */
const errorStatus = (message = '') => {
  if (/not found/i.test(message)) return 404;
  if (/already|duplicate|cannot|only be released|no trainx|cancelled/i.test(message)) return 409;
  return 400;
};

const mapProgram = (program) => ({
  programId: program.id,
  programCode: program.code,
  programName: program.name,
  shortName: program.short_name,
  totalFee: program.fee_amount,
  upiId: program.upi_id,
  upiPayeeName: program.upi_payee_name,
  status: program.status,
  qrConfigured: Boolean(program.upi_id),
});

// ---------------------------------------------------------------------------
// Program configuration
// ---------------------------------------------------------------------------

/** UPI coordinates and program fee that back the payment QR. Admin-editable. */
export const getC2cConfig = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const program = (await getC2cProgram(collegeId)) || (await ensureC2cProgram(collegeId));
    if (!program) {
      return sendError(res, 'C2C program is not available', 404);
    }
    return sendSuccess(res, 'C2C configuration retrieved successfully', {
      ...mapProgram(program),
      paymentStatuses: Object.values(C2C_PAYMENT_STATUS),
      accessStatuses: Object.values(C2C_ACCESS_STATUS),
      registrationStatuses: Object.values(C2C_REGISTRATION_STATUS),
    });
  } catch (error) {
    next(error);
  }
};

export const updateC2cConfig = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { fee_amount, feeAmount, upi_id, upiId, upi_payee_name, upiPayeeName, status } = req.body || {};
    const program = (await getC2cProgram(collegeId)) || (await ensureC2cProgram(collegeId));
    if (!program) {
      return sendError(res, 'C2C program is not available', 404);
    }
    const updated = await updateC2cProgram(program.id, {
      feeAmount: feeAmount ?? fee_amount,
      upiId: upiId ?? upi_id,
      payeeName: upiPayeeName ?? upi_payee_name,
      status,
    });
    if (!updated) {
      return sendError(res, 'C2C program not found', 404);
    }
    return sendSuccess(res, 'C2C configuration updated successfully', mapProgram(updated));
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export const getC2cDashboard = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const programCode = programCodeOf(req);
    const [enrollmentStats, registrationStats] = await Promise.all([
      getC2cDashboardStats({ collegeId, programCode }),
      getC2cRegistrationStats({ collegeId, programCode }),
    ]);
    return sendSuccess(res, 'C2C dashboard retrieved successfully', {
      ...enrollmentStats,
      registrations: registrationStats,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// C2C registrations (intake: payment QR + initial payment information)
// ---------------------------------------------------------------------------

export const getC2cRegistrations = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { search, status, payment_status } = req.query;
    const rows = await listC2cRegistrations({
      collegeId,
      programCode: programCodeOf(req),
      search,
      status,
      paymentStatus: normalizePaymentStatus(payment_status),
    });
    return sendSuccess(res, 'C2C registrations retrieved successfully', rows);
  } catch (error) {
    next(error);
  }
};

/** Creates the intake record and its placeholder account; returns the QR payload. */
export const createC2cRegistrationHandler = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const {
      name,
      email,
      mobile_number,
      mobile,
      roll_number,
      rollNumber,
      branch,
      department_id,
      departmentId,
      batch_id,
      batchId,
      fee_amount,
      feeAmount,
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return sendError(res, 'Student name is required', 400);
    }
    if (!email && !mobile_number && !mobile) {
      return sendError(res, 'An email address or mobile number is required to identify the student', 400);
    }

    const result = await createC2cRegistration({
      collegeId,
      name,
      email,
      mobile: mobile || mobile_number,
      rollNumber: rollNumber || roll_number,
      branch,
      departmentId: departmentId || department_id,
      batchId: batchId || batch_id,
      feeAmount: feeAmount ?? fee_amount,
      createdBy: req.user?.id,
    });

    if (result.error) {
      return sendError(res, result.error, 409);
    }

    const registration = await getC2cRegistrationById(result.registrationId, collegeId);
    return sendSuccess(res, 'C2C registration created. Share the payment QR with the student.', registration, 201);
  } catch (error) {
    next(error);
  }
};

export const getC2cRegistrationByIdHandler = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const registration = await getC2cRegistrationById(req.params.id, collegeId);
    if (!registration) {
      return sendError(res, 'C2C registration not found', 404);
    }
    return sendSuccess(res, 'C2C registration retrieved successfully', registration);
  } catch (error) {
    next(error);
  }
};

/**
 * Records the initial payment information. Deliberately available before the
 * student has registered on TrainX.
 */
export const updateC2cRegistrationPayment = async (req, res, next) => {  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { id } = req.params;
    const {
      amount_paid,
      amountPaid,
      utr,
      payment_date,
      paymentDate,
      payment_status,
      paymentStatus,
      payment_mode,
      paymentMode,
      payment_note,
      paymentNote,
    } = req.body || {};

    const existing = await getC2cRegistrationById(id, collegeId);
    if (!existing) {
      return sendError(res, 'C2C registration not found', 404);
    }
    if (paymentStatus !== undefined && normalizePaymentStatus(paymentStatus) === null) {
      return sendError(res, 'paymentStatus must be one of: completed, part_payment, pending, cancelled', 400);
    }

    const result = await updateC2cPayment(id, {
      amountPaid: amountPaid ?? amount_paid,
      utr,
      paymentDate: paymentDate || payment_date || null,
      paymentStatus: paymentStatus ?? payment_status,
      paymentMode: paymentMode ?? payment_mode,
      paymentNote: paymentNote ?? payment_note,
    });
    if (result.error) {
      return sendError(res, result.error, errorStatus(result.error));
    }

    return sendSuccess(res, 'Payment information recorded successfully', await getC2cRegistrationById(id, collegeId));
  } catch (error) {
    next(error);
  }
};

/** Releases the TrainX registration link. Full or part payment required first. */
export const releaseC2cRegistrationLink = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { id } = req.params;
    const { email } = req.body || {};

    const registration = await getC2cRegistrationById(id, collegeId);
    if (!registration) {
      return sendError(res, 'C2C registration not found', 404);
    }

    const result = await issueC2cRegistrationLink(id);
    if (result.error) {
      return sendError(res, result.error, 409);
    }

    const link = buildC2cRegistrationLink(result.token);
    let emailed = false;
    let emailNotice = '';
    if (email === true) {
      const delivery = await deliverC2cRegistrationLink(registration, result.token);
      emailed = delivery.emailed;
      emailNotice = delivery.reason || '';
    }

    return sendSuccess(res, emailed ? 'Registration link released and emailed to the student' : 'Registration link released', {
      ...(await getC2cRegistrationById(id, collegeId)),
      registrationLink: link,
      emailed,
      emailNotice,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelC2cRegistrationHandler = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { id } = req.params;
    const existing = await getC2cRegistrationById(id, collegeId);
    if (!existing) {
      return sendError(res, 'C2C registration not found', 404);
    }
    const result = await cancelC2cRegistration(id);
    if (result.error) {
      return sendError(res, result.error, 409);
    }
    return sendSuccess(res, 'C2C registration cancelled', await getC2cRegistrationById(id, collegeId));
  } catch (error) {
    next(error);
  }
};

/** Renders the payment QR for a lead as a PNG data URL. */
export const getC2cRegistrationQr = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { id } = req.params;
    const registration = await getC2cRegistrationById(id, collegeId);
    if (!registration) {
      return sendError(res, 'C2C registration not found', 404);
    }
    if (!registration.upiId) {
      return sendError(res, 'No UPI ID is configured for the C2C program. Add one in C2C settings first.', 400);
    }

    const payload =
      registration.qrPayload ||
      buildUpiPayload({
        upiId: registration.upiId,
        payeeName: registration.upiPayeeName,
        amount: registration.feeAmount,
        note: `${registration.programCode} program fee`,
        transactionRef: `C2C${Date.now().toString().slice(-8)}`,
      });

    const qrCode = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
    return sendSuccess(res, 'Payment QR generated successfully', {
      registrationId: registration.registrationId,
      payload,
      qrCode,
      upiId: registration.upiId,
      upiPayeeName: registration.upiPayeeName,
      totalFee: registration.feeAmount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Public endpoint used by the registration page to prefill a student's details
 * from their link. Returns only what is needed to complete the form, and only
 * for a token that actually exists.
 */
export const validateC2cRegistrationToken = async (req, res, next) => {
  try {
    const token = req.query.token || req.body?.token;
    if (!token || String(token).trim().length < 16) {
      return sendError(res, 'Invalid registration link', 400);
    }
    const registration = await getC2cRegistrationByToken(String(token).trim());
    if (!registration) {
      return sendError(res, 'This registration link is not valid. Please contact your college admin.', 404);
    }

    return sendSuccess(res, 'Registration link verified', {
      valid: true,
      name: registration.name,
      email: registration.email,
      mobile: registration.mobile,
      rollNumber: registration.rollNumber,
      branch: registration.branch,
      programName: registration.programName,
      programCode: registration.programCode,
      alreadyRegistered: Boolean(registration.registeredAt),
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// C2C Enrollment (admin-only)
// ---------------------------------------------------------------------------

export const getC2cEnrollments = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { search, branch, payment_status, access_status } = req.query;
    const programCode = programCodeOf(req);
    const [enrollments, branches] = await Promise.all([
      listC2cEnrollments({
        collegeId,
        programCode,
        search,
        branch,
        paymentStatus: normalizePaymentStatus(payment_status),
        accessStatus: access_status,
      }),
      listC2cBranches({ collegeId, programCode }),
    ]);
    return sendSuccess(res, 'C2C enrollments retrieved successfully', { enrollments, branches });
  } catch (error) {
    next(error);
  }
};

/** Admin-only manual change of the mutually-exclusive payment status. */
export const updateC2cEnrollmentPaymentHandler = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { id } = req.params;
    const { payment_status, paymentStatus, amount_paid, amountPaid, utr, payment_date, paymentDate, payment_mode, paymentMode } =
      req.body || {};

    const status = normalizePaymentStatus(paymentStatus ?? payment_status);
    if (!status) {
      return sendError(res, 'paymentStatus must be one of: completed, part_payment, pending, cancelled', 400);
    }

    const programCode = programCodeOf(req);
    const target = await getC2cEnrollmentForCollege(id, collegeId, programCode);
    if (!target) {
      return sendError(res, 'C2C enrollment not found', 404);
    }

    const result = await updateC2cEnrollmentPayment(id, {
      paymentStatus: status,
      amountPaid: amountPaid ?? amount_paid,
      utr,
      paymentDate: paymentDate || payment_date || null,
      paymentMode: paymentMode ?? payment_mode,
    });
    if (result.error) {
      return sendError(res, result.error, errorStatus(result.error));
    }

    const refreshed = await getC2cEnrollmentForCollege(id, collegeId, programCode);
    return sendSuccess(res, 'Payment status updated successfully', refreshed);
  } catch (error) {
    next(error);
  }
};

/** Admin-only manual change of the TrainX software / access status. */
export const updateC2cEnrollmentAccessHandler = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req) || 1;
    const { id } = req.params;
    const { access_status, accessStatus } = req.body || {};

    const programCode = programCodeOf(req);
    const target = await getC2cEnrollmentForCollege(id, collegeId, programCode);
    if (!target) {
      return sendError(res, 'C2C enrollment not found', 404);
    }

    const result = await updateC2cEnrollmentAccess(id, { accessStatus: accessStatus ?? access_status });
    if (result.error) {
      return sendError(res, result.error, errorStatus(result.error));
    }

    const refreshed = await getC2cEnrollmentForCollege(id, collegeId, programCode);
    return sendSuccess(res, 'Access status updated successfully', refreshed);
  } catch (error) {
    next(error);
  }
};

/**
 * Re-runs enrollment creation for an already-approved student. Normally
 * unnecessary because approval creates the enrollment, but useful for records
 * that predate this workflow.
 */
export const reEnrollC2cStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await finalizeC2cEnrollmentForUser(id, req.user);
    if (result.skipped) {
      return sendError(res, result.reason || 'Nothing to enroll', 409);
    }
    return sendSuccess(res, result.created ? 'C2C enrollment created' : 'C2C enrollment already exists', {
      enrollmentId: result.enrollmentId,
      enrollment: result.enrollment,
      duplicate: result.duplicate,
    });
  } catch (error) {
    next(error);
  }
};
