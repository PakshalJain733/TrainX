import { query } from '../config/db.js';

/**
 * 1. Attendance Sessions Table helper
 * Find or create a session record for a lecture/batch session.
 */
export const findOrCreateAttendanceSession = async ({
  collegeId = 1,
  batchId = 1,
  sessionCode = 'JAVA-QRVL',
  title = 'Training Lecture',
  sessionDate = new Date().toISOString().split('T')[0],
  facultyId = null,
} = {}) => {
  if (sessionCode) {
    const existing = await query(
      `SELECT * FROM attendance_sessions WHERE LOWER(session_code) = LOWER(?) LIMIT 1`,
      [sessionCode.trim()]
    );
    if (existing && existing.length > 0) {
      return existing[0];
    }
  }

  const result = await query(
    `INSERT INTO attendance_sessions (college_id, batch_id, session_code, title, session_date, faculty_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [collegeId, batchId, sessionCode ? sessionCode.trim() : null, title, sessionDate, facultyId]
  );

  return {
    id: result.insertId,
    college_id: collegeId,
    batch_id: batchId,
    session_code: sessionCode,
    title,
    session_date: sessionDate,
    faculty_id: facultyId,
  };
};

/**
 * 2. Attendance Summary Table helper
 * Upsert persistent summary metrics for a student.
 */
export const upsertStudentAttendanceSummary = async (userId, metrics = {}) => {
  const total = Number(metrics.total_classes || 0);
  const present = Number(metrics.present_count || 0);
  const absent = Number(metrics.absent_count || 0);
  const late = Number(metrics.late_count || 0);
  const excused = Number(metrics.excused_count || 0);
  const percentage = Number(metrics.attendance_percentage || 0.0);
  const status = metrics.attendance_status || 'No Records';

  const sql = `
    INSERT INTO attendance_summary 
      (user_id, total_classes, present_count, absent_count, late_count, excused_count, attendance_percentage, attendance_status)
    VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      total_classes = VALUES(total_classes),
      present_count = VALUES(present_count),
      absent_count = VALUES(absent_count),
      late_count = VALUES(late_count),
      excused_count = VALUES(excused_count),
      attendance_percentage = VALUES(attendance_percentage),
      attendance_status = VALUES(attendance_status),
      updated_at = CURRENT_TIMESTAMP
  `;

  await query(sql, [userId, total, present, absent, late, excused, percentage, status]);
};

/**
 * Fetch persistent attendance summary for a student from attendance_summary table.
 */
export const getStudentAttendanceSummaryRecord = async (userId) => {
  const rows = await query(`SELECT * FROM attendance_summary WHERE user_id = ?`, [userId]);
  return rows[0] || null;
};

/**
 * Fetch attendance count metrics for a single student from attendance records table.
 */
export const getStudentAttendanceCounts = async (userId) => {
  const sql = `
    SELECT 
      COUNT(*) AS total_classes,
      SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) AS present_count,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_count,
      SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) AS excused_count
    FROM attendance
    WHERE user_id = ?
  `;
  const results = await query(sql, [userId]);
  const row = results[0] || {};
  return {
    total_classes: Number(row.total_classes || 0),
    present_count: Number(row.present_count || 0),
    absent_count: Number(row.absent_count || 0),
    late_count: Number(row.late_count || 0),
    excused_count: Number(row.excused_count || 0),
  };
};

/**
 * Fetch detailed attendance logs for a student.
 */
export const getStudentAttendanceLogs = async (userId, limit = 50) => {
  const sql = `
    SELECT 
      a.id,
      a.session_date,
      a.status,
      a.remarks,
      b.name AS batch_name,
      u_m.name AS marked_by_name,
      sess.title AS session_title,
      sess.session_code
    FROM attendance a
    LEFT JOIN batches b ON a.batch_id = b.id
    LEFT JOIN users u_m ON a.marked_by = u_m.id
    LEFT JOIN attendance_sessions sess ON a.session_id = sess.id
    WHERE a.user_id = ?
    ORDER BY a.session_date DESC
    LIMIT ?
  `;
  return await query(sql, [userId, Number(limit)]);
};

/**
 * Fetch list of students with attendance aggregated per student,
 * filtered by college, department, batch, or threshold.
 */
export const getAggregatedStudentsAttendance = async ({
  collegeId = null,
  department = null,
  batchId = null,
  batchName = null,
} = {}) => {
  let whereClauses = ["u.role = 'student'"];
  let params = [];

  if (collegeId) {
    whereClauses.push('u.college_id = ?');
    params.push(collegeId);
  }

  if (department && department.trim() !== '') {
    whereClauses.push('(LOWER(s.department) = LOWER(?) OR LOWER(d.name) = LOWER(?) OR LOWER(d.code) = LOWER(?))');
    const deptTerm = department.trim();
    params.push(deptTerm, deptTerm, deptTerm);
  }

  if (batchId) {
    whereClauses.push('(s.batch_id = ? OR a.batch_id = ?)');
    params.push(batchId, batchId);
  }

  if (batchName && batchName.trim() !== '') {
    whereClauses.push('(LOWER(b.name) LIKE LOWER(?))');
    params.push(`%${batchName.trim()}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      u.id AS student_id,
      u.name AS student_name,
      u.email AS student_email,
      COALESCE(s.department, d.name, d.code, 'General') AS department,
      u.college_id,
      COALESCE(b.name, 'Unassigned Batch') AS batch_name,
      COUNT(a.id) AS total_classes,
      SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) AS present_count,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
      SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_count,
      SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END) AS excused_count
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN batches b ON s.batch_id = b.id
    LEFT JOIN attendance a ON u.id = a.user_id
    ${whereSql}
    GROUP BY u.id, u.name, u.email, department, u.college_id, batch_name
    ORDER BY u.name ASC
  `;

  return await query(sql, params);
};

/**
 * Fetch Department-wise Attendance Statistics
 */
export const getDepartmentAttendanceStatsModel = async (collegeId = null) => {
  let whereClause = "u.role = 'student'";
  let params = [];
  if (collegeId) {
    whereClause += " AND u.college_id = ?";
    params.push(collegeId);
  }

  const sql = `
    SELECT 
      COALESCE(s.department, d.name, d.code, 'General') AS department,
      COUNT(DISTINCT u.id) AS total_students,
      COUNT(a.id) AS total_session_records,
      SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) AS total_presents,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS total_absents
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN attendance a ON u.id = a.user_id
    WHERE ${whereClause}
    GROUP BY COALESCE(s.department, d.name, d.code, 'General')
    ORDER BY department ASC
  `;
  return await query(sql, params);
};

/**
 * Fetch Batch-wise Attendance Statistics
 */
export const getBatchAttendanceStatsModel = async (collegeId = null) => {
  let whereClause = "u.role = 'student'";
  let params = [];
  if (collegeId) {
    whereClause += " AND u.college_id = ?";
    params.push(collegeId);
  }

  const sql = `
    SELECT 
      COALESCE(b.name, 'Unassigned Batch') AS batch_name,
      COUNT(DISTINCT u.id) AS total_students,
      COUNT(a.id) AS total_session_records,
      SUM(CASE WHEN a.status IN ('present', 'late') THEN 1 ELSE 0 END) AS total_presents,
      SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count
    FROM users u
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN batches b ON s.batch_id = b.id
    LEFT JOIN attendance a ON u.id = a.user_id
    WHERE ${whereClause}
    GROUP BY COALESCE(b.name, 'Unassigned Batch')
    ORDER BY batch_name ASC
  `;
  return await query(sql, params);
};
