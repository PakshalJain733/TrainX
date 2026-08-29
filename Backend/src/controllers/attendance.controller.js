import { sendSuccess } from '../utils/response.js';

export const getAttendanceData = async (req, res, next) => { try { return sendSuccess(res, 'attendance data retrieved successfully'); } catch (error) { next(error); } };
