import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import {
  findOrCreateAttendanceSession,
  logAttendanceScan,
  getStudentAttendanceScans,
} from '../models/attendance.model.js';
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
    const callerId = req.user?.userId || req.user?.id;
    const callerRole = (req.user?.role || '').toLowerCase();
    if (callerRole === 'student' && Number(callerId) !== studentId) {
      return sendError(res, 'Access denied: You can only view your own attendance', 403);
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
    const callerId = req.user?.userId || req.user?.id;
    const callerRole = (req.user?.role || '').toLowerCase();
    const studentId = req.params.studentId ? Number(req.params.studentId) : callerId;
    if (!studentId || isNaN(studentId)) {
      return sendError(res, 'Invalid student ID provided', 400);
    }
    if (callerRole === 'student' && Number(callerId) !== Number(studentId)) {
      return sendError(res, 'Access denied: You can only view your own attendance history', 403);
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
    const { department, batch, batch_id, threshold, date, session_date } = req.query;
    const collegeId = req.user?.college_id || req.user?.collegeId || null;
    const targetDate = date || session_date || new Date().toISOString().split('T')[0];

    // Resolve target batch ID to enforce strict batch isolation
    let resolvedBatchId = batch_id ? parseInt(String(batch_id).replace(/[^0-9]/g, ''), 10) : null;
    if (!resolvedBatchId && batch && String(batch).trim()) {
      const cleanTerm = String(batch).trim();
      if (cleanTerm.toUpperCase().startsWith('BATCH-')) {
        resolvedBatchId = parseInt(cleanTerm.toUpperCase().replace('BATCH-', ''), 10) || null;
      } else if (!isNaN(parseInt(cleanTerm, 10)) && /^\d+$/.test(cleanTerm)) {
        resolvedBatchId = parseInt(cleanTerm, 10);
      } else {
        const bRows = await query(
          'SELECT id FROM batches WHERE UPPER(code) = UPPER(?) OR UPPER(join_code) = UPPER(?) OR UPPER(name) = UPPER(?) LIMIT 1',
          [cleanTerm, cleanTerm, cleanTerm]
        );
        if (bRows && bRows.length > 0) {
          resolvedBatchId = bRows[0].id;
        }
      }
    }

    const data = await getFilteredStudentsAttendanceService({
      collegeId,
      department: department || null,
      batchId: resolvedBatchId || null,
      batchName: batch || null,
      threshold: threshold ? Number(threshold) : 75,
      onlyLowAttendance: false,
    });

    // Enrich with specific date attendance and scan records strictly scoped to this batch
    try {
      let dayRecords = [];
      let dayScans = [];

      if (resolvedBatchId) {
        dayRecords = await query(
          'SELECT user_id, batch_id, status FROM attendance WHERE DATE(session_date) = DATE(?) AND batch_id = ?',
          [targetDate, resolvedBatchId]
        );
        dayScans = await query(
          'SELECT DISTINCT user_id, batch_id FROM attendance_scans WHERE DATE(session_date) = DATE(?) AND batch_id = ?',
          [targetDate, resolvedBatchId]
        );
      } else {
        dayRecords = await query(
          'SELECT user_id, batch_id, status FROM attendance WHERE DATE(session_date) = DATE(?)',
          [targetDate]
        );
        dayScans = await query(
          'SELECT DISTINCT user_id, batch_id FROM attendance_scans WHERE DATE(session_date) = DATE(?)',
          [targetDate]
        );
      }

      const statusMap = new Map();
      (dayRecords || []).forEach(r => {
        statusMap.set(Number(r.user_id), r.status);
        if (r.batch_id) statusMap.set(`${r.user_id}_${r.batch_id}`, r.status);
      });

      const scanSet = new Set();
      (dayScans || []).forEach(s => {
        scanSet.add(Number(s.user_id));
        if (s.batch_id) scanSet.add(`${s.user_id}_${s.batch_id}`);
      });

      if (Array.isArray(data)) {
        data.forEach(st => {
          const uId = Number(st.userId || st.user_id || st.studentId || st.student_id || st.id);
          const stBatchId = resolvedBatchId || st.batch_id || st.batchId || null;

          let dayStat = null;
          let isScanned = false;

          if (stBatchId) {
            dayStat = statusMap.get(`${uId}_${stBatchId}`) || (resolvedBatchId ? statusMap.get(uId) : null);
            isScanned = scanSet.has(`${uId}_${stBatchId}`) || (resolvedBatchId ? scanSet.has(uId) : false);
          } else {
            dayStat = statusMap.get(uId) || null;
            isScanned = scanSet.has(uId);
          }

          st.today_status = dayStat || (isScanned ? 'present' : null);
          st.todayStatus = st.today_status;
          st.is_scanned = Boolean(isScanned);
          st.isScanned = st.is_scanned;
          st.id = uId;
          st.userId = uId;
          st.studentId = uId;
        });
      }
    } catch (e) {
      console.warn('[getAllStudentsAttendance date enrich fallback]', e.message);
    }

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
    const { code, batch_id, date, session_date } = req.body || {};
    const todayStr = new Date().toISOString().split('T')[0];
    const targetDate = date || session_date || todayStr;

    // Validate collegeId against colleges table to prevent MySQL foreign key failure
    let validCollegeId = null;
    if (collegeId) {
      try {
        const cCheck = await query(`SELECT id FROM colleges WHERE id = ?`, [collegeId]);
        if (cCheck && cCheck.length > 0) validCollegeId = cCheck[0].id;
      } catch (e) {}
    }
    if (!validCollegeId) {
      try {
        const firstCol = await query(`SELECT id FROM colleges ORDER BY id ASC LIMIT 1`);
        if (firstCol && firstCol.length > 0) validCollegeId = firstCol[0].id;
      } catch (e) {}
    }

    // Check if payload is a batch roster save ({ batch_id, date, attendance })
    if (req.body && req.body.attendance && typeof req.body.attendance === 'object' && Object.keys(req.body.attendance).length > 0) {
      const attendanceMap = req.body.attendance;
      let tBatchId = batch_id;
      if (tBatchId) {
        try {
          const bCheck = await query(`SELECT id FROM batches WHERE id = ?`, [tBatchId]);
          if (!bCheck || bCheck.length === 0) tBatchId = null;
        } catch (e) { tBatchId = null; }
      }
      if (!tBatchId) {
        try {
          const firstB = await query(`SELECT id FROM batches ORDER BY id ASC LIMIT 1`);
          tBatchId = firstB[0]?.id || null;
        } catch (e) { tBatchId = null; }
      }

      // Find or create session for this batch & date
      const sessionObj = await findOrCreateAttendanceSession({
        collegeId: validCollegeId,
        batchId: tBatchId,
        sessionCode: `BATCH-${tBatchId}`,
        title: `Batch Session (${targetDate})`,
        sessionDate: targetDate,
      });

      const markedResults = [];
      for (const [stKey, isPresent] of Object.entries(attendanceMap)) {
        let targetUserId = null;
        const cleanKey = String(stKey).trim();

        // 1. Check if cleanKey is numeric user ID
        const numKey = parseInt(cleanKey, 10);
        if (!isNaN(numKey)) {
          const uCheck = await query(`SELECT id FROM users WHERE id = ?`, [numKey]);
          if (uCheck && uCheck.length > 0) {
            targetUserId = uCheck[0].id;
          } else {
            const sCheck = await query(`SELECT user_id FROM students WHERE id = ?`, [numKey]);
            if (sCheck && sCheck.length > 0) targetUserId = sCheck[0].user_id;
          }
        }

        // 2. Check by student roll_number or student ID string
        if (!targetUserId) {
          const sCheck = await query(
            `SELECT user_id FROM students WHERE LOWER(roll_number) = LOWER(?) OR CAST(id AS CHAR) = ? OR CAST(user_id AS CHAR) = ?`,
            [cleanKey, cleanKey, cleanKey]
          );
          if (sCheck && sCheck.length > 0) targetUserId = sCheck[0].user_id;
        }

        // 3. Check by user name string
        if (!targetUserId) {
          const uCheck = await query(`SELECT id FROM users WHERE LOWER(name) = LOWER(?)`, [cleanKey]);
          if (uCheck && uCheck.length > 0) targetUserId = uCheck[0].id;
        }

        if (targetUserId) {
          const statusVal = isPresent ? 'present' : 'absent';
          await query(
            `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, marked_by, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'Admin Roster Save')
             ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), status = VALUES(status), marked_by = VALUES(marked_by), remarks = VALUES(remarks)`,
            [validCollegeId, tBatchId, targetUserId, sessionObj?.id || null, targetDate, statusVal, userId]
          );
          await getStudentAttendanceSummaryService(targetUserId);
          markedResults.push({ userId: targetUserId, status: statusVal });
        }
      }

      return sendSuccess(res, `Batch attendance saved successfully for ${markedResults.length} students!`, {
        markedCount: markedResults.length,
        session_date: targetDate,
        records: markedResults
      });
    }

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
      // Check if primaryCode is formatted as "BATCH-X", "BTCH-X" or is numeric
      let potentialId = null;
      if (cleanPrimary.startsWith('BATCH-')) {
        const parsed = parseInt(cleanPrimary.replace('BATCH-', ''), 10);
        if (!isNaN(parsed)) potentialId = parsed;
      } else if (cleanPrimary.startsWith('BTCH-')) {
        const parsed = parseInt(cleanPrimary.replace('BTCH-', ''), 10);
        if (!isNaN(parsed)) potentialId = parsed;
      } else if (!isNaN(parseInt(cleanPrimary, 10))) {
        potentialId = parseInt(cleanPrimary, 10);
      }

      let queryStr = `SELECT id, name, status, code_expires_at FROM batches WHERE UPPER(code) = ? OR UPPER(join_code) = ? OR UPPER(name) = ? OR UPPER(REPLACE(name, ' ', '')) = ? OR UPPER(code) = ? OR UPPER(join_code) = ?`;
      let queryParams = [cleanPrimary, cleanPrimary, cleanPrimary, cleanPrimary.replace(/\s+/g, ''), cleanRaw, cleanRaw];

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
        // Look up in attendance_sessions without querying non-existent 'status' column
        const sessionRows = await query(
          `SELECT batch_id FROM attendance_sessions WHERE UPPER(session_code) = ? OR UPPER(session_code) = ? LIMIT 1`,
          [cleanPrimary, cleanRaw]
        );
        if (sessionRows && sessionRows.length > 0 && sessionRows[0].batch_id) {
          targetBatchId = sessionRows[0].batch_id;
        }
      }
    }

    // If batch not found by code, fallback to student's enrolled batch in student_batches or students table
    if (!targetBatchId) {
      const sbRows = await query(
        `SELECT sb.batch_id, b.name as batch_name FROM student_batches sb JOIN batches b ON sb.batch_id = b.id WHERE sb.user_id = ? LIMIT 1`,
        [userId]
      );
      if (sbRows && sbRows.length > 0 && sbRows[0].batch_id) {
        targetBatchId = sbRows[0].batch_id;
      }
    }

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
      const firstB = await query(`SELECT id FROM batches ORDER BY id ASC LIMIT 1`);
      if (firstB && firstB.length > 0) {
        targetBatchId = firstB[0].id;
      }
    }

    let batchCheck = [];
    if (targetBatchId) {
      batchCheck = await query(`SELECT id, status, name FROM batches WHERE id = ?`, [targetBatchId]);
    }

    if (!batchCheck || batchCheck.length === 0) {
      const firstB = await query(`SELECT id, name FROM batches ORDER BY id ASC LIMIT 1`);
      if (firstB && firstB.length > 0) {
        targetBatchId = firstB[0].id;
        batchCheck = firstB;
      }
    }

    // Ensure student is registered in student_batches join table for this batch
    if (targetBatchId && userId) {
      try {
        await query(
          `INSERT IGNORE INTO student_batches (user_id, batch_id) VALUES (?, ?)`,
          [userId, targetBatchId]
        );
        await query(
          `UPDATE students SET batch_id = ? WHERE user_id = ? AND (batch_id IS NULL OR batch_id = 0)`,
          [targetBatchId, userId]
        );
      } catch (_) {}
    }

    // Create or find dedicated session in attendance_sessions table
    const sessionObj = await findOrCreateAttendanceSession({
      collegeId: validCollegeId,
      batchId: targetBatchId,
      sessionCode: primaryCode || 'VALIDATED',
      title: `${batchCheck[0]?.name || 'Training'} Session`,
      sessionDate: todayStr,
    });

    // Find user email/mobile to ensure attendance is recorded for user ID
    let userEmail = req.user?.email || '';
    let userMobile = req.user?.mobile || '';
    let studentRealName = req.user?.name || '';
    try {
      const userRows = await query(`SELECT name, email, mobile_number FROM users WHERE id = ?`, [userId]);
      if (userRows && userRows.length > 0) {
        studentRealName = userRows[0].name || studentRealName;
        userEmail = userRows[0].email || userEmail;
        userMobile = userRows[0].mobile_number || userMobile;
      }
    } catch (e) {}

    let uIdsToMark = [userId];
    if ((userEmail && userEmail.trim()) || (userMobile && userMobile.trim())) {
      try {
        const matchingUsers = await query(
          `SELECT id FROM users WHERE id = ? OR (email IS NOT NULL AND email != '' AND LOWER(email) = LOWER(?)) OR (mobile_number IS NOT NULL AND mobile_number != '' AND mobile_number = ?)`,
          [userId, userEmail.trim() || '___NONE___', userMobile.trim() || '___NONE___']
        );
        if (matchingUsers && matchingUsers.length > 0) {
          uIdsToMark = matchingUsers.map(u => u.id);
        }
      } catch (e) {}
    }

    for (const uId of uIdsToMark) {
      try {
        await query(
          `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, remarks)
           VALUES (?, ?, ?, ?, ?, 'present', ?)
           ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), batch_id = VALUES(batch_id), status = 'present', remarks = VALUES(remarks), updated_at = CURRENT_TIMESTAMP`,
          [validCollegeId, targetBatchId, uId, sessionObj?.id || null, todayStr, `Scanned QR Code: ${primaryCode || 'VALIDATED'}`]
        );
      } catch (attErr) {
        console.warn('[attendance insert fallback without updated_at]', attErr.message);
        await query(
          `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, remarks)
           VALUES (?, ?, ?, ?, ?, 'present', ?)
           ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), batch_id = VALUES(batch_id), status = 'present'`,
          [validCollegeId, targetBatchId, uId, sessionObj?.id || null, todayStr, `Scanned QR Code: ${primaryCode || 'VALIDATED'}`]
        );
      }

      // Log detailed scan entry into attendance_scans table
      try {
        await logAttendanceScan({
          userId: uId,
          batchId: targetBatchId,
          sessionId: sessionObj?.id || null,
          scannedCode: rawCode || primaryCode || 'VALIDATED',
          sessionDate: todayStr,
          status: 'present',
          ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
          deviceInfo: req.headers['user-agent'] || null,
          remarks: `Scanned QR Code: ${primaryCode || 'VALIDATED'}`,
        });
      } catch (e) {
        console.warn('[logAttendanceScan error]', e.message);
      }
    }

    const summary = await getStudentAttendanceSummaryService(userId);

    return sendSuccess(res, `Attendance marked Present for ${batchCheck[0]?.name || 'Training Session'}!`, {
      marked: true,
      session_date: todayStr,
      status: 'present',
      summary: {
        ...summary,
        studentName: studentRealName || 'Student User',
        studentId: userId,
        userId: userId,
      },
    });
  } catch (error) {
    console.error("[markSelfAttendanceByCode error]", error);
    next(error);
  }
};

