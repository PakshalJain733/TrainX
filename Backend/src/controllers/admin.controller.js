import { sendSuccess } from '../utils/response.js';

export const getAdminData = async (req, res, next) => { try { return sendSuccess(res, 'admin data retrieved successfully'); } catch (error) { next(error); } };
