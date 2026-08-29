import { Router } from 'express';
import { getCollegeData } from '../controllers/college.controller.js';

const router = Router();
router.get('/', getCollegeData);

export default router;
