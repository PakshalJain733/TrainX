import { Router } from 'express';
import {
  getMentorOverview,
  getMentorBatches,
  getMentorStudents,
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
  deleteMentorStudyMaterial,
  getMentorLiveSessions,
  createMentorLiveSession,
  deleteMentorLiveSession,
  getMentorStudentsRoadmaps,
  getMentorStudentSkillGaps,
  getMentorLeaderboard,
  getMentorAssignments,
  getMentorNotifications,
} from '../controllers/mentor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Protect all mentor endpoints with JWT and Mentor / College Admin / Coordinator / Super Admin roles
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.MENTOR, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.SUPER_ADMIN));

// Dashboard / Roster / Batches
router.get('/overview', getMentorOverview);
router.get('/notifications', getMentorNotifications);
router.get('/batches', getMentorBatches);
router.get('/students', getMentorStudents);
router.get('/students/performance', getMentorStudentsPerformance);
router.get('/students/roadmaps', getMentorStudentsRoadmaps);
router.get('/students/skill-gaps', getMentorStudentSkillGaps);

// Leaderboard & Assignments
router.get('/leaderboard', getMentorLeaderboard);
router.get('/assignments', getMentorAssignments);

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
router.delete('/study-materials/:id', deleteMentorStudyMaterial);

// Live Sessions
router.get('/live-sessions', getMentorLiveSessions);
router.post('/live-sessions', createMentorLiveSession);
router.delete('/live-sessions/:id', deleteMentorLiveSession);

export default router;