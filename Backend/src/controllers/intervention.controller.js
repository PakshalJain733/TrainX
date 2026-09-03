import { sendSuccess } from '../utils/response.js';

export const getInterventionData = async (req, res, next) => { try { return sendSuccess(res, 'intervention data retrieved successfully'); } catch (error) { next(error); } };
