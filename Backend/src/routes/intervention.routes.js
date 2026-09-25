import { Router } from 'express';
import {
  getInterventionData,
  logInterventionController,
  getStudentInterventionStatusController,
  getMentorDefaulterQueueController,
  getCoordinatorDefaulterQueueController,
  getAdminDefaultersController,
  sendWarningController
} from '../controllers/intervention.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getInterventionData);
router.post('/log', logInterventionController);
router.post('/warn', sendWarningController);
router.get('/student/my-status', getStudentInterventionStatusController);
router.get('/mentor', getMentorDefaulterQueueController);
router.get('/coordinator', getCoordinatorDefaulterQueueController);
router.get('/admin', getAdminDefaultersController);

export default router;
