import { Router } from 'express';
import {
  getInterventionData,
  logInterventionController,
  getStudentInterventionStatusController,
  getMentorDefaulterQueueController,
  getCoordinatorDefaulterQueueController,
  getAdminDefaultersController,
} from '../controllers/intervention.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(authenticateToken);

const staffRoles = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR);

router.get('/', getInterventionData);
router.post('/log', staffRoles, logInterventionController);
router.get('/student/my-status', getStudentInterventionStatusController);
router.get('/mentor', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.MENTOR), getMentorDefaulterQueueController);
router.get('/coordinator', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COORDINATOR), getCoordinatorDefaulterQueueController);
router.get('/admin', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), getAdminDefaultersController);

export default router;
