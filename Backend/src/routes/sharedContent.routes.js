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

// POST /api/v1/shared-content          → create or update an item
router.post('/', (req, res, next) => {
  if (req.body?.type === 'maintenance') {
    return addSharedContent(req, res, next);
  }
  return authenticateToken(req, res, () => addSharedContent(req, res, next));
});

// DELETE /api/v1/shared-content/:id    → delete an item
router.delete('/:id', authenticateToken, removeSharedContent);

export default router;
