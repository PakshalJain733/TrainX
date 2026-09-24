import express from 'express';
import { getSystemHealthMetrics } from '../controllers/systemHealth.controller.js';

const router = express.Router();

router.get('/', getSystemHealthMetrics);

export default router;
