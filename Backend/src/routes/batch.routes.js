import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  joinBatch,
  getMyBatches,
  getBatchStudents,
  getBatchTasks,
  getTaskById,
  createBatchTask,
  updateBatchTask,
  deleteBatchTask,
  getBatchById,
  getBatchDailyTopics,
  saveBatchDailyTopic,
  getTaskSubmissions,
} from '../controllers/batch.controller.js';

const router = Router();
router.use(authenticateToken);

const batchManager = authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.TRAINER);

router.get('/', getBatches);
router.post('/', batchManager, createBatch);
router.post('/join', joinBatch);
router.get('/my-batches', getMyBatches);
router.get('/:id/students', getBatchStudents);
router.get('/:id/daily-topics', getBatchDailyTopics);
router.post('/:id/daily-topics', batchManager, saveBatchDailyTopic);
router.get('/tasks/detail/:taskId', getTaskById);
router.get('/tasks/:taskId/submissions', getTaskSubmissions);
router.get('/:id/tasks/:taskId/submissions', getTaskSubmissions);
router.get('/:id/tasks', getBatchTasks);
router.post('/:id/tasks', createBatchTask);
router.put('/:id/tasks/:taskId', updateBatchTask);
router.put('/tasks/:taskId', updateBatchTask);
router.delete('/:id/tasks/:taskId', deleteBatchTask);
router.delete('/tasks/:taskId', deleteBatchTask);
router.get('/:id', getBatchById);
router.put('/:id', batchManager, updateBatch);
router.delete('/:id', batchManager, deleteBatch);

export default router;
