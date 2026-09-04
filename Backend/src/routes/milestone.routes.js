import { Router } from 'express';
import { getMilestoneData } from '../controllers/milestone.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', getMilestoneData);

export default router;
