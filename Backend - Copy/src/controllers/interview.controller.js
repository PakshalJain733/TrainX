import { sendSuccess } from '../utils/response.js';

export const getInterviewData = async (req, res, next) => { try { return sendSuccess(res, 'interview data retrieved successfully'); } catch (error) { next(error); } };
