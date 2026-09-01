import { Router } from 'express';
import { getAttendanceData } from '../controllers/attendance.controller.js';

const router = Router();
router.get('/', getAttendanceData);

export default router;
