import { Router } from 'express';
import { getInterventionData } from '../controllers/intervention.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', getInterventionData);

export default router;
