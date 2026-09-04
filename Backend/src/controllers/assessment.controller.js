import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';
import {
  getAssessmentsService,
  getAssessmentDetailsService,
  submitAssessmentAttemptService,
  getStudentAttemptsService,
  startAssessmentService,
  submitAssessmentService,
  getAttemptResultService,
} from '../services/assessment.service.js';

// ─── EXISTING CONTROLLERS ──────────────────────────────────────────────────────

export const getAssessments = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
    const collegeId = isSuperAdmin ? (req.query.collegeId || null) : req.user.collegeId;
    const data = await getAssessmentsService(collegeId);
    return sendSuccess(res, 'Assessments retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStaff = [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR].includes(req.user.role);
    const data = await getAssessmentDetailsService(id, isStaff);
    return sendSuccess(res, 'Assessment details retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * @deprecated  Use submitAssessment (POST /attempts/:attemptId/submit) instead.
 * Kept for backward compatibility with old route POST /:id/attempts.
 */
export const submitAssessmentAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return sendError(res, 'Submitted answers must be provided as an array', 400);
    }

    const userId = req.user.userId || req.user.id;
    const collegeId = req.user.collegeId || 1;

    const evaluationResult = await submitAssessmentAttemptService({
      assessmentId: id,
      userId,
      collegeId,
      submittedAnswers: answers,
    });

    return sendSuccess(res, 'Assessment evaluated and recorded successfully', evaluationResult, 201);
  } catch (error) {
    next(error);
  }
};

export const getMyAttempts = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const attempts = await getStudentAttemptsService(userId);
    return sendSuccess(res, 'Your assessment attempts retrieved successfully', attempts);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentData = getAssessments;

// ─── NEW CONTROLLERS ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/assessments/:id/start
 * 
 * Student starts an assessment.
 * - Creates a new in_progress attempt (or returns existing one).
 * - Returns assessment info + questions WITHOUT correct_option.
 * - Blocks if already completed.
 */
export const startAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    if (!id || isNaN(parseInt(id, 10))) {
      return sendError(res, 'Invalid assessment ID', 400);
    }
    if (!userId) {
      return sendError(res, 'Invalid student — user ID not found in token', 401);
    }

    const result = await startAssessmentService(id, userId);
    return sendSuccess(res, 'Assessment started successfully', result, 200);
  } catch (error) {
    // If already completed, return 409 with attemptId so frontend can redirect to result
    if (error.statusCode === 409) {
      return sendError(
        res,
        error.message,
        409,
        error.attemptId ? [{ hint: `View result at /attempts/${error.attemptId}/result` }] : []
      );
    }
    next(error);
  }
};

/**
 * POST /api/v1/assessments/attempts/:attemptId/submit
 * 
 * Student submits answers for an in_progress attempt.
 * 
 * Body:
 * {
 *   "answers": [
 *     { "question_id": 1, "selected_option": "A" },
 *     { "question_id": 2, "selected_option": "C" }
 *   ]
 * }
 */
export const submitAssessment = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.user.userId || req.user.id;

    // Basic validation
    if (!attemptId || isNaN(parseInt(attemptId, 10))) {
      return sendError(res, 'Invalid attempt ID', 400);
    }
    if (!answers || !Array.isArray(answers)) {
      return sendError(res, 'Answers must be provided as an array', 400);
    }
    if (answers.length === 0) {
      return sendError(res, 'At least one answer must be submitted', 400);
    }

    const result = await submitAssessmentService(attemptId, userId, answers);
    return sendSuccess(res, 'Assessment submitted and evaluated successfully', result, 200);
  } catch (error) {
    // Pass through known HTTP errors as-is
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * GET /api/v1/assessments/attempts/:attemptId/result
 * 
 * Returns full result for a completed attempt.
 * - STUDENT: can only see their own result.
 * - MENTOR/COORDINATOR/COLLEGE_ADMIN/SUPER_ADMIN: can see any result.
 */
export const getAttemptResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    if (!attemptId || isNaN(parseInt(attemptId, 10))) {
      return sendError(res, 'Invalid attempt ID', 400);
    }

    const result = await getAttemptResultService(attemptId, userId, userRole);
    return sendSuccess(res, 'Assessment result retrieved successfully', result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};
