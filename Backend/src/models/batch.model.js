import { query } from '../config/db.js';

// Get all batches (with optional filters)
export const findBatches = async () => {
  return await query(`
    SELECT b.*, c.name AS college_name, d.name AS department_name
    FROM batches b
    LEFT JOIN colleges c ON b.college_id = c.id
    LEFT JOIN departments d ON b.department_id = d.id
    ORDER BY b.id DESC
  `);
};

export const findBatchesByCollege = async (collegeId) => {
  return await query(`
    SELECT b.*, c.name AS college_name, d.name AS department_name
    FROM batches b
    LEFT JOIN colleges c ON b.college_id = c.id
    LEFT JOIN departments d ON b.department_id = d.id
    WHERE b.college_id = ?
    ORDER BY b.id DESC
  `, [collegeId]);
};

export const findBatchesByDepartment = async (departmentId) => {
  return await query(`
    SELECT b.*, c.name AS college_name, d.name AS department_name
    FROM batches b
    LEFT JOIN colleges c ON b.college_id = c.id
    LEFT JOIN departments d ON b.department_id = d.id
    WHERE b.department_id = ?
    ORDER BY b.id DESC
  `, [departmentId]);
};

// Get batch by ID
export const findBatchById = async (id) => {
  const rows = await query(`
    SELECT b.*, c.name AS college_name, d.name AS department_name
    FROM batches b
    LEFT JOIN colleges c ON b.college_id = c.id
    LEFT JOIN departments d ON b.department_id = d.id
    WHERE b.id = ?
  `, [id]);
  return rows[0];
};

// Create batch
export const createBatch = async ({ college_id, department_id, name, academic_year, start_year, end_year, status }) => {
  const result = await query(
    `INSERT INTO batches (college_id, department_id, name, academic_year, start_year, end_year, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [college_id, department_id, name, academic_year || null, start_year || null, end_year || null, status || 'active']
  );
  return findBatchById(result.insertId);
};

// Update batch
export const updateBatch = async (id, { college_id, department_id, name, academic_year, start_year, end_year, status }) => {
  await query(
    `UPDATE batches SET college_id = ?, department_id = ?, name = ?, academic_year = ?, start_year = ?, end_year = ?, status = ?
     WHERE id = ?`,
    [college_id, department_id, name, academic_year || null, start_year || null, end_year || null, status, id]
  );
  return findBatchById(id);
};

// Delete batch
export const deleteBatch = async (id) => {
  return await query('DELETE FROM batches WHERE id = ?', [id]);
};
