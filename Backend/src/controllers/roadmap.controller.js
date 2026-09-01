import { sendSuccess } from '../utils/response.js';

export const getRoadmapData = async (req, res, next) => { try { return sendSuccess(res, 'roadmap data retrieved successfully'); } catch (error) { next(error); } };
