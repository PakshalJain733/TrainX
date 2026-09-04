import { Router } from 'express';
import { getInterventionData } from '../controllers/intervention.controller.js';

const router = Router();
router.get('/', getInterventionData);

export default router;
