import { Router } from 'express';
import {
  getAssessments,
  createAssessment,
} from '../controllers/assessment.controller.js';

const router = Router();

router.get('/', getAssessments);
router.post('/', createAssessment);

export default router;
