import { query } from '../config/db.js';

/**
 * 1. Attendance Sessions Table helper
 * Find or create a session record for a lecture/batch session.
 */
export const findOrCreateAttendanceSession = async ({
  collegeId = null,
  batchId = null,
  sessionCode = 'JAVA-QRVL',
  title = 'Training Lecture',
  sessionDate = new Date().toISOString().split('T')[0],
  facultyId = null,
} = {}) => {
  if (sessionCode) {
    try {
      const existing = await query(
        `SELECT * FROM attendance_sessions WHERE LOWER(session_code) = LOWER(?) LIMIT 1`,
        [sessionCode.trim()]
      );
      if (existing && existing.length > 0) {
        return existing[0];
      }
    } catch (e) {}
  }

  // Validate collegeId against colleges table
  let validCollegeId = collegeId;
  if (validCollegeId) {
    try {
      const cCheck = await query(`SELECT id FROM colleges WHERE id = ?`, [validCollegeId]);
      if (!cCheck || cCheck.length === 0) validCollegeId = null;
    } catch (e) { validCollegeId = null; }
  }
  if (!validCollegeId) {
    try {
      const firstC = await query(`SELECT id FROM colleges ORDER BY id ASC LIMIT 1`);
      validCollegeId = firstC[0]?.id || null;
    } catch (e) { validCollegeId = null; }
  }

  // Validate batchId against batches table
  let validBatchId = batchId;
  if (validBatchId) {
    try {
      const bCheck = await query(`SELECT id FROM batches WHERE id = ?`, [validBatchId]);
      if (!bCheck || bCheck.length === 0) validBatchId = null;
    } catch (e) { validBatchId = null; }
  }
  if (!validBatchId) {
    try {
      const firstB = await query(`SELECT id FROM batches ORDER BY id ASC LIMIT 1`);
      validBatchId = firstB[0]?.id || null;
    } catch (e) { validBatchId = null; }
  }

  // Validate facultyId against users table
  let validFacultyId = facultyId;
  if (validFacultyId) {
    try {
      const uCheck = await query(`SELECT id FROM users WHERE id = ?`, [validFacultyId]);
      if (!uCheck || uCheck.length === 0) validFacultyId = null;
    } catch (e) { validFacultyId = null; }
  }

  const result = await query(
    `INSERT INTO attendance_sessions (college_id, batch_id, session_code, title, session_date, faculty_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [validCollegeId, validBatchId || 1, sessionCode ? sessionCode.trim() : null, title, sessionDate, validFacultyId]
  );

  return {
    id: result.insertId,
    college_id: validCollegeId,
    batch_id: validBatchId || 1,
    session_code: sessionCode,
    title,
    session_date: sessionDate,
    faculty_id: validFacultyId,
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

/**
 * 3. Log a QR/Barcode/Code attendance scan entry in attendance_scans table
 */
export const logAttendanceScan = async ({
  userId,
  batchId = null,
  sessionId = null,
  scannedCode,
  sessionDate = new Date().toISOString().split('T')[0],
  status = 'present',
  ipAddress = null,
  deviceInfo = null,
  locationLat = null,
  locationLng = null,
  remarks = 'QR Scan',
}) => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS attendance_scans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        batch_id INT NULL,
        session_id INT NULL,
        scanned_code VARCHAR(255) NOT NULL,
        session_date DATE NOT NULL,
        status ENUM('present', 'late', 'absent', 'rejected') NOT NULL DEFAULT 'present',
        ip_address VARCHAR(100) NULL,
        device_info VARCHAR(255) NULL,
        location_lat DECIMAL(10,8) NULL,
        location_lng DECIMAL(11,8) NULL,
        remarks VARCHAR(255) NULL,
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_attendance_scans_user (user_id),
        INDEX idx_attendance_scans_date (session_date),
        INDEX idx_attendance_scans_code (scanned_code)
      )
    `);

    const result = await query(
      `INSERT INTO attendance_scans 
        (user_id, batch_id, session_id, scanned_code, session_date, status, ip_address, device_info, location_lat, location_lng, remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, batchId, sessionId, scannedCode, sessionDate, status, ipAddress, deviceInfo, locationLat, locationLng, remarks]
    );

    return {
      id: result.insertId,
      user_id: userId,
      batch_id: batchId,
      session_id: sessionId,
      scanned_code: scannedCode,
      session_date: sessionDate,
      status,
      remarks,
      scanned_at: new Date(),
    };
  } catch (e) {
    console.warn('[DB logAttendanceScan error]', e.message);
    return null;
  }
};

/**
 * Fetch detailed scanned attendance logs for a student from attendance_scans table.
 */
export const getStudentAttendanceScans = async (userId, limit = 50) => {
  try {
    const sql = `
      SELECT 
        s.id,
        s.scanned_code,
        s.session_date,
        s.status,
        s.remarks,
        s.ip_address,
        s.device_info,
        s.scanned_at,
        b.name AS batch_name,
        sess.title AS session_title
      FROM attendance_scans s
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN attendance_sessions sess ON s.session_id = sess.id
      WHERE s.user_id = ?
      ORDER BY s.scanned_at DESC
      LIMIT ?
    `;
    return await query(sql, [userId, Number(limit)]);
  } catch (e) {
    console.warn('[DB getStudentAttendanceScans fallback]', e.message);
    return [];
  }
};
