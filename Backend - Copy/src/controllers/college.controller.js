import { sendSuccess } from '../utils/response.js';

export const getCollegeData = async (req, res, next) => { try { return sendSuccess(res, 'college data retrieved successfully'); } catch (error) { next(error); } };
