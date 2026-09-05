import { Router } from 'express';
import {
  getAssessments,
  getAssessmentById,
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
  getAttemptResult,
  getAssessmentResults,
  submitAssessmentAttempt,
  generateAIQuestionsCtrl,
} from '../controllers/assessment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

// All assessment endpoints require authentication
router.use(authenticateToken);

// Generate questions using Google Gemini AI
router.post(
  '/generate-ai-questions',
  authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'),
  generateAIQuestionsCtrl
);

// ─── Result & Attempt Routes (before /:id to avoid param conflicts) ────────────


// View full result for a completed attempt
router.get(
  '/attempts/:attemptId/result',
  authorizeRoles('student', 'mentor', 'coordinator', 'college_admin', 'super_admin'),
  getAttemptResult
);

// Get own specific result (student)
router.get('/attempts/:attemptId/my-result', authorizeRoles('student'), getMyResult);

// Submit answers for an in_progress attempt
router.post(
  '/attempts/:attemptId/submit',
  authorizeRoles('student'),
  submitAssessment
);

// ─── Student Personal Routes ───────────────────────────────────────────────────

// Available/published assessments for students
router.get('/available', authorizeRoles('student'), getPublishedAssessments);

// List all past attempts for the logged-in student
router.get(
  '/my-attempts',
  authorizeRoles('student'),
  getMyAttempts
);

// ─── Mentor / Admin: Assessment CRUD ─────────────────────────────────────────

// List all assessments (with filters)
router.get(
  '/',
  authorizeRoles('student', 'mentor', 'coordinator', 'college_admin', 'super_admin'),
  getAssessments
);

// Get a single assessment
router.get(
  '/:id',
  authorizeRoles('student', 'mentor', 'coordinator', 'college_admin', 'super_admin'),
  getAssessmentById
);

// Create assessment
router.post(
  '/',
  authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'),
  addAssessment
);

// Edit assessment
router.put(
  '/:id',
  authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'),
  editAssessment
);

// Delete assessment
router.delete(
  '/:id',
  authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'),
  removeAssessment
);

// Publish assessment
router.patch(
  '/:id/publish',
  authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'),
  publishAssessmentCtrl
);

// ─── Questions CRUD ──────────────────────────────────────────────────────────

router.get('/:id/questions', authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), getQuestions);
router.post('/:id/questions', authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), addQuestion);
router.put('/:id/questions/:qid', authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), editQuestion);
router.delete('/:id/questions/:qid', authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), removeQuestion);

// View all results for an assessment (Admin/Mentor)
router.get('/:id/results', authorizeRoles('super_admin', 'college_admin', 'coordinator', 'mentor'), getAssessmentResults);

// Student: Start assessment (returns questions WITHOUT correct answers)
router.post('/:id/start', authorizeRoles('student'), startAssessment);

// Legacy backward-compatible routes
router.post('/:id/attempts', authorizeRoles('student'), submitAssessmentAttempt);
router.post('/:id/submit', authorizeRoles('student'), submitAssessmentAttempt);

export default router;
