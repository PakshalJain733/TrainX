import { Router } from 'express';
import {
  getAdminData,
  getAdminStats,
  getAdminUsers,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/', getAdminData);
router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.post('/users', createUserAdmin);
router.put('/users/:id', updateUserAdmin);
router.delete('/users/:id', deleteUserAdmin);

export default router;

