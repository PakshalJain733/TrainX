import { query } from '../config/db.js';

const formatDbDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) {
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val).slice(0, 10);
};

// Get all practice problems
export const getPracticeProblemsModel = async ({ collegeId = null, batchId = null, difficulty = null } = {}) => {
  try {
    let sql = `
      SELECT p.*, b.name AS associated_batch_name
      FROM practice_problems p
      LEFT JOIN batches b ON p.batch_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (collegeId) {
      sql += ' AND (p.college_id = ? OR p.college_id IS NULL)';
      params.push(parseInt(collegeId, 10));
    }
    if (batchId && batchId !== 'All') {
      sql += ' AND (p.batch_id = ? OR p.batch_name = "All Batches" OR p.batch_id IS NULL)';
      params.push(parseInt(batchId, 10));
    }
    if (difficulty && difficulty !== 'All') {
      sql += ' AND p.difficulty = ?';
      params.push(difficulty);
    }

    sql += ' ORDER BY p.id DESC';

    const results = await query(sql, params);
    if (results && Array.isArray(results)) {
      return results.map(r => ({
        ...r,
        tags: r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        batch: r.batch_name || r.associated_batch_name || 'All Batches',
        due_date: formatDbDate(r.due_date),
        dueDate: formatDbDate(r.due_date),
      }));
    }
  } catch (error) {
    console.error(`[Practice Problem Model] Database query error: ${error.message}`);
  }
  return [];
};

// Get single problem by ID
export const getPracticeProblemByIdModel = async (id, { forStudent = false } = {}) => {
  const numId = parseInt(id, 10);
  try {
    const rows = await query('SELECT * FROM practice_problems WHERE id = ?', [numId]);
    if (rows && rows.length > 0) {
      const r = rows[0];
      let testCases = await query('SELECT input, expected_output, is_hidden FROM coding_test_cases WHERE problem_id = ?', [numId]);
      
      if (forStudent && Array.isArray(testCases)) {
        testCases = testCases.filter(tc => !(tc.is_hidden === true || tc.is_hidden === 1 || String(tc.is_hidden).toLowerCase() === 'true'));
      }

      let desc = r.description;
      if (!desc || desc === 'No problem description provided.') {
        desc = `Write a program to solve '${r.title}'. Read input from standard input and output the evaluated result.\n\nInput: Input data corresponding to ${r.category || 'DSA'} constraints.\nOutput: Computed solution for the problem statement.`;
      }

      return {
        ...r,
        description: desc,
        tags: r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        batch: r.batch_name || 'All Batches',
        testCases: testCases || [],
        due_date: formatDbDate(r.due_date),
        dueDate: formatDbDate(r.due_date),
      };
    }
  } catch (error) {
    console.error(`[Practice Problem Model] Database query error: ${error.message}`);
  }
  return null;
};

// Create a new practice problem / coding task
export const createPracticeProblemModel = async ({
  college_id = null,
  batch_id = null,
  batch_name = 'All Batches',
  title,
  description = '',
  difficulty = 'Medium',
  category = 'General DSA',
  tags = '',
  points = 100,
  created_by = null,
  sampleInput = '',
  sampleOutput = '',
  testCases = [],
  due_date = null,
}) => {
  const tagsStr = Array.isArray(tags) ? tags.join(', ') : (tags || '');

  // Validate college_id foreign key against colleges table
  let validCollegeId = null;
  if (college_id) {
    try {
      const colRows = await query('SELECT id FROM colleges WHERE id = ?', [parseInt(college_id, 10)]);
      if (colRows && colRows.length > 0) {
        validCollegeId = parseInt(college_id, 10);
      }
    } catch (e) {
      validCollegeId = null;
    }
  }

  // Validate created_by foreign key against users table
  let validCreatedBy = null;
  if (created_by) {
    try {
      const userRows = await query('SELECT id FROM users WHERE id = ?', [created_by]);
      if (userRows && userRows.length > 0) {
        validCreatedBy = created_by;
      }
    } catch (e) {
      validCreatedBy = null;
    }
  }

  // Validate batch_id foreign key against batches table
  let validBatchId = null;
  if (batch_id && batch_id !== 'All') {
    try {
      const batchRows = await query('SELECT id FROM batches WHERE id = ?', [parseInt(batch_id, 10)]);
      if (batchRows && batchRows.length > 0) {
        validBatchId = parseInt(batch_id, 10);
      }
    } catch (e) {
      validBatchId = null;
    }
  }

  let res;
  try {
    res = await query(
      `INSERT INTO practice_problems 
        (college_id, batch_id, batch_name, title, description, difficulty, category, tags, points, due_date, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [validCollegeId, validBatchId, batch_name || 'All Batches', title.trim(), description || '', difficulty, category, tagsStr, points || 100, due_date || null, validCreatedBy]
    );
  } catch (err) {
    if (err && err.message && err.message.includes("Unknown column 'due_date'")) {
      console.warn('[Practice Problem Model] due_date column not found in table, falling back to insert without due_date');
      res = await query(
        `INSERT INTO practice_problems 
          (college_id, batch_id, batch_name, title, description, difficulty, category, tags, points, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [validCollegeId, validBatchId, batch_name || 'All Batches', title.trim(), description || '', difficulty, category, tagsStr, points || 100, validCreatedBy]
      );
    } else {
      throw err;
    }
  }

  if (res && res.insertId) {
    const probId = res.insertId;

    try {
      await query(
        `INSERT INTO coding_problems (id, title, description, difficulty, category) 
         VALUES (?, ?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), difficulty = VALUES(difficulty), category = VALUES(category)`,
        [probId, title.trim(), description || '', difficulty, category]
      );
    } catch (e) {
      console.warn('[Practice Problem Model] coding_problems sync notice:', e.message);
    }

    if (sampleInput || sampleOutput) {
      try {
        await query(
          `INSERT INTO coding_test_cases (problem_id, input, expected_output, is_hidden) VALUES (?, ?, ?, 0)`,
          [probId, sampleInput || '', sampleOutput || '']
        );
      } catch (e) { }
    }

    if (Array.isArray(testCases) && testCases.length > 0) {
      for (const tc of testCases) {
        const inp = tc.input || '';
        const out = tc.expectedOutput || tc.expected_output || tc.output || '';
        if (inp || out) {
          try {
            await query(
              `INSERT INTO coding_test_cases (problem_id, input, expected_output, is_hidden) VALUES (?, ?, ?, ?)`,
              [probId, inp, out, tc.isHidden ? 1 : 0]
            );
          } catch (e) { }
        }
      }
    }

    return getPracticeProblemByIdModel(probId);
  }
  return null;
};

// Delete a practice problem
export const deletePracticeProblemModel = async (id) => {
  const numId = parseInt(id, 10);
  try {
    await query('DELETE FROM coding_test_cases WHERE problem_id = ?', [numId]);
  } catch (e) { }
  return await query('DELETE FROM practice_problems WHERE id = ?', [numId]);
};
