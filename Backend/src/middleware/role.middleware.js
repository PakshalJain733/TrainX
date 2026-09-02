import { sendError } from '../utils/response.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access forbidden: Insufficient role permissions', 403);
    }
    next();
  };
};
