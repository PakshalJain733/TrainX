import { Router } from 'express';
import {
  getDrives,
  startDrive,
  submitDriveSection,
  createDrive,
  getDriveData,
} from '../controllers/drive.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();
router.use(authenticateToken);

router.get('/', getDrives);
router.post('/create', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), createDrive);
router.post('/:id/start', startDrive);
router.post('/:id/submit-section', submitDriveSection);

export default router;
