import { Router } from 'express';
import {
  getRoadmapData,
  getAllRoadmaps,
  generateRoadmap,
  updateMilestone,
  saveRoadmapProgressController,
  generateTopicQuiz,
  generateMilestonePractice,
  generateMilestoneTheory,
  getMilestoneVideo,
} from '../controllers/roadmap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public educational learning endpoints (YouTube Video, AI Theory, Practice Challenge & Quiz)
router.get('/video', getMilestoneVideo);
router.post('/theory/generate', generateMilestoneTheory);
router.post('/practice/generate', generateMilestonePractice);
router.post('/quiz/generate', generateTopicQuiz);

// Protect roadmap routes
router.use(authenticateToken);

// Retrieve student active roadmap
router.get('/', getRoadmapData);
router.get('/all', getAllRoadmaps);
router.get('/my', getRoadmapData);
router.get('/my-roadmap', getRoadmapData);
router.get('/student/:id', getRoadmapData);

// AI Roadmap Generation
router.post('/generate', generateRoadmap);
router.post('/student/:id/generate', generateRoadmap);

// AI Quiz Generation
router.post('/quiz/generate', generateTopicQuiz);

// Milestone Item Status & Full Roadmap Progress Updates
router.patch('/items/:itemId', updateMilestone);
router.put('/:id/progress', saveRoadmapProgressController);
router.post('/progress', saveRoadmapProgressController);

export default router;
