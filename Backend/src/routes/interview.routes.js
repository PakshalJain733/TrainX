import { Router } from 'express';
import {
  getInterviewData,
  getInterviewById,
  saveInterviewSession,
  getInterviewLockStatus,
} from '../controllers/interview.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireFeature } from '../middleware/featureSwitch.middleware.js';

const router = Router();
router.use(authenticateToken);
router.use(requireFeature('aiInterviews'));

router.get('/lock-status', getInterviewLockStatus);
router.get('/rate-limit', getInterviewLockStatus);

router.post('/', saveInterviewSession);
router.get('/', getInterviewData);
router.get('/history', getInterviewData);
router.get('/:id', getInterviewById);

export default router;
