import { Router } from 'express';
import {
  getBatches,
  createBatch,
  updateBatch,
  deleteBatch,
} from '../controllers/batch.controller.js';

const router = Router();

router.get('/', getBatches);
router.post('/', createBatch);
router.put('/:id', updateBatch);
router.delete('/:id', deleteBatch);

export default router;
