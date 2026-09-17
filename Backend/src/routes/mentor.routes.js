import { Router } from 'express';
import {
  getMentorStudentsPerformance,
  getMentorAttendanceBatches,
  saveMentorAttendance,
  getMentorDefaulters,
  createMentorIntervention,
  getMentorInterventions,
  getMentorWeeklyReports,
  createMentorWeeklyReport,
  getMentorStudyMaterials,
  createMentorStudyMaterial,
  getMentorLiveSessions,
  createMentorLiveSession,
} from '../controllers/mentor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Protect all mentor endpoints with JWT and Mentor / College Admin / Super Admin roles
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.MENTOR, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.SUPER_ADMIN));

// Performance
router.get('/students/performance', getMentorStudentsPerformance);

// Attendance
router.get('/attendance/batches', getMentorAttendanceBatches);
router.post('/attendance/save', saveMentorAttendance);

// Defaulters & Interventions
router.get('/defaulters', getMentorDefaulters);
router.get('/interventions', getMentorInterventions);
router.post('/interventions', createMentorIntervention);

// Weekly Reports
router.get('/weekly-reports', getMentorWeeklyReports);
router.post('/weekly-reports', createMentorWeeklyReport);

// Study Materials
router.get('/study-materials', getMentorStudyMaterials);
router.post('/study-materials', createMentorStudyMaterial);

// Live Sessions
router.get('/live-sessions', getMentorLiveSessions);
router.post('/live-sessions', createMentorLiveSession);

export default router;
