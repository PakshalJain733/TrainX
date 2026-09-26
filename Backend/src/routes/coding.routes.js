import express from 'express';
import { runCodeController, submitCodeController, mySubmissionsController } from '../controllers/coding.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Secure coding execution endpoints (require authentication).
 * POST /api/v1/code/run             - execute a single snippet
 * POST /api/v1/code/submit          - evaluate against stored test cases and save
 * GET  /api/v1/code/submissions/my  - get authenticated student's own submissions
 */
router.post('/run', authenticateToken, runCodeController);
router.post('/submit', authenticateToken, submitCodeController);
router.get('/submissions/my', authenticateToken, mySubmissionsController);

export default router;