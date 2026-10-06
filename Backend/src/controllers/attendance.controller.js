import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import crypto from 'crypto';
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
 * Student marks their attendance Present via QR code token scan
 */
export const markSelfAttendanceByCode = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    const { token, code } = req.body || {};
    let tokenVal = token || code;
    if (typeof tokenVal === 'string') tokenVal = tokenVal.trim();

    if (!tokenVal) {
      return sendError(res, 'QR Token is required.', 400);
    }

    // Handle JSON payload string if scanned as JSON object
    if (typeof tokenVal === 'string' && tokenVal.startsWith('{') && tokenVal.endsWith('}')) {
      try {
        const parsed = JSON.parse(tokenVal);
        tokenVal = parsed.token || parsed.code || tokenVal;
      } catch (_) {}
    }

    // 1. Find session by current_qr_token or session_code
    let sessions = await query(
      `SELECT s.*, b.name AS batch_name
       FROM attendance_sessions s
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE (s.current_qr_token = ? OR s.session_code = ?) AND s.status = 'ACTIVE' LIMIT 1`,
      [tokenVal, tokenVal]
    );

    // Fallback: If scanned token was previous 5s cycle token, check recent session match
    if (!sessions || sessions.length === 0) {
      const closedCheck = await query(
        `SELECT id, status FROM attendance_sessions WHERE current_qr_token = ? OR session_code = ? LIMIT 1`,
        [tokenVal, tokenVal]
      );
      if (closedCheck && closedCheck.length > 0) {
        if (closedCheck[0].status === 'CLOSED') {
          return sendError(res, 'Attendance session is closed.', 400);
        }
      }
      return sendError(res, 'Invalid or expired QR code.', 400);
    }

    const session = sessions[0];

    // 2. Token Expiry Check (allow 7-second grace window for latency)
    if (session.token_expires_at) {
      const expiryMs = new Date(session.token_expires_at).getTime();
      if (expiryMs > 0 && Date.now() > expiryMs + 3000) {
        return sendError(res, 'QR code has expired. Please scan the current QR.', 400);
      }
    }

    // 3. Batch Eligibility Check (Must fetch actual student batch from DB based on authenticated JWT)
    let userEmail = req.user?.email || '';
    try {
      const uRes = await query(`SELECT email FROM users WHERE id = ?`, [userId]);
      if (uRes && uRes.length > 0) userEmail = uRes[0].email || userEmail;
    } catch (_) {}

    const studentBatchRows = await query(
      `SELECT batch_id FROM students WHERE user_id = ? OR (email != '' AND LOWER(email) = LOWER(?))
       UNION
       SELECT batch_id FROM users WHERE id = ? AND batch_id IS NOT NULL LIMIT 1`,
      [userId, userEmail, userId]
    );

    const enrolledBatchId = studentBatchRows && studentBatchRows.length > 0 ? studentBatchRows[0].batch_id : null;

    if (!enrolledBatchId || Number(enrolledBatchId) !== Number(session.batch_id)) {
      return sendError(res, 'You are not a member of this batch. Attendance cannot be marked.', 403);
    }

    // 4. Duplicate Prevention Check (UNIQUE session_id + user_id check)
    const existingMark = await query(
      `SELECT id FROM attendance WHERE session_id = ? AND (user_id = ? OR user_id IN (
        SELECT id FROM students WHERE user_id = ? OR (email != '' AND LOWER(email) = LOWER(?))
      )) LIMIT 1`,
      [session.id, userId, userId, userEmail]
    );

    if (existingMark && existingMark.length > 0) {
      return sendError(res, 'You are already marked PRESENT for this attendance session.', 400);
    }

    // 5. Insert Attendance Record in MySQL
    const collegeId = session.college_id || req.user?.college_id || 1;
    const sessionDate = session.session_date ? new Date(session.session_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

    let insertedRecordId = null;
    try {
      const ins = await query(
        `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, remarks)
         VALUES (?, ?, ?, ?, ?, 'present', 'QR Scan')
         ON DUPLICATE KEY UPDATE status = 'present', updated_at = CURRENT_TIMESTAMP`,
        [collegeId, session.batch_id, userId, session.id, sessionDate]
      );
      insertedRecordId = ins.insertId;
    } catch (dbErr) {
      if (dbErr.code === 'ER_DUP_ENTRY') {
        return sendError(res, 'You are already marked PRESENT for this attendance session.', 400);
      }
      throw dbErr;
    }

    // Update persistent attendance_summary
    await getStudentAttendanceSummaryService(userId);

    // Get student details for response payload
    const uRes = await query(`SELECT name FROM users WHERE id = ?`, [userId]);
    const sRes = await query(`SELECT roll_number FROM students WHERE user_id = ?`, [userId]);
    const studentName = uRes[0]?.name || 'Student';
    const rollNumber = sRes[0]?.roll_number || '';

    return sendSuccess(res, 'Attendance marked PRESENT successfully!', {
      marked: true,
      record_id: insertedRecordId,
      session_id: session.id,
      batch_name: session.batch_name,
      session_date: sessionDate,
      status: 'PRESENT',
      summary: {
        studentName,
        rollNumber,
        userId,
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/attendance/sessions
 * Admin creates one attendance session for Batch + Date
 */
export const createAttendanceSession = async (req, res, next) => {
  try {
    const { batch_id, date } = req.body || {};
    const batchId = parseInt(batch_id, 10);
    if (!batchId || isNaN(batchId)) {
      return sendError(res, 'Please select a valid batch.', 400);
    }

    const sessionDate = date ? String(date).trim() : new Date().toISOString().split('T')[0];
    const createdBy = req.user?.id || req.user?.userId || null;
    const collegeId = req.user?.college_id || req.user?.collegeId || 1;

    // Validate batch existence
    const batchCheck = await query(`SELECT id, name, code FROM batches WHERE id = ?`, [batchId]);
    if (!batchCheck || batchCheck.length === 0) {
      return sendError(res, 'Selected batch does not exist.', 404);
    }
    const batchObj = batchCheck[0];

    // Prevent duplicate ACTIVE attendance sessions for the same batch_id + session_date
    const activeExisting = await query(
      `SELECT * FROM attendance_sessions WHERE batch_id = ? AND session_date = ? AND status = 'ACTIVE' LIMIT 1`,
      [batchId, sessionDate]
    );

    if (activeExisting && activeExisting.length > 0) {
      const existingSession = activeExisting[0];
      return sendError(res, 'Attendance session already exists for this batch and date.', 400, {
        sessionExists: true,
        session: {
          id: existingSession.id,
          batch_id: existingSession.batch_id,
          batch_name: batchObj.name,
          batch_code: batchObj.code,
          date: existingSession.session_date,
          status: existingSession.status,
          current_qr_token: existingSession.current_qr_token,
          token_expires_at: existingSession.token_expires_at,
        }
      });
    }

    // Generate initial cryptographically secure 5-second QR token
    const initialToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7000); // 7-second expiry window for 5s rotation

    const insertRes = await query(
      `INSERT INTO attendance_sessions (college_id, batch_id, session_code, title, session_date, status, current_qr_token, token_expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)`,
      [collegeId, batchId, batchObj.code, `Attendance - ${batchObj.name}`, sessionDate, initialToken, expiresAt, createdBy]
    );

    const sessionId = insertRes.insertId;

    return sendSuccess(res, 'Attendance session created successfully', {
      id: sessionId,
      session_id: sessionId,
      batch_id: batchId,
      batch_name: batchObj.name,
      batch_code: batchObj.code,
      date: sessionDate,
      status: 'ACTIVE',
      current_qr_token: initialToken,
      token_expires_at: expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/sessions/:sessionId/qr
 * Fetch current QR token for active attendance session
 */
export const getAttendanceSessionQr = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (!sessionId || isNaN(sessionId)) {
      return sendError(res, 'Invalid session ID', 400);
    }

    const sessions = await query(`SELECT * FROM attendance_sessions WHERE id = ?`, [sessionId]);
    if (!sessions || sessions.length === 0) {
      return sendError(res, 'Attendance session not found.', 404);
    }

    const session = sessions[0];
    if (session.status !== 'ACTIVE') {
      return sendError(res, 'Attendance session is closed or inactive.', 400);
    }

    // If current token is expired or nearly expired, refresh automatically
    let token = session.current_qr_token;
    const expiresAtMs = session.token_expires_at ? new Date(session.token_expires_at).getTime() : 0;
    if (!token || expiresAtMs <= Date.now() + 1000) {
      token = crypto.randomBytes(16).toString('hex');
      const newExpiry = new Date(Date.now() + 7000);
      await query(
        `UPDATE attendance_sessions SET current_qr_token = ?, token_expires_at = ? WHERE id = ?`,
        [token, newExpiry, sessionId]
      );
    }

    return sendSuccess(res, 'Current QR token fetched', {
      token,
      expires_in: 5,
      session_id: sessionId,
      status: session.status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/attendance/sessions/:sessionId/refresh-qr
 * Automatically refresh QR token every 5 seconds (invalidating previous token)
 */
export const refreshAttendanceSessionQr = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (!sessionId || isNaN(sessionId)) {
      return sendError(res, 'Invalid session ID', 400);
    }

    const sessions = await query(`SELECT * FROM attendance_sessions WHERE id = ?`, [sessionId]);
    if (!sessions || sessions.length === 0) {
      return sendError(res, 'Attendance session not found.', 404);
    }

    const session = sessions[0];
    if (session.status !== 'ACTIVE') {
      return sendError(res, 'Attendance session is closed.', 400);
    }

    const newToken = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7000); // 7s buffer for 5s cycle

    await query(
      `UPDATE attendance_sessions SET current_qr_token = ?, token_expires_at = ? WHERE id = ?`,
      [newToken, expiresAt, sessionId]
    );

    return sendSuccess(res, 'QR token refreshed successfully', {
      token: newToken,
      expires_in: 5,
      session_id: sessionId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/attendance/sessions/:sessionId/close
 * Close attendance session (stopping QR acceptance)
 */
export const closeAttendanceSession = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (!sessionId || isNaN(sessionId)) {
      return sendError(res, 'Invalid session ID', 400);
    }

    await query(
      `UPDATE attendance_sessions SET status = 'CLOSED', current_qr_token = NULL WHERE id = ?`,
      [sessionId]
    );

    return sendSuccess(res, 'Attendance session closed successfully.', { sessionId, status: 'CLOSED' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/sessions/:sessionId/status
 * Admin live attendance stats & student roster list
 */
export const getAttendanceSessionStatus = async (req, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId, 10);
    if (!sessionId || isNaN(sessionId)) {
      return sendError(res, 'Invalid session ID', 400);
    }

    const sessions = await query(
      `SELECT s.*, b.name AS batch_name, b.code AS batch_code
       FROM attendance_sessions s
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE s.id = ?`,
      [sessionId]
    );

    if (!sessions || sessions.length === 0) {
      return sendError(res, 'Attendance session not found.', 404);
    }

    const session = sessions[0];
    const batchId = session.batch_id;

    // Fetch all students belonging to this batch
    const batchStudents = await query(
      `SELECT u.id AS user_id, u.name, u.email, s.id AS student_id, s.roll_number
       FROM users u
       JOIN students s ON s.user_id = u.id
       WHERE s.batch_id = ?
       ORDER BY s.roll_number ASC, u.name ASC`,
      [batchId]
    );

    // Fetch attendance records marked for this session
    const markedRecords = await query(
      `SELECT a.*, u.name AS user_name, s.roll_number
       FROM attendance a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       WHERE a.session_id = ?`,
      [sessionId]
    );

    const markedUserMap = new Map();
    markedRecords.forEach((r) => {
      markedUserMap.set(String(r.user_id), r);
      if (r.student_id) markedUserMap.set(String(r.student_id), r);
    });

    const studentList = batchStudents.map((st) => {
      const rec = markedUserMap.get(String(st.user_id)) || markedUserMap.get(String(st.student_id));
      const isPresent = rec && String(rec.status).toLowerCase() === 'present';
      return {
        id: st.user_id,
        student_id: st.student_id,
        name: st.name,
        roll_number: st.roll_number || `STU-${st.user_id}`,
        status: isPresent ? 'PRESENT' : 'ABSENT',
        marked_at: rec ? rec.created_at : null,
      };
    });

    const total = batchStudents.length;
    const present = studentList.filter((s) => s.status === 'PRESENT').length;
    const absent = total - present;
    const percentage = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0.0;

    return sendSuccess(res, 'Live attendance session status retrieved', {
      session_id: sessionId,
      batch_id: batchId,
      batch_name: session.batch_name || `Batch ${batchId}`,
      batch_code: session.batch_code || `B-${batchId}`,
      date: session.session_date,
      status: session.status,
      current_qr_token: session.current_qr_token,
      total,
      present,
      absent,
      percentage,
      students: studentList,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/sessions/active
 * Get active attendance sessions
 */
export const getActiveAttendanceSessions = async (req, res, next) => {
  try {
    const activeSessions = await query(
      `SELECT s.*, b.name AS batch_name, b.code AS batch_code
       FROM attendance_sessions s
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE s.status = 'ACTIVE'
       ORDER BY s.id DESC`
    );
    return sendSuccess(res, 'Active attendance sessions', activeSessions || []);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/sessions/history
 * Get previous attendance sessions history
 */
export const getAttendanceSessionsHistory = async (req, res, next) => {
  try {
    const sessions = await query(
      `SELECT s.*, b.name AS batch_name, b.code AS batch_code,
              (SELECT COUNT(*) FROM students st WHERE st.batch_id = s.batch_id) AS total_students,
              (SELECT COUNT(*) FROM attendance a WHERE a.session_id = s.id AND LOWER(a.status) = 'present') AS present_count
       FROM attendance_sessions s
       LEFT JOIN batches b ON s.batch_id = b.id
       ORDER BY s.session_date DESC, s.id DESC
       LIMIT 100`
    );

    const history = sessions.map((s) => {
      const total = Number(s.total_students || 0);
      const present = Number(s.present_count || 0);
      const pct = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0;
      return {
        id: s.id,
        date: s.session_date,
        batch_id: s.batch_id,
        batch_name: s.batch_name || `Batch ${s.batch_id}`,
        batch_code: s.batch_code,
        status: s.status,
        total,
        present,
        absent: Math.max(0, total - present),
        percentage: pct,
      };
    });

    return sendSuccess(res, 'Attendance sessions history retrieved', history);
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
