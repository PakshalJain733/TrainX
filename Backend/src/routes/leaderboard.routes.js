import { Router } from 'express';
import { getLeaderboardData } from '../controllers/leaderboard.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticateToken);
router.get('/', getLeaderboardData);

export default router;
