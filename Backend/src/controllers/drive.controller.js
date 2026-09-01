import { sendSuccess } from '../utils/response.js';

export const getDriveData = async (req, res, next) => { try { return sendSuccess(res, 'drive data retrieved successfully'); } catch (error) { next(error); } };
