import { Router } from 'express';
import { getWeeklyReports, getAllReports } from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.get('/', getWeeklyReports);
router.get('/weekly', getWeeklyReports);
router.get('/all', getAllReports);

export default router;
