import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

const batchSelect = `
  SELECT b.*, c.name as college_name, d.name as department_name,
         (SELECT COUNT(DISTINCT s.id) FROM students s WHERE s.batch_id = b.id) as enrolled_students
  FROM batches b
  LEFT JOIN colleges c ON b.college_id = c.id
  LEFT JOIN departments d ON b.department_id = d.id`;

const mapBatch = (b) => ({
  id: b?.id,
  name: b?.name,
  code: b?.join_code || `B-${b?.id}`,
  collegeId: b?.college_id,
  collegeName: b?.college_name || 'Engineering College',
  departmentId: b?.department_id,
  departmentName: b?.department_name || 'Engineering',
  trainer: b?.mentor || 'Unassigned',
  studentsCount: Number(b?.enrolled_students) || 0,
  enrolledStudents: Number(b?.enrolled_students) || 0,
  progress: 0,
  schedule: b?.schedule || 'Regular Schedule',
  status: b?.status === 'active' ? 'Active' : 'Inactive',
  year: b?.year,
  division: b?.division,
  academic_year: b?.academic_year,
});

export const getBatches = async (req, res, next) => {
  try {
    const { collegeId, departmentId, college, department } = req.query;

    let sql = `${batchSelect} WHERE 1=1`;
    const params = [];

    // College scope: explicit query param wins; otherwise default to the
    // caller's own college. Super admins see all colleges when no filter is given.
    const isSuperAdmin = req.user?.role === ROLES.SUPER_ADMIN;
    const effectiveCollegeId =
      Number(collegeId) || (!isSuperAdmin ? (req.user?.collegeId || req.user?.college_id || null) : null);

    if (effectiveCollegeId) {
      sql += ` AND b.college_id = ?`;
      params.push(effectiveCollegeId);
    }
    if (departmentId) {
      sql += ` AND b.department_id = ?`;
      params.push(Number(departmentId));
    }
    if (college) {
      sql += ` AND LOWER(c.name) LIKE ?`;
      params.push(`%${String(college).toLowerCase()}%`);
    }
    if (department) {
      sql += ` AND LOWER(d.name) LIKE ?`;
      params.push(`%${String(department).toLowerCase()}%`);
    }

    sql += ` ORDER BY b.id DESC`;

    const dbBatches = await query(sql, params);
    return sendSuccess(res, 'Batches retrieved successfully', (dbBatches || []).map(mapBatch));
  } catch (error) {
    next(error);
  }
};

export const createBatch = async (req, res, next) => {
  try {
    const { name, code, collegeId, departmentId, trainer, mentorId, schedule } = req.body;
    if (!name || !code) {
      return sendError(res, 'Batch Name and Code are required', 400);
    }

    const collegeIdFinal = Number(collegeId) || req.user?.college_id || req.user?.collegeId || null;
    const userId = req.user?.userId || req.user?.id;

    let deptId = departmentId ? Number(departmentId) : null;
    if (!deptId && userId) {
      const coord = await query(
        `SELECT department_id FROM coordinator_departments WHERE coordinator_id = ? LIMIT 1`,
        [userId]
      );
      deptId = coord && coord[0] ? coord[0].department_id : null;
    }

    const result = await query(
      `INSERT INTO batches (college_id, department_id, name, mentor, mentor_id, schedule, join_code, status, academic_year)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [collegeIdFinal, deptId, name, trainer || null, mentorId ? Number(mentorId) : null, schedule || null, code, new Date().getFullYear()]
    );

    const [created] = await query(`${batchSelect} WHERE b.id = ?`, [result.insertId]);
    return sendSuccess(res, 'Batch created successfully', mapBatch(created), 201);
  } catch (error) {
    next(error);
  }
};

export const updateBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query(`SELECT id FROM batches WHERE id = ?`, [id]);
    if (!existing || existing.length === 0) {
      return sendError(res, 'Batch not found', 404);
    }

    const { name, code, trainer, mentorId, schedule, status } = req.body;
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (code !== undefined) { updates.push('join_code = ?'); params.push(code); }
    if (trainer !== undefined) { updates.push('mentor = ?'); params.push(trainer); }
    if (mentorId !== undefined) { updates.push('mentor_id = ?'); params.push(Number(mentorId)); }
    if (schedule !== undefined) { updates.push('schedule = ?'); params.push(schedule); }
    if (status !== undefined) { updates.push('status = ?'); params.push(String(status).toLowerCase() === 'active' ? 'active' : 'inactive'); }

    if (updates.length === 0) {
      return sendError(res, 'No fields to update', 400);
    }

    params.push(id);
    await query(`UPDATE batches SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await query(`${batchSelect} WHERE b.id = ?`, [id]);
    return sendSuccess(res, 'Batch updated successfully', mapBatch(updated));
  } catch (error) {
    next(error);
  }
};

export const deleteBatch = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM batches WHERE id = ?`, [id]);
    return sendSuccess(res, 'Batch deleted successfully');
  } catch (error) {
    next(error);
  }
};