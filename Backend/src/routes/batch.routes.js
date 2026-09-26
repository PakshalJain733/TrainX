import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
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
  deleteBatchTask,
  getBatchById,
} from '../controllers/batch.controller.js';

const router = Router();
router.use(authenticateToken);

router.get('/', getBatches);
router.post('/', createBatch);
router.post('/join', joinBatch);
router.get('/my-batches', getMyBatches);
router.get('/:id/students', getBatchStudents);
router.get('/tasks/detail/:taskId', getTaskById);
router.get('/:id/tasks', getBatchTasks);
router.post('/:id/tasks', createBatchTask);
router.delete('/tasks/:taskId', deleteBatchTask);
router.get('/:id', getBatchById);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

export default router;


