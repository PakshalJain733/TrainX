import { Router } from 'express';
import {
  handleGoogleFormWebhook,
  getEnrollments,
  updateEnrollmentStatus,
} from '../controllers/c2c.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Public Webhook for Google Forms / Apps Script
router.post('/google-form/webhook', handleGoogleFormWebhook);
router.post('/webhook', handleGoogleFormWebhook);

// Admin-protected enrollment management routes (ADMIN-ONLY)
router.get('/enrollments', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), getEnrollments);
router.patch('/enrollments/:id/status', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), updateEnrollmentStatus);
router.put('/enrollments/:id/status', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), updateEnrollmentStatus);

export default router;
