import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

let tablesInitialized = false;
async function ensureDeptTable() {
  if (tablesInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT DEFAULT 1,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        hod_name VARCHAR(100) NULL,
        hod_email VARCHAR(255) NULL,
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    tablesInitialized = true;
  } catch (e) {
    console.warn('[DB ensureDeptTable error]', e.message);
  }
}

export const getDepartments = async (req, res, next) => {
  try {
    await ensureDeptTable();
    const { collegeId } = req.query;

    let sql = 'SELECT * FROM departments WHERE 1=1';
    const params = [];

    if (collegeId) {
      sql += ' AND college_id = ?';
      params.push(collegeId);
    }

    sql += ' ORDER BY id DESC';

    const dbDepts = await query(sql, params);
    return sendSuccess(res, 'Departments retrieved successfully', dbDepts || []);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    await ensureDeptTable();
    const { name, code, collegeId, hodName, hodEmail } = req.body;
    if (!name || !code) {
      return sendError(res, 'Department Name and Code are required', 400);
    }

    const result = await query(
      `INSERT INTO departments (college_id, name, code, hod_name, hod_email, status)
       VALUES (?, ?, ?, ?, ?, 'Active')`,
      [
        collegeId || 1,
        name.trim(),
        code.trim(),
        hodName || 'Dr. Department HOD',
        hodEmail || `hod.${code.toLowerCase()}@college.edu.in`
      ]
    );

    const [newDept] = await query('SELECT * FROM departments WHERE id = ?', [result.insertId]);

    return sendSuccess(res, 'Department created successfully', newDept || {
      id: result.insertId,
      name,
      code,
      college_id: collegeId || 1
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    await ensureDeptTable();
    const { id } = req.params;
    const { name, code, hodName, hodEmail, status } = req.body;

    await query(
      `UPDATE departments
       SET name = COALESCE(?, name),
           code = COALESCE(?, code),
           hod_name = COALESCE(?, hod_name),
           hod_email = COALESCE(?, hod_email),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [name, code, hodName, hodEmail, status, id]
    );

    const [updated] = await query('SELECT * FROM departments WHERE id = ?', [id]);
    if (!updated) {
      return sendError(res, 'Department not found', 404);
    }

    return sendSuccess(res, 'Department updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    await ensureDeptTable();
    const { id } = req.params;
    await query('DELETE FROM departments WHERE id = ?', [id]);
    return sendSuccess(res, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};
