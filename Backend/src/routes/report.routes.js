import { Router } from 'express';
import {
  getReportData,
  generateWeeklyReportController,
  getStudentWeeklyReportsController,
  getMentorWeeklyReportsController,
  getAdminWeeklyReportsController,
} from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getReportData);
router.post('/weekly/generate', generateWeeklyReportController);
router.get('/student/my-reports', getStudentWeeklyReportsController);
router.get('/mentor/batch-reports', getMentorWeeklyReportsController);
router.get('/admin/college-reports', getAdminWeeklyReportsController);

export default router;
