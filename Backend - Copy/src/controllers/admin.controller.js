import { sendSuccess, sendError } from '../utils/response.js';
import {
  getAllUsersModel,
  createUser,
  saveStudentDetails,
  updateUserModel,
  deleteUserModel,
  getUserStatsModel,
  findUserByEmailOrMobile,
} from '../models/user.model.js';
import { ROLES } from '../utils/constants.js';

export const getAdminData = async (req, res, next) => {
  try {
    const stats = await getUserStatsModel();
    return sendSuccess(res, 'Admin data retrieved successfully', { stats });
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    const stats = await getUserStatsModel();
    return sendSuccess(res, 'Admin statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

export const getAdminUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    let users = await getAllUsersModel();

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

export const createUserAdmin = async (req, res, next) => {
  try {
    const { name, email, mobile_number, role = 'student', roll_number, department, year, division, semester } = req.body;

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

    let canonicalRole = ROLES.STUDENT;
    if (role) {
      const r = role.toLowerCase();
      if (r.includes('super')) canonicalRole = ROLES.SUPER_ADMIN;
      else if (r.includes('admin') || r.includes('hod')) canonicalRole = ROLES.COLLEGE_ADMIN;
      else if (r.includes('coordinator')) canonicalRole = ROLES.COORDINATOR;
      else if (r.includes('mentor') || r.includes('faculty')) canonicalRole = ROLES.MENTOR;
    }

    const newUser = await createUser({
      name,
      email: email || '',
      mobile_number: mobile_number || '',
      role: canonicalRole,
    });

    let studentProfile = null;
    if (canonicalRole === ROLES.STUDENT) {
      studentProfile = await saveStudentDetails({
        user_id: newUser.id,
        roll_number: roll_number || '',
        department: department || '',
        year: year || '',
        division: division || '',
        semester: semester || '',
      });
    }

    return sendSuccess(res, 'User created successfully', { ...newUser, ...studentProfile }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateUserModel(id, req.body);
    return sendSuccess(res, 'User updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteUserAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteUserModel(id);
    return sendSuccess(res, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};
