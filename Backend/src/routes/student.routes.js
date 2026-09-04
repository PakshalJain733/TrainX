import { Router } from 'express';
import {
  getStudentData,
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard,
} from '../controllers/student.controller.js';
import { getRoadmapData, generateRoadmap } from '../controllers/roadmap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protect student routes
router.use(authenticateToken);

router.get('/', getStudentData);
router.get('/me', getStudentProfile);
router.patch('/me', updateStudentProfile);
router.get('/dashboard', getStudentDashboard);

// Section 11 Roadmap Endpoints
router.get('/:id/roadmap', getRoadmapData);
router.post('/:id/roadmap/generate', generateRoadmap);
router.post('/:id/roadmap/update', generateRoadmap);

export default router;
