import { Router } from 'express';
import {
  getMentorOverview,
  getMentorBatches,
  getMentorLeaderboard,
  getMentorDefaulters,
  getMentorStudentsPerformance,
  getMentorWeeklyReports,
  getMentorAssignments,
  createMentorAssignment,
  deleteMentorAssignment,
  getMentorProfile,
  getMentorAttendanceBatches,
  saveMentorAttendance,
  getLiveSessions,
  createLiveSession,
  deleteLiveSession,
  getStudyMaterials,
  createStudyMaterial,
  deleteStudyMaterial,
  getMentorNotifications,
} from '../controllers/mentor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';
import { upload } from '../utils/s3Upload.js';

const router = Router();

router.use(authenticateToken);

// Mentor-scoped data: students, batches and analytics are always resolved from
// `mentor_student_assignments` for the authenticated mentor.
const mentorOnly = authorizeRoles(ROLES.MENTOR);

router.get('/overview', mentorOnly, getMentorOverview);
router.get('/batches', mentorOnly, getMentorBatches);
router.get('/leaderboard', mentorOnly, getMentorLeaderboard);
router.get('/defaulters', mentorOnly, getMentorDefaulters);
router.get('/students/performance', mentorOnly, getMentorStudentsPerformance);
router.get('/weekly-reports', mentorOnly, getMentorWeeklyReports);
router.get('/profile', mentorOnly, getMentorProfile);

router.get('/assignments', mentorOnly, getMentorAssignments);
router.post('/assignments', mentorOnly, createMentorAssignment);
router.delete('/assignments/:id', mentorOnly, deleteMentorAssignment);

router.get('/attendance/batches', mentorOnly, getMentorAttendanceBatches);
router.post('/attendance/save', mentorOnly, saveMentorAttendance);

// Live sessions are owned by the mentor who created them.
router.get('/live-sessions', mentorOnly, getLiveSessions);
router.post('/live-sessions', mentorOnly, createLiveSession);
router.delete('/live-sessions/:id', mentorOnly, deleteLiveSession);

// Study materials are shared library content consumed by the mentor workspace,
// the college admin learning-content page and the student learning page.
const materialsAccess = authorizeRoles(ROLES.MENTOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN, ROLES.STUDENT);
const materialsWrite = authorizeRoles(ROLES.MENTOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN);

router.get('/materials', materialsAccess, getStudyMaterials);
router.get('/study-materials', materialsAccess, getStudyMaterials);
router.post('/materials', materialsWrite, upload.single('file'), createStudyMaterial);
router.post('/study-materials', materialsWrite, upload.single('file'), createStudyMaterial);
router.delete('/materials/:id', materialsWrite, deleteStudyMaterial);
router.delete('/study-materials/:id', materialsWrite, deleteStudyMaterial);

router.get('/notifications', mentorOnly, getMentorNotifications);

export default router;
