import express from 'express';
import { runCodeController, submitCodeController } from '../controllers/coding.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Secure coding execution endpoints (require authentication).
 * POST /api/v1/code/run     - execute a single snippet
 * POST /api/v1/code/submit  - evaluate against stored test cases and save
 */
router.post('/run', authenticateToken, runCodeController);
router.post('/submit', authenticateToken, submitCodeController);

export default router;