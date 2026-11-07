import {
  provisionStudentFromCareerGateway,
  revokeStudentEligibility,
} from '../services/studentProvisioning.service.js';
import {
  consumeAccountActivation,
  resendAccountActivation,
} from '../services/accountActivation.service.js';
import { sendSuccess, sendError } from '../../../../utils/response.js';

/**
 * POST /api/integrations/career-gateway/students
 * Ingests a single student or batch of students from Career Gateway.
 */
export async function handleProvisionStudents(req, res, next) {
  try {
    const body = req.body;
    const students = Array.isArray(body) ? body : (Array.isArray(body.students) ? body.students : [body]);

    if (!students || students.length === 0 || !students[0]) {
      return sendError(res, 'Invalid request: No student data provided', 400);
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;
    let firstFailureStatusCode = 400;

    for (const student of students) {
      try {
        const result = await provisionStudentFromCareerGateway(student);
        results.push(result);
        successCount++;
      } catch (err) {
        const code = err.statusCode || 400;
        if (failureCount === 0) firstFailureStatusCode = code;
        results.push({
          student_id: student.student_id || student.id || null,
          status: 'failed',
          statusCode: code,
          error: err.message,
        });
        failureCount++;
      }
    }

    const firstSuccessful = results.find((r) => r.status !== 'failed' && r.trainx_user_id);
    const referenceId = firstSuccessful ? `tx_student_${firstSuccessful.trainx_user_id}` : null;
    const userId = firstSuccessful ? firstSuccessful.trainx_user_id : null;

    const httpStatus = failureCount === 0 ? 200 : (successCount > 0 ? 207 : firstFailureStatusCode);
    return res.status(httpStatus).json({
      success: failureCount === 0,
      reference_id: referenceId,
      id: userId,
      message: `Provisioned ${successCount} student(s) (${failureCount} failed)`,
      total: students.length,
      success_count: successCount,
      failure_count: failureCount,
      data: results,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/integrations/career-gateway/students/:studentId/eligibility
 * Revokes or updates student eligibility from Career Gateway.
 */
export async function handleUpdateEligibility(req, res, next) {
  try {
    const { studentId } = req.params;
    const { eligible, reason } = req.body;

    if (eligible === false || eligible === 0 || eligible === 'false') {
      const result = await revokeStudentEligibility(studentId, reason);
      return sendSuccess(res, 'Student eligibility revoked successfully', result);
    }

    // If eligible === true, re-provision / reactivate student
    const result = await provisionStudentFromCareerGateway({
      student_id: studentId,
      email: req.body.email,
      name: req.body.name,
      eligible: true,
    });
    return sendSuccess(res, 'Student eligibility restored successfully', result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/integrations/career-gateway/students/deactivate
 * Deactivates a student from Career Gateway.
 */
export async function handleDeactivateStudent(req, res, next) {
  try {
    const studentId = req.body.student_id || req.body.career_gateway_student_id || req.body.id;
    if (!studentId) {
      return sendError(res, 'student_id or career_gateway_student_id is required', 400);
    }
    const result = await revokeStudentEligibility(studentId, req.body.reason || 'Deactivated via Career Gateway S2S');
    return res.status(200).json({
      success: true,
      reference_id: `tx_deact_${studentId}`,
      message: 'Student deactivated successfully',
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/integrations/career-gateway/activate-account
 * Public activation endpoint called by students clicking their email activation link.
 */
export async function handleActivateAccount(req, res, next) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return sendError(res, 'Activation token and new password are required', 400);
    }

    const result = await consumeAccountActivation(token, password);
    return sendSuccess(res, result.message, {
      userId: result.userId,
      email: result.email,
    });
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}

/**
 * POST /api/integrations/career-gateway/resend-activation
 * Public endpoint to request a fresh activation link.
 */
export async function handleResendActivation(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Email address is required', 400);
    }
    const result = await resendAccountActivation(email);
    return sendSuccess(res, result.message, { success: true });
  } catch (err) {
    next(err);
  }
}
