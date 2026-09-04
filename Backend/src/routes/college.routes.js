import { Router } from 'express';
import {
  getColleges,
  getCollegeById,
  createCollege,
  addCollege,
  editCollege,
  removeCollege,
  getDepartments,
  createDepartment,
  editDepartment,
  removeDepartment,
  getBatches,
  createBatch,
  editBatch,
  removeBatch,
} from '../controllers/college.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticateToken);

// ─── Colleges ─────────────────────────────────────────────────────────────────
router.get('/', getColleges);
router.get('/list', getColleges);
router.post('/', authorizeRoles(ROLES.SUPER_ADMIN), createCollege);
router.put('/:id', authorizeRoles(ROLES.SUPER_ADMIN), editCollege);
router.delete('/:id', authorizeRoles(ROLES.SUPER_ADMIN), removeCollege);

// ─── Departments ──────────────────────────────────────────────────────────────
router.get('/departments', getDepartments);
router.post('/departments', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), createDepartment);
router.put('/departments/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), editDepartment);
router.delete('/departments/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN), removeDepartment);

// ─── Batches ──────────────────────────────────────────────────────────────────
router.get('/batches', getBatches);
router.post('/batches', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), createBatch);
router.put('/batches/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), editBatch);
router.delete('/batches/:id', authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR), removeBatch);

// ─── College by ID (must come after named routes) ─────────────────────────────
router.get('/:id', getCollegeById);

export default router;