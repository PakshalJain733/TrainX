import { Router } from 'express';
import { getStudentData, getStudentDashboard } from '../controllers/student.controller.js';
import { getRoadmapData, generateRoadmap } from '../controllers/roadmap.controller.js';

const router = Router();

router.get('/', getStudentData);
router.get('/dashboard', getStudentDashboard);

// Section 11 Roadmap Endpoints
router.get('/:id/roadmap', getRoadmapData);
router.post('/:id/roadmap/generate', generateRoadmap);
router.post('/:id/roadmap/update', generateRoadmap);

export default router;
