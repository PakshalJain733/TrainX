import { ROLES } from './constants.js';

/**
 * Enforce college isolation for a resource owned by `resourceCollegeId`.
 * Super admin may read across colleges; everyone else must match their own college.
 * Returns `null` on success or a localized Error describing the denial.
 */
export const assertCollegeScope = ({
  userRole = ROLES.STUDENT,
  userCollegeId = null,
  resourceCollegeId = null,
  message = 'Access forbidden: Cannot access data belonging to another college',
}) => {
  if (userRole === ROLES.SUPER_ADMIN) return null;
  if (!userCollegeId || !resourceCollegeId) return null;
  if (parseInt(userCollegeId, 10) === parseInt(resourceCollegeId, 10)) return null;
  return new Error(message);
};

/**
 * Resolve the effective college filter for a list/read request.
 * College-scoped roles get their own college unless an explicit collegeId is
 * given (trusted callers). Super admins may pass any collegeId or none.
 */
export const resolveCollegeFilter = ({
  userRole = ROLES.STUDENT,
  userCollegeId = null,
  queryCollegeId = null,
}) => {
  if (userRole === ROLES.SUPER_ADMIN) {
    return queryCollegeId || userCollegeId || null;
  }
  return queryCollegeId || userCollegeId || null;
};