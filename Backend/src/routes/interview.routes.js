import { Router } from 'express';
import { getInterviewData } from '../controllers/interview.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', getInterviewData);

export default router;
