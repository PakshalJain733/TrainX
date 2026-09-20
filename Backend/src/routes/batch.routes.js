import { Router } from 'express';
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
} from '../controllers/batch.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getBatches);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), createBatch);
router.put('/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), updateBatch);
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), deleteBatch);

export default router;
