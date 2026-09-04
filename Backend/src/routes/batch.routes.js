import { Router } from 'express';
import {
  getBatches,
  getBatchById,
  addBatch,
  editBatch,
  removeBatch
} from '../controllers/batch.controller.js';

const router = Router();

router.get('/', getBatches);
router.get('/:id', getBatchById);
router.post('/', addBatch);
router.put('/:id', editBatch);
router.delete('/:id', removeBatch);

export default router;
