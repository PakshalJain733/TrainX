import { Router } from 'express';
import { getSkillGapData } from '../controllers/skillGap.controller.js';

const router = Router();
router.get('/', getSkillGapData);

export default router;
