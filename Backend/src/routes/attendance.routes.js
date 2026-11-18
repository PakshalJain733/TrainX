import { Router } from 'express';
import {
  getMyAttendanceSummary,
  getStudentAttendanceById,
  getStudentAttendanceHistory,
  getMyAttendanceScans,
  getLowAttendanceStudents,
  getAllStudentsAttendance,
  getDepartmentSummary,
  getBatchSummary,
  getDashboardSummary,
  markSelfAttendanceByCode,
  getLeaveRequests,
  createLeaveRequest,
  updateLeaveRequestStatus,
  deleteLeaveRequest,
  getBatchAttendanceHistory,
  getSessionRoster,
} from '../controllers/attendance.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';
import { requireFeature } from '../middleware/featureSwitch.middleware.js';

const router = Router();

// Protect all attendance routes
router.use(authenticateToken);
router.use(requireFeature('attendance'));

// 0. Student mark self attendance present via QR scan or code
router.post('/mark', markSelfAttendanceByCode);
router.get('/scans', getMyAttendanceScans);
router.get('/history-records', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), getBatchAttendanceHistory);
router.get('/session-roster', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR), getSessionRoster);

// Leave Requests Routes
router.get('/leave-requests', getLeaveRequests);
router.post('/leave-requests', createLeaveRequest);
router.put('/leave-requests/:id/status', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR), updateLeaveRequestStatus);
router.patch('/leave-requests/:id/status', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR), updateLeaveRequestStatus);
router.delete('/leave-requests/:id', deleteLeaveRequest);

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
