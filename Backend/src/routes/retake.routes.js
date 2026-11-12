import express from 'express';
import {
  getRetakesByTarget,
  getEligibleStudentsForRetake,
  grantRetake,
  revokeRetake,
  checkStudentRetakeStatus,
} from '../controllers/retake.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

const staffOrAdmin = authorizeRoles(
  ROLES.SUPER_ADMIN,
  ROLES.COLLEGE_ADMIN,
  ROLES.TRAINER,
  ROLES.MENTOR,
  ROLES.COORDINATOR
);

// Admin / Staff endpoints
router.get('/', authenticateToken, staffOrAdmin, getRetakesByTarget);
router.get('/eligible-students', authenticateToken, staffOrAdmin, getEligibleStudentsForRetake);
router.post('/grant', authenticateToken, staffOrAdmin, grantRetake);
router.post('/revoke', authenticateToken, staffOrAdmin, revokeRetake);

// Student / Self endpoint to verify if retake is active
router.get('/status', authenticateToken, checkStudentRetakeStatus);

export default router;