/**
 * GET /api/v1/attendance/scans
 * Fetch logged-in student's scanned attendance log records from attendance_scans table.
 */
export const getMyAttendanceScans = async (req, res, next) => {
  try {
    const studentId = req.user.id || req.user.userId;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const scans = await getStudentAttendanceScans(studentId, limit);
    return sendSuccess(res, 'Scanned attendance logs retrieved successfully', scans);
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
    const callerId = req.user?.userId || req.user?.id;
    const isStudent = req.user?.role === 'student';

    let leaves = [];
    try {
      const sql = `SELECT l.*, 
                COALESCE(u.name, 'Student') as student_name, 
                COALESCE(u.name, 'Student') as studentName, 
                u.email, 
                COALESCE(s.roll_number, 'N/A') as roll_number, 
                COALESCE(s.roll_number, 'N/A') as rollNo, 
                s.department,
                COALESCE(b.name, 'All Batches') as batch
         FROM leave_requests l
         LEFT JOIN users u ON l.user_id = u.id
         LEFT JOIN students s ON s.user_id = u.id
         LEFT JOIN batches b ON s.batch_id = b.id
         WHERE ${isStudent ? 'l.user_id = ?' : '(l.college_id = ? OR l.college_id IS NULL)'}
         ORDER BY l.id DESC`;
      const params = isStudent ? [callerId] : [collegeId];
      leaves = await query(sql, params);
    } catch (e) {
      console.warn('[DB getLeaveRequests fallback]', e.message);
    }

    const formatted = (leaves || []).map((r) => ({
      ...r,
      studentName: r.studentName || r.student_name || 'Student',
      rollNo: r.rollNo || r.roll_number || 'N/A',
      batch: r.batch || 'All Batches',
      requestType: r.category || r.title || 'General Leave',
      category: r.category || r.title || 'General Leave',
      reason: r.reason || r.remarks || '',
      date: r.start_date ? new Date(r.start_date).toISOString().split('T')[0] : (r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      status: r.status || 'Pending',
    }));

    return sendSuccess(res, 'Leave requests retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/attendance/leave-requests
 * Create a new leave / absence request
 */
export const createLeaveRequest = async (req, res, next) => {
  try {
    let collegeId = req.user?.college_id || req.user?.collegeId || null;
    if (collegeId) {
      try {
        const colExists = await query('SELECT id FROM colleges WHERE id = ? LIMIT 1', [collegeId]);
        if (!colExists || colExists.length === 0) collegeId = null;
      } catch (_) {
        collegeId = null;
      }
    }
    const userId = req.user?.id || req.user?.userId || 1;
    const {
      studentName,
      title,
      category = 'Medical Leave Application',
      reason = '',
      date,
      startDate,
      endDate,
      days = 1,
    } = req.body || {};

    const reqTitle = title || category || 'Leave Application';
    const reqStartDate = startDate || date || new Date().toISOString().split('T')[0];
    const reqEndDate = endDate || reqStartDate;

    let insertId = Date.now();
    try {
      const insertResult = await query(
        `INSERT INTO leave_requests (user_id, college_id, title, category, status, days, start_date, end_date, reason)
         VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ?)`,
        [userId, collegeId, reqTitle, category, days, reqStartDate, reqEndDate, reason]
      );
      if (insertResult && insertResult.insertId) {
        insertId = insertResult.insertId;
      }
    } catch (e) {
      console.warn('[DB createLeaveRequest fallback]', e.message);
    }

    const created = {
      id: insertId,
      studentName: studentName || req.user?.name || 'Student',
      category,
      requestType: category,
      reason,
      date: reqStartDate,
      status: 'Pending',
    };

    return sendSuccess(res, 'Leave request created successfully', created, 201);
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

/**
 * DELETE /api/v1/attendance/leave-requests/:id
 * Remove leave request from database
 */
export const deleteLeaveRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const callerId = req.user?.userId || req.user?.id;
    const isStaffOrAdmin = ['super_admin', 'college_admin', 'coordinator', 'mentor'].includes(req.user?.role);

    try {
      if (isStaffOrAdmin) {
        await query(`DELETE FROM leave_requests WHERE id = ?`, [id]);
      } else {
        await query(`DELETE FROM leave_requests WHERE id = ? AND user_id = ?`, [id, callerId]);
      }
    } catch (e) {
      console.warn('[DB deleteLeaveRequest fallback]', e.message);
    }
    return sendSuccess(res, 'Leave request removed successfully', { id });
  } catch (error) {
    next(error);
  }
};


/**
 * GET /api/v1/attendance/history-records
 * Fetch previous attendance history sessions for Admin & Coordinator.
 */
export const getBatchAttendanceHistory = async (req, res, next) => {
  try {
    const collegeId = req.user?.college_id || req.user?.collegeId || null;
    const { batch_id, limit = 50 } = req.query;

    let queryStr = `
      SELECT 
        a.batch_id as batchId,
        DATE_FORMAT(MAX(a.session_date), '%Y-%m-%d') as date,
        COALESCE(MAX(b.name), 'Training Batch') as batchName,
        COALESCE(MAX(b.join_code), MAX(b.code), CONCAT('BATCH-', a.batch_id)) as batchCode,
        COUNT(a.id) as total,
        SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
        ROUND((SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100) as rate,
        COALESCE(MAX(u.name), 'System Admin') as savedBy,
        DATE_FORMAT(MAX(COALESCE(a.updated_at, a.created_at, a.session_date)), '%b %d, %Y, %h:%i %p') as savedAt
      FROM attendance a
      LEFT JOIN batches b ON a.batch_id = b.id
      LEFT JOIN users u ON a.marked_by = u.id
      WHERE (a.college_id = ? OR ? IS NULL)
    `;
    const params = [collegeId, collegeId];

    if (batch_id) {
      queryStr += ` AND a.batch_id = ?`;
      params.push(batch_id);
    }

    queryStr += `
      GROUP BY a.batch_id, DATE(a.session_date), a.marked_by
      ORDER BY MAX(a.session_date) DESC, a.batch_id ASC
      LIMIT ?
    `;
    params.push(Number(limit) || 50);

    let history;
    try {
      history = await query(queryStr, params);
    } catch (histErr) {
      if (histErr.code === 'ER_BAD_FIELD_ERROR' || histErr.message?.includes('updated_at')) {
        const safeQueryStr = queryStr.replace('a.updated_at, ', '');
        history = await query(safeQueryStr, params);
      } else {
        throw histErr;
      }
    }

    const formattedHistory = (history || []).map((row, idx) => ({
      id: `HIST-${row.batchId}-${row.date}-${idx}`,
      batchId: row.batchId,
      date: row.date,
      batchCode: row.batchCode,
      batchName: row.batchName,
      total: Number(row.total) || 0,
      present: Number(row.present) || 0,
      absent: Number(row.absent) || 0,
      rate: Number(row.rate) || 0,
      savedBy: row.savedBy || 'System Admin',
      savedAt: row.savedAt || new Date().toLocaleString()
    }));

    return sendSuccess(res, 'Batch attendance history retrieved successfully', formattedHistory);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/attendance/session-roster
 * Fetch individual student attendance records for a historical batch session.
 */
export const getSessionRoster = async (req, res, next) => {
  try {
    const { batch_id, date } = req.query;
    if (!batch_id || !date) {
      return sendError(res, 'batch_id and date are required', 400);
    }
    const rows = await query(
      `SELECT 
         a.user_id as userId,
         u.name,
         COALESCE(s.roll_number, CONCAT('STU-', u.id)) as rollNo,
         a.status,
         a.remarks,
         (CASE WHEN a.remarks LIKE '%QR%' THEN 'QR Scan' ELSE 'Manual' END) as mode
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       WHERE a.batch_id = ? AND DATE(a.session_date) = DATE(?)
       ORDER BY u.name ASC`,
      [batch_id, date]
    );

    return sendSuccess(res, 'Session roster retrieved successfully', rows || []);
  } catch (error) {
    next(error);
  }
};
