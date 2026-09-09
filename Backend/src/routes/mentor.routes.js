import { Router } from 'express';
import {
  getMentorStudentsPerformance,
  getMentorAttendanceBatches,
  saveMentorAttendance,
  getLiveSessions,
  createLiveSession,
  deleteLiveSession,
  getStudyMaterials,
  createStudyMaterial,
  deleteStudyMaterial
} from '../controllers/mentor.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/students/performance', getMentorStudentsPerformance);
router.get('/attendance/batches', getMentorAttendanceBatches);
router.post('/attendance/save', saveMentorAttendance);

// Live Sessions
router.get('/live-sessions', getLiveSessions);
router.post('/live-sessions', createLiveSession);
router.delete('/live-sessions/:id', deleteLiveSession);

import { upload } from '../utils/s3Upload.js';

// Study Materials
router.get('/materials', getStudyMaterials);
router.post('/materials', upload.single('file'), createStudyMaterial);
router.delete('/materials/:id', deleteStudyMaterial);

export default router;

