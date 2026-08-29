import { Router } from 'express';
import { getAssessmentData } from '../controllers/assessment.controller.js';

const router = Router();
router.get('/', getAssessmentData);

export default router;
