import { sendSuccess, sendError } from '../utils/response.js';
import {
  upsertGoogleFormEnrollment,
  getC2CEnrollments,
  updateC2CPaymentStatus,
} from '../models/c2c.model.js';

/**
 * Webhook endpoint for receiving Google Form submissions via Apps Script.
 * POST /api/v1/c2c/google-form/webhook
 */
export const handleGoogleFormWebhook = async (req, res, next) => {
  try {
    const expectedSecret = process.env.C2C_WEBHOOK_SECRET || 'TrainX_C2C_Webhook_Secret_Key_2026';
    
    // Extract secret from header, query param, or body
    const providedSecret =
      req.headers['x-c2c-secret'] ||
      req.headers['x-c2c-webhook-secret'] ||
      req.headers['authorization']?.replace(/^Bearer\s+/i, '') ||
      req.query.secret ||
      req.body.webhook_secret ||
      req.body.secret;

    if (!providedSecret || String(providedSecret).trim() !== String(expectedSecret).trim()) {
      return sendError(res, 'Unauthorized: Invalid or missing C2C webhook secret.', 401);
    }

    const payload = req.body || {};
    const full_name = payload.full_name || payload.name || payload['Full Name'] || payload['Name'];
    const email = payload.email || payload['Email Address'] || payload['Email'];
    const mobile = payload.mobile || payload.phone || payload['Mobile Number'] || payload['Phone Number'];
    const roll_number = payload.roll_number || payload.prn || payload['Roll Number'] || payload['PRN'];
    const college = payload.college || payload['College Name'] || payload['College'];
    const branch = payload.branch || payload.department || payload['Branch'] || payload['Department'];
    const year = payload.year || payload['Year'];
    const division = payload.division || payload['Division'];
    const batch = payload.batch || payload['Batch'];
    const amount_paid = payload.amount_paid !== undefined ? payload.amount_paid : payload['Amount Paid'];
    const utr_number = payload.utr_number || payload.utr || payload['UTR Number'] || payload['Transaction ID'];
    const payment_date = payload.payment_date || payload.response_timestamp || payload.form_response_timestamp || payload['Payment Date'];
    const payment_proof_url = payload.payment_proof_url || payload['Payment Proof'] || payload['Upload Payment Proof'];
    const response_id = payload.source_response_id || payload.response_id || payload.responseId || payload.id;

    if (!email && !full_name) {
      return sendError(res, 'Bad Request: Full name or email is required.', 400);
    }

    const normalizedData = {
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

    const result = await upsertGoogleFormEnrollment(normalizedData);

    return sendSuccess(
      res,
      result.created ? 'C2C Google Form submission processed successfully' : 'C2C enrollment record updated successfully',
      result,
      result.created ? 201 : 200
    );
  } catch (error) {
    console.error('[C2C Webhook Error]', error);
    next(error);
  }
};

/**
 * Gets all C2C enrollments and statistics for the Admin dashboard.
 * GET /api/v1/c2c/enrollments or /api/v1/admin/c2c/enrollments
 */
export const getEnrollments = async (req, res, next) => {
  try {
    const data = await getC2CEnrollments();
    return sendSuccess(res, 'C2C enrollments fetched successfully', data);
  } catch (error) {
    console.error('[C2C Controller getEnrollments Error]', error);
    next(error);
  }
};

/**
 * Updates payment status and optional amount paid for a C2C enrollment.
 * PATCH /api/v1/c2c/enrollments/:id/status
 */
export const updateEnrollmentStatus = async (idOrReq, res, next) => {
  try {
    const req = res ? idOrReq : this;
    const targetRes = res || idOrReq;

    const id = req.params.id;
    const newStatus = req.body.payment_status || req.body.paymentStatus;
    const newAmountPaid = req.body.amount_paid !== undefined ? req.body.amount_paid : req.body.amountPaid;

    if (!newStatus) {
      return sendError(targetRes, 'payment_status is required', 400);
    }

    const updated = await updateC2CPaymentStatus(id, newStatus, newAmountPaid);
    return sendSuccess(targetRes, 'Payment status updated successfully', updated);
  } catch (error) {
    console.error('[C2C Controller updateEnrollmentStatus Error]', error);
    next(error);
  }
};
