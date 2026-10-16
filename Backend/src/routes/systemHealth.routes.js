import express from 'express';
import {
  getLivenessProbe,
  getReadinessProbe,
  getDetailedSystemHealth,
  getSystemHealthHistory,
} from '../controllers/systemHealth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = express.Router();

// ── Public Health Check Endpoints (Section 3) ──
// Liveness probe: verifies process responsiveness without database dependency
router.get('/live', getLivenessProbe);

// Readiness probe: confirms the application can serve requests, including DB connectivity
router.get('/ready', getReadinessProbe);

// ── Protected Administrative System Health Endpoints ──
// Strictly secured with existing authentication and Super Admin role authorization middleware.
// Students, Mentors, and Coordinators are prevented from accessing detailed system metrics.
router.get('/', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), getDetailedSystemHealth);
router.get('/health', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), getDetailedSystemHealth);
router.get('/history', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), getSystemHealthHistory);

export default router;
