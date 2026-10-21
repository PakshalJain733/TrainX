import { Router } from 'express';
import {
  getCoordinatorOverview,
  getCoordinatorBatches,
  getCoordinatorStudents,
  getCoordinatorMentors,
  createCoordinatorMentor,
  getCoordinatorMentorStudents,
  getCoordinatorRequests,
  updateCoordinatorRequestStatus,
  createCoordinatorBroadcast,
  getCoordinatorSkillGaps,
  getCoordinatorWeeklyReports,
  getCoordinatorLiveSessions,
  createCoordinatorLiveSession,
  getCoordinatorNotifications,
  getCoordinatorSupportTickets,
  createCoordinatorSupportTicket,
  updateCoordinatorSupportTicket,
  escalateCoordinatorSupportTicket,
} from '../controllers/coordinator.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN));

import {
  getAdminPracticeProblems,
  createAdminPracticeProblem,
  deleteAdminPracticeProblem,
  generateAIPracticeProblemController,
} from '../controllers/admin.controller.js';

router.get('/overview', getCoordinatorOverview);
router.get('/batches', getCoordinatorBatches);
router.get('/students', getCoordinatorStudents);
router.get('/mentors', getCoordinatorMentors);
router.post('/mentors', createCoordinatorMentor);
router.get('/mentors/:id/students', getCoordinatorMentorStudents);
router.get('/requests', getCoordinatorRequests);
router.put('/requests/:id', updateCoordinatorRequestStatus);
router.post('/broadcast', createCoordinatorBroadcast);
router.get('/skill-gaps', getCoordinatorSkillGaps);
router.get('/weekly-reports', getCoordinatorWeeklyReports);
router.get('/live-sessions', getCoordinatorLiveSessions);
router.post('/live-sessions', createCoordinatorLiveSession);
router.get('/notifications', getCoordinatorNotifications);
router.get('/practice-problems', getAdminPracticeProblems);
router.post('/practice-problems', createAdminPracticeProblem);
router.post('/practice-problems/generate-ai', generateAIPracticeProblemController);
router.delete('/practice-problems/:id', deleteAdminPracticeProblem);

// Coordinator Support Tickets & Escalation to College Admin
router.get('/support/tickets', getCoordinatorSupportTickets);
router.post('/support/tickets', createCoordinatorSupportTicket);
router.put('/support/tickets/:id', updateCoordinatorSupportTicket);
router.post('/support/tickets/:id/escalate', escalateCoordinatorSupportTicket);

export default router;
