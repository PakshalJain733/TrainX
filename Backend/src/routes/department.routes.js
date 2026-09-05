import { Router } from 'express';

import {
    getDepartments,
    getDepartmentById,
    addDepartment,
    editDepartment,
    removeDepartment
} from '../controllers/department.controller.js';

const router = Router();

router.get('/', getDepartments);
router.get('/:id', getDepartmentById);
router.post('/', addDepartment);
router.put('/:id', editDepartment);
router.delete('/:id', removeDepartment);

export default router;