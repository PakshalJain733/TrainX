import { Router } from 'express';
import {
  getDrives,
  startDrive,
  submitDriveSection,
  createDrive,
  getDriveData,
} from '../controllers/drive.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);

router.get('/', getDrives);
router.post('/create', createDrive);
router.post('/:id/start', startDrive);
router.post('/:id/submit-section', submitDriveSection);

export default router;
