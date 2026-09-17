import { Router } from 'express';
import {
  getCoordinatorOverview,
  getCoordinatorBatches,
  getCoordinatorStudents,
  getCoordinatorMentors,
  getCoordinatorRequests,
  updateCoordinatorRequestStatus,
  createCoordinatorBroadcast,
} from '../controllers/coordinator.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticateToken);
router.use(authorizeRoles(ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN));

router.get('/overview', getCoordinatorOverview);
router.get('/batches', getCoordinatorBatches);
router.get('/students', getCoordinatorStudents);
router.get('/mentors', getCoordinatorMentors);
router.get('/requests', getCoordinatorRequests);
router.put('/requests/:id', updateCoordinatorRequestStatus);
router.post('/broadcast', createCoordinatorBroadcast);

export default router;
