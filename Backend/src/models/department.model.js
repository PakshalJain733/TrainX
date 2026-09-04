import { query } from '../config/db.js';

// Get all departments
export const findDepartments = async () => {
    return await query('SELECT * FROM departments ORDER BY id DESC');
};

// Get department by ID
export const findDepartmentById = async (id) => {
    const rows = await query(
        'SELECT * FROM departments WHERE id = ?',
        [id]
    );
    return rows[0];
};

// Get departments belonging to a college
export const findDepartmentsByCollege = async (collegeId) => {
    return await query(
        'SELECT * FROM departments WHERE college_id = ? ORDER BY id DESC',
        [collegeId]
    );
};

// Create department
export const createDepartment = async (collegeId, name, code) => {
    const result = await query(
        'INSERT INTO departments (college_id, name, code) VALUES (?, ?, ?)',
        [collegeId, name, code]
    );

    return {
        id: result.insertId,
        college_id: collegeId,
        name,
        code
    };
};

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
