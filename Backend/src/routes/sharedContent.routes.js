import { Router } from 'express';
import {
  getSharedContent,
  addSharedContent,
  removeSharedContent,
} from '../controllers/sharedContent.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

// GET  /api/v1/shared-content          → all items
// GET  /api/v1/shared-content?type=X   → filtered by type (quiz|coding|drive|learning|broadcast)
router.get('/', getSharedContent);

// POST /api/v1/shared-content          → create an item
router.post('/', addSharedContent);

// DELETE /api/v1/shared-content/:id    → delete an item
router.delete('/:id', removeSharedContent);

export default router;
