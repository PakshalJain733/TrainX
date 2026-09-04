import { Router } from 'express';
import {
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege,
} from '../controllers/college.controller.js';

const router = Router();

router.get('/', getColleges);
router.post('/', createCollege);
router.put('/:id', updateCollege);
router.delete('/:id', deleteCollege);

export default router;
