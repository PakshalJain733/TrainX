import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

let tableEnsured = false;
export const ensureRetakeTableExists = async () => {
  if (tableEnsured) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS coding_retake_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_type VARCHAR(20) NOT NULL,
        target_id INT NOT NULL,
        batch_id INT NULL,
        student_id INT NOT NULL,
        granted_by INT NOT NULL,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        used_at TIMESTAMP NULL,
        submission_id INT NULL,
        reason VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_retake_lookup (target_type, target_id, student_id, status),
        INDEX idx_retake_student (student_id),
        INDEX idx_retake_target (target_type, target_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    try { await query("ALTER TABLE coding_submissions ADD COLUMN is_retake BOOLEAN DEFAULT FALSE"); } catch (_) {}
    try { await query("ALTER TABLE coding_submissions ADD COLUMN retake_permission_id INT NULL"); } catch (_) {}
    try { await query("ALTER TABLE task_submissions ADD COLUMN attempt_number INT DEFAULT 1"); } catch (_) {}
    try { await query("ALTER TABLE task_submissions ADD COLUMN is_retake BOOLEAN DEFAULT FALSE"); } catch (_) {}
    try { await query("ALTER TABLE task_submissions ADD COLUMN retake_permission_id INT NULL"); } catch (_) {}
    tableEnsured = true;
  } catch (err) {
    console.error("[ensureRetakeTableExists error]", err.message);
  }
};

/**
 * GET /api/v1/retakes
 * List all granted retake permissions for a specific task or practice problem.
 * Query: target_type ('task' | 'practice'), target_id (integer)
 */
