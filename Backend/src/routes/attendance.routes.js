import { Router } from 'express';
import {
  getMyAttendanceSummary,
  getStudentAttendanceById,
  getStudentAttendanceHistory,
  getLowAttendanceStudents,
  getAllStudentsAttendance,
  getDepartmentSummary,
  getBatchSummary,
  getDashboardSummary,
  markSelfAttendanceByCode,
  getLeaveRequests,
  updateLeaveRequestStatus,
} from '../controllers/attendance.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Protect all attendance routes
router.use(authenticateToken);

// 0. Student mark self attendance present via QR scan or code
router.post('/mark', markSelfAttendanceByCode);

// Leave Requests Routes
router.get('/leave-requests', getLeaveRequests);
router.put('/leave-requests/:id/status', updateLeaveRequestStatus);

// 1. Logged in student personal summary & history
router.get('/summary', getMyAttendanceSummary);
router.get('/history', getStudentAttendanceHistory);

// 2. Low-attendance filtered list (Coordinators, Mentors, Admins)
router.get(
  '/low-attendance',
  authorizeRoles(ROLES.COORDINATOR, ROLES.MENTOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getLowAttendanceStudents
);

// 3. Search/filter all students attendance list
router.get(
  '/list',
  authorizeRoles(ROLES.COORDINATOR, ROLES.MENTOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getAllStudentsAttendance
);

// 4. Department-wise breakdown
router.get(
  '/department',
  authorizeRoles(ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getDepartmentSummary
);

// 5. Batch-wise breakdown
router.get(
  '/batch',
  authorizeRoles(ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getBatchSummary
);

// 6. Dashboard summary analytics
router.get(
  '/dashboard-summary',
  authorizeRoles(ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getDashboardSummary
);

// 7. Specific student attendance summary
router.get('/student/:studentId', getStudentAttendanceById);

// 8. Specific student attendance session log history
router.get('/student/:studentId/history', getStudentAttendanceHistory);

export default router;
