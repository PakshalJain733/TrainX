import { query } from '../config/db.js';

const mockBatches = [];

// Get all batches (with optional filters and fallback)
export const getBatchesModel = async ({ collegeId = null, departmentId = null } = {}) => {
  try {
    let sql = `
      SELECT b.*, c.name AS college_name, d.name AS department_name
      FROM batches b
      LEFT JOIN colleges c ON b.college_id = c.id
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE 1=1
    `;
    const params = [];
    if (collegeId) {
      sql += ' AND b.college_id = ?';
      params.push(parseInt(collegeId, 10));
    }
    if (departmentId) {
      sql += ' AND b.department_id = ?';
      params.push(parseInt(departmentId, 10));
    }
    sql += ' ORDER BY b.id ASC';

    const results = await query(sql, params);
    if (results && Array.isArray(results) && results.length > 0) return results;
  } catch (error) {
    console.warn(`[Batch Model] Database query fallback: ${error.message}`);
  }

  return mockBatches.filter((b) => {
    if (collegeId && b.college_id !== parseInt(collegeId, 10)) return false;
    if (departmentId && b.department_id !== parseInt(departmentId, 10)) return false;
    return true;
  });
};

export const findBatches = async () => getBatchesModel();

export const findBatchesByCollege = async (collegeId) => getBatchesModel({ collegeId });

export const findBatchesByDepartment = async (departmentId) => getBatchesModel({ departmentId });

// Get batch by ID (with fallback)
export const getBatchByIdModel = async (id) => {
  const numId = parseInt(id, 10);
  try {
    const rows = await query(`
      SELECT b.*, c.name AS college_name, d.name AS department_name
      FROM batches b
      LEFT JOIN colleges c ON b.college_id = c.id
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE b.id = ?
    `, [numId]);
    if (rows && rows.length > 0) return rows[0];
  } catch (error) {
    console.warn(`[Batch Model] Database query fallback: ${error.message}`);
  }
  return mockBatches.find((b) => b.id === numId) || null;
};

export const findBatchById = getBatchByIdModel;

// Create batch (with fallback)
export const createBatchModel = async ({ college_id, department_id, name, year = 'TE', division = 'A', academic_year = '2025-2026', start_year, end_year, status }) => {
  const cId = parseInt(college_id, 10);
  const dId = parseInt(department_id, 10);
  try {
    const res = await query(
      'INSERT INTO batches (college_id, department_id, name, year, division, academic_year, start_year, end_year, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [cId, dId, name, year, division, academic_year || null, start_year || null, end_year || null, status || 'active']
    );
    if (res && res.insertId) {
      return getBatchByIdModel(res.insertId);
    }
  } catch (error) {
    console.warn(`[Batch Model] Database insert fallback: ${error.message}`);
  }

  const newBatch = { id: mockBatches.length + 1, college_id: cId, department_id: dId, name, year, division, academic_year, created_at: new Date() };
  mockBatches.push(newBatch);
  return newBatch;
};

export const createBatch = async ({ college_id, department_id, name, academic_year, start_year, end_year, status }) => {
  return createBatchModel({ college_id, department_id, name, academic_year, start_year, end_year, status });
};

// Update batch
export const updateBatch = async (id, { college_id, department_id, name, academic_year, start_year, end_year, status }) => {
  await query(
    `UPDATE batches SET college_id = ?, department_id = ?, name = ?, academic_year = ?, start_year = ?, end_year = ?, status = ?
     WHERE id = ?`,
    [college_id, department_id, name, academic_year || null, start_year || null, end_year || null, status, id]
  );
  return getBatchByIdModel(id);
};

// Delete batch
export const deleteBatch = async (id) => {
  return await query('DELETE FROM batches WHERE id = ?', [id]);
};
