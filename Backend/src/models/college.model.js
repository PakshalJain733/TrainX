import { query } from '../config/db.js';

// Get all colleges
export const findColleges = async () => {
  return await query('SELECT * FROM colleges ORDER BY id DESC');
};

// Get one college
export const findCollegeById = async (id) => {
  const rows = await query(
    'SELECT * FROM colleges WHERE id = ?',
    [id]
  );
  return rows[0];
};

// Create college
export const createCollege = async (name, code) => {
  const result = await query(
    'INSERT INTO colleges (name, code) VALUES (?, ?)',
    [name, code]
  );

  return {
    id: result.insertId,
    name,
    code
  };
};

// Update college
export const updateCollege = async (id, name, code) => {
  return await query(
    'UPDATE colleges SET name = ?, code = ? WHERE id = ?',
    [name, code, id]
  );
};

// Delete college
export const deleteCollege = async (id) => {
  return await query(
    'DELETE FROM colleges WHERE id = ?',
    [id]
  );
};