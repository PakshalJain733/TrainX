import { Router } from 'express';
import { authenticateCareerGatewayService } from './middleware/careerGatewayAuth.middleware.js';
import {
  activationRateLimiter,
  m2mProvisioningRateLimiter,
} from './middleware/careerGatewayRateLimit.middleware.js';
import {
  handleProvisionStudents,
  handleUpdateEligibility,
  handleActivateAccount,
} from './controllers/careerGatewayProvisioning.controller.js';
import {
  getIntegrationStatus,
  handleManualExportTrigger,
} from './controllers/careerGatewayMonitoring.controller.js';
import { authenticateToken } from '../../../middleware/auth.middleware.js';
import { authorizeRoles } from '../../../middleware/role.middleware.js';
import { ROLES } from '../../../utils/constants.js';

const router = Router();

// ============================================================================
// 1. Inbound Service Endpoints (Protected by Career Gateway Service Token & Rate Limiter)
// ============================================================================

// Healthcheck & Probe Endpoints (prevents 404 on GET discovery or health probes)
router.get('/', (req, res) => {
  return res.json({
    success: true,
    message: 'TrainX Career Gateway Integration Service is online and active',
    service: 'trainx-career-gateway-integration',
    endpoints: {
      provisioning: 'POST /students',
      eligibility: 'PATCH /students/:studentId/eligibility',
      activation: 'POST /activate-account',
    },
  });
});

router.get('/health', (req, res) => {
  return res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

router.get('/students', (req, res) => {
  return res.json({
    success: true,
    message: 'TrainX Student Provisioning service is active and ready to receive POST requests with Bearer JWT token.',
    expected_method: 'POST',
    endpoint: '/students',
  });
});

// Provision single or batch students from Career Gateway (SEC-05: burst-tolerant rate limiter)
router.post('/students', m2mProvisioningRateLimiter, authenticateCareerGatewayService, handleProvisionStudents);

// Update or revoke student eligibility (SEC-05: burst-tolerant rate limiter)
router.patch('/students/:studentId/eligibility', m2mProvisioningRateLimiter, authenticateCareerGatewayService, handleUpdateEligibility);

// ============================================================================
// 2. Student Self-Service Account Activation (Public with Activation Token & Strict Rate Limit)
// ============================================================================

// SEC-05: strict rate limiting to prevent bcrypt compute exhaustion attacks
router.post('/activate-account', activationRateLimiter, handleActivateAccount);

// ============================================================================
// 3. Admin Integration Monitoring & Manual Trigger
// ============================================================================

router.get(
  '/monitoring/status',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  getIntegrationStatus
);

router.post(
  '/monitoring/trigger-export',
  authenticateToken,
  authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN),
  handleManualExportTrigger
);

export default router;
