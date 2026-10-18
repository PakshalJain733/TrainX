import { Router } from 'express';
import {
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege,
} from '../controllers/college.controller.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

// Publicly readable for student registration and domain validation (returns all active colleges if unauthenticated, or filters by role if authenticated)
router.get('/', optionalAuthenticateToken, getColleges);

// Strictly protected management routes for Super Admin
router.post('/', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), createCollege);
router.put('/:id', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), updateCollege);
router.delete('/:id', authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN), deleteCollege);

export default router;
