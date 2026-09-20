import { Router } from 'express';
import {
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege,
} from '../controllers/college.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getColleges);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN), createCollege);
router.put('/:id', authorizeRoles(ROLES.SUPER_ADMIN), updateCollege);
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN), deleteCollege);

export default router;
