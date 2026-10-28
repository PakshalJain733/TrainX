import { sendSuccess, sendError } from '../utils/response.js';
import {
  saveCodingSubmissionService,
  getSubmissionByIdService,
  getStudentSubmissionsService,
  getAllCodingSubmissionsService,
  submitCodeFeedbackService,
} from '../services/codingSubmission.service.js';

/**
 * Controller: Save a student's coding attempt and calculated marks
 * POST /api/v1/coding-submissions
 */
export const createCodingSubmission = async (req, res, next) => {
  try {
    const {
      problem_id,
      submitted_code,
      language,
      passed_test_cases,
      total_test_cases,
      score,
      marks,
      percentage,
      status,
      execution_details,
    } = req.body;

    // Student identity ALWAYS comes from the authenticated JWT -- never from
    // the client-supplied body (prevents inserting submissions under another
    // student's account).
    const effectiveStudentId = req.user?.userId || req.user?.id;

    if (!effectiveStudentId) {
      return sendError(res, 'student_id is required', 400);
    }

    if (!problem_id) {
      return sendError(res, 'problem_id is required', 400);
    }

    if (submitted_code === undefined || submitted_code === null || (typeof submitted_code === 'string' && submitted_code.trim() === '')) {
      return sendError(res, 'submitted_code is required', 400);
    }

    if (!language || (typeof language === 'string' && language.trim() === '')) {
      return sendError(res, 'language is required', 400);
    }

    const submission = await saveCodingSubmissionService({
      student_id: effectiveStudentId,
      problem_id,
      submitted_code,
      language,
      passed_test_cases,
      total_test_cases,
      score,
      marks,
      percentage,
      status,
      execution_details,
    });

    return sendSuccess(res, 'Coding attempt and marks saved successfully', submission, 201);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Controller: Get a single coding submission by ID
 * GET /api/v1/coding-submissions/:id
 */
export const getCodingSubmissionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submission = await getSubmissionByIdService(id);
    return sendSuccess(res, 'Coding submission retrieved successfully', submission, 200);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Controller: Get all coding submissions for a student
 * GET /api/v1/coding-submissions/student/:studentId
 */
export const getStudentCodingSubmissions = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const result = await getStudentSubmissionsService(studentId);
    return sendSuccess(res, 'Student coding submissions retrieved successfully', result, 200);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Controller: Get all coding submissions across students for Admin & Instructors
 * GET /api/v1/coding-submissions
 */
export const getAllCodingSubmissionsAdmin = async (req, res, next) => {
  try {
    const { problem_id, student_id, status, limit, page } = req.query;
    const submissions = await getAllCodingSubmissionsService({
      problem_id,
      student_id,
      status,
      limit,
      page,
    });
    return sendSuccess(res, 'Coding submissions retrieved successfully', submissions, 200);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * Update / save optional review feedback on a coding submission
 * PATCH /api/v1/coding-submissions/:id/feedback
 */
export const updateSubmissionFeedbackController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body || {};
    const reviewerName = req.user?.name || (req.user?.role === 'mentor' ? 'Mentor' : 'Admin');

    const result = await submitCodeFeedbackService({
      submission_id: id,
      feedback,
      feedback_by: reviewerName,
    });

    return sendSuccess(res, 'Feedback saved successfully', result, 200);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

