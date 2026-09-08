import { query } from '../config/db.js';

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
      }));
    }
  } catch (error) {
    console.error(`[Practice Problem Model] Database query error: ${error.message}`);
  }
  return [];
};

// Get single problem by ID
export const getPracticeProblemByIdModel = async (id) => {
  const numId = parseInt(id, 10);
  try {
    const rows = await query('SELECT * FROM practice_problems WHERE id = ?', [numId]);
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        ...r,
        tags: r.tags ? r.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        batch: r.batch_name || 'All Batches',
      };
    }
  } catch (error) {
    console.error(`[Practice Problem Model] Database query error: ${error.message}`);
  }
  return null;
};

// Create a new practice problem / coding task
export const createPracticeProblemModel = async ({
  college_id = 1,
  batch_id = null,
  batch_name = 'All Batches',
  title,
  description = '',
  difficulty = 'Medium',
  category = 'General DSA',
  tags = '',
  points = 100,
  created_by = null,
}) => {
  const cId = college_id ? parseInt(college_id, 10) : 1;
  const tagsStr = Array.isArray(tags) ? tags.join(', ') : (tags || '');

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

  const res = await query(
    `INSERT INTO practice_problems 
      (college_id, batch_id, batch_name, title, description, difficulty, category, tags, points, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cId, validBatchId, batch_name || 'All Batches', title.trim(), description || '', difficulty, category, tagsStr, points || 100, validCreatedBy]
  );

  if (res && res.insertId) {
    return getPracticeProblemByIdModel(res.insertId);
  }
  return null;
};

// Delete a practice problem
export const deletePracticeProblemModel = async (id) => {
  const numId = parseInt(id, 10);
  return await query('DELETE FROM practice_problems WHERE id = ?', [numId]);
};
