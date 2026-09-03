import { Router } from 'express';
import { getInterviewData } from '../controllers/interview.controller.js';

const router = Router();
router.get('/', getInterviewData);

export default router;
