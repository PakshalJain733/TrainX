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

    const rawRole = String(req.user.role || '').trim();
    const userRole = rawRole.toLowerCase();

    // Super admin bypasses all role restrictions
    if (userRole === ROLES.SUPER_ADMIN.toLowerCase() || userRole === 'super_admin' || userRole === 'superadmin') {
      return next();
    }

    const normalizedAllowed = allowedRoles.map(r => String(r || '').toLowerCase().trim());

    // Check direct normalized match or defined canonical synonyms (e.g. mentor/faculty, college_admin/admin/hod)
    const isAllowed =
      normalizedAllowed.includes(userRole) ||
      (normalizedAllowed.includes('mentor') && ['mentor', 'faculty'].includes(userRole)) ||
      (normalizedAllowed.includes('college_admin') && ['college_admin', 'admin', 'hod'].includes(userRole));

    if (isAllowed) {
      return next();
    }

    return sendError(
      res,
      `Access forbidden: Role '${rawRole}' is not authorized to access this resource`,
      403
    );
  };
};
