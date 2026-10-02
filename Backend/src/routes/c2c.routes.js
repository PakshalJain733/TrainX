import { Router } from 'express';
import {
  handleGoogleFormWebhook,
  getEnrollments,
  updateEnrollmentStatus,
} from '../controllers/c2c.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Public Webhook for Google Forms / Apps Script
router.post('/google-form/webhook', handleGoogleFormWebhook);
router.post('/webhook', handleGoogleFormWebhook);

// Admin-protected enrollment management routes
router.get('/enrollments', authenticateToken, getEnrollments);
router.patch('/enrollments/:id/status', authenticateToken, updateEnrollmentStatus);
router.put('/enrollments/:id/status', authenticateToken, updateEnrollmentStatus);

export default router;
