import {
  findBatches,
  findBatchesByCollege,
  findBatchesByDepartment,
  findBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  findBatchByCode,
  joinStudentBatch,
  getStudentBatchesModel,
} from '../models/batch.model.js';
import { sendSuccess, sendError } from '../utils/response.js';

// GET /api/v1/batches
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
    const {
      college_id = 1,
      department_id,
      name,
      mentor,
      schedule,
      join_code,
      joinCode,
      code_expires_at,
      codeExpiresAt,
      students = 0,
      status = 'active',
    } = req.body;

    if (!name || !name.trim()) {
      return sendError(res, 'Batch name is required', 400);
    }

    const batch = await createBatch({
      college_id: college_id || 1,
      department_id: department_id || null,
      name: name.trim(),
      mentor: mentor || '',
      schedule: schedule || '',
      join_code: join_code || joinCode || '',
      code_expires_at: code_expires_at || codeExpiresAt || null,
      students: students || 0,
      status: status || 'active',
    });

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

    const {
      college_id,
      department_id,
      name,
      mentor,
      schedule,
      join_code,
      joinCode,
      code_expires_at,
      codeExpiresAt,
      students,
      status,
    } = req.body;

    const updated = await updateBatch(req.params.id, {
      college_id,
      department_id,
      name,
      mentor,
      schedule,
      join_code: join_code !== undefined ? join_code : joinCode,
      code_expires_at: code_expires_at !== undefined ? code_expires_at : codeExpiresAt,
      students,
      status,
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

// ─── Student: Join Batch by Code ────────────────────────────────

// POST /api/v1/batches/join
export const joinBatchByCode = async (req, res, next) => {
  try {
    const { join_code, code } = req.body;
    const batchCode = (join_code || code || '').trim();

    if (!batchCode) {
      return sendError(res, 'Please provide a batch join code', 400);
    }

    // Find batch by code
    const batch = await findBatchByCode(batchCode);
    if (!batch) {
      return sendError(res, 'Invalid batch code. Please check and try again.', 404);
    }

    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return sendError(res, 'Authentication required', 401);
    }

    // Join the batch
    const success = await joinStudentBatch(userId, batch.id);
    if (!success) {
      return sendError(res, 'Failed to join batch. Please try again.', 500);
    }

    return sendSuccess(res, `Successfully joined batch: ${batch.name}`, {
      batch_id: batch.id,
      batch_name: batch.name,
      join_code: batch.join_code,
      status: batch.status,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/batches/my-batches
export const getMyBatches = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return sendError(res, 'Authentication required', 401);
    }

    const batches = await getStudentBatchesModel(userId);
    return sendSuccess(res, 'Your batches retrieved successfully', batches);
  } catch (error) {
    next(error);
  }
};
