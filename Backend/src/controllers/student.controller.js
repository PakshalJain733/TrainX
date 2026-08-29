import { sendSuccess } from '../utils/response.js';

export const getStudentData = async (req, res, next) => { try { return sendSuccess(res, 'student data retrieved successfully'); } catch (error) { next(error); } };
