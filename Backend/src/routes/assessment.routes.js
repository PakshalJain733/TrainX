import { Router } from 'express';
import {
  getAssessments,
  getPublishedAssessments,
  getAssessmentById,
  addAssessment,
  editAssessment,
  removeAssessment,
  publishAssessmentCtrl,
  getQuestions,
  addQuestion,
  editQuestion,
  removeQuestion,
  startAssessment,
  submitAssessment,
  submitAssessmentAttempt,
  getAttemptResult,
  getMyResult,
  getMyAttempts,
  getAssessmentResults,
  generateAIQuestionsCtrl,
} from '../controllers/assessment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// All assessment endpoints require authentication
router.use(authenticateToken);

// Generate questions using Google Gemini AI
router.post(
  '/generate-ai-questions',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  generateAIQuestionsCtrl
);

// ─── Result & Attempt Routes (before /:id to avoid param conflicts) ────────────

// View full result for a completed attempt
router.get(
  '/attempts/:attemptId/result',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getAttemptResult
);

// Get own specific result (student)
router.get('/attempts/:attemptId/my-result', authorizeRoles(ROLES.STUDENT), getMyResult);

// Submit answers for an in_progress attempt
router.post(
  '/attempts/:attemptId/submit',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  submitAssessment
);

// ─── Student Personal Routes ───────────────────────────────────────────────────

// Available/published assessments for students
router.get(
  '/available',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getPublishedAssessments
);

// List all past attempts for the logged-in student
router.get(
  '/my-attempts',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getMyAttempts
);

// ─── Mentor / Admin: Assessment CRUD ─────────────────────────────────────────

// List all assessments (with filters)
router.get(
  '/',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getAssessments
);

// Get a single assessment
router.get(
  '/:id',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getAssessmentById
);

// Create assessment
router.post(
  '/',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  addAssessment
);

// Edit assessment
router.put(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  editAssessment
);

// Delete assessment
router.delete(
  '/:id',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  removeAssessment
);

// Publish assessment
router.patch(
  '/:id/publish',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  publishAssessmentCtrl
);

// ─── Questions CRUD ──────────────────────────────────────────────────────────

router.get(
  '/:id/questions',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  getQuestions
);
router.post(
  '/:id/questions',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  addQuestion
);
router.put(
  '/:id/questions/:qid',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  editQuestion
);
router.delete(
  '/:id/questions/:qid',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  removeQuestion
);

// View all results for an assessment (Admin/Mentor)
router.get(
  '/:id/results',
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR),
  getAssessmentResults
);

// Student: Start assessment (returns questions WITHOUT correct answers)
router.post(
  '/:id/start',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  startAssessment
);

// Backward-compatible routes
router.post(
  '/:id/attempts',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  submitAssessmentAttempt
);
router.post(
  '/:id/submit',
  authorizeRoles(ROLES.STUDENT, ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  submitAssessmentAttempt
);

export default router;
