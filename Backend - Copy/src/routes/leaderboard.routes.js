import { Router } from 'express';
import { getLeaderboardData } from '../controllers/leaderboard.controller.js';

const router = Router();
router.get('/', getLeaderboardData);

export default router;
