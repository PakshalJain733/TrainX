import { Router } from 'express';
import { getSkillGapData } from '../controllers/skillGap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', getSkillGapData);

export default router;
