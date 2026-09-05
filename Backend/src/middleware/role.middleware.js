import { sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization', 401);
    }

    const userRole = req.user.role;
    const isSuperAdmin = userRole === ROLES.SUPER_ADMIN || userRole === 'super_admin';
    const isCollegeAdmin = userRole === ROLES.COLLEGE_ADMIN || userRole === 'college_admin';
    const isDirectlyAllowed = allowedRoles.includes(userRole);

    if (isDirectlyAllowed || isSuperAdmin || isCollegeAdmin) {
      return next();
    }

    return sendError(
      res,
      `Access forbidden: Role '${userRole}' is not authorized to access this resource`,
      403
    );
  };
};
