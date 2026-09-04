import { query } from '../config/db.js';

const mockBatches = [
  { id: 1, college_id: 1, department_id: 1, name: 'COMP-TE-A-2026', year: 'TE', division: 'A', academic_year: '2025-2026', created_at: new Date('2026-01-01') },
  { id: 2, college_id: 1, department_id: 3, name: 'ECS-TE-B-2026', year: 'TE', division: 'B', academic_year: '2025-2026', created_at: new Date('2026-01-01') },
  { id: 3, college_id: 2, department_id: 5, name: 'DBIT-COMP-2026', year: 'TE', division: 'A', academic_year: '2025-2026', created_at: new Date('2026-01-01') },
];

export const getBatchesModel = async ({ collegeId = null, departmentId = null } = {}) => {
  try {
    let sql = 'SELECT * FROM batches WHERE 1=1';
    const params = [];
    if (collegeId) {
      sql += ' AND college_id = ?';
      params.push(parseInt(collegeId, 10));
    }
    if (departmentId) {
      sql += ' AND department_id = ?';
      params.push(parseInt(departmentId, 10));
    }
    sql += ' ORDER BY id ASC';

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

export const getBatchByIdModel = async (id) => {
  const numId = parseInt(id, 10);
  try {
    const results = await query('SELECT * FROM batches WHERE id = ?', [numId]);
    if (results && results.length > 0) return results[0];
  } catch (error) {
    console.warn(`[Batch Model] Database query fallback: ${error.message}`);
  }
  return mockBatches.find((b) => b.id === numId) || null;
};

export const createBatchModel = async ({ college_id, department_id, name, year = 'TE', division = 'A', academic_year = '2025-2026' }) => {
  const cId = parseInt(college_id, 10);
  const dId = parseInt(department_id, 10);
  try {
    const res = await query(
      'INSERT INTO batches (college_id, department_id, name, year, division, academic_year) VALUES (?, ?, ?, ?, ?, ?)',
      [cId, dId, name, year, division, academic_year]
    );
    if (res && res.insertId) {
      return { id: res.insertId, college_id: cId, department_id: dId, name, year, division, academic_year, created_at: new Date() };
    }
  } catch (error) {
    console.warn(`[Batch Model] Database insert fallback: ${error.message}`);
  }

  const newBatch = { id: mockBatches.length + 1, college_id: cId, department_id: dId, name, year, division, academic_year, created_at: new Date() };
  mockBatches.push(newBatch);
  return newBatch;
};
