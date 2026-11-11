import express from 'express';
import {
  createCodingSubmission,
  getCodingSubmissionById,
  getStudentCodingSubmissions,
  getAllCodingSubmissionsAdmin,
  updateSubmissionFeedbackController,
} from '../controllers/codingSubmission.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireFeature } from '../middleware/featureSwitch.middleware.js';

const router = express.Router();

import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const staffOrAdmin = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.TRAINER, ROLES.MENTOR, ROLES.COORDINATOR);

/**
 * Route: Get all coding submissions (Admin / Mentors / Instructors Only)
 * GET /api/v1/coding-submissions
 */
router.get('/', authenticateToken, staffOrAdmin, requireFeature('trainerSubmissions'), getAllCodingSubmissionsAdmin);

/**
 * Route: Save a student's coding attempt and marks
 * POST /api/v1/coding-submissions
 */
router.post('/', authenticateToken, requireFeature('codingCompiler'), createCodingSubmission);

/**
 * Route: Save optional feedback on coding submission (Admin / Mentors / Instructors Only)
 * PATCH /api/v1/coding-submissions/:id/feedback
 * POST /api/v1/coding-submissions/:id/feedback
 */
router.patch('/:id/feedback', authenticateToken, staffOrAdmin, updateSubmissionFeedbackController);
router.post('/:id/feedback', authenticateToken, staffOrAdmin, updateSubmissionFeedbackController);

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
