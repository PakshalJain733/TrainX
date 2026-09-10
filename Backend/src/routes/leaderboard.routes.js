import { Router } from 'express';
import {
  getLeaderboardData,
  getOverallLeaderboardController,
  getDepartmentLeaderboardController,
  getMilestoneLeaderboardController,
  getStudentRankController,
} from '../controllers/leaderboard.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getLeaderboardData);
router.get('/overall', getOverallLeaderboardController);
router.get('/department', getDepartmentLeaderboardController);
router.get('/milestone', getMilestoneLeaderboardController);
router.get('/student/my-rank', getStudentRankController);

export default router;
