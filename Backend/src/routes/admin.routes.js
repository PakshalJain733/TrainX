import { Router } from 'express';
import {
  getAdminData,
  getAdminStats,
  getAdminUsers,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
} from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Priority 1: Protect Admin API with authenticateToken & authorizeRoles
router.use(authenticateToken);
router.use(authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN));

router.get('/', getAdminData);
router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.post('/users', createUserAdmin);
router.put('/users/:id', updateUserAdmin);
router.delete('/users/:id', deleteUserAdmin);

export default router;
