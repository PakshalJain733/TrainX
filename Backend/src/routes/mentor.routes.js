import { Router } from 'express';
import { getMentorStudentsPerformance, getMentorAttendanceBatches, saveMentorAttendance } from '../controllers/mentor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protect mentor routes
router.use(authenticateToken);

router.get('/students/performance', getMentorStudentsPerformance);
router.get('/attendance/batches', getMentorAttendanceBatches);
router.post('/attendance/save', saveMentorAttendance);

export default router;
