import { Router } from 'express';
import { getAttendanceData } from '../controllers/attendance.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', getAttendanceData);

export default router;
