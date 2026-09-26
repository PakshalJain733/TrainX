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

// Delete batch (Soft delete - set status = 'inactive')
export const deleteBatch = async (id) => {
  return await query("UPDATE batches SET status = 'inactive' WHERE id = ?", [parseInt(id, 10)]);
};

// ─── Student Batch Join ───────────────────────────────────────────

// Helper to ensure student_batches table exists for multi-batch membership
const ensureStudentBatchesTable = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS student_batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        batch_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_batch (user_id, batch_id)
      )
    `);
  } catch (err) {
    console.warn(`[Batch Model] ensureStudentBatchesTable warning: ${err.message}`);
  }
};

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

// Join student to a batch (supports multi-batch membership)
export const joinStudentBatch = async (userId, batchId) => {
  try {
    const uId = parseInt(userId, 10);
    const bId = parseInt(batchId, 10);

    await ensureStudentBatchesTable();

    // 1. Insert into student_batches junction table so student stays enrolled in all joined batches
    await query(
      'INSERT IGNORE INTO student_batches (user_id, batch_id) VALUES (?, ?)',
      [uId, bId]
    );

    // 2. Also update/create student record for backwards compatibility
    const rows = await query('SELECT id FROM students WHERE user_id = ? LIMIT 1', [uId]);
    if (rows && rows.length > 0) {
      await query('UPDATE students SET batch_id = ? WHERE user_id = ?', [bId, uId]);
    } else {
      await query(
        `INSERT INTO students (user_id, college_id, department_id, batch_id, roll_number, department, year, division, semester, cgpa, skills)
         VALUES (?, 1, NULL, ?, '', '', '', '', '', '8.0', '')`,
        [uId, bId]
      );
    }

    // 3. Update batch student count dynamically
    await query(
      'UPDATE batches SET students = (SELECT COUNT(DISTINCT user_id) FROM student_batches WHERE batch_id = ?) WHERE id = ?',
      [bId, bId]
    );
    return true;
  } catch (error) {
    console.error(`[Batch Model] joinStudentBatch error: ${error.message}`);
    return false;
  }
};

// Get all batches the student is enrolled in (multi-batch supported)
export const getStudentBatchesModel = async (userId) => {
  try {
    await ensureStudentBatchesTable();
    const uId = parseInt(userId, 10);
    const rows = await query(
      `SELECT b.*, c.name AS college_name, d.name AS department_name
       FROM batches b
       LEFT JOIN colleges c ON b.college_id = c.id
       LEFT JOIN departments d ON b.department_id = d.id
       WHERE b.id IN (
         SELECT batch_id FROM student_batches WHERE user_id = ?
         UNION
         SELECT batch_id FROM students WHERE user_id = ? AND batch_id IS NOT NULL
       )
       ORDER BY b.id DESC`,
      [uId, uId]
    );
    return rows || [];
  } catch (error) {
    console.error(`[Batch Model] getStudentBatchesModel error: ${error.message}`);
    return [];
  }
};

// Get all enrolled students for a specific batch
export const getBatchStudentsModel = async (batchId) => {
  try {
    const rows = await query(
      `SELECT s.id, s.user_id, u.name, u.email, s.roll_number, s.department, s.year, s.division, s.cgpa
       FROM students s
       JOIN users u ON s.user_id = u.id
       WHERE s.batch_id = ?
       ORDER BY u.name ASC`,
      [parseInt(batchId, 10)]
    );
    return rows || [];
  } catch (error) {
    console.error(`[Batch Model] getBatchStudentsModel error: ${error.message}`);
    return [];
  }
};

export const createBatchTaskModel = async (taskData) => {
  try {
    const bId = parseInt(taskData.batch_id || taskData.batchId, 10);
    const testCasesJson = taskData.testCases || taskData.test_cases ? JSON.stringify(taskData.testCases || taskData.test_cases) : null;
    
    const res = await query(
      `INSERT INTO batch_tasks (batch_id, title, topic, difficulty, points, deadline, description, test_cases)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bId,
        taskData.title,
        taskData.topic || '',
        taskData.difficulty || 'Medium',
        parseInt(taskData.points || 100, 10),
        taskData.deadline || '',
        taskData.desc || taskData.description || '',
        testCasesJson
      ]
    );

    if (res && res.insertId) {
      const rows = await query('SELECT * FROM batch_tasks WHERE id = ?', [res.insertId]);
      if (rows && rows.length > 0) return rows[0];
    }
  } catch (error) {
    console.error(`[Batch Model] createBatchTaskModel error: ${error.message}`);
  }
  return {
    batch_id: parseInt(taskData.batch_id || taskData.batchId, 10),
    title: taskData.title,
    topic: taskData.topic || '',
    difficulty: taskData.difficulty || 'Medium',
    points: parseInt(taskData.points || 100, 10),
    deadline: taskData.deadline || '',
    description: taskData.desc || taskData.description || '',
  };
};

export const getBatchTasksModel = async (batchId) => {
  const bId = parseInt(batchId, 10);
  try {
    const rows = await query('SELECT * FROM batch_tasks WHERE batch_id = ? ORDER BY id DESC', [bId]);
    if (rows && Array.isArray(rows)) {
      return rows.map(r => ({
        ...r,
        desc: r.description || r.desc,
        testCases: typeof r.test_cases === 'string' ? JSON.parse(r.test_cases) : (r.test_cases || [])
      }));
    }
  } catch (error) {
    console.error(`[Batch Model] getBatchTasksModel error: ${error.message}`);
  }
  return [];
};

export const deleteBatchTaskModel = async (taskId) => {
  const tId = parseInt(taskId, 10);
  try {
    await query('DELETE FROM batch_tasks WHERE id = ?', [tId]);
    return true;
  } catch (error) {
    console.error(`[Batch Model] deleteBatchTaskModel error: ${error.message}`);
    return false;
  }
};

export const getTaskSubmissionsModel = async (taskId) => {
  const tId = parseInt(taskId, 10);
  try {
    const rows = await query(
      `SELECT ts.*, u.name, u.email, s.roll_number, s.department
       FROM task_submissions ts
       JOIN users u ON ts.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       WHERE ts.task_id = ?
       ORDER BY ts.submitted_at DESC`,
      [tId]
    );
    return rows || [];
  } catch (error) {
    console.error(`[Batch Model] getTaskSubmissionsModel error: ${error.message}`);
    return [];
  }
};
