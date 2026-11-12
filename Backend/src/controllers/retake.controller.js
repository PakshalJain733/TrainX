import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

/**
 * GET /api/v1/retakes
 * List all granted retake permissions for a specific task or practice problem.
 * Query: target_type ('task' | 'practice'), target_id (integer)
 */
export const getRetakesByTarget = async (req, res, next) => {
  try {
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

      let sql = `
        SELECT DISTINCT u.id, u.name, u.email,
               COALESCE(s.roll_number, s.clg_id, u.id) as roll_number,
               ts.status as submission_status,
               ts.score as marks_obtained,
               ts.submitted_at,
               (SELECT crp.status FROM coding_retake_permissions crp 
                WHERE crp.target_type = 'task' AND crp.target_id = ? AND crp.student_id = u.id AND crp.status = 'pending' LIMIT 1) as active_retake_status
        FROM users u
        LEFT JOIN students s ON u.id = s.user_id
        LEFT JOIN student_batches sb ON u.id = sb.user_id
        LEFT JOIN task_submissions ts ON ts.task_id = ? AND ts.user_id = u.id AND ts.batch_id = ?
        WHERE u.role = 'student'
          AND (sb.batch_id = ? OR s.batch_id = ?)
      `;
      const params = [cleanId, cleanId, taskRow.batch_id, taskRow.batch_id, taskRow.batch_id];

      if (search) {
        sql += ` AND (u.name LIKE ? OR u.email LIKE ? OR s.roll_number LIKE ?)`;
        const wildcard = `%${search}%`;
        params.push(wildcard, wildcard, wildcard);
      }

      sql += ` ORDER BY u.name ASC LIMIT 100`;
      students = await query(sql, params);
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
               (SELECT cs.status FROM coding_submissions cs WHERE cs.problem_id = ? AND (cs.student_id = u.id) ORDER BY cs.id DESC LIMIT 1) as submission_status,
               (SELECT cs.score FROM coding_submissions cs WHERE cs.problem_id = ? AND (cs.student_id = u.id) ORDER BY cs.id DESC LIMIT 1) as marks_obtained,
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
      students = await query(sql, params);
    }

    return sendSuccess(res, 'Eligible students retrieved', students || []);
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
    const { target_type, target_id, student_ids, reason } = req.body;
    const cleanType = String(target_type || '').toLowerCase().trim();
    const cleanId = parseInt(String(target_id).replace(/[^0-9]/g, ''), 10);

    if (!cleanType || !['task', 'practice'].includes(cleanType) || isNaN(cleanId)) {
      return sendError(res, 'Valid target_type (task or practice) and target_id are required.', 400);
    }

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return sendError(res, 'Please select at least one student to grant retake permission.', 400);
    }

    const grantedBy = req.user?.userId || req.user?.id;
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
