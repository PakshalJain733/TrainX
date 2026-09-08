import { Router } from 'express';
import { getSkillGapData, analyzePerformance } from '../controllers/skillGap.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all routes with JWT authentication
router.use(authenticateToken);

// GET /api/v1/skill-gaps - Get skill gap for current student
router.get('/', getSkillGapData);

// GET /api/v1/skill-gaps/student/:studentId - Get skill gap for specific student
router.get('/student/:studentId', getSkillGapData);

// POST /api/v1/skill-gaps - Analyze performance data
router.post('/', analyzePerformance);

// POST /api/v1/skill-gaps/analyze - Analyze performance data
router.post('/analyze', analyzePerformance);

export default router;
