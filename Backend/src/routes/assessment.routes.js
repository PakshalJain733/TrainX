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
  getAssessmentResults
} from '../controllers/assessment.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';

const router = Router();

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

export default router;
