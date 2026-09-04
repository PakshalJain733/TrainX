import { Router } from 'express';
import {
  getAssessments,
  getAssessmentById,
  submitAssessmentAttempt,
  getMyAttempts,
  startAssessment,
  submitAssessment,
  getAttemptResult,
} from '../controllers/assessment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// All assessment endpoints require authentication
router.use(authenticateToken);

// ─── RESULT & ATTEMPT ROUTES (before /:id to avoid param conflicts) ────────────

/**
 * GET /api/v1/assessments/attempts/:attemptId/result
 * 
 * View full result for a completed attempt.
 * STUDENT   → own result only
 * MENTOR/COORDINATOR/COLLEGE_ADMIN/SUPER_ADMIN → any result
 */
router.get(
  '/attempts/:attemptId/result',
  authorizeRoles('student', 'mentor', 'coordinator', 'college_admin', 'super_admin'),
  getAttemptResult
);

/**
 * POST /api/v1/assessments/attempts/:attemptId/submit
 * 
 * Submit answers for an in_progress attempt.
 * Only students can submit.
 */
router.post(
  '/attempts/:attemptId/submit',
  authorizeRoles('student'),
  submitAssessment
);

// ─── STUDENT PERSONAL ROUTES ───────────────────────────────────────────────────

/**
 * GET /api/v1/assessments/my-attempts
 * 
 * List all past attempts for the logged-in student.
 */
router.get(
  '/my-attempts',
  authorizeRoles('student'),
  getMyAttempts
);

// ─── ASSESSMENT LISTING ────────────────────────────────────────────────────────

/**
 * GET /api/v1/assessments/
 * 
 * List all published assessments.
 * All authenticated roles can view the list.
 */
router.get(
  '/',
  authorizeRoles('student', 'mentor', 'coordinator', 'college_admin', 'super_admin'),
  getAssessments
);

// ─── ASSESSMENT DETAIL & START (parameterized — must come after static routes) ─

/**
 * GET /api/v1/assessments/:id
 * 
 * View assessment details.
 * Staff see correct_option; students do not.
 */
router.get(
  '/:id',
  authorizeRoles('student', 'mentor', 'coordinator', 'college_admin', 'super_admin'),
  getAssessmentById
);

/**
 * POST /api/v1/assessments/:id/start
 * 
 * Student starts an assessment (creates in_progress attempt).
 * Returns questions WITHOUT correct_option.
 * Blocked if already completed.
 */
router.post(
  '/:id/start',
  authorizeRoles('student'),
  startAssessment
);

/**
 * @deprecated  Use POST /attempts/:attemptId/submit instead.
 * Kept for backward compatibility.
 */
router.post('/:id/attempts', authorizeRoles('student'), submitAssessmentAttempt);
router.post('/:id/submit', authorizeRoles('student'), submitAssessmentAttempt);

export default router;
