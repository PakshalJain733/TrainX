import { Router } from 'express';
import { getTrainingData } from '../controllers/training.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', getTrainingData);

export default router;
