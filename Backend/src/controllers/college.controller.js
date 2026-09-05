import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';
import {
  getAllCollegesModel,
  getCollegeByIdModel,
  createCollegeModel,
  updateCollege,
  deleteCollege,
} from '../models/college.model.js';
import {
  getDepartmentsByCollegeModel,
  getDepartmentByIdModel,
  createDepartmentModel,
  updateDepartment,
  deleteDepartment,
} from '../models/department.model.js';
import {
  getBatchesModel,
  getBatchByIdModel,
  createBatchModel,
  updateBatch,
  deleteBatch,
} from '../models/batch.model.js';

// ─── Colleges ─────────────────────────────────────────────────────────────────

export const getColleges = async (req, res, next) => {
  try {
    const colleges = await getAllCollegesModel();
    return sendSuccess(res, 'Colleges retrieved successfully', colleges);
  } catch (error) {
    next(error);
  }
};

export const getCollegeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const college = await getCollegeByIdModel(id);
    if (!college) {
      return sendError(res, 'College not found', 404);
    }
    return sendSuccess(res, 'College retrieved successfully', college);
  } catch (error) {
    next(error);
  }
};

export const createCollege = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return sendError(res, 'Name and code are required', 400);
    }
    const newCollege = await createCollegeModel({ name, code });
    return sendSuccess(res, 'College created successfully', newCollege, 201);
  } catch (error) {
    next(error);
  }
};

export const addCollege = createCollege;

export const editCollege = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    await updateCollege(req.params.id, name, code);
    return sendSuccess(res, 'College updated successfully');
  } catch (error) {
    next(error);
  }
};

export const removeCollege = async (req, res, next) => {
  try {
    await deleteCollege(req.params.id);
    return sendSuccess(res, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Departments ──────────────────────────────────────────────────────────────

export const getDepartments = async (req, res, next) => {
  try {
    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
    const collegeId = isSuperAdmin ? (req.query.collegeId || null) : req.user.collegeId;
    const departments = await getDepartmentsByCollegeModel(collegeId);
    return sendSuccess(res, 'Departments retrieved successfully', departments);
  } catch (error) {
    next(error);
  }
};

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

export const editDepartment = async (req, res, next) => {
  try {
    const { name, code, college_id } = req.body;
    await updateDepartment(req.params.id, college_id, name, code);
    return sendSuccess(res, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
};

export const removeDepartment = async (req, res, next) => {
  try {
    await deleteDepartment(req.params.id);
    return sendSuccess(res, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Batches ──────────────────────────────────────────────────────────────────

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
    const { name, department_id, year, division, academic_year, college_id, start_year, end_year, status } = req.body;
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
      start_year,
      end_year,
      status,
    });

    return sendSuccess(res, 'Batch created successfully', newBatch, 201);
  } catch (error) {
    next(error);
  }
};

export const editBatch = async (req, res, next) => {
  try {
    const { college_id, department_id, name, academic_year, start_year, end_year, status } = req.body;
    const updated = await updateBatch(req.params.id, { college_id, department_id, name, academic_year, start_year, end_year, status });
    return sendSuccess(res, 'Batch updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const removeBatch = async (req, res, next) => {
  try {
    await deleteBatch(req.params.id);
    return sendSuccess(res, 'Batch deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getCollegeData = getColleges;
