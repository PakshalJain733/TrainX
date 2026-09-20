import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import { findOrCreateAttendanceSession } from '../models/attendance.model.js';
import {
  getStudentAttendanceSummaryService,
  getStudentAttendanceHistoryService,
  getFilteredStudentsAttendanceService,
  getDepartmentSummaryService,
  getBatchSummaryService,
  getAttendanceDashboardSummaryService,
} from '../services/attendance.service.js';

/**
 * GET /api/v1/attendance/summary
 * Fetch logged-in student's attendance summary.
 */
export const getMyAttendanceSummary = async (req, res, next) => {
  try {
    const studentId = req.user.id || req.user.userId;
    const data = await getStudentAttendanceSummaryService(studentId);
    return sendSuccess(res, 'Student attendance summary retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/student/:studentId
 * Fetch specific student's attendance summary.
 */
export const getStudentAttendanceById = async (req, res, next) => {
  try {
    const studentId = Number(req.params.studentId);
    if (!studentId || isNaN(studentId)) {
      return sendError(res, 'Invalid student ID provided', 400);
    }
    const currentUserId = Number(req.user?.userId || req.user?.id);
    if (req.user?.role === 'student' && currentUserId !== studentId) {
      return sendError(res, 'Access forbidden: You cannot view another student\'s attendance', 403);
    }
    const data = await getStudentAttendanceSummaryService(studentId);
    return sendSuccess(res, 'Student attendance summary retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/student/:studentId/history
 * Fetch student attendance session logs.
 */
export const getStudentAttendanceHistory = async (req, res, next) => {
  try {
    const studentId = req.params.studentId ? Number(req.params.studentId) : (req.user?.id || req.user?.userId);
    if (!studentId || isNaN(studentId)) {
      return sendError(res, 'Invalid student ID provided', 400);
    }
    const currentUserId = Number(req.user?.userId || req.user?.id);
    if (req.user?.role === 'student' && currentUserId !== studentId) {
      return sendError(res, 'Access forbidden: You cannot view another student\'s attendance history', 403);
    }
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const data = await getStudentAttendanceHistoryService(studentId, limit);
    return sendSuccess(res, 'Student attendance history retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/low-attendance
 * Fetch low-attendance students (supports department, batch, threshold filter).
 */
export const getLowAttendanceStudents = async (req, res, next) => {
  try {
    const { department, batch, threshold } = req.query;
    const collegeId = req.user?.college_id || req.user?.collegeId || null;

    const data = await getFilteredStudentsAttendanceService({
      collegeId,
      department: department || null,
      batchName: batch || null,
      threshold: threshold ? Number(threshold) : 75,
      onlyLowAttendance: true,
    });

    return sendSuccess(res, 'Low attendance students retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/list
 * Fetch all students with attendance metrics (supports search/filter).
 */
export const getAllStudentsAttendance = async (req, res, next) => {
  try {
    const { department, batch, threshold } = req.query;
    const collegeId = req.user?.college_id || req.user?.collegeId || null;

    const data = await getFilteredStudentsAttendanceService({
      collegeId,
      department: department || null,
      batchName: batch || null,
      threshold: threshold ? Number(threshold) : 75,
      onlyLowAttendance: false,
    });

    return sendSuccess(res, 'Students attendance list retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/department
 * Department-wise attendance breakdown.
 */
export const getDepartmentSummary = async (req, res, next) => {
  try {
    const collegeId = req.user?.college_id || req.user?.collegeId || null;
    const data = await getDepartmentSummaryService(collegeId);
    return sendSuccess(res, 'Department attendance summary retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/batch
 * Batch-wise attendance breakdown.
 */
export const getBatchSummary = async (req, res, next) => {
  try {
    const collegeId = req.user?.college_id || req.user?.collegeId || null;
    const data = await getBatchSummaryService(collegeId);
    return sendSuccess(res, 'Batch attendance summary retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/dashboard-summary
 * Full attendance analytics dashboard summary for Coordinators/Admins.
 */
export const getDashboardSummary = async (req, res, next) => {
  try {
    const collegeId = req.user?.college_id || req.user?.collegeId || null;
    const threshold = req.query.threshold ? Number(req.query.threshold) : 75;
    const data = await getAttendanceDashboardSummaryService(collegeId, threshold);
    return sendSuccess(res, 'Attendance dashboard summary retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/attendance/mark
 * Student marks their attendance Present via QR code scan or manual code
 */
export const markSelfAttendanceByCode = async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.userId;
    const collegeId = req.user.college_id || req.user.collegeId || 1;
    const { code, batch_id } = req.body || {};

    const todayStr = new Date().toISOString().split('T')[0];

    // Find batch by code/name if provided
    let targetBatchId = batch_id;
    if (!targetBatchId && code) {
      const cleanCode = code.trim();
      const batchRows = await query(
        `SELECT id FROM batches WHERE LOWER(name) LIKE LOWER(?) LIMIT 1`,
        [`%${cleanCode}%`]
      );
      if (batchRows && batchRows.length > 0) {
        targetBatchId = batchRows[0].id;
      }
    }

    if (!targetBatchId) {
      const userRows = await query(
        `SELECT s.batch_id FROM users u LEFT JOIN students s ON u.id = s.user_id WHERE u.id = ? AND s.batch_id IS NOT NULL`,
        [userId]
      );
      targetBatchId = userRows[0]?.batch_id;
    }

    if (!targetBatchId) {
      const firstBatch = await query(`SELECT id FROM batches ORDER BY id ASC LIMIT 1`);
      if (firstBatch && firstBatch.length > 0) {
        targetBatchId = firstBatch[0].id;
      } else {
        const newBatch = await query(`INSERT INTO batches (college_id, name) VALUES (?, 'General Training Batch')`, [collegeId]);
        targetBatchId = newBatch.insertId;
      }
    }

    // Create or find dedicated session in attendance_sessions table
    const sessionObj = await findOrCreateAttendanceSession({
      collegeId,
      batchId: targetBatchId,
      sessionCode: code || 'VALIDATED',
      title: `Training Lecture (${code || 'Regular'})`,
      sessionDate: todayStr,
    });

    // Duplicate protection: if the same user already marked attendance for the
    // same session, do not insert another row — return an "already marked" response.
    const existing = await query(
      `SELECT id FROM attendance WHERE user_id = ? AND session_id = ? LIMIT 1`,
      [userId, sessionObj.id]
    );

    if (existing && existing.length > 0) {
      const summary = await getStudentAttendanceSummaryService(userId);
      return sendSuccess(res, 'Attendance already marked for this session', {
        marked: false,
        already_marked: true,
        session_date: todayStr,
        status: 'present',
        summary,
      });
    }

    await query(
      `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, remarks)
       VALUES (?, ?, ?, ?, ?, 'present', ?)`,
      [collegeId, targetBatchId, userId, sessionObj.id, todayStr, `Scanned QR Code: ${code || 'VALIDATED'}`]
    );

    const summary = await getStudentAttendanceSummaryService(userId);

    return sendSuccess(res, 'Attendance marked present successfully in database!', {
      marked: true,
      session_date: todayStr,
      status: 'present',
      summary,
    });
  } catch (error) {
    next(error);
  }
};
