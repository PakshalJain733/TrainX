import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';
import {
  getAssessments,
  getAvailableAssessments,
  getAssessmentById,
  createAssessment,
  deleteAssessment,
  generateAIQuestions,
  verifyAIQuestions,
  addAssessmentQuestion,
  getAssessmentResults,
  submitAssessment,
  getMyAttempts,
  startAssessment,
  markQuizCompleted,
} from '../controllers/assessment.controller.js';

const router = Router();
router.use(authenticateToken);

const instructorOrAdmin = authorizeRoles(
  ROLES.SUPER_ADMIN,
  ROLES.COLLEGE_ADMIN,
  ROLES.TRAINER,
  ROLES.MENTOR,
  ROLES.COORDINATOR
);

// Static GET routes MUST come before parameter /:id routes
router.get('/', getAssessments);
router.get('/available', getAvailableAssessments);
router.get('/my-attempts', getMyAttempts);

// Static POST routes (Instructor / Admin only for creation & AI generation)
router.post('/', instructorOrAdmin, createAssessment);
router.post('/generate-ai-questions', instructorOrAdmin, generateAIQuestions);
router.post('/verify-ai-questions', instructorOrAdmin, verifyAIQuestions);
router.post('/mark-completed', markQuizCompleted);

// Attempt and submission routes
router.post('/attempts/:attemptId/submit', submitAssessment);
router.post('/:id/attempts/:attemptId/submit', submitAssessment);

// Parameter /:id routes LAST
router.get('/:id', getAssessmentById);
router.delete('/:id', instructorOrAdmin, deleteAssessment);
router.post('/:id/questions', instructorOrAdmin, addAssessmentQuestion);
router.get('/:id/results', instructorOrAdmin, getAssessmentResults);
router.post('/:id/start', startAssessment);
router.post('/:id/submit', submitAssessment);

export default router;
