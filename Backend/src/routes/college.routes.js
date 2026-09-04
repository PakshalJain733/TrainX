import { Router } from 'express';

import {
  getColleges,
  getCollegeById,
  addCollege,
  editCollege,
  removeCollege
} from '../controllers/college.controller.js';

const router = Router();

router.get('/', getColleges);
router.get('/:id', getCollegeById);
router.post('/', addCollege);
router.put('/:id', editCollege);
router.delete('/:id', removeCollege);

export default router;