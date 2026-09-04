import { Router } from 'express';
<<<<<<< HEAD
import {
  getColleges,
  getCollegeById,
  createCollege,
  getDepartments,
  createDepartment,
  getBatches,
  createBatch,
} from '../controllers/college.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticateToken);

// Colleges
router.get('/', getColleges);
router.get('/list', getColleges);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN), createCollege);

// Departments
router.get('/departments', getDepartments);
router.post('/departments', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), createDepartment);

// Batches
router.get('/batches', getBatches);
router.post('/batches', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), createBatch);

router.get('/:id', getCollegeById);
=======

import {
  getColleges,
  getCollegeById,
  addCollege,
  editCollege,
  removeCollege
} from '../controllers/college.controller.js';

const router = Router();
>>>>>>> Pakshal

router.get('/', getColleges);
router.get('/:id', getCollegeById);
router.post('/', addCollege);
router.put('/:id', editCollege);
router.delete('/:id', removeCollege);

export default router;