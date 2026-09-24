import {
  generateStudentWeeklyReport,
  getStudentWeeklyReports,
  getMentorWeeklyReportsService,
  getAdminWeeklyReportsService,
  getSuperAdminWeeklyReportsService,
} from '../services/report.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

/**
 * GET /api/v1/reports
 * Role-aware endpoint returning weekly reports based on caller's role & permissions
 */
export const getReportData = async (req, res, next) => {
  try {
    const user = req.user || {};
    const role = user.role || ROLES.STUDENT;
    const userId = user.userId || user.id || 6;

    if (role === ROLES.STUDENT) {
      const reports = await getStudentWeeklyReports(userId);
      return sendSuccess(res, 'Student weekly reports retrieved successfully', reports);
    }

    if (role === ROLES.MENTOR) {
      const reports = await getMentorWeeklyReportsService(user, req.query);
      return sendSuccess(res, 'Mentor batch weekly reports retrieved successfully', reports);
    }

    if (role === ROLES.COLLEGE_ADMIN || role === ROLES.COORDINATOR) {
      const reports = await getAdminWeeklyReportsService(user, req.query);
      return sendSuccess(res, 'College admin weekly reports retrieved successfully', reports);
    }

    if (role === ROLES.SUPER_ADMIN) {
      const reports = await getSuperAdminWeeklyReportsService(req.query);
      return sendSuccess(res, 'Super admin governance reports retrieved successfully', reports);
    }

    const defaultReports = await getStudentWeeklyReports(userId);
    return sendSuccess(res, 'Weekly reports retrieved successfully', defaultReports);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/reports/weekly/generate
 * Trigger weekly report generation for a student
 */
export const generateWeeklyReportController = async (req, res, next) => {
  try {
    const userId = req.body.student_id || req.body.studentId || req.user?.userId || req.user?.id || 6;
    const weeksAgo = req.body.weeksAgo || 0;
    const forceRegenerate = req.body.forceRegenerate || false;

    const report = await generateStudentWeeklyReport(userId, { weeksAgo, forceRegenerate });
    return sendSuccess(res, 'Weekly performance report generated successfully', report);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/student/my-reports
 */
export const getStudentWeeklyReportsController = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id || 6;
    const reports = await getStudentWeeklyReports(userId);
    return sendSuccess(res, 'Student weekly reports retrieved successfully', reports);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/mentor/batch-reports
 */
export const getMentorWeeklyReportsController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const reports = await getMentorWeeklyReportsService(user, req.query);
    return sendSuccess(res, 'Mentor weekly reports retrieved successfully', reports);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reports/admin/college-reports
 */
export const getAdminWeeklyReportsController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const reports = await getAdminWeeklyReportsService(user, req.query);
    return sendSuccess(res, 'College admin weekly reports retrieved successfully', reports);
  } catch (error) {
    next(error);
  }
};
