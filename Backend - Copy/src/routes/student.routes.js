import { Router } from 'express';
import { getStudentData, getStudentDashboard } from '../controllers/student.controller.js';

const router = Router();

router.get('/', getStudentData);
router.get('/dashboard', getStudentDashboard);

export default router;

