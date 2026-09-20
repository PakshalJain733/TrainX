import { Router } from 'express';
import {
  getStudentData,
  getStudentProfile,
  updateStudentProfile,
  getStudentDashboard,
  getStudentPracticeProblems,
  getStudentAttendance,
  applyStudentLeave,
  getStudentNotifications,
  getStudentPerformance,
  getStudentStudyMaterials,
} from '../controllers/student.controller.js';
import { getRoadmapData, generateRoadmap } from '../controllers/roadmap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protect student routes
router.use(authenticateToken);

router.get('/', getStudentData);
router.get('/me', getStudentProfile);
router.patch('/me', updateStudentProfile);
router.get('/profile', getStudentProfile);
router.patch('/profile', updateStudentProfile);
router.get('/dashboard', getStudentDashboard);

// Practice Problems & Attendance
router.get('/practice-problems', getStudentPracticeProblems);
router.get('/attendance', getStudentAttendance);
router.post('/attendance/leave', applyStudentLeave);
router.get('/notifications', getStudentNotifications);
router.get('/performance', getStudentPerformance);
router.get('/study-materials', getStudentStudyMaterials);

// Section 11 Roadmap Endpoints
router.get('/:id/roadmap', getRoadmapData);
router.post('/:id/roadmap/generate', generateRoadmap);
router.post('/:id/roadmap/update', generateRoadmap);

export default router;
