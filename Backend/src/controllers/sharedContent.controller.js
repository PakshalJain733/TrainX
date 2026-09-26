import { sendSuccess, sendError } from '../utils/response.js';
import {
  getSharedContentByType,
  getAllSharedContent,
  createSharedContent,
  deleteSharedContent,
} from '../models/sharedContent.model.js';

const getCollegeId = (req) => req.user?.collegeId || req.user?.college_id || 1;

// GET /api/v1/shared-content?type=quiz
export const getSharedContent = async (req, res, next) => {
  try {
    const { type } = req.query;
    const collegeId = getCollegeId(req);

    let items;
    if (type) {
      items = await getSharedContentByType(type, collegeId);
    } else {
      items = await getAllSharedContent(collegeId);
    }

    return sendSuccess(res, 'Shared content retrieved', items);
  } catch (err) {
    next(err);
  }
};

// POST /api/v1/shared-content
export const addSharedContent = async (req, res, next) => {
  try {
    const { type, title, description, data, status, batch_name, target } = req.body;

    if (!type || !title) {
      return sendError(res, 'type and title are required', 400);
    }

    const validTypes = ['quiz', 'coding', 'drive', 'learning', 'broadcast'];
    if (!validTypes.includes(type)) {
      return sendError(res, `type must be one of: ${validTypes.join(', ')}`, 400);
    }

    const collegeId = getCollegeId(req);
    const created_by = req.user?.id || req.user?.userId || null;

    const item = await createSharedContent({
      type,
      title,
      description: description || '',
      data: data || {},
      status: status || 'Active',
      college_id: collegeId,
      created_by,
      batch_id: req.body?.batch_id ?? null,
      batch_name: batch_name || 'All Batches',
      target: target || 'All',
    });

    if (!item) {
      return sendError(res, 'Shared content could not be persisted', 500);
    }

    return sendSuccess(res, 'Shared content created', item, 201);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/v1/shared-content/:id
export const removeSharedContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteSharedContent(id);
    return sendSuccess(res, 'Shared content deleted');
  } catch (err) {
    next(err);
  }
};
