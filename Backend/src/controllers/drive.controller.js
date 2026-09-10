import { sendSuccess, sendError } from '../utils/response.js';
import {
  getStudentDrivesService,
  getMentorDrivesService,
  getCoordinatorDrivesService,
  createMockDriveService,
  getSuperAdminDrivesService,
  startMockDriveService,
  submitDriveSectionService,
} from '../services/drive.service.js';
import { ROLES } from '../utils/constants.js';

/**
 * GET MOCK DRIVES BY ROLE
 */
export const getDrives = async (req, res, next) => {
  try {
    const role = req.user?.role || ROLES.STUDENT;
    let data;

    if (role === ROLES.STUDENT) {
      data = await getStudentDrivesService(req.user);
    } else if (role === ROLES.MENTOR) {
      data = await getMentorDrivesService(req.user, req.query);
    } else if (role === ROLES.COORDINATOR || role === ROLES.COLLEGE_ADMIN) {
      data = await getCoordinatorDrivesService(req.user, req.query);
    } else if (role === ROLES.SUPER_ADMIN) {
      data = await getSuperAdminDrivesService();
    } else {
      data = await getStudentDrivesService(req.user);
    }

    return sendSuccess(res, 'Mock drives retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * START MOCK DRIVE FOR STUDENT
 */
export const startDrive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.userId || req.user?.id || 6;
    const result = await startMockDriveService(id, studentId);
    return sendSuccess(res, result.message, result.participation);
  } catch (error) {
    next(error);
  }
};

/**
 * SUBMIT SECTION (APTITUDE / CODING / INTERVIEW)
 */
export const submitDriveSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user?.userId || req.user?.id || 6;
    const updated = await submitDriveSectionService(id, studentId, req.body);
    return sendSuccess(res, 'Section submitted successfully', updated);
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE NEW MOCK DRIVE (COORDINATOR / ADMIN)
 */
export const createDrive = async (req, res, next) => {
  try {
    const newDrive = await createMockDriveService(req.user, req.body);
    return sendSuccess(res, 'Mock Placement Drive created successfully', newDrive, 201);
  } catch (error) {
    next(error);
  }
};

export const getDriveData = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Drive data retrieved successfully', []);
  } catch (error) {
    next(error);
  }
};
