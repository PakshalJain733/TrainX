import { Router } from 'express';
import {
  getSharedContent,
  addSharedContent,
  removeSharedContent,
} from '../controllers/sharedContent.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
const superAdminOnly = [authenticateToken, authorizeRoles(ROLES.SUPER_ADMIN)];

// GET /api/v1/shared-content?type=maintenance is accessible for system status checks
router.get('/', (req, res, next) => {
  if (req.query.type === 'maintenance') {
    return getSharedContent(req, res, next);
  }
  return authenticateToken(req, res, () => getSharedContent(req, res, next));
});

// POST /api/v1/shared-content -> create or update an item (Super Admin only for maintenance / shared items)
router.post('/', superAdminOnly, addSharedContent);

// DELETE /api/v1/shared-content/:id -> delete an item (Super Admin only)
router.delete('/:id', superAdminOnly, removeSharedContent);

export default router;
