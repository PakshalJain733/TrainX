import { sendError } from '../utils/response.js';

export const validateRequestBody = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = requiredFields.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
    if (missing.length > 0) {
      return sendError(res, `Missing required fields: ${missing.join(', ')}`, 400);
    }
    next();
  };
};
