import { Router } from 'express';
import {
  getRoadmapData,
  generateRoadmap,
  updateMilestone,
} from '../controllers/roadmap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Retrieve student active roadmap
router.get('/', getRoadmapData);
router.get('/my-roadmap', getRoadmapData);
router.get('/student/:id', getRoadmapData);

// AI Roadmap Generation
router.post('/generate', generateRoadmap);
router.post('/student/:id/generate', generateRoadmap);

// Milestone Item Status & Progress Update
router.patch('/items/:itemId', updateMilestone);

export default router;
