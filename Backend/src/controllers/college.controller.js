import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

export const getColleges = async (req, res, next) => {
  try {
    const dbColleges = await query(`
      SELECT c.id, c.name, c.code, c.created_at,
             COUNT(DISTINCT d.id) as departmentsCount,
             COUNT(DISTINCT b.id) as batchesCount,
             COUNT(DISTINCT u.id) as studentsCount
      FROM colleges c
      LEFT JOIN departments d ON c.id = d.college_id
      LEFT JOIN batches b ON c.id = b.college_id
      LEFT JOIN users u ON c.id = u.college_id AND u.role = 'student'
      GROUP BY c.id
      ORDER BY c.id ASC
    `);

    const result = dbColleges.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      codeName: (c.code || '').split('-')[0] || c.code,
      departmentsCount: parseInt(c.departmentsCount, 10) || 0,
      batchesCount: parseInt(c.batchesCount, 10) || 0,
      studentsCount: parseInt(c.studentsCount, 10) || 0,
      status: 'Active',
      created_at: c.created_at,
    }));

    return sendSuccess(res, 'Colleges retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const createCollege = async (req, res, next) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return sendError(res, 'College Name and Code are required', 400);
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    const insertResult = await query(
      'INSERT INTO colleges (name, code) VALUES (?, ?)',
      [cleanName, cleanCode]
    );

    const [created] = await query('SELECT * FROM colleges WHERE id = ?', [insertResult.insertId]);

    return sendSuccess(res, 'College created successfully', {
      ...created,
      departmentsCount: 0,
      batchesCount: 0,
      studentsCount: 0,
      status: 'Active',
    }, 201);
  } catch (error) {
    next(error);
  }
};

export const updateCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);
    const { name, code } = req.body;

    const [existing] = await query('SELECT * FROM colleges WHERE id = ?', [numId]);
    if (!existing) {
      return sendError(res, 'College not found', 404);
    }

    await query(
      'UPDATE colleges SET name = COALESCE(?, name), code = COALESCE(?, code) WHERE id = ?',
      [name ? name.trim() : null, code ? code.trim().toUpperCase() : null, numId]
    );

    const [updated] = await query('SELECT * FROM colleges WHERE id = ?', [numId]);
    return sendSuccess(res, 'College updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const deleteCollege = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numId = Number(id);

    const [existing] = await query('SELECT * FROM colleges WHERE id = ?', [numId]);
    if (!existing) {
      return sendError(res, 'College not found', 404);
    }

    const [userRefs] = await query(
      `SELECT COUNT(*) as count FROM users WHERE college_id = ?`,
      [numId]
    );
    const [batchRefs] = await query(
      `SELECT COUNT(*) as count FROM batches WHERE college_id = ?`,
      [numId]
    );
    const [deptRefs] = await query(
      `SELECT COUNT(*) as count FROM departments WHERE college_id = ?`,
      [numId]
    );
    if ((userRefs?.count || 0) > 0 || (batchRefs?.count || 0) > 0 || (deptRefs?.count || 0) > 0) {
      return sendError(
        res,
        'Cannot delete college: it still has users, batches, or departments. Reassign or remove those records first.',
        409
      );
    }

    await query('DELETE FROM colleges WHERE id = ?', [numId]);
    return sendSuccess(res, 'College deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getCollegeData = getColleges;
