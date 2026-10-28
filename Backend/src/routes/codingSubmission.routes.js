import express from 'express';
import {
  createCodingSubmission,
  getCodingSubmissionById,
  getStudentCodingSubmissions,
  getAllCodingSubmissionsAdmin,
  updateSubmissionFeedbackController,
} from '../controllers/codingSubmission.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Route: Get all coding submissions (Admin / Mentors)
 * GET /api/v1/coding-submissions
 */
router.get('/', authenticateToken, getAllCodingSubmissionsAdmin);

/**
 * Route: Save a student's coding attempt and marks
 * POST /api/v1/coding-submissions
 */
router.post('/', authenticateToken, createCodingSubmission);

/**
 * Route: Save optional feedback on coding submission (Admin / Mentors)
 * PATCH /api/v1/coding-submissions/:id/feedback
 * POST /api/v1/coding-submissions/:id/feedback
 */
router.patch('/:id/feedback', authenticateToken, updateSubmissionFeedbackController);
router.post('/:id/feedback', authenticateToken, updateSubmissionFeedbackController);

/**
 * Route: Get coding submission by ID
 * GET /api/v1/coding-submissions/:id
 */
router.get('/:id', authenticateToken, getCodingSubmissionById);

/**
 * Route: Get all coding submissions for a student
 * GET /api/v1/coding-submissions/student/:studentId
 */
router.get('/student/:studentId', authenticateToken, getStudentCodingSubmissions);

export default router;
