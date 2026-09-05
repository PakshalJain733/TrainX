import { Router } from 'express';
import {
  getBatches,
  getBatchById,
  addBatch,
  editBatch,
  removeBatch,
  joinBatchByCode,
  getMyBatches,
} from '../controllers/batch.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All batch routes require auth
router.use(authenticateToken);

// Student: get only their enrolled batches (before /:id to avoid param conflict)
router.get('/my-batches', getMyBatches);

// Student: join a batch by code
router.post('/join', joinBatchByCode);

router.get('/', getBatches);
router.get('/:id', getBatchById);
router.post('/', addBatch);
router.put('/:id', editBatch);
router.delete('/:id', removeBatch);

export default router;
