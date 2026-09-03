import { sendSuccess } from '../utils/response.js';

export const getReportData = async (req, res, next) => { try { return sendSuccess(res, 'report data retrieved successfully'); } catch (error) { next(error); } };
