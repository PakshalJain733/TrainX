import { Router } from 'express';
import { getTrainingData } from '../controllers/training.controller.js';

const router = Router();
router.get('/', getTrainingData);

export default router;
