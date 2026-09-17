import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

export const getInterventions = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;

    let sql = `
      SELECT i.*, u.name as student_name, u.email as student_email, s.roll_number, b.name as batch_name,
             m.name as mentor_name
      FROM interventions i
      JOIN users u ON i.student_id = u.id
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN batches b ON s.batch_id = b.id
      LEFT JOIN users m ON i.mentor_id = m.id
      WHERE i.college_id = ?
    `;
    const params = [collegeId];

    if (userRole === 'student') {
      sql += ' AND i.student_id = ?';
      params.push(userId);
    }

    sql += ' ORDER BY i.id DESC';
    const rows = await query(sql, params);
    return sendSuccess(res, 'Interventions retrieved successfully', rows);
  } catch (error) {
    next(error);
  }
};

export const getInterventionData = getInterventions;

export const createIntervention = async (req, res, next) => {
  try {
    const mentorId = req.user?.userId || req.user?.id;
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const { student_id, studentId, type, title, notes, action_taken, status, date } = req.body;

    const targetStudentId = student_id || studentId;
    if (!targetStudentId || !title) {
      return sendError(res, 'Student ID and title are required', 400);
    }

    const numStudentId = parseInt(String(targetStudentId).replace('st-', ''), 10);
    const interventionDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO interventions (college_id, student_id, mentor_id, type, title, notes, action_taken, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [collegeId, numStudentId, mentorId, type || 'warning', title, notes || '', action_taken || '', status || 'pending', interventionDate]
    );

    return sendSuccess(res, 'Intervention logged successfully', { id: result.insertId }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateIntervention = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, action_taken, notes } = req.body;

    await query(
      `UPDATE interventions SET status = COALESCE(?, status), action_taken = COALESCE(?, action_taken), notes = COALESCE(?, notes) WHERE id = ?`,
      [status || null, action_taken || null, notes || null, id]
    );

    return sendSuccess(res, 'Intervention updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getDefaulters = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;

    const defaulters = await query(
      `SELECT u.id, u.name, u.email, u.mobile_number, s.roll_number, s.department, b.name as batch_name,
              COALESCE(att.attendance_percentage, 0) as attendance,
              COALESCE(att.total_classes, 0) as total_classes,
              COALESCE(att.absent_count, 0) as absent_count,
              COALESCE(ROUND(AVG(aa.percentage), 1), 0) as avg_quiz_score
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE u.college_id = ? AND u.role = 'student'
       GROUP BY u.id, s.id, b.id, att.id
       HAVING attendance < 75 OR avg_quiz_score < 50
       ORDER BY attendance ASC`,
      [collegeId]
    );

    return sendSuccess(res, 'Defaulters retrieved successfully', defaulters);
  } catch (error) {
    next(error);
  }
};
