import { sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

/**
 * Role-based authorization middleware.
 * Only allows access if the user's role is explicitly in allowedRoles.
 * Super admins bypass everything. No other role gets implicit bypass.
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Authentication required before authorization', 401);
    }

    const userRole = req.user.role;

    // Super admin bypasses all role restrictions
    if (userRole === ROLES.SUPER_ADMIN) {
      return next();
    }

    // All other roles (including college_admin) must be explicitly listed
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return sendError(
      res,
      `Access forbidden: Role '${userRole}' is not authorized to access this resource`,
      403
    );
  };
};
