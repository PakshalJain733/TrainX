import { Router } from 'express';
import {
  getMyNotifications,
  postNotification,
  markAsRead,
  markAllAsRead,
  deleteMyNotification,
  clearAllMyNotifications,
} from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All notification endpoints require authenticated user
router.use(authenticateToken);

router.get('/', getMyNotifications);
router.post('/', postNotification);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/clear-all', clearAllMyNotifications);
router.delete('/:id', deleteMyNotification);

export default router;

