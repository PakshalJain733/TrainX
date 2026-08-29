import { sendSuccess } from '../utils/response.js';

export const getAssessmentData = async (req, res, next) => { try { return sendSuccess(res, 'assessment data retrieved successfully'); } catch (error) { next(error); } };
