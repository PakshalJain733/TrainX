import { query } from '../config/db.js';

const mockAssessments = [];

const mockQuestions = [];

const mockAttempts = [];
const mockAnswers = [];

// ─── Assessments ─────────────────────────────────────────────────────────────

export const getAssessmentsModel = async (collegeId = null) => {
  try {
    let sql = 'SELECT * FROM assessments WHERE is_published = TRUE';
    const params = [];
    if (collegeId) {
      sql += ' AND (college_id = ? OR college_id IS NULL)';
      params.push(parseInt(collegeId, 10));
    }
    sql += ' ORDER BY id ASC';
    const results = await query(sql, params);
    if (results && Array.isArray(results) && results.length > 0) return results;
  } catch (error) {
    console.warn(`[Assessment Model] Database query fallback: ${error.message}`);
  }

  return mockAssessments.filter((a) => {
    if (!collegeId) return true;
    return !a.college_id || a.college_id === parseInt(collegeId, 10);
  });
};

export const findAssessments = async (filters = {}) => {
  let sql = `
    SELECT a.*, u.name AS created_by_name, c.name AS college_name, b.name AS batch_name
    FROM assessments a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN colleges c ON a.college_id = c.id
    LEFT JOIN batches b ON a.batch_id = b.id
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
  const rows = await query(sql, params);

  if (Array.isArray(rows)) {
    for (const a of rows) {
      const qRows = await query(
        `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order
         FROM assessment_questions WHERE assessment_id = ? ORDER BY question_order ASC, id ASC`,
        [a.id]
      );
      a.questions = qRows || [];
      a.total_questions = a.questions.length;
    }
  }

  return rows || [];
};


export const getAssessmentByIdModel = async (id) => {
  const numId = parseInt(id, 10);
  try {
    const results = await query('SELECT * FROM assessments WHERE id = ?', [numId]);
    if (results && results.length > 0) return results[0];
  } catch (error) {
    console.warn(`[Assessment Model] Database query fallback: ${error.message}`);
  }
  return mockAssessments.find((a) => a.id === numId) || null;
};

export const findAssessmentById = async (id) => {
  const rows = await query(`
    SELECT a.*, u.name AS created_by_name, c.name AS college_name, b.name AS batch_name
    FROM assessments a
    LEFT JOIN users u ON a.created_by = u.id
    LEFT JOIN colleges c ON a.college_id = c.id
    LEFT JOIN batches b ON a.batch_id = b.id
    WHERE a.id = ?
  `, [id]);
  return rows[0] || (await getAssessmentByIdModel(id));
};

export const createAssessment = async ({ title, description, college_id, batch_id, created_by, duration_minutes, total_marks, pass_marks, status }) => {
  const isPub = (status === 'published') ? 1 : 0;
  let creatorId = null;
  if (created_by) {
    const existingUser = await query('SELECT id FROM users WHERE id = ?', [created_by]);
    if (existingUser && existingUser.length > 0) {
      creatorId = existingUser[0].id;
    }
  }
  const result = await query(
    `INSERT INTO assessments (title, description, college_id, batch_id, created_by, duration_minutes, total_marks, pass_marks, status, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, college_id || null, batch_id || null, creatorId, duration_minutes || null, total_marks || 0, pass_marks || 0, status || 'published', isPub]
  );
  return findAssessmentById(result.insertId);
};

export const updateAssessment = async (id, { title, description, college_id, batch_id, duration_minutes, total_marks, pass_marks, status }) => {
  const isPub = (status === 'published') ? 1 : 0;
  await query(
    `UPDATE assessments SET title=?, description=?, college_id=?, batch_id=?, duration_minutes=?, total_marks=?, pass_marks=?, status=?, is_published=?
     WHERE id = ?`,
    [title, description || null, college_id || null, batch_id || null, duration_minutes || null, total_marks, pass_marks, status, isPub, id]
  );
  return findAssessmentById(id);
};


export const deleteAssessment = async (id) => {
  return await query('DELETE FROM assessments WHERE id = ?', [id]);
};

export const publishAssessment = async (id) => {
  await query("UPDATE assessments SET status = 'published', is_published = TRUE WHERE id = ?", [id]);
  return findAssessmentById(id);
};

// ─── Questions ──────────────────────────────────────────────────────────────

