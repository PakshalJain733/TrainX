import { Router } from 'express';
import {
  getLeaderboardData,
  getOverallLeaderboardController,
  getDepartmentLeaderboardController,
  getMilestoneLeaderboardController,
  getStudentRankController,
} from '../controllers/leaderboard.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { requireFeature } from '../middleware/featureSwitch.middleware.js';

const router = Router();

router.use(authenticateToken);
router.use(requireFeature('studentLeaderboard'));

router.get('/', getLeaderboardData);
router.get('/batch', getOverallLeaderboardController);
router.get('/overall', getOverallLeaderboardController);
router.get('/department', getDepartmentLeaderboardController);
router.get('/milestone', getMilestoneLeaderboardController);
router.get('/student/my-rank', getStudentRankController);

export default router;
