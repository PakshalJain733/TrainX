import { Router } from 'express';
import {
  getInterviewData,
  getInterviewById,
  saveInterviewSession,
} from '../controllers/interview.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.post('/', saveInterviewSession);
router.get('/', getInterviewData);
router.get('/:id', getInterviewById);

export default router;