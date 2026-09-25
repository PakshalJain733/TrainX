import { Router } from 'express';
import {
  getAdminData,
  getAdminStats,
  getAdminUsers,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  getAdminPracticeProblems,
  createAdminPracticeProblem,
  deleteAdminPracticeProblem,
  getAdminProfile,
  updateAdminProfile,
  getAdminBroadcasts,
  createAdminBroadcast,
  deleteAdminBroadcast,
  getAdminPerformance,
  assignMentorToStudents,
  getMentorAssignments,
} from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Protect Admin API with authenticateToken & authorizeRoles
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN));

router.get('/', getAdminData);
router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.post('/users', createUserAdmin);
router.put('/users/:id', updateUserAdmin);
router.delete('/users/:id', deleteUserAdmin);

// Admin Profile
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

// Coding Tasks / Practice Problems
router.get('/practice-problems', getAdminPracticeProblems);
router.post('/practice-problems', createAdminPracticeProblem);
router.delete('/practice-problems/:id', deleteAdminPracticeProblem);

// Broadcast Notifications Center
router.get('/broadcast', getAdminBroadcasts);
router.post('/broadcast', createAdminBroadcast);
router.delete('/broadcast/:id', deleteAdminBroadcast);

// Performance Analysis
router.get('/performance', getAdminPerformance);

// Faculty Mentor Assignment Routes
router.post('/assign-mentor', assignMentorToStudents);
router.get('/assign-mentor', getMentorAssignments);

export default router;
