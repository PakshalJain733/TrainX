import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  getAssessments,
  getAvailableAssessments,
  getAssessmentById,
  createAssessment,
  deleteAssessment,
  generateAIQuestions,
  addAssessmentQuestion,
  getAssessmentResults,
  submitAssessment,
  getMyAttempts,
  startAssessment,
  markQuizCompleted,
} from '../controllers/assessment.controller.js';

const router = Router();
router.use(authenticateToken);

// Static GET routes MUST come before parameter /:id routes
router.get('/', getAssessments);
router.get('/available', getAvailableAssessments);
router.get('/my-attempts', getMyAttempts);

// Static POST routes
router.post('/', createAssessment);
router.post('/generate-ai-questions', generateAIQuestions);
router.post('/mark-completed', markQuizCompleted);

// Parameter /:id routes LAST
router.get('/:id', getAssessmentById);
router.delete('/:id', deleteAssessment);
router.post('/:id/questions', addAssessmentQuestion);
router.get('/:id/results', getAssessmentResults);
router.post('/:id/start', startAssessment);
router.post('/:id/submit', submitAssessment);

export default router;