export const getAssessmentQuestionsModel = async (assessmentId, includeAnswers = false) => {
  const numId = parseInt(assessmentId, 10);
  try {
    let sql = 'SELECT id, assessment_id, question_text, option_a, option_b, option_c, option_d, marks';
    if (includeAnswers) {
      sql += ', correct_option, explanation';
    }
    sql += ' FROM assessment_questions WHERE assessment_id = ? ORDER BY question_order ASC, id ASC';
    const results = await query(sql, [numId]);
    if (results && Array.isArray(results) && results.length > 0) return results;
  } catch (error) {
    console.warn(`[Assessment Model] Database query fallback: ${error.message}`);
  }

  return mockQuestions
    .filter((q) => q.assessment_id === numId)
    .map((q) => {
      if (includeAnswers) return { ...q };
      const { correct_option, explanation, ...safeQ } = q;
      return safeQ;
    });
};

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

export const saveAssessmentAttemptModel = async (attemptData) => {
  const {
    assessment_id,
    user_id,
    college_id = 1,
    total_questions,
    attempted_questions,
    correct_count,
    incorrect_count,
    unattempted_count,
    marks_obtained,
    total_marks,
    percentage,
    status,
    answers = [],
  } = attemptData;

  let attemptId = null;

  try {
    const res = await query(
      `INSERT INTO assessment_attempts 
        (assessment_id, user_id, college_id, total_questions, attempted_questions, correct_count, incorrect_count, unattempted_count, marks_obtained, total_marks, percentage, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assessment_id,
        user_id,
        college_id,
        total_questions,
        attempted_questions,
        correct_count,
        incorrect_count,
        unattempted_count,
        marks_obtained,
        total_marks,
        percentage,
        status,
      ]
    );

    if (res && res.insertId) {
      attemptId = res.insertId;
      for (const ans of answers) {
        await query(
          'INSERT INTO assessment_answers (attempt_id, question_id, selected_option, is_correct, marks_awarded) VALUES (?, ?, ?, ?, ?)',
          [attemptId, ans.question_id, ans.selected_option, ans.is_correct ? 1 : 0, ans.marks_awarded]
        );
      }
    }
  } catch (error) {
    console.warn(`[Assessment Model] Database save attempt fallback: ${error.message}`);
  }

  if (!attemptId) {
    attemptId = mockAttempts.length + 1;
  }

  const newAttempt = {
    id: attemptId,
    assessment_id,
    user_id,
    college_id,
    total_questions,
    attempted_questions,
    correct_count,
    incorrect_count,
    unattempted_count,
    marks_obtained,
    total_marks,
    percentage,
    status,
    created_at: new Date(),
    answers,
  };

  mockAttempts.push(newAttempt);
  answers.forEach((ans) => {
    mockAnswers.push({
      id: mockAnswers.length + 1,
      attempt_id: attemptId,
      ...ans,
    });
  });

  return newAttempt;
};

export const getStudentAttemptsModel = async (userId) => {
  const numId = parseInt(userId, 10);
  try {
    const results = await query(
      `SELECT a.*, asm.title as assessment_title, asm.category, asm.total_marks as assessment_total_marks, asm.duration_minutes
       FROM assessment_attempts a
       JOIN assessments asm ON a.assessment_id = asm.id
       WHERE a.user_id = ?
       ORDER BY a.id DESC`,
      [numId]
    );
    if (results && Array.isArray(results) && results.length > 0) return results;
  } catch (error) {
    console.warn(`[Assessment Model] Database query attempts fallback: ${error.message}`);
  }

  return mockAttempts.filter((a) => a.user_id === numId);
};

export const startAttemptModel = async (assessmentId, userId) => {
  const numAssId = parseInt(assessmentId, 10);
  const numUserId = parseInt(userId, 10);

  try {
    const existing = await query(
      `SELECT * FROM assessment_attempts 
       WHERE assessment_id = ? AND user_id = ? 
       ORDER BY id DESC LIMIT 1`,
      [numAssId, numUserId]
    );
    if (existing && existing.length > 0) return existing[0];
  } catch (error) {
    console.warn(`[Assessment Model] startAttemptModel check fallback: ${error.message}`);
    const mockExisting = mockAttempts
      .filter((a) => a.assessment_id === numAssId && a.user_id === numUserId)
      .sort((a, b) => b.id - a.id)[0];
    if (mockExisting) return mockExisting;
  }

  let newAttemptId = null;
  try {
    const res = await query(
      `INSERT INTO assessment_attempts 
         (assessment_id, user_id, status) 
       VALUES (?, ?, 'in_progress')`,
      [numAssId, numUserId]
    );
    if (res && res.insertId) {
      newAttemptId = res.insertId;
      const rows = await query('SELECT * FROM assessment_attempts WHERE id = ?', [newAttemptId]);
      if (rows && rows.length > 0) return rows[0];
    }
  } catch (error) {
    console.warn(`[Assessment Model] startAttemptModel insert fallback: ${error.message}`);
  }

  const mockAttempt = {
    id: newAttemptId || mockAttempts.length + 1,
    assessment_id: numAssId,
    user_id: numUserId,
    status: 'in_progress',
    created_at: new Date(),
  };
  mockAttempts.push(mockAttempt);
  return mockAttempt;
};

export const getAttemptByIdModel = async (attemptId) => {
  const numId = parseInt(attemptId, 10);
  try {
    const results = await query(
      `SELECT a.*, asm.title as assessment_title, asm.passing_percentage,
              asm.total_marks as assessment_total_marks, asm.category
       FROM assessment_attempts a
       JOIN assessments asm ON a.assessment_id = asm.id
       WHERE a.id = ?`,
      [numId]
    );
    if (results && results.length > 0) return results[0];
  } catch (error) {
    console.warn(`[Assessment Model] getAttemptByIdModel fallback: ${error.message}`);
  }
  return mockAttempts.find((a) => a.id === numId) || null;
};

export const updateAttemptModel = async (attemptId, updateData) => {
  const numId = parseInt(attemptId, 10);
  const {
    total_questions,
    attempted_questions,
    correct_count,
    incorrect_count,
    unattempted_count,
    marks_obtained,
    total_marks,
    percentage,
    status,
  } = updateData;

  try {
    await query(
      `UPDATE assessment_attempts
       SET total_questions = ?, attempted_questions = ?, correct_count = ?,
           incorrect_count = ?, unattempted_count = ?, marks_obtained = ?,
           total_marks = ?, percentage = ?, status = ?, submitted_at = NOW()
       WHERE id = ?`,
      [
        total_questions,
        attempted_questions,
        correct_count,
        incorrect_count,
        unattempted_count,
        marks_obtained,
        total_marks,
        percentage,
        status,
        numId,
      ]
    );
  } catch (error) {
    console.warn(`[Assessment Model] updateAttemptModel fallback: ${error.message}`);
  }

  const mockAttempt = mockAttempts.find((a) => a.id === numId);
  if (mockAttempt) {
    Object.assign(mockAttempt, { ...updateData, submitted_at: new Date() });
  }

  return { id: numId, ...updateData, submitted_at: new Date() };
};

export const saveAnswersModel = async (attemptId, answers = []) => {
  const numId = parseInt(attemptId, 10);

  try {
    for (const ans of answers) {
      await query(
        `INSERT INTO assessment_answers 
           (attempt_id, question_id, selected_option, is_correct, marks_awarded) 
         VALUES (?, ?, ?, ?, ?)`,
        [numId, ans.question_id, ans.selected_option || null, ans.is_correct ? 1 : 0, ans.marks_awarded]
      );
    }
  } catch (error) {
    console.warn(`[Assessment Model] saveAnswersModel fallback: ${error.message}`);
  }

  answers.forEach((ans) => {
    mockAnswers.push({
      id: mockAnswers.length + 1,
      attempt_id: numId,
      ...ans,
    });
  });

  return answers;
};

export const getAttemptAnswersModel = async (attemptId) => {
  const numId = parseInt(attemptId, 10);
  try {
    const results = await query(
      `SELECT aa.*, aq.question_text, aq.option_a, aq.option_b, aq.option_c, aq.option_d,
              aq.correct_option, aq.explanation, aq.marks
       FROM assessment_answers aa
       JOIN assessment_questions aq ON aa.question_id = aq.id
       WHERE aa.attempt_id = ?
       ORDER BY aa.id ASC`,
      [numId]
    );
    if (results && Array.isArray(results) && results.length > 0) return results;
  } catch (error) {
    console.warn(`[Assessment Model] getAttemptAnswersModel fallback: ${error.message}`);
  }
  return mockAnswers.filter((a) => a.attempt_id === numId);
};

// ─── Pakshal's direct DB functions (no fallback) ────────────────────────────

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
