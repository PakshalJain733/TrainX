import { Router } from 'express';
import {
  getSkillGapData,
  getMySkillGaps,
  getStudentSkillGapsById,
  triggerRemedialAssignment,
  getRemedialInterventions,
  getAIDiagnostics,
  analyzePerformance,
} from '../controllers/skillGap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Protect all skill-gap endpoints with JWT authentication
router.use(authenticateToken);

/**
 * Route: Get personal skill gap report for logged-in student
 * GET /api/v1/skill-gaps/my-gaps
 */
router.get('/my-gaps', getMySkillGaps);

/**
 * Route: Get list of remedial assignments & interventions
 * GET /api/v1/skill-gaps/remedial
 */
router.get('/remedial', getRemedialInterventions);

/**
 * Route: Get batch-wide skill gaps or current student skill gap
 * GET /api/v1/skill-gaps
 */
router.get('/', getSkillGapData);

/**
 * Route: Get skill gap report for a specific student
 * GET /api/v1/skill-gaps/student/:studentId
 */
router.get(
  '/student/:studentId',
  authorizeRoles(ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getStudentSkillGapsById
);

/**
 * Route: Trigger AI-generated remedial assignment
 * POST /api/v1/skill-gaps/remedial
 */
router.post(
  '/remedial',
  authorizeRoles(ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  triggerRemedialAssignment
);

/**
 * Route: Run live AI diagnostics on a topic
 * POST /api/v1/skill-gaps/diagnostics
 */
router.post(
  '/diagnostics',
  authorizeRoles(ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN),
  getAIDiagnostics
);

/**
 * Route: Analyze performance data
 * POST /api/v1/skill-gaps
 * POST /api/v1/skill-gaps/analyze
 */
router.post('/', analyzePerformance);
router.post('/analyze', analyzePerformance);

export default router;
