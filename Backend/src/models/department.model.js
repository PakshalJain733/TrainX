import { query } from '../config/db.js';

const mockDepartments = [];

// Get all departments (with fallback)
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

export const findDepartments = async () => getDepartmentsByCollegeModel(null);

export const findDepartmentsByCollege = async (collegeId) => getDepartmentsByCollegeModel(collegeId);

// Get department by ID (with fallback)
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

export const findDepartmentById = getDepartmentByIdModel;

// Create department (with fallback)
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

export const createDepartment = async (collegeId, name, code) => createDepartmentModel({ college_id: collegeId, name, code });

// Update department
export const updateDepartment = async (id, collegeId, name, code) => {
  return await query(
    'UPDATE departments SET college_id = ?, name = ?, code = ? WHERE id = ?',
    [collegeId, name, code, id]
  );
};

// Delete department
export const deleteDepartment = async (id) => {
  return await query(
    'DELETE FROM departments WHERE id = ?',
    [id]
  );
};
