import { Router } from 'express';
import { getStudentData } from '../controllers/student.controller.js';

const router = Router();
router.get('/', getStudentData);

export default router;
