import { Router } from 'express';
import { getMilestoneData } from '../controllers/milestone.controller.js';

const router = Router();
router.get('/', getMilestoneData);

export default router;
