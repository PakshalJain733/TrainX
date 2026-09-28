import { Router } from 'express';
import {
  getSharedContent,
  addSharedContent,
  removeSharedContent,
} from '../controllers/sharedContent.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// GET  /api/v1/shared-content?type=maintenance is accessible without forcing 401
router.get('/', (req, res, next) => {
  if (req.query.type === 'maintenance') {
    return getSharedContent(req, res, next);
  }
  return authenticateToken(req, res, () => getSharedContent(req, res, next));
});

router.use(authenticateToken);

// POST /api/v1/shared-content          → create an item
router.post('/', addSharedContent);

// DELETE /api/v1/shared-content/:id    → delete an item
router.delete('/:id', removeSharedContent);

export default router;
