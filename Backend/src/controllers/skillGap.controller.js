import { sendSuccess } from '../utils/response.js';

export const getSkillGapData = async (req, res, next) => { try { return sendSuccess(res, 'skillGap data retrieved successfully'); } catch (error) { next(error); } };
