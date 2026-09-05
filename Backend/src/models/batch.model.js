import { query } from '../config/db.js';

// Get all batches
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
    sql += ' ORDER BY b.id DESC';

    const results = await query(sql, params);
    if (results && Array.isArray(results)) return results;
  } catch (error) {
    console.error(`[Batch Model] Database query error: ${error.message}`);
  }
  return [];
};

export const findBatches = async () => getBatchesModel();
export const findBatchesByCollege = async (collegeId) => getBatchesModel({ collegeId });
export const findBatchesByDepartment = async (departmentId) => getBatchesModel({ departmentId });

// Get batch by ID
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
    console.error(`[Batch Model] Database query error: ${error.message}`);
  }
  return null;
};

export const findBatchById = getBatchByIdModel;

// Create batch
export const createBatchModel = async ({
  college_id = 1,
  department_id = null,
  name,
  mentor = '',
  schedule = '',
  join_code = '',
  code_expires_at = null,
  students = 0,
  year = 'TE',
  division = 'A',
  academic_year = '2025-2026',
  start_year = null,
  end_year = null,
  status = 'active',
}) => {
  const cId = college_id ? parseInt(college_id, 10) : 1;
  const dId = department_id ? parseInt(department_id, 10) : null;
  const expiresAtVal = code_expires_at ? Number(code_expires_at) : null;

  const res = await query(
    `INSERT INTO batches 
      (college_id, department_id, name, mentor, schedule, join_code, code_expires_at, students, year, division, academic_year, start_year, end_year, status) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [cId, dId, name, mentor, schedule, join_code, expiresAtVal, students || 0, year, division, academic_year, start_year, end_year, status || 'active']
  );

  if (res && res.insertId) {
    return getBatchByIdModel(res.insertId);
  }
  return null;
};

export const createBatch = async (batchData) => {
  return createBatchModel(batchData);
};

// Update batch
export const updateBatch = async (id, {
  college_id,
  department_id,
  name,
  mentor,
  schedule,
  join_code,
  code_expires_at,
  students,
  academic_year,
  start_year,
  end_year,
  status,
}) => {
  const numId = parseInt(id, 10);
  const existing = await getBatchByIdModel(numId);
  if (!existing) return null;

  const cId = college_id !== undefined ? (college_id ? parseInt(college_id, 10) : 1) : existing.college_id;
  const dId = department_id !== undefined ? (department_id ? parseInt(department_id, 10) : null) : existing.department_id;
  const batchName = name !== undefined ? name : existing.name;
  const batchMentor = mentor !== undefined ? mentor : existing.mentor;
  const batchSchedule = schedule !== undefined ? schedule : existing.schedule;
  const batchJoinCode = join_code !== undefined ? join_code : existing.join_code;
  const batchCodeExpiresAt = code_expires_at !== undefined ? (code_expires_at ? Number(code_expires_at) : null) : existing.code_expires_at;
  const batchStudents = students !== undefined ? parseInt(students, 10) : existing.students;
  const batchStatus = status !== undefined ? status : existing.status;

  await query(
    `UPDATE batches SET 
      college_id = ?, department_id = ?, name = ?, mentor = ?, schedule = ?, 
      join_code = ?, code_expires_at = ?, students = ?, status = ?
     WHERE id = ?`,
    [cId, dId, batchName, batchMentor, batchSchedule, batchJoinCode, batchCodeExpiresAt, batchStudents, batchStatus, numId]
  );
  return getBatchByIdModel(numId);
};

// Delete batch
export const deleteBatch = async (id) => {
  return await query('DELETE FROM batches WHERE id = ?', [parseInt(id, 10)]);
};

// ─── Student Batch Join ───────────────────────────────────────────

// Find batch by join_code
export const findBatchByCode = async (code) => {
  try {
    const rows = await query(
      `SELECT b.*, c.name AS college_name FROM batches b
       LEFT JOIN colleges c ON b.college_id = c.id
       WHERE b.join_code = ? AND b.status = 'active' LIMIT 1`,
      [code.trim()]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error(`[Batch Model] findBatchByCode error: ${error.message}`);
    return null;
  }
};

// Join student to a batch (updates students.batch_id)
export const joinStudentBatch = async (userId, batchId) => {
  try {
    // Update the student record's batch_id
    await query(
      `UPDATE students SET batch_id = ? WHERE user_id = ?`,
      [parseInt(batchId, 10), parseInt(userId, 10)]
    );
    // Also bump batch student count
    await query(
      `UPDATE batches SET students = COALESCE(students, 0) + 1 WHERE id = ?`,
      [parseInt(batchId, 10)]
    );
    return true;
  } catch (error) {
    console.error(`[Batch Model] joinStudentBatch error: ${error.message}`);
    return false;
  }
};

// Get all batches the student is enrolled in
export const getStudentBatchesModel = async (userId) => {
  try {
    const rows = await query(
      `SELECT b.*, c.name AS college_name, d.name AS department_name
       FROM batches b
       LEFT JOIN colleges c ON b.college_id = c.id
       LEFT JOIN departments d ON b.department_id = d.id
       WHERE b.id IN (
         SELECT batch_id FROM students WHERE user_id = ? AND batch_id IS NOT NULL
       )
       ORDER BY b.id DESC`,
      [parseInt(userId, 10)]
    );
    return rows || [];
  } catch (error) {
    console.error(`[Batch Model] getStudentBatchesModel error: ${error.message}`);
    return [];
  }
};
