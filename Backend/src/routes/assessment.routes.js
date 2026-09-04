import { Router } from 'express';
import {
  getAssessments,
  getAssessmentById,
<<<<<<< HEAD
  submitAssessmentAttempt,
  getMyAttempts,
  startAssessment,
  submitAssessment,
  getAttemptResult,
=======
  addAssessment,
  editAssessment,
  removeAssessment,
  publishAssessmentCtrl,
  getQuestions,
  addQuestion,
  editQuestion,
  removeQuestion,
  getPublishedAssessments,
  startAssessment,
  submitAssessment,
  getMyResult,
  getMyAttempts,
  getAssessmentResults
>>>>>>> Pakshal
} from '../controllers/assessment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

<<<<<<< HEAD
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
=======
// ─── Student Routes ─────────────────────────────────────────────────────────
// Student views available assessments
router.get('/available', authenticateToken, getPublishedAssessments);

// Student attempts history
router.get('/my-attempts', authenticateToken, getMyAttempts);

// Student gets their own specific attempt result
router.get('/attempts/:attemptId/result', authenticateToken, getMyResult);

// Student starts an assessment (returns questions WITHOUT correct answers)
router.post('/:id/start', authenticateToken, startAssessment);

// Student submits an attempt
router.post('/attempts/:attemptId/submit', authenticateToken, submitAssessment);


// ─── Mentor / Admin Routes ──────────────────────────────────────────────────
// Assessment CRUD
router.get('/', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), getAssessments);
router.get('/:id', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), getAssessmentById);
router.post('/', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), addAssessment);
router.put('/:id', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), editAssessment);
router.delete('/:id', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), removeAssessment);

// Publish Assessment
router.patch('/:id/publish', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), publishAssessmentCtrl);

// Questions CRUD
router.get('/:id/questions', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), getQuestions);
router.post('/:id/questions', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), addQuestion);
router.put('/:id/questions/:qid', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), editQuestion);
router.delete('/:id/questions/:qid', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), removeQuestion);

// View all results for an assessment (Mentor/Admin)
router.get('/:id/results', authenticateToken, authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), getAssessmentResults);
>>>>>>> Pakshal

export default router;
