import { query } from '../config/db.js';

export const findinterviews = async () => {
  return await query('SELECT * FROM interviews');
};

export const createInterviewSessionModel = async ({
  user_id,
  student_id = null,
  interview_type = 'Technical Mock',
  overall_score = 0,
  grade = 'Average',
  feedback = '',
  conducted_date = null,
  status = 'Completed',
  details = null,
}) => {
  const date = conducted_date || new Date().toISOString().slice(0, 10);
  const res = await query(
    `INSERT INTO interview_sessions
       (user_id, student_id, interview_type, overall_score, grade, feedback, conducted_date, status, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      student_id || user_id,
      interview_type,
      Number(overall_score) || 0,
      grade,
      feedback,
      date,
      status,
      details ? JSON.stringify(details) : null,
    ]
  );
  return getInterviewSessionByIdModel(res.insertId);
};

export const getInterviewSessionByIdModel = async (id) => {
  const rows = await query('SELECT * FROM interview_sessions WHERE id = ?', [id]);
  if (!rows || rows.length === 0) return null;
  const session = rows[0];
  if (typeof session.details === 'string') {
    try {
      session.details = JSON.parse(session.details);
    } catch {
      session.details = null;
    }
  }
  return session;
};

export const findInterviewSessionsByUserModel = async (userId, limit = 50) => {
  const rows = await query(
    'SELECT id, interview_type, overall_score, grade, feedback, conducted_date, status, details, created_at FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?',
    [userId, Number(limit) || 50]
  );
  return (rows || []).map((session) => {
    if (typeof session.details === 'string') {
      try {
        session.details = JSON.parse(session.details);
      } catch {
        session.details = null;
      }
    }
    return session;
  });
};