import { Router } from 'express';
import {
  getReportData,
  generateWeeklyReportController,
  getStudentWeeklyReportsController,
  getMentorWeeklyReportsController,
  getAdminWeeklyReportsController,
} from '../controllers/report.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';
import { requireFeature } from '../middleware/featureSwitch.middleware.js';

const router = Router();
router.use(authenticateToken);
router.use(requireFeature('weeklyReports'));

router.get('/', getReportData);
router.post('/weekly/generate', generateWeeklyReportController);
router.get('/student/my-reports', getStudentWeeklyReportsController);
router.get('/mentor/batch-reports', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.MENTOR, ROLES.COORDINATOR), getMentorWeeklyReportsController);
router.get('/admin/college-reports', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), getAdminWeeklyReportsController);

export default router;
