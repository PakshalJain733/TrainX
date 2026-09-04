import { query } from '../config/db.js';

// ─── Assessments ────────────────────────────────────────────────────────────

export const findAssessments = async (filters = {}) => {
  let sql = `
    SELECT a.*, u.name AS created_by_name, c.name AS college_name
    FROM assessments a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN colleges c ON a.college_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (filters.college_id) {
    sql += ' AND a.college_id = ?';
    params.push(filters.college_id);
  }
  if (filters.batch_id) {
    sql += ' AND a.batch_id = ?';
    params.push(filters.batch_id);
  }
  if (filters.status) {
    sql += ' AND a.status = ?';
    params.push(filters.status);
  }

  sql += ' ORDER BY a.id DESC';
  return await query(sql, params);
};

export const findAssessmentById = async (id) => {
  const rows = await query(`
    SELECT a.*, u.name AS created_by_name, c.name AS college_name
    FROM assessments a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN colleges c ON a.college_id = c.id
    WHERE a.id = ?
  `, [id]);
  return rows[0];
};

export const createAssessment = async ({ title, description, college_id, batch_id, created_by, duration_minutes, total_marks, pass_marks, status }) => {
  const result = await query(
    `INSERT INTO assessments (title, description, college_id, batch_id, created_by, duration_minutes, total_marks, pass_marks, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, college_id || null, batch_id || null, created_by, duration_minutes || null, total_marks || 0, pass_marks || 0, status || 'draft']
  );
  return findAssessmentById(result.insertId);
};

export const updateAssessment = async (id, { title, description, college_id, batch_id, duration_minutes, total_marks, pass_marks, status }) => {
  await query(
    `UPDATE assessments SET title=?, description=?, college_id=?, batch_id=?, duration_minutes=?, total_marks=?, pass_marks=?, status=?
     WHERE id = ?`,
    [title, description || null, college_id || null, batch_id || null, duration_minutes || null, total_marks, pass_marks, status, id]
  );
  return findAssessmentById(id);
};

export const deleteAssessment = async (id) => {
  return await query('DELETE FROM assessments WHERE id = ?', [id]);
};

export const publishAssessment = async (id) => {
  await query("UPDATE assessments SET status = 'published' WHERE id = ?", [id]);
  return findAssessmentById(id);
};

// ─── Questions ──────────────────────────────────────────────────────────────

export const findQuestionsByAssessment = async (assessmentId, includeCorrect = false) => {
  const columns = includeCorrect
    ? 'id, assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order'
    : 'id, assessment_id, question_text, option_a, option_b, option_c, option_d, marks, question_order';

  return await query(
    `SELECT ${columns} FROM assessment_questions WHERE assessment_id = ? ORDER BY question_order ASC, id ASC`,
    [assessmentId]
  );
};

export const findQuestionById = async (id) => {
  const rows = await query('SELECT * FROM assessment_questions WHERE id = ?', [id]);
  return rows[0];
};

export const createQuestion = async ({ assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order }) => {
  const result = await query(
    `INSERT INTO assessment_questions (assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [assessment_id, question_text, option_a, option_b, option_c, option_d, correct_option, marks || 1, question_order || 0]
  );
  return findQuestionById(result.insertId);
};

export const updateQuestion = async (id, { question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order }) => {
  await query(
    `UPDATE assessment_questions SET question_text=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_option=?, marks=?, question_order=?
     WHERE id = ?`,
    [question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order, id]
  );
  return findQuestionById(id);
};

export const deleteQuestion = async (id) => {
  return await query('DELETE FROM assessment_questions WHERE id = ?', [id]);
};

// ─── Attempts ───────────────────────────────────────────────────────────────

export const findAttemptById = async (id) => {
  const rows = await query('SELECT * FROM assessment_attempts WHERE id = ?', [id]);
  return rows[0];
};

export const findAttemptByUserAndAssessment = async (userId, assessmentId) => {
  const rows = await query(
    "SELECT * FROM assessment_attempts WHERE user_id = ? AND assessment_id = ? AND status = 'completed' LIMIT 1",
    [userId, assessmentId]
  );
  return rows[0];
};

export const findAttemptsByUser = async (userId) => {
  return await query(`
    SELECT aa.*, a.title AS assessment_title, a.total_marks
    FROM assessment_attempts aa
    JOIN assessments a ON aa.assessment_id = a.id
    WHERE aa.user_id = ?
    ORDER BY aa.id DESC
  `, [userId]);
};

export const createAttempt = async ({ user_id, assessment_id }) => {
  const result = await query(
    `INSERT INTO assessment_attempts (user_id, assessment_id, started_at, status)
     VALUES (?, ?, NOW(), 'in_progress')`,
    [user_id, assessment_id]
  );
  return findAttemptById(result.insertId);
};

export const completeAttempt = async (id, { score, percentage, total_questions, correct_answers }) => {
  await query(
    `UPDATE assessment_attempts SET score=?, percentage=?, total_questions=?, correct_answers=?, submitted_at=NOW(), status='completed'
     WHERE id = ?`,
    [score, percentage, total_questions, correct_answers, id]
  );
  return findAttemptById(id);
};

// ─── Answers ────────────────────────────────────────────────────────────────

export const saveAnswer = async ({ attempt_id, question_id, selected_option, is_correct, marks_awarded }) => {
  const result = await query(
    `INSERT INTO assessment_answers (attempt_id, question_id, selected_option, is_correct, marks_awarded)
     VALUES (?, ?, ?, ?, ?)`,
    [attempt_id, question_id, selected_option || null, is_correct ? 1 : 0, marks_awarded || 0]
  );
  return result.insertId;
};

export const findAnswersByAttempt = async (attemptId) => {
  return await query(`
    SELECT aa.*, aq.question_text, aq.option_a, aq.option_b, aq.option_c, aq.option_d, aq.correct_option
    FROM assessment_answers aa
    JOIN assessment_questions aq ON aa.question_id = aq.id
    WHERE aa.attempt_id = ?
  `, [attemptId]);
};
