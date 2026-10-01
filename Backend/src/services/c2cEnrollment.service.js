import { query } from '../config/db.js';
import { config } from '../config/env.js';
import { C2C_REGISTRATION_STATUS } from '../utils/constants.js';
import {
  getC2cRegistrationByUserId,
  createC2cEnrollmentFromRegistration,
  getC2cEnrollmentById,
} from '../models/c2c.model.js';
import { updateUserModel } from '../models/user.model.js';
import {
  sendC2cEnrollmentConfirmedEmail,
  sendC2cRegistrationLinkEmail,
} from './email.service.js';

/**
 * Absolute URL of the TrainX registration page a C2C student redeems.
 */
export const buildC2cRegistrationLink = (token) => {
  const base = (config.c2c.registrationBaseUrl || config.frontendUrl || '').replace(/\/+$/, '');
  return `${base}/register?c2c_token=${encodeURIComponent(token)}`;
};

/**
 * Copies the lead's student identifier onto the `students` profile row so the
 * Admin C2C table can show branch and batch for enrollments that predate the
 * spreadsheet importer.
 */
const syncStudentProfile = async (registration) => {
  if (!registration?.userId) return;
  const rollNumber = registration.rollNumber || '';
  if (!rollNumber && !registration.branchId && !registration.batchId) return;

  try {
    await updateUserModel(registration.userId, {
      name: registration.name || undefined,
      roll_number: rollNumber || undefined,
      department: registration.branch || undefined,
      department_id: registration.branchId || undefined,
      batch_id: registration.batchId || undefined,
      target_track: registration.programCode || undefined,
    });
  } catch (error) {
    console.warn('[C2C] Could not sync student profile:', error.message);
  }
};

/**
 * Runs on admin approval. Creates the student's C2C Enrollment automatically,
 * carrying the payment information that was recorded on the intake record
 * before the student registered. The admin never has to add the student by hand.
 *
 * Safe to call more than once: a second call reports the existing enrollment
 * rather than creating a duplicate.
 */
export const finalizeC2cEnrollmentForUser = async (userId, adminUser) => {
  const registration = await getC2cRegistrationByUserId(userId);
  if (!registration) {
    return { created: false, skipped: true, reason: 'not_a_c2c_registration' };
  }

  await syncStudentProfile(registration);

  const result = await createC2cEnrollmentFromRegistration({
    registration,
    userId: Number(userId),
    approvedBy: adminUser?.id || null,
    approvedAt: new Date(),
  });

  if (result.error) {
    return { created: false, skipped: true, reason: result.error, registration };
  }

  const enrollment = await getC2cEnrollmentById(result.enrollmentId);

  if (result.created) {
    // A registration cancelled before approval should not silently produce an
    // enrollment; the guard above only blocks a second enrollment, so undo the
    // one we just made.
    if (registration.status === C2C_REGISTRATION_STATUS.CANCELLED) {
      await query('DELETE FROM training_enrollments WHERE id = ?', [result.enrollmentId]);
      await query(
        'UPDATE c2c_registrations SET enrollment_id = NULL, status = ? WHERE id = ?',
        [C2C_REGISTRATION_STATUS.CANCELLED, registration.registrationId]
      );
      return { created: false, skipped: true, reason: 'registration_cancelled', registration };
    }

    if (enrollment?.email && enrollment.email.includes('@')) {
      sendC2cEnrollmentConfirmedEmail({
        to: enrollment.email,
        name: enrollment.name,
        programName: registration.programName,
        totalFee: enrollment.totalFee,
        amountPaid: enrollment.amountPaid,
        balance: enrollment.balance,
        accessStatus: enrollment.accessStatus,
      }).catch((error) => console.warn('[C2C] Enrollment email skipped:', error.message));
    }
  }

  return {
    created: !!result.created,
    duplicate: !!result.duplicate,
    skipped: false,
    enrollmentId: result.enrollmentId,
    enrollment,
    registration,
  };
};

/**
 * Emails the released registration link to the student. Delivery is best effort:
 * a missing or rejected email address never blocks the Admin from sharing the
 * link manually.
 */
export const deliverC2cRegistrationLink = async (registration, token) => {
  const link = buildC2cRegistrationLink(token);
  if (!registration?.email || !registration.email.includes('@')) {
    return { emailed: false, link, reason: 'no_email_on_record' };
  }

  try {
    await sendC2cRegistrationLinkEmail({
      to: registration.email,
      name: registration.name,
      programName: registration.programName,
      registrationLink: link,
      feeAmount: registration.feeAmount,
      amountPaid: registration.amountPaid,
      balance: registration.balance,
    });
    return { emailed: true, link };
  } catch (error) {
    console.warn('[C2C] Registration link email skipped:', error.message);
    return { emailed: false, link, reason: error.message };
  }
};
