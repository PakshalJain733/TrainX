import { Router } from 'express';
import { getDriveData } from '../controllers/drive.controller.js';

const router = Router();
router.get('/', getDriveData);

export default router;
