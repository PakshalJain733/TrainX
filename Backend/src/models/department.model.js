import { query } from '../config/db.js';

const mockDepartments = [
  { id: 1, college_id: 1, name: 'Computer Engineering', code: 'COMP', created_at: new Date('2026-01-01') },
  { id: 2, college_id: 1, name: 'Information Technology', code: 'IT', created_at: new Date('2026-01-01') },
  { id: 3, college_id: 1, name: 'Electronics and Computer Science', code: 'ECS', created_at: new Date('2026-01-01') },
  { id: 4, college_id: 1, name: 'Artificial Intelligence and Data Science', code: 'AIDS', created_at: new Date('2026-01-01') },
  { id: 5, college_id: 2, name: 'Computer Engineering', code: 'DBIT_COMP', created_at: new Date('2026-01-01') },
];

export const getDepartmentsByCollegeModel = async (collegeId = null) => {
  try {
    let sql = 'SELECT * FROM departments';
    const params = [];
    if (collegeId) {
      sql += ' WHERE college_id = ?';
      params.push(collegeId);
    }
    sql += ' ORDER BY id ASC';
    const results = await query(sql, params);
    if (results && Array.isArray(results) && results.length > 0) return results;
  } catch (error) {
    console.warn(`[Department Model] Database query fallback: ${error.message}`);
  }

  return mockDepartments.filter((d) => (!collegeId ? true : d.college_id === parseInt(collegeId, 10)));
};

export const getDepartmentByIdModel = async (id) => {
  const numId = parseInt(id, 10);
  try {
    const results = await query('SELECT * FROM departments WHERE id = ?', [numId]);
    if (results && results.length > 0) return results[0];
  } catch (error) {
    console.warn(`[Department Model] Database query fallback: ${error.message}`);
  }
  return mockDepartments.find((d) => d.id === numId) || null;
};

export const createDepartmentModel = async ({ college_id, name, code }) => {
  const cId = parseInt(college_id, 10);
  try {
    const res = await query('INSERT INTO departments (college_id, name, code) VALUES (?, ?, ?)', [cId, name, code]);
    if (res && res.insertId) return { id: res.insertId, college_id: cId, name, code, created_at: new Date() };
  } catch (error) {
    console.warn(`[Department Model] Database insert fallback: ${error.message}`);
  }

  const newDept = { id: mockDepartments.length + 1, college_id: cId, name, code, created_at: new Date() };
  mockDepartments.push(newDept);
  return newDept;
};
