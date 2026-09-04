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
    return sendSuccess(res, 'Colleges retrieved successfully', colleges);
  } catch (error) {
    next(error);
  }
};

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

    return sendSuccess(res, 'College retrieved successfully', college);
  } catch (error) {
    next(error);
  }
};

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
  } catch (error) {
    next(error);
  }
};

// Update college
export const editCollege = async (req, res, next) => {
  try {
    const { name, code } = req.body;

    await updateCollege(req.params.id, name, code);

    return sendSuccess(res, 'College updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete college
export const removeCollege = async (req, res, next) => {
  try {
    await deleteCollege(req.params.id);

    return sendSuccess(res, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};