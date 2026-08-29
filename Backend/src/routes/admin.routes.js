import { Router } from 'express';
import { getAdminData } from '../controllers/admin.controller.js';

const router = Router();
router.get('/', getAdminData);

export default router;