export const getRetakesByTarget = async (req, res, next) => {
  try {
    await ensureRetakeTableExists();
    const { target_type, target_id } = req.query;
    const cleanType = String(target_type || '').toLowerCase().trim();
    const cleanId = parseInt(String(target_id).replace(/[^0-9]/g, ''), 10);

    if (!cleanType || !['task', 'practice'].includes(cleanType) || isNaN(cleanId)) {
      return sendError(res, 'Valid target_type (task or practice) and target_id are required.', 400);
    }

    const rows = await query(
      `SELECT crp.*,
              u.name as student_name,
              u.email as student_email,
              COALESCE(s.roll_number, s.clg_id, u.id) as roll_number,
              admin_u.name as granted_by_name
       FROM coding_retake_permissions crp
       JOIN users u ON crp.student_id = u.id
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN users admin_u ON crp.granted_by = admin_u.id
       WHERE crp.target_type = ? AND crp.target_id = ?
       ORDER BY crp.id DESC`,
      [cleanType, cleanId]
    );

    return sendSuccess(res, 'Retakes retrieved successfully', rows || []);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/retakes/eligible-students
 * Search and list students eligible to be granted retakes for a task or practice problem.
 * Query: target_type ('task' | 'practice'), target_id (integer), q (search string)
 */
export const getEligibleStudentsForRetake = async (req, res, next) => {
  try {
    await ensureRetakeTableExists();
    const { target_type, target_id, q: searchTerm } = req.query;
    const cleanType = String(target_type || '').toLowerCase().trim();
    const cleanId = parseInt(String(target_id).replace(/[^0-9]/g, ''), 10);
    const search = String(searchTerm || '').trim();

    if (!cleanType || !['task', 'practice'].includes(cleanType) || isNaN(cleanId)) {
      return sendError(res, 'Valid target_type (task or practice) and target_id are required.', 400);
    }

    let students = [];

    if (cleanType === 'task') {
      // 1. Get task's batch_id
      const [taskRow] = await query('SELECT id, batch_id FROM batch_tasks WHERE id = ? LIMIT 1', [cleanId]);
      if (!taskRow) {
        return sendError(res, 'Batch task not found', 404);
      }

      const batchIdNum = parseInt(taskRow.batch_id, 10) || 0;
      const batchIdStr = String(taskRow.batch_id);

      let sql = `
        SELECT DISTINCT u.id, u.name, u.email,
               COALESCE(s.roll_number, s.clg_id, u.id) as roll_number,
               (SELECT ts.status FROM task_submissions ts WHERE ts.task_id = ? AND ts.user_id = u.id ORDER BY ts.id DESC LIMIT 1) as submission_status,
               (SELECT COALESCE(ts.marks_obtained, 0) FROM task_submissions ts WHERE ts.task_id = ? AND ts.user_id = u.id ORDER BY ts.id DESC LIMIT 1) as marks_obtained,
               (SELECT ts.submitted_at FROM task_submissions ts WHERE ts.task_id = ? AND ts.user_id = u.id ORDER BY ts.id DESC LIMIT 1) as submitted_at,
               (SELECT crp.status FROM coding_retake_permissions crp 
                WHERE crp.target_type = 'task' AND crp.target_id = ? AND crp.student_id = u.id AND crp.status = 'pending' LIMIT 1) as active_retake_status
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN student_batches sb ON u.id = sb.user_id
        WHERE (u.role = 'student' OR u.role IS NULL)
          AND (sb.batch_id = ? OR sb.batch_id = ? OR s.batch_id = ? OR s.batch_id = ?)
      `;
      const params = [cleanId, cleanId, cleanId, cleanId, batchIdNum, batchIdStr, batchIdNum, batchIdStr];

      if (search) {
        sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR s.roll_number LIKE ?)`;
        const wildcard = `%${search}%`;
        params.push(wildcard, wildcard, wildcard);
      }

      sql += ` ORDER BY u.name ASC LIMIT 100`;
      const rawStudents = await query(sql, params);

      students = (rawStudents || []).map((st) => ({
        id: st.id,
        name: st.name,
        email: st.email,
        roll_number: st.roll_number,
        submission_status: st.submission_status || null,
        current_status: st.submission_status || null,
        marks_obtained: st.marks_obtained !== undefined && st.marks_obtained !== null ? Number(st.marks_obtained) : null,
        current_score: st.marks_obtained !== undefined && st.marks_obtained !== null ? Number(st.marks_obtained) : null,
        submitted_at: st.submitted_at || null,
        active_retake_status: st.active_retake_status || null,
        has_active_retake: st.active_retake_status === 'pending',
      }));
    } else {
      // 2. Practice problem: Search students in college
      const [probRow] = await query('SELECT id, college_id FROM practice_problems WHERE id = ? LIMIT 1', [cleanId]);
      if (!probRow) {
        return sendError(res, 'Practice problem not found', 404);
      }

      const collegeId = probRow.college_id || req.user?.college_id || req.user?.collegeId;
      let sql = `
        SELECT DISTINCT u.id, u.name, u.email,
               COALESCE(s.roll_number, s.clg_id, u.id) as roll_number,
               (SELECT cs.status FROM coding_submissions cs WHERE cs.problem_id = ? AND cs.student_id = u.id ORDER BY cs.id DESC LIMIT 1) as submission_status,
               (SELECT cs.score FROM coding_submissions cs WHERE cs.problem_id = ? AND cs.student_id = u.id ORDER BY cs.id DESC LIMIT 1) as marks_obtained,
               (SELECT crp.status FROM coding_retake_permissions crp 
                WHERE crp.target_type = 'practice' AND crp.target_id = ? AND crp.student_id = u.id AND crp.status = 'pending' LIMIT 1) as active_retake_status
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        WHERE u.role = 'student'
      `;
      const params = [cleanId, cleanId, cleanId];

      if (collegeId && req.user?.role !== ROLES.SUPER_ADMIN) {
        sql += ` AND u.college_id = ?`;
        params.push(collegeId);
      }

      if (search) {
        sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR s.roll_number LIKE ?)`;
        const wildcard = `%${search}%`;
        params.push(wildcard, wildcard, wildcard);
      }

      sql += ` ORDER BY u.name ASC LIMIT 100`;
      const rawStudents = await query(sql, params);

      students = (rawStudents || []).map((st) => ({
        id: st.id,
        name: st.name,
        email: st.email,
        roll_number: st.roll_number,
        submission_status: st.submission_status || null,
        current_status: st.submission_status || null,
        marks_obtained: st.marks_obtained !== undefined && st.marks_obtained !== null ? Number(st.marks_obtained) : null,
        current_score: st.marks_obtained !== undefined && st.marks_obtained !== null ? Number(st.marks_obtained) : null,
        active_retake_status: st.active_retake_status || null,
        has_active_retake: st.active_retake_status === 'pending',
      }));
    }

    return sendSuccess(res, 'Eligible students retrieved', students);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/retakes/grant
 * Grant retake permissions to selected students.
 * Body: { target_type, target_id, student_ids: [1, 2, ...], reason }
 */
export const grantRetake = async (req, res, next) => {
  try {
    await ensureRetakeTableExists();
    const { target_type, target_id, student_ids, reason } = req.body;
    const cleanType = String(target_type || '').toLowerCase().trim();
    const cleanId = parseInt(String(target_id).replace(/[^0-9]/g, ''), 10);

    if (!cleanType || !['task', 'practice'].includes(cleanType) || isNaN(cleanId)) {
      return sendError(res, 'Valid target_type (task or practice) and target_id are required.', 400);
    }

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return sendError(res, 'Please select at least one student to grant retake permission.', 400);
    }

    const grantedBy = req.user?.userId || req.user?.id || 1;
    let batchId = null;

    if (cleanType === 'task') {
      const [t] = await query('SELECT batch_id FROM batch_tasks WHERE id = ? LIMIT 1', [cleanId]);
      if (!t) return sendError(res, 'Batch task not found', 404);
      batchId = t.batch_id;
    }

    let grantedCount = 0;
    let skippedCount = 0;
    const grantedIds = [];

    for (const sid of student_ids) {
      const cleanStudentId = parseInt(sid, 10);
      if (isNaN(cleanStudentId)) continue;

      // Check if student already has a pending retake for this target
      const [existing] = await query(
        `SELECT id FROM coding_retake_permissions 
         WHERE target_type = ? AND target_id = ? AND student_id = ? AND status = 'pending' 
         LIMIT 1`,
        [cleanType, cleanId, cleanStudentId]
      );

      if (existing) {
        skippedCount++;
        continue;
      }

      const insRes = await query(
        `INSERT INTO coding_retake_permissions 
         (target_type, target_id, batch_id, student_id, granted_by, status, reason, granted_at)
         VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
        [cleanType, cleanId, batchId, cleanStudentId, grantedBy, reason || 'Admin granted retake']
      );
      if (insRes && insRes.insertId) {
        grantedIds.push(insRes.insertId);
      }
      grantedCount++;
    }

    return sendSuccess(res, `Retake permission granted to ${grantedCount} student(s).${skippedCount > 0 ? ` (${skippedCount} already had pending retakes)` : ''}`, {
      grantedCount,
      skippedCount,
      grantedIds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/retakes/revoke
 * Revoke an unused (pending) retake permission.
 * Body: { retake_id }
 */
export const revokeRetake = async (req, res, next) => {
  try {
    await ensureRetakeTableExists();
    const { retake_id } = req.body;
    const cleanRetakeId = parseInt(retake_id, 10);
    if (!cleanRetakeId) {
      return sendError(res, 'Valid retake_id is required', 400);
    }

    const [retake] = await query(
      `SELECT * FROM coding_retake_permissions WHERE id = ? LIMIT 1`,
      [cleanRetakeId]
    );

    if (!retake) {
      return sendError(res, 'Retake permission record not found', 404);
    }

    if (retake.status === 'used') {
      return sendError(res, 'Cannot revoke a retake that has already been attempted or used by the student.', 400);
    }

    if (retake.status === 'revoked') {
      return sendError(res, 'This retake permission has already been revoked.', 400);
    }

    await query(
      `UPDATE coding_retake_permissions SET status = 'revoked', updated_at = NOW() WHERE id = ?`,
      [cleanRetakeId]
    );

    return sendSuccess(res, 'Retake permission revoked successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/retakes/status
 * Check student's active retake status for a target.
 * Query: target_type, target_id
 */
export const checkStudentRetakeStatus = async (req, res, next) => {
  try {
    await ensureRetakeTableExists();
    const { target_type, target_id } = req.query;
    const cleanType = String(target_type || '').toLowerCase().trim();
    const cleanId = parseInt(String(target_id).replace(/[^0-9]/g, ''), 10);
    const studentId = req.user?.userId || req.user?.id;

    if (!cleanType || !['task', 'practice'].includes(cleanType) || isNaN(cleanId) || !studentId) {
      return sendError(res, 'target_type and target_id are required', 400);
    }

    const [activeRetake] = await query(
      `SELECT id, target_type, target_id, granted_at, reason, status
       FROM coding_retake_permissions 
       WHERE target_type = ? AND target_id = ? AND student_id = ? AND status = 'pending' 
       ORDER BY id DESC LIMIT 1`,
      [cleanType, cleanId, studentId]
    );

    return sendSuccess(res, 'Retake status checked', {
      retakeAvailable: Boolean(activeRetake),
      retake: activeRetake || null,
      retakePermission: activeRetake || null,
    });
  } catch (error) {
    next(error);
  }
};
