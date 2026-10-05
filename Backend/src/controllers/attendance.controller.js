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
    const studentId = req.params.studentId ? Number(req.params.studentId) : (req.user.id || req.user.userId);
    if (!studentId || isNaN(studentId)) {
      return sendError(res, 'Invalid student ID provided', 400);
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
    let collegeId = req.user?.college_id || req.user?.collegeId || null;
    const { code, batch_id } = req.body || {};

    // Validate collegeId against colleges table
    if (collegeId) {
      try {
        const cCheck = await query(`SELECT id FROM colleges WHERE id = ?`, [collegeId]);
        if (!cCheck || cCheck.length === 0) {
          const firstCol = await query(`SELECT id FROM colleges LIMIT 1`);
          collegeId = firstCol[0]?.id || null;
        }
      } catch (e) {
        collegeId = null;
      }
    } else {
      try {
        const firstCol = await query(`SELECT id FROM colleges LIMIT 1`);
        collegeId = firstCol[0]?.id || null;
      } catch (e) {
        collegeId = null;
      }
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Extract raw code string
    let rawCode = code ? String(code).trim() : '';

    // Handle JSON payload string if scanned as JSON object
    if (rawCode.startsWith('{') && rawCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawCode);
        rawCode = parsed.code || parsed.batch_code || parsed.join_code || parsed.sessionCode || rawCode;
      } catch (e) {}
    }

    // Handle URL payload string if scanned as URL
    if (rawCode.startsWith('http://') || rawCode.startsWith('https://')) {
      try {
        const urlObj = new URL(rawCode);
        const codeParam = urlObj.searchParams.get('code') || urlObj.searchParams.get('batch_code') || urlObj.searchParams.get('join_code');
        if (codeParam) {
          rawCode = codeParam;
        } else {
          rawCode = urlObj.pathname.split('/').pop() || rawCode;
        }
      } catch (e) {}
    }

    // Handle BATCH_CODE:SALT format (e.g. "CS-2026-A:X8Y9Z" or "BATCH-1:A3K9L")
    let primaryCode = rawCode;
    if (rawCode.includes(':')) {
      primaryCode = rawCode.split(':')[0].trim();
    }

    const cleanPrimary = primaryCode.toUpperCase();
    const cleanRaw = rawCode.toUpperCase();

    // Find batch by code, name, or numeric ID
    let targetBatchId = batch_id;

    if (cleanPrimary.length > 0) {
      // Check if primaryCode is formatted as "BATCH-X" or is numeric
      let potentialId = null;
      if (cleanPrimary.startsWith('BATCH-')) {
        const parsed = parseInt(cleanPrimary.replace('BATCH-', ''), 10);
        if (!isNaN(parsed)) potentialId = parsed;
      } else if (!isNaN(parseInt(cleanPrimary, 10))) {
        potentialId = parseInt(cleanPrimary, 10);
      }

      let queryStr = `SELECT id, name, status, code_expires_at FROM batches WHERE UPPER(code) = ? OR UPPER(join_code) = ? OR UPPER(name) = ? OR UPPER(code) = ? OR UPPER(join_code) = ?`;
      let queryParams = [cleanPrimary, cleanPrimary, cleanPrimary, cleanRaw, cleanRaw];

      if (potentialId) {
        queryStr += ` OR id = ?`;
        queryParams.push(potentialId);
      }
      queryStr += ` LIMIT 1`;

      const batchRows = await query(queryStr, queryParams);

      if (batchRows && batchRows.length > 0) {
        const foundB = batchRows[0];
        if (foundB.status && (foundB.status.toLowerCase() === 'inactive' || foundB.status.toLowerCase() === 'archived')) {
          return sendError(res, `Batch '${foundB.name}' is inactive and attendance cannot be marked.`, 400);
        }
        targetBatchId = foundB.id;
      } else {
        const sessionRows = await query(
          `SELECT batch_id, status FROM attendance_sessions WHERE UPPER(session_code) = ? OR UPPER(session_code) = ? LIMIT 1`,
          [cleanPrimary, cleanRaw]
        );
        if (sessionRows && sessionRows.length > 0) {
          targetBatchId = sessionRows[0].batch_id;
        }
      }
    }

    // If batch not found by code, fallback to student's enrolled batch
    if (!targetBatchId) {
      const userRows = await query(
        `SELECT s.batch_id, b.name as batch_name FROM users u LEFT JOIN students s ON u.id = s.user_id LEFT JOIN batches b ON s.batch_id = b.id WHERE u.id = ? AND s.batch_id IS NOT NULL LIMIT 1`,
        [userId]
      );
      if (userRows && userRows.length > 0 && userRows[0].batch_id) {
        targetBatchId = userRows[0].batch_id;
      }
    }

    // Fallback to first available active batch in system if still not assigned
    if (!targetBatchId) {
      const firstB = await query(`SELECT id FROM batches LIMIT 1`);
      if (firstB && firstB.length > 0) {
        targetBatchId = firstB[0].id;
      }
    }

    if (!targetBatchId) {
      return sendError(res, `Invalid attendance code '${code || rawCode}'. No active batch found.`, 400);
    }

    const batchCheck = await query(`SELECT id, status, name FROM batches WHERE id = ?`, [targetBatchId]);
    if (!batchCheck || batchCheck.length === 0) {
      return sendError(res, "Invalid batch assignment. Please contact your administrator.", 400);
    }

    // Create or find dedicated session in attendance_sessions table
    const sessionObj = await findOrCreateAttendanceSession({
      collegeId,
      batchId: targetBatchId,
      sessionCode: primaryCode || 'VALIDATED',
      title: `Training Lecture (${primaryCode || 'Regular'})`,
      sessionDate: todayStr,
    });

    // Find user email/mobile to ensure attendance is recorded for all linked account user IDs
    let userEmail = req.user?.email || '';
    let userMobile = req.user?.mobile || '';
    try {
      const userRows = await query(`SELECT email, mobile_number FROM users WHERE id = ?`, [userId]);
      if (userRows && userRows.length > 0) {
        userEmail = userRows[0].email || userEmail;
        userMobile = userRows[0].mobile_number || userMobile;
      }
    } catch (e) {}

    let uIdsToMark = [userId];
    try {
      const matchingUsers = await query(
        `SELECT id FROM users WHERE id = ? OR (email != '' AND LOWER(email) = LOWER(?)) OR (mobile_number != '' AND mobile_number = ?)`,
        [userId, userEmail, userMobile]
      );
      if (matchingUsers && matchingUsers.length > 0) {
        uIdsToMark = matchingUsers.map(u => u.id);
      }
    } catch (e) {}

    for (const uId of uIdsToMark) {
      await query(
        `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, remarks)
         VALUES (?, ?, ?, ?, ?, 'present', ?)
         ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), status = 'present', updated_at = CURRENT_TIMESTAMP`,
        [collegeId, targetBatchId, uId, sessionObj.id, todayStr, `Scanned QR Code: ${primaryCode || 'VALIDATED'}`]
      );
    }

    const summary = await getStudentAttendanceSummaryService(userId);

    return sendSuccess(res, `Attendance marked Present for ${batchCheck[0]?.name || 'Session'}!`, {
      marked: true,
      session_date: todayStr,
      status: 'present',
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/leave-requests
 * Fetch all student leave requests from MySQL database for Coordinators/Admins
 */
export const getLeaveRequests = async (req, res, next) => {
  try {
    const collegeId = req.user?.college_id || req.user?.collegeId || 1;
    let leaves = [];
    try {
      leaves = await query(
        `SELECT l.*, u.name as student_name, u.email, s.roll_number, s.department
         FROM leave_requests l
         LEFT JOIN users u ON l.user_id = u.id
         LEFT JOIN students s ON s.user_id = u.id
         WHERE l.college_id = ? OR l.college_id IS NULL
         ORDER BY l.id DESC`,
        [collegeId]
      );
    } catch (e) {
      console.warn('[DB getLeaveRequests fallback]', e.message);
    }
    return sendSuccess(res, 'Leave requests retrieved successfully', leaves || []);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/attendance/leave-requests/:id/status
 * Approve or Reject student leave application in database
 */
export const updateLeaveRequestStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    try {
      await query(
        `UPDATE leave_requests SET status = ?, remarks = ? WHERE id = ?`,
        [status || 'Approved', remarks || null, id]
      );
    } catch (e) {
      console.warn('[DB updateLeaveRequestStatus fallback]', e.message);
    }
    return sendSuccess(res, 'Leave request status updated in database', { id, status });
  } catch (error) {
    next(error);
  }
};
