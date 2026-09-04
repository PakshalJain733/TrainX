import { sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization', 401);
    }

    const userRole = req.user.role;
    const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;
    const isDirectlyAllowed = allowedRoles.includes(userRole);

    if (isDirectlyAllowed || isSuperAdmin) {
      return next();
    }

    return sendError(
      res,
      `Access forbidden: Role '${userRole}' is not authorized to access this resource`,
      403
    );
  };
};
