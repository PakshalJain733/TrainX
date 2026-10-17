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

// Root health endpoint: If called by authenticated Super Admin, provides detailed system metrics.
// If unauthenticated or standard monitoring probe (Render, uptime check), returns readiness probe.
const handleRootHealth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, () => {
      if (req.user && req.user.role === ROLES.SUPER_ADMIN) {
        return getDetailedSystemHealth(req, res, next);
      }
      return getReadinessProbe(req, res, next);
    });
  }
  return getReadinessProbe(req, res, next);
};

router.get('/', handleRootHealth);
router.get('/health', handleRootHealth);
router.get('/detailed', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), getDetailedSystemHealth);
router.get('/history', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), getSystemHealthHistory);

export default router;
