import express from 'express';
import {
  createCodingSubmission,
  getCodingSubmissionById,
  getStudentCodingSubmissions,
} from '../controllers/codingSubmission.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Route: Save a student's coding attempt and marks
 * POST /api/v1/coding-submissions
 */
router.post('/', authenticateToken, createCodingSubmission);

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
