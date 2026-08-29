import { sendSuccess } from '../utils/response.js';

export const getTrainingData = async (req, res, next) => { try { return sendSuccess(res, 'training data retrieved successfully'); } catch (error) { next(error); } };
