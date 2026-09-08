import { Router } from 'express';
import { getDriveData } from '../controllers/drive.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', getDriveData);

export default router;
