import { Router } from 'express';
import { getRoadmapData } from '../controllers/roadmap.controller.js';

const router = Router();
router.get('/', getRoadmapData);

export default router;
