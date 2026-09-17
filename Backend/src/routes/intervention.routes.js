import { Router } from 'express';
import {
  getInterventions,
  createIntervention,
  updateIntervention,
  getDefaulters,
} from '../controllers/intervention.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(authenticateToken);

router.get('/', getInterventions);
router.get('/defaulters', authorizeRoles(ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN), getDefaulters);
router.post('/', authorizeRoles(ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN), createIntervention);
router.put('/:id', authorizeRoles(ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN), updateIntervention);

export default router;
