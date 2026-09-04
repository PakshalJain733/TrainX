<<<<<<< HEAD
import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';
import {
  getAllCollegesModel,
  getCollegeByIdModel,
  createCollegeModel,
} from '../models/college.model.js';
import {
  getDepartmentsByCollegeModel,
  getDepartmentByIdModel,
  createDepartmentModel,
} from '../models/department.model.js';
import {
  getBatchesModel,
  getBatchByIdModel,
  createBatchModel,
} from '../models/batch.model.js';

export const getColleges = async (req, res, next) => {
  try {
    const colleges = await getAllCollegesModel();
=======
import {
  findColleges,
  findCollegeById,
  createCollege,
  updateCollege,
  deleteCollege
} from '../models/college.model.js';

import { sendSuccess } from '../utils/response.js';

// Get all colleges
export const getColleges = async (req, res, next) => {
  try {
    const colleges = await findColleges();
>>>>>>> Pakshal
    return sendSuccess(res, 'Colleges retrieved successfully', colleges);
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
export const getCollegeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const college = await getCollegeByIdModel(id);
    if (!college) {
      return sendError(res, 'College not found', 404);
    }
=======
// Get one college
export const getCollegeById = async (req, res, next) => {
  try {
    const college = await findCollegeById(req.params.id);

    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }

>>>>>>> Pakshal
    return sendSuccess(res, 'College retrieved successfully', college);
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
export const createCollege = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return sendError(res, 'Name and code are required', 400);
    }
    const newCollege = await createCollegeModel({ name, code });
    return sendSuccess(res, 'College created successfully', newCollege, 201);
=======
// Create college
export const addCollege = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    const college = await createCollege(name, code);
    return sendSuccess(res, 'College created successfully', college);
>>>>>>> Pakshal
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
export const getDepartments = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
    const collegeId = isSuperAdmin ? (req.query.collegeId || null) : req.user.collegeId;
    const departments = await getDepartmentsByCollegeModel(collegeId);
    return sendSuccess(res, 'Departments retrieved successfully', departments);
=======
// Update college
export const editCollege = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    await updateCollege(req.params.id, name, code);

    return sendSuccess(res, 'College updated successfully');
>>>>>>> Pakshal
  } catch (error) {
    next(error);
  }
};

<<<<<<< HEAD
export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, college_id } = req.body;
    if (!name || !code) {
      return sendError(res, 'Department name and code are required', 400);
    }

    let targetCollegeId = req.user.collegeId;
    if (req.user.role === ROLES.SUPER_ADMIN && college_id) {
      targetCollegeId = parseInt(college_id, 10);
    }

    const newDept = await createDepartmentModel({
      college_id: targetCollegeId,
      name,
      code,
    });

    return sendSuccess(res, 'Department created successfully', newDept, 201);
  } catch (error) {
    next(error);
  }
};

export const getBatches = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
    const collegeId = isSuperAdmin ? (req.query.collegeId || null) : req.user.collegeId;
    const departmentId = req.query.departmentId || null;

    const batches = await getBatchesModel({ collegeId, departmentId });
    return sendSuccess(res, 'Batches retrieved successfully', batches);
  } catch (error) {
    next(error);
  }
};

export const createBatch = async (req, res, next) => {
  try {
    const { name, department_id, year, division, academic_year, college_id } = req.body;
    if (!name || !department_id) {
      return sendError(res, 'Batch name and department_id are required', 400);
    }

    let targetCollegeId = req.user.collegeId;
    if (req.user.role === ROLES.SUPER_ADMIN && college_id) {
      targetCollegeId = parseInt(college_id, 10);
    }

    // Verify department belongs to the college
    const dept = await getDepartmentByIdModel(department_id);
    if (!dept || (dept.college_id !== targetCollegeId && req.user.role !== ROLES.SUPER_ADMIN)) {
      return sendError(res, 'Invalid department for this college', 400);
    }

    const newBatch = await createBatchModel({
      college_id: targetCollegeId,
      department_id,
      name,
      year,
      division,
      academic_year,
    });

    return sendSuccess(res, 'Batch created successfully', newBatch, 201);
  } catch (error) {
    next(error);
  }
};

export const getCollegeData = getColleges;
=======
// Delete college
export const removeCollege = async (req, res, next) => {
  try {
    await deleteCollege(req.params.id);

    return sendSuccess(res, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};
>>>>>>> Pakshal
