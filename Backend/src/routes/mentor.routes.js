import { Router } from 'express';
import {
  getMentorOverview,
  getMentorBatches,
  getMentorBatchDetails,
  saveMentorSubmissionFeedback,
  getMentorLeaderboard,
  getMentorDefaulters,
  getMentorStudentsPerformance,
  getMentorWeeklyReports,
  submitMentorWeeklyReport,
  getMentorDirectory,
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
  getMentorMenteeInterviews,
  getMentorSupportTickets,
  createMentorSupportTicket,
  updateMentorSupportTicket,
  escalateMentorSupportTicket,
  updateMentorProfile,
} from '../controllers/mentor.controller.js';
import {
  getAdminPracticeProblems,
  createAdminPracticeProblem,
  updateAdminPracticeProblem,
  deleteAdminPracticeProblem,
  generateAIPracticeProblemController,
} from '../controllers/admin.controller.js';
import {
  getAllCodingSubmissionsAdmin,
  updateSubmissionFeedbackController,
} from '../controllers/codingSubmission.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';
import { upload } from '../utils/s3Upload.js';

const router = Router();

router.use(authenticateToken);

// Mentor-scoped data: students, batches and analytics are always resolved from
const mentorOnly = authorizeRoles(ROLES.MENTOR, ROLES.SUPER_ADMIN);

router.get('/overview', mentorOnly, getMentorOverview);
router.get('/batches', mentorOnly, getMentorBatches);
router.get('/batches/:batchId/details', mentorOnly, getMentorBatchDetails);
router.post('/submissions/:submissionId/feedback', mentorOnly, saveMentorSubmissionFeedback);
router.get('/leaderboard', mentorOnly, getMentorLeaderboard);
router.get('/defaulters', mentorOnly, getMentorDefaulters);
router.get('/students', mentorOnly, getMentorStudentsPerformance);
router.get('/students/performance', mentorOnly, getMentorStudentsPerformance);
router.get('/weekly-reports', mentorOnly, getMentorWeeklyReports);
router.post('/weekly-reports', mentorOnly, submitMentorWeeklyReport);
router.get('/mentors-list', mentorOnly, getMentorDirectory);
router.get('/interviews', mentorOnly, getMentorMenteeInterviews);
router.get('/profile', mentorOnly, getMentorProfile);
router.put('/profile', mentorOnly, updateMentorProfile);
router.patch('/profile', mentorOnly, updateMentorProfile);

// Mentor Coding Practice Problems Management (just like Admin)
router.get('/practice-problems', mentorOnly, getAdminPracticeProblems);
router.post('/practice-problems', mentorOnly, createAdminPracticeProblem);
router.put('/practice-problems/:id', mentorOnly, updateAdminPracticeProblem);
router.delete('/practice-problems/:id', mentorOnly, deleteAdminPracticeProblem);
router.post('/practice-problems/generate-ai', mentorOnly, generateAIPracticeProblemController);
router.get('/practice-problems/submissions', mentorOnly, getAllCodingSubmissionsAdmin);
router.patch('/practice-problems/submissions/:id/feedback', mentorOnly, updateSubmissionFeedbackController);
router.post('/practice-problems/submissions/:id/feedback', mentorOnly, updateSubmissionFeedbackController);

router.get('/assignments', mentorOnly, getMentorAssignments);
router.post('/assignments', mentorOnly, createMentorAssignment);
router.delete('/assignments/:id', mentorOnly, deleteMentorAssignment);

router.get('/attendance/batches', mentorOnly, getMentorAttendanceBatches);
router.post('/attendance/save', mentorOnly, saveMentorAttendance);

// Live sessions are owned by the mentor who created them; assigned students can read.
const liveSessionsAccess = authorizeRoles(ROLES.MENTOR, ROLES.SUPER_ADMIN, ROLES.STUDENT);
router.get('/live-sessions', liveSessionsAccess, getLiveSessions);
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

// Mentor Support Tickets & Escalation to College Admin
router.get('/support/tickets', mentorOnly, getMentorSupportTickets);
router.post('/support/tickets', mentorOnly, createMentorSupportTicket);
router.put('/support/tickets/:id', mentorOnly, updateMentorSupportTicket);
router.post('/support/tickets/:id/escalate', mentorOnly, escalateMentorSupportTicket);

export default router;
