import { Router } from 'express';
import {
  getBatches,
  getBatchById,
  addBatch,
  editBatch,
  removeBatch,
  joinBatchByCode,
  getMyBatches,
  getBatchStudents,
  addBatchTask,
  getBatchTasks,
  removeBatchTask,
  getTaskSubmissions,
} from '../controllers/batch.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All batch routes require auth
router.use(authenticateToken);

// Student: get only their enrolled batches (before /:id to avoid param conflict)
router.get('/my-batches', getMyBatches);

// Student: join a batch by code
router.post('/join', joinBatchByCode);

// Task-specific routes (before /:id)
router.delete('/tasks/:taskId', removeBatchTask);
router.get('/tasks/:taskId/submissions', getTaskSubmissions);

router.get('/', getBatches);
router.get('/:id', getBatchById);
router.post('/', addBatch);
router.put('/:id', editBatch);
router.delete('/:id', removeBatch);

// Batch Students & Tasks routes
router.get('/:id/students', getBatchStudents);
router.get('/:id/tasks', getBatchTasks);
router.post('/:id/tasks', addBatchTask);

export default router;
