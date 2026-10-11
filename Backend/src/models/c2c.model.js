import {
  upsertWebhookTrainingEnrollment,
  getEnrollmentsByTrainingId,
  updateEnrollmentPayment,
  updateEnrollmentApproval,
  getAllTrainings,
} from './training.model.js';
import { query } from '../config/db.js';

/**
 * Backward-compatible wrapper for C2C Google Form Webhook.
 */
export const upsertGoogleFormEnrollment = async (payload) => {
  return await upsertWebhookTrainingEnrollment(payload);
};

/**
 * Backward-compatible wrapper for fetching C2C enrollments.
 */
export const getC2CEnrollments = async (trainingId = null) => {
  let targetId = trainingId;
  if (!targetId) {
    // Resolve C2C program ID (default to ID 4 or first program with C2C)
    const rows = await query("SELECT id FROM training_programs WHERE UPPER(code) LIKE '%C2C%' ORDER BY id DESC LIMIT 1");
    targetId = rows && rows.length > 0 ? rows[0].id : 4;
  }
  return await getEnrollmentsByTrainingId(targetId);
};

/**
 * Backward-compatible wrapper for updating C2C payment status.
 */
export const updateC2CPaymentStatus = async (id, newStatus, newAmountPaid) => {
  return await updateEnrollmentPayment(id, newStatus, newAmountPaid);
};

export { updateEnrollmentApproval };
