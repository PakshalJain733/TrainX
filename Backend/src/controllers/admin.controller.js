import { sendSuccess, sendError } from '../utils/response.js';
import {
  getAllUsersModel,
  createUser,
  saveStudentDetails,
  updateUserModel,
  deleteUserModel,
  getUserStatsModel,
  findUserByEmailOrMobile,
  findUserById,
} from '../models/user.model.js';
import { getDepartmentByIdModel } from '../models/department.model.js';
import { getBatchByIdModel } from '../models/batch.model.js';
import { ROLES } from '../utils/constants.js';

/**
 * Helper to determine college isolation filter based on caller role
 */
const getCallerCollegeFilter = (req) => {
  if (req.user.role === ROLES.SUPER_ADMIN) {
    return req.query.collegeId ? parseInt(req.query.collegeId, 10) : null;
  }
  return req.user.collegeId;
};

export const getAdminData = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    const stats = await getUserStatsModel(collegeId);
    return sendSuccess(res, 'Admin data retrieved successfully', { stats });
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    const collegeId = getCallerCollegeFilter(req);
    const stats = await getUserStatsModel(collegeId);
    return sendSuccess(res, 'Admin statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const collegeId = getCallerCollegeFilter(req);

    // Multi-college isolation: strictly partitioned by caller's collegeId unless super_admin
    let users = await getAllUsersModel(collegeId);

    if (role && role !== 'all') {
      const canonicalRole = role.toLowerCase();
      users = users.filter((u) => u.role.toLowerCase() === canonicalRole);
    }

    if (search) {
      const q = search.trim().toLowerCase();
      users = users.filter((u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.mobile_number && u.mobile_number.includes(q)) ||
        (u.roll_number && u.roll_number.toLowerCase().includes(q)) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    }

    return sendSuccess(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

/**
 * User Hierarchy Assignment: User -> College -> Department -> Batch -> Role
 */
export const createUserAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      mobile_number,
      role = 'student',
      college_id: requestedCollegeId,
      department_id,
      batch_id,
      roll_number,
      department,
      year,
      division,
      semester,
      cgpa,
      skills,
    } = req.body;

    if (!name || (!email && !mobile_number)) {
      return sendError(res, 'Name and either Email or Mobile Number are required', 400);
    }

    if (email) {
      const existing = await findUserByEmailOrMobile(email);
      if (existing) {
        return sendError(res, 'A user with this email already exists', 409);
      }
    }

    if (mobile_number) {
      const existingMobile = await findUserByEmailOrMobile(mobile_number);
      if (existingMobile) {
        return sendError(res, 'A user with this mobile number already exists', 409);
      }
    }

    // Role mapping
    let canonicalRole = ROLES.STUDENT;
    if (role) {
      const r = role.toLowerCase();
      if (r.includes('super')) canonicalRole = ROLES.SUPER_ADMIN;
      else if (r.includes('admin') || r.includes('hod')) canonicalRole = ROLES.COLLEGE_ADMIN;
      else if (r.includes('coordinator')) canonicalRole = ROLES.COORDINATOR;
      else if (r.includes('mentor') || r.includes('faculty')) canonicalRole = ROLES.MENTOR;
    }

    // College Isolation Enforcement:
    // College Admins can ONLY create users within their own college.
    let targetCollegeId = req.user.collegeId;
    if (req.user.role === ROLES.SUPER_ADMIN) {
      targetCollegeId = requestedCollegeId ? parseInt(requestedCollegeId, 10) : 1;
    }

    // Hierarchy validation: verify department & batch belong to the target college if specified
    let validatedDeptName = department || '';
    if (department_id) {
      const deptRecord = await getDepartmentByIdModel(department_id);
      if (deptRecord) {
        if (deptRecord.college_id !== targetCollegeId && req.user.role !== ROLES.SUPER_ADMIN) {
          return sendError(res, 'Cannot assign user to a department from another college', 403);
        }
        validatedDeptName = deptRecord.name;
      }
    }

    if (batch_id) {
      const batchRecord = await getBatchByIdModel(batch_id);
      if (batchRecord && batchRecord.college_id !== targetCollegeId && req.user.role !== ROLES.SUPER_ADMIN) {
        return sendError(res, 'Cannot assign user to a batch from another college', 403);
      }
    }

    const newUser = await createUser({
      name,
      email: email || '',
      mobile_number: mobile_number || '',
      role: canonicalRole,
      college_id: targetCollegeId,
    });

    let studentProfile = null;
    if (canonicalRole === ROLES.STUDENT) {
      studentProfile = await saveStudentDetails({
        user_id: newUser.id,
        college_id: targetCollegeId,
        department_id: department_id ? parseInt(department_id, 10) : null,
        batch_id: batch_id ? parseInt(batch_id, 10) : null,
        roll_number: roll_number || `AUTO_${newUser.id}`,
        department: validatedDeptName,
        year: year || 'TE',
        division: division || 'A',
        semester: semester || 'Semester 6',
        cgpa: cgpa || '8.5',
        skills: skills || '',
      });
    }

    return sendSuccess(
      res,
      'User created and assigned hierarchy successfully',
      {
        ...newUser,
        studentProfile,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

export const updateUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return sendError(res, 'User not found', 404);
    }

    // College Isolation check: non-super_admin cannot update users belonging to another college
    if (req.user.role !== ROLES.SUPER_ADMIN && existingUser.college_id !== req.user.collegeId) {
      return sendError(res, 'Access forbidden: Cannot modify users from another college', 403);
    }

    const updated = await updateUserModel(id, req.body);
    return sendSuccess(res, 'User updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingUser = await findUserById(id);
    if (!existingUser) {
      return sendError(res, 'User not found', 404);
    }

    // College Isolation check: non-super_admin cannot delete users from another college
    if (req.user.role !== ROLES.SUPER_ADMIN && existingUser.college_id !== req.user.collegeId) {
      return sendError(res, 'Access forbidden: Cannot delete users from another college', 403);
    }

    await deleteUserModel(id);
    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};
