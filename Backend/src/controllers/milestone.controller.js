import { sendSuccess } from '../utils/response.js';

export const getMilestoneData = async (req, res, next) => { try { return sendSuccess(res, 'milestone data retrieved successfully'); } catch (error) { next(error); } };
