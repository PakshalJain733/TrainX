import {
  provisionStudentFromCareerGateway,
  revokeStudentEligibility,
} from '../services/studentProvisioning.service.js';
import { consumeAccountActivation } from '../services/accountActivation.service.js';
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

    const httpStatus = failureCount === 0 ? 200 : (successCount > 0 ? 207 : firstFailureStatusCode);
    return res.status(httpStatus).json({
      success: failureCount === 0,
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
