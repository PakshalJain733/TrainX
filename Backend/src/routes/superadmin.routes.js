import { Router } from 'express';
import {
  getSuperAdminOverview,
  getSuperAdminColleges,
  getSuperAdminDepartments,
  getSuperAdminBatches,
  getSuperAdminCoordinators,
  getSuperAdminMentors,
  getSuperAdminStudents,
  getSuperAdminAttendance,
  getSuperAdminPerformance,
  getSuperAdminWeeklyReports,
  getSuperAdminRoadmaps,
  getSuperAdminVerifications,
  getSuperAdminDashboardSummary,
  getSuperAdminC2CStats,
} from '../controllers/superadmin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN));

router.get('/overview', getSuperAdminOverview);
router.get('/dashboard-summary', getSuperAdminDashboardSummary);
router.get('/colleges', getSuperAdminColleges);
router.get('/departments', getSuperAdminDepartments);
router.get('/batches', getSuperAdminBatches);
router.get('/coordinators', getSuperAdminCoordinators);
router.get('/mentors', getSuperAdminMentors);
router.get('/students', getSuperAdminStudents);
router.get('/attendance', getSuperAdminAttendance);
router.get('/performance', getSuperAdminPerformance);
router.get('/weekly-reports', getSuperAdminWeeklyReports);
router.get('/roadmaps', getSuperAdminRoadmaps);
router.get('/verifications', getSuperAdminVerifications);
router.get('/c2c/stats', getSuperAdminC2CStats);

export default router;