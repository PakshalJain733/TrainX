import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

const mapDept = (d) => ({
  id: d.id,
  name: d.name,
  code: d.code,
  collegeId: d.college_id,
  collegeName: d.collegeName || null,
  hodName: null,
  hodEmail: null,
  studentsCount: parseInt(d.studentsCount, 10) || 0,
  batchesCount: parseInt(d.batchesCount, 10) || 0,
  status: 'Active',
});

export const getDepartments = async (req, res, next) => {
  try {
    const { collegeId, college, college_id } = req.query;

    let sql = `
      SELECT d.id, d.name, d.code, d.college_id, c.name as collegeName,
             (SELECT COUNT(DISTINCT s.user_id) FROM students s WHERE s.department_id = d.id) as studentsCount,
             (SELECT COUNT(*) FROM batches b WHERE b.department_id = d.id) as batchesCount
      FROM departments d
      LEFT JOIN colleges c ON d.college_id = c.id
    `;
    const params = [];

    const cidRaw = collegeId || college_id;
    if (cidRaw) {
      sql += ' WHERE d.college_id = ?';
      params.push(Number(cidRaw));
    } else if (college) {
      sql += ' WHERE LOWER(c.name) LIKE ?';
      params.push(`%${String(college).toLowerCase()}%`);
    }

    sql += ' ORDER BY d.id ASC';

    const dbDepts = await query(sql, params);
    const result = (dbDepts || []).map(mapDept);
    return sendSuccess(res, 'Departments retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createDepartment = async (req, res, next) => {
  try {
    const { name, code, collegeId, college_id } = req.body;
    if (!name || !code) {
      return sendError(res, 'Department Name and Code are required', 400);
    }

    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
    const collegeIdNum = Number(collegeId || college_id);
    const targetCollege = isSuperAdmin
      ? (collegeIdNum || 1)
      : (req.user.collegeId || 1);

    if (isSuperAdmin && collegeIdNum) {
      const [college] = await query('SELECT id FROM colleges WHERE id = ?', [collegeIdNum]);
      if (!college) {
        return sendError(res, 'Selected college does not exist', 400);
      }
    }

    const insertResult = await query(
      'INSERT INTO departments (college_id, name, code) VALUES (?, ?, ?)',
      [targetCollege, name.trim(), code.trim().toUpperCase()]
    );

    const rows = await query(
      `SELECT d.id, d.name, d.code, d.college_id, c.name as collegeName,
             0 as studentsCount, 0 as batchesCount
       FROM departments d
       LEFT JOIN colleges c ON d.college_id = c.id
       WHERE d.id = ?`,
      [insertResult.insertId]
    );

    return sendSuccess(res, 'Department created successfully', mapDept(rows?.[0] || { id: insertResult.insertId, name, code, college_id: targetCollege }), 201);
  } catch (error) {
    next(error);
  }
};

export const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);
    const { name, code, collegeId } = req.body;

    const [existing] = await query('SELECT * FROM departments WHERE id = ?', [numId]);
    if (!existing) {
      return sendError(res, 'Department not found', 404);
    }

    if (req.user.role !== ROLES.SUPER_ADMIN && existing.college_id !== (req.user.collegeId || 1)) {
      return sendError(res, 'Access forbidden: cannot modify a department of another college', 403);
    }

    const newCollegeId = req.user.role === ROLES.SUPER_ADMIN && collegeId != null
      ? Number(collegeId)
      : existing.college_id;

    await query(
      'UPDATE departments SET name = COALESCE(?, name), code = COALESCE(?, code), college_id = COALESCE(?, college_id) WHERE id = ?',
      [name ? name.trim() : null, code ? code.trim().toUpperCase() : null, newCollegeId, numId]
    );

    const [updated] = await query(
      `SELECT d.id, d.name, d.code, d.college_id
       FROM departments d WHERE d.id = ?`,
      [numId]
    );
    return sendSuccess(res, 'Department updated successfully', mapDept(updated));
  } catch (error) {
    next(error);
  }
};

export const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    const [existing] = await query('SELECT * FROM departments WHERE id = ?', [numId]);
    if (!existing) {
      return sendError(res, 'Department not found', 404);
    }

    if (req.user.role !== ROLES.SUPER_ADMIN && existing.college_id !== (req.user.collegeId || 1)) {
      return sendError(res, 'Access forbidden: cannot delete a department of another college', 403);
    }

    const [batchRefs] = await query(
      `SELECT COUNT(*) as count FROM batches WHERE department_id = ?`,
      [numId]
    );
    const [studentRefs] = await query(
      `SELECT COUNT(*) as count FROM students WHERE department_id = ?`,
      [numId]
    );
    if ((batchRefs?.count || 0) > 0 || (studentRefs?.count || 0) > 0) {
      return sendError(
        res,
        'Cannot delete department: it still has batches or students assigned. Reassign them first.',
        409
      );
    }

    await query('DELETE FROM departments WHERE id = ?', [numId]);
    return sendSuccess(res, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};