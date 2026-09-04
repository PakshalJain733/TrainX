import {
  findBatches,
  findBatchesByCollege,
  findBatchesByDepartment,
  findBatchById,
  createBatch,
  updateBatch,
  deleteBatch
} from '../models/batch.model.js';
import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';

// GET /api/v1/batches  OR  ?college_id=  OR  ?department_id=
export const getBatches = async (req, res, next) => {
  try {
    let batches;
    if (req.query.college_id) {
      batches = await findBatchesByCollege(req.query.college_id);
    } else if (req.query.department_id) {
      batches = await findBatchesByDepartment(req.query.department_id);
    } else {
      batches = await findBatches();
    }
    return sendSuccess(res, 'Batches retrieved successfully', batches);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/batches/:id
export const getBatchById = async (req, res, next) => {
  try {
    const batch = await findBatchById(req.params.id);
    if (!batch) {
      return sendError(res, 'Batch not found', 404);
    }
    return sendSuccess(res, 'Batch retrieved successfully', batch);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/batches
export const addBatch = async (req, res, next) => {
  try {
    const { college_id, department_id, name, academic_year, start_year, end_year, status } = req.body;

    if (!college_id || !department_id || !name) {
      return sendError(res, 'college_id, department_id, and name are required', 400);
    }

    // Validate college exists
    const colleges = await query('SELECT id FROM colleges WHERE id = ?', [college_id]);
    if (!colleges.length) {
      return sendError(res, `College with id ${college_id} does not exist`, 400);
    }

    // Validate department exists and belongs to college
    const departments = await query('SELECT id FROM departments WHERE id = ? AND college_id = ?', [department_id, college_id]);
    if (!departments.length) {
      return sendError(res, `Department with id ${department_id} does not exist or does not belong to college ${college_id}`, 400);
    }

    const batch = await createBatch({ college_id, department_id, name, academic_year, start_year, end_year, status });
    return sendSuccess(res, 'Batch created successfully', batch, 201);
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/batches/:id
export const editBatch = async (req, res, next) => {
  try {
    const existing = await findBatchById(req.params.id);
    if (!existing) {
      return sendError(res, 'Batch not found', 404);
    }

    const { college_id, department_id, name, academic_year, start_year, end_year, status } = req.body;

    const newCollegeId = college_id || existing.college_id;
    const newDeptId = department_id || existing.department_id;
    const newName = name || existing.name;
    const newStatus = status || existing.status;

    // Validate college if being changed
    if (college_id) {
      const colleges = await query('SELECT id FROM colleges WHERE id = ?', [college_id]);
      if (!colleges.length) {
        return sendError(res, `College with id ${college_id} does not exist`, 400);
      }
    }

    // Validate department if being changed
    if (department_id) {
      const departments = await query('SELECT id FROM departments WHERE id = ? AND college_id = ?', [newDeptId, newCollegeId]);
      if (!departments.length) {
        return sendError(res, `Department with id ${department_id} does not exist or does not belong to the college`, 400);
      }
    }

    const updated = await updateBatch(req.params.id, {
      college_id: newCollegeId,
      department_id: newDeptId,
      name: newName,
      academic_year: academic_year !== undefined ? academic_year : existing.academic_year,
      start_year: start_year !== undefined ? start_year : existing.start_year,
      end_year: end_year !== undefined ? end_year : existing.end_year,
      status: newStatus
    });

    return sendSuccess(res, 'Batch updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/batches/:id
export const removeBatch = async (req, res, next) => {
  try {
    const existing = await findBatchById(req.params.id);
    if (!existing) {
      return sendError(res, 'Batch not found', 404);
    }
    await deleteBatch(req.params.id);
    return sendSuccess(res, 'Batch deleted successfully');
  } catch (error) {
    next(error);
  }
};
