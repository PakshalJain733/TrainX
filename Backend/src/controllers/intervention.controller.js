import {
  evaluateStudentDefaulterStatus,
  scanAndDetectDefaulters,
  logMentorInterventionService,
  getStudentInterventionHistory,
  getMentorDefaulterQueueService,
  getCoordinatorDefaulterQueueService,
  getAdminDefaulterQueueService,
  getSuperAdminDefaulterOverviewService,
} from '../services/intervention.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';
import { sendGenericEmail } from '../services/email.service.js';

/**
 * GET /api/v1/interventions
 * Role-aware endpoint for Defaulters & Interventions
 */
export const getInterventionData = async (req, res, next) => {
  try {
    const user = req.user || {};
    const role = user.role || ROLES.STUDENT;
    const userId = user.userId || user.id || 6;

    if (role === ROLES.STUDENT) {
      const data = await getStudentInterventionHistory(userId);
      return sendSuccess(res, 'Student intervention status retrieved successfully', data);
    }

    if (role === ROLES.MENTOR) {
      const data = await getMentorDefaulterQueueService(user, req.query);
      return sendSuccess(res, 'Mentor defaulter queue retrieved successfully', data);
    }

    if (role === ROLES.COORDINATOR) {
      const data = await getCoordinatorDefaulterQueueService(user, req.query);
      return sendSuccess(res, 'Coordinator students needing improvement retrieved successfully', data);
    }

    if (role === ROLES.COLLEGE_ADMIN) {
      const data = await getAdminDefaulterQueueService(user, req.query);
      return sendSuccess(res, 'College admin defaulter records retrieved successfully', data);
    }

    if (role === ROLES.SUPER_ADMIN) {
      const data = await getSuperAdminDefaulterOverviewService(req.query);
      return sendSuccess(res, 'Super admin defaulter oversight retrieved successfully', data);
    }

    const defaultQueue = await getMentorDefaulterQueueService(user, req.query);
    return sendSuccess(res, 'Defaulters queue retrieved successfully', defaultQueue);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/interventions/log
 * Log mentor interaction, notes, action taken, and update status
 */
export const logInterventionController = async (req, res, next) => {
  try {
    const mentorUser = req.user || {};
    const payload = req.body || {};

    if (!payload.student_id && !payload.studentId && !payload.user_id) {
      return sendError(res, 'student_id is required to log an intervention', 400);
    }

    const result = await logMentorInterventionService(mentorUser, payload);
    return sendSuccess(res, 'Mentor intervention action logged successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/interventions/student/my-status
 */
export const getStudentInterventionStatusController = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || 6;
    const data = await getStudentInterventionHistory(userId);
    return sendSuccess(res, 'Student intervention status retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/interventions/mentor
 */
export const getMentorDefaulterQueueController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const data = await getMentorDefaulterQueueService(user, req.query);
    return sendSuccess(res, 'Mentor defaulter queue retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/interventions/coordinator
 */
export const getCoordinatorDefaulterQueueController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const data = await getCoordinatorDefaulterQueueService(user, req.query);
    return sendSuccess(res, 'Coordinator students needing improvement retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/interventions/admin
 */
export const getAdminDefaultersController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const data = await getAdminDefaulterQueueService(user, req.query);
    return sendSuccess(res, 'College admin defaulters overview retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/interventions/warn
 */
export const sendWarningController = async (req, res, next) => {
  try {
    const { studentEmail, studentName, reason } = req.body;
    if (!studentEmail) {
      return sendError(res, 'Student email is required', 400);
    }
    const subject = `Urgent: Warning Alert from Campus Training Portal`;
    const html = `
      <div style="color: #0f172a; font-size: 16px;">
        <p>Dear ${studentName || 'Student'},</p>
        <p>This is an automated warning alert regarding your performance/attendance on the Campus Training Portal.</p>
        <p><strong>Reason:</strong> ${reason || 'Low attendance or missed assignments'}</p>
        <p>Please log in to the portal and contact your mentor immediately to resolve this issue.</p>
      </div>
    `;
    await sendGenericEmail({ to: studentEmail, subject, html, text: 'Warning alert regarding your performance/attendance.' });
    return sendSuccess(res, 'Warning email sent successfully');
  } catch (error) {
    next(error);
  }
};
