import { Router } from 'express';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/department.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getDepartments);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), createDepartment);
router.put('/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), updateDepartment);
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), deleteDepartment);

export default router;
