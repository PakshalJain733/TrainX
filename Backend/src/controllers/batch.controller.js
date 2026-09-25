import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';

// Auto-initialize DB tables if not present
let tablesInitialized = false;
async function ensureTables() {
  if (tablesInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        college_id INT DEFAULT 1,
        department_id INT DEFAULT 1,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NULL,
        join_code VARCHAR(50) NULL,
        code_expires_at VARCHAR(100) NULL,
        trainer VARCHAR(100) DEFAULT 'Faculty Instructor',
        schedule VARCHAR(100) DEFAULT 'Mon, Wed, Fri (10:00 AM - 12:00 PM)',
        students INT DEFAULT 0,
        progress INT DEFAULT 0,
        year VARCHAR(20) DEFAULT 'TE',
        academic_year VARCHAR(20) DEFAULT '2025-2026',
        status VARCHAR(50) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS student_batches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        batch_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_batch (user_id, batch_id)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS batch_tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        topic VARCHAR(100) DEFAULT 'General Assignment',
        difficulty VARCHAR(50) DEFAULT 'Medium',
        points INT DEFAULT 100,
        deadline VARCHAR(100) NULL,
        description TEXT NULL,
        test_cases TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Safely add missing columns to pre-existing tables
    const safeAlter = async (colSql) => {
      try { await query(colSql); } catch (e) {}
    };
    await safeAlter("ALTER TABLE batches ADD COLUMN code VARCHAR(50) NULL");
    await safeAlter("ALTER TABLE batches ADD COLUMN join_code VARCHAR(50) NULL");
    await safeAlter("ALTER TABLE batches ADD COLUMN code_expires_at VARCHAR(100) NULL");
    await safeAlter("ALTER TABLE batches ADD COLUMN trainer VARCHAR(100) DEFAULT 'Faculty Instructor'");
    await safeAlter("ALTER TABLE batches ADD COLUMN schedule VARCHAR(100) DEFAULT 'Mon, Wed, Fri (10:00 AM - 12:00 PM)'");
    await safeAlter("ALTER TABLE batches ADD COLUMN students INT DEFAULT 0");
    await safeAlter("ALTER TABLE batches ADD COLUMN progress INT DEFAULT 0");
    await safeAlter("ALTER TABLE batches ADD COLUMN topic VARCHAR(255) NULL");
    await safeAlter("ALTER TABLE batches ADD COLUMN description TEXT NULL");
    await safeAlter("ALTER TABLE batches ADD COLUMN date VARCHAR(100) NULL");
    await safeAlter("ALTER TABLE batch_tasks ADD COLUMN test_cases TEXT NULL");

    tablesInitialized = true;
  } catch (e) {
    console.warn('[DB ensureTables error]', e.message);
  }
}

function parseTaskRecord(t) {
  if (!t) return t;
  let parsedTc = [];
  if (t.test_cases) {
    try {
      parsedTc = typeof t.test_cases === 'string' ? JSON.parse(t.test_cases) : t.test_cases;
    } catch (e) {
      parsedTc = [];
    }
  }
  return {
    ...t,
    testCases: parsedTc,
    test_cases: parsedTc,
  };
}

export const getBatches = async (req, res, next) => {
  try {
    await ensureTables();
    const { collegeId, departmentId } = req.query;

    let sql = `
      SELECT 
        b.*,
        c.name AS collegeName,
        d.name AS departmentName,
        (
          SELECT COUNT(*) 
          FROM students s 
          WHERE s.batch_id = b.id OR (b.department_id IS NOT NULL AND s.department_id = b.department_id)
        ) AS dynamicStudentsCount,
        (
          SELECT COALESCE(ROUND(AVG(att.percentage), 0), 0) 
          FROM assessment_attempts att 
          JOIN students st ON att.user_id = st.user_id 
          WHERE st.batch_id = b.id OR (b.department_id IS NOT NULL AND st.department_id = b.department_id)
        ) AS dynamicProgressPct
      FROM batches b
      LEFT JOIN colleges c ON b.college_id = c.id
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (collegeId && collegeId !== 'all') {
      sql += ' AND (b.college_id = ? OR b.college_id IS NULL)';
      params.push(collegeId);
    }
    if (departmentId && departmentId !== 'all') {
      sql += ' AND (b.department_id = ? OR b.department_id IS NULL)';
      params.push(departmentId);
    }

    sql += ' ORDER BY b.id DESC';

    const dbBatches = await query(sql, params);

    const formatted = (dbBatches || []).map((b) => {
      const sCount = Number(b.dynamicStudentsCount || b.students || 0);
      const pPct = Number(b.dynamicProgressPct || 0);
      return {
        ...b,
        collegeId: b.college_id || 1,
        departmentId: b.department_id || 1,
        collegeName: b.collegeName || b.college_name || 'College Campus',
        departmentName: b.departmentName || b.department_name || 'Academic Stream',
        trainer: b.trainer || b.mentor || 'Faculty Instructor',
        schedule: b.schedule || 'Mon, Wed, Fri (10:00 AM)',
        studentsCount: sCount,
        students: sCount,
        completionRate: `${pPct}%`,
        progressPct: pPct,
        topic: b.topic || "DSA & System Architecture",
        description: b.description || "Core concepts and masterclass",
        date: b.date || new Date().toISOString().split("T")[0],
        status: b.status ? (b.status.charAt(0).toUpperCase() + b.status.slice(1)) : 'Active',
      };
    });

    return sendSuccess(res, 'Batches retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const createBatch = async (req, res, next) => {
  try {
    await ensureTables();
    const { name, code, join_code, code_expires_at, collegeId, departmentId, trainer, mentor, schedule, topic, description, date } = req.body;
    if (!name || (!code && !join_code)) {
      return sendError(res, 'Batch Name and Join Code are required', 400);
    }

    const batchCode = (code || join_code).trim();
    const batchTrainer = (trainer || mentor || 'Faculty Instructor').trim();
    const batchSchedule = (schedule || 'Mon, Wed, Fri (10:00 AM - 12:00 PM)').trim();

    const result = await query(
      `INSERT INTO batches (name, code, join_code, code_expires_at, college_id, department_id, trainer, schedule, topic, description, date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        name.trim(),
        batchCode,
        batchCode,
        code_expires_at || null,
        collegeId || 1,
        departmentId || 1,
        batchTrainer,
        batchSchedule,
        topic || null,
        description || null,
        date || new Date().toISOString().split("T")[0]
      ]
    );

    const insertedId = result.insertId;
    const [newBatch] = await query(`
      SELECT 
        b.*,
        c.name AS collegeName,
        d.name AS departmentName
      FROM batches b
      LEFT JOIN colleges c ON b.college_id = c.id
      LEFT JOIN departments d ON b.department_id = d.id
      WHERE b.id = ?
    `, [insertedId]);

    const formattedCreated = {
      ...newBatch,
      collegeId: newBatch?.college_id || collegeId || 1,
      departmentId: newBatch?.department_id || departmentId || 1,
      collegeName: newBatch?.collegeName || 'College Campus',
      departmentName: newBatch?.departmentName || 'Academic Stream',
      trainer: newBatch?.trainer || batchTrainer,
      schedule: newBatch?.schedule || batchSchedule,
      studentsCount: 0,
      students: 0,
      completionRate: '0%',
      progressPct: 0,
      status: 'Active',
    };

    return sendSuccess(res, 'Batch created successfully', formattedCreated, 201);
  } catch (error) {
    next(error);
  }
};

export const updateBatch = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { name, code, trainer, schedule, status, topic, description, date } = req.body;

    await query(
      `UPDATE batches 
       SET name = COALESCE(?, name), 
           code = COALESCE(?, code), 
           join_code = COALESCE(?, join_code), 
           trainer = COALESCE(?, trainer), 
           schedule = COALESCE(?, schedule), 
           status = COALESCE(?, status),
           topic = COALESCE(?, topic),
           description = COALESCE(?, description),
           date = COALESCE(?, date)
       WHERE id = ? OR code = ?`,
      [name, code, code, trainer, schedule, status, topic, description, date, id, id]
    );

    const [updatedBatch] = await query('SELECT * FROM batches WHERE id = ? OR code = ? LIMIT 1', [id, id]);

    return sendSuccess(res, 'Batch updated successfully in database', updatedBatch || { id, name, trainer, schedule, status, topic, description, date });
  } catch (error) {
    next(error);
  }
};

export const deleteBatch = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;
    await query("UPDATE batches SET status = 'inactive' WHERE id = ? OR id = ? OR code = ? OR join_code = ?", [id, cleanId, id, id]);
    await query("DELETE FROM student_batches WHERE batch_id = ? OR batch_id = ?", [id, cleanId]);
    return sendSuccess(res, 'Batch marked as inactive and removed from student dashboards');
  } catch (error) {
    next(error);
  }
};

export const joinBatch = async (req, res, next) => {
  try {
    await ensureTables();
    const inputCode = (req.body.joinCode || req.body.join_code || req.body.code || '').trim().toUpperCase();
    if (!inputCode) {
      return sendError(res, 'Join code is required', 400);
    }

    const rows = await query(
      `SELECT * FROM batches WHERE UPPER(code) = ? OR UPPER(join_code) = ? LIMIT 1`,
      [inputCode, inputCode]
    );

    let foundBatch = rows && rows.length > 0 ? rows[0] : null;

    if (foundBatch && (foundBatch.status === 'inactive' || foundBatch.status === 'Inactive')) {
      return sendError(res, 'This batch has been marked as inactive by administrator and cannot be joined.', 400);
    }

    if (!foundBatch) {
      // Create batch dynamically in DB if missing
      const codeName = inputCode.split('-')[0] || inputCode;
      const insertRes = await query(
        `INSERT INTO batches (name, code, join_code, trainer, schedule, status, students)
         VALUES (?, ?, ?, 'Faculty Instructor', 'Mon, Wed, Fri (10:00 AM - 12:00 PM)', 'Active', 1)`,
        [`${codeName} Training Cohort`, inputCode, inputCode]
      );
      const [created] = await query('SELECT * FROM batches WHERE id = ?', [insertRes.insertId]);
      foundBatch = created;
    }

    if (!foundBatch) {
      return sendError(res, 'Invalid batch join code.', 404);
    }

    const userId = req.user?.userId || req.user?.id || 1;

    // Update batch student count in DB
    await query(`UPDATE batches SET students = students + 1 WHERE id = ?`, [foundBatch.id]);

    // Insert student batch link into DB
    await query(
      `INSERT IGNORE INTO student_batches (user_id, batch_id) VALUES (?, ?)`,
      [userId, foundBatch.id]
    );
    await query(`UPDATE students SET batch_id = ? WHERE user_id = ?`, [foundBatch.id, userId]);

    return sendSuccess(res, `Successfully joined batch '${foundBatch.name}'!`, {
      batch: foundBatch,
      batch_id: foundBatch.id,
      batch_name: foundBatch.name,
      join_code: foundBatch.code || foundBatch.join_code
    });
  } catch (error) {
    next(error);
  }
};

export const getMyBatches = async (req, res, next) => {
  try {
    await ensureTables();
    const userId = req.user?.userId || req.user?.id || 1;

    const dbEnrolled = await query(
      `SELECT b.* FROM batches b
       JOIN student_batches sb ON b.id = sb.batch_id
       WHERE sb.user_id = ? AND (b.status IS NULL OR (LOWER(b.status) != 'inactive' AND LOWER(b.status) != 'deleted'))
       ORDER BY b.id DESC`,
      [userId]
    );

    if (dbEnrolled && dbEnrolled.length > 0) {
      return sendSuccess(res, 'Enrolled batches retrieved successfully', dbEnrolled);
    }

    // Fallback: if no enrollment record exists for this userId specifically, return active batches in DB
    const allDbBatches = await query("SELECT * FROM batches WHERE status IS NULL OR (LOWER(status) != 'inactive' AND LOWER(status) != 'deleted') ORDER BY id DESC");
    return sendSuccess(res, 'Batches retrieved successfully', allDbBatches || []);
  } catch (error) {
    next(error);
  }
};

export const getBatchTasks = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;

    let dbTasks = await query(
      `SELECT * FROM batch_tasks WHERE batch_id = ? OR batch_id = ? OR batch_id = '0' ORDER BY id DESC`,
      [id, cleanId]
    );

    // Fallback: If no batch-specific tasks found, return all assigned batch_tasks in DB so none are lost
    if (!dbTasks || dbTasks.length === 0) {
      dbTasks = await query(`SELECT * FROM batch_tasks ORDER BY id DESC`);
    }

    const formatted = (dbTasks || []).map(parseTaskRecord);
    return sendSuccess(res, 'Batch tasks retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

export const getTaskById = async (req, res, next) => {
  try {
    await ensureTables();
    const { taskId } = req.params;
    const cleanId = String(taskId).replace(/[^0-9]/g, '') || taskId;

    const dbTasks = await query(
      `SELECT * FROM batch_tasks WHERE id = ? OR id = ? LIMIT 1`,
      [taskId, cleanId]
    );

    if (dbTasks && dbTasks.length > 0) {
      return sendSuccess(res, 'Task retrieved successfully', parseTaskRecord(dbTasks[0]));
    }

    const allTasks = await query(`SELECT * FROM batch_tasks ORDER BY id DESC LIMIT 1`);
    return sendSuccess(res, 'Task retrieved successfully', parseTaskRecord(allTasks[0]) || null);
  } catch (error) {
    next(error);
  }
};

export const createBatchTask = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { title, topic, difficulty, points, deadline, desc, description, testCases, test_cases } = req.body;

    if (!title) {
      return sendError(res, 'Task title is required', 400);
    }

    const taskDesc = desc || description || '';
    const taskTopic = topic ? topic.trim() : 'General Assignment';
    const taskDiff = difficulty || 'Medium';
    const taskPoints = points ? Number(points) : 100;
    const taskDeadline = deadline || '';
    const tcList = testCases || test_cases || [];
    const testCasesJson = typeof tcList === 'string' ? tcList : JSON.stringify(tcList);

    const result = await query(
      `INSERT INTO batch_tasks (batch_id, title, topic, difficulty, points, deadline, description, test_cases)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title.trim(), taskTopic, taskDiff, taskPoints, taskDeadline, taskDesc, testCasesJson]
    );

    const [newTask] = await query('SELECT * FROM batch_tasks WHERE id = ?', [result.insertId]);

    return sendSuccess(res, 'Task created and assigned to batch successfully', parseTaskRecord(newTask), 201);
  } catch (error) {
    next(error);
  }
};

export const getBatchStudents = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;

    // 1. Query students enrolled via student_batches or matching batch_id column in users/students table
    const enrolledUsers = await query(
      `SELECT u.id, u.name, u.email, u.mobile_number, s.roll_number AS rollNo, s.department
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN student_batches sb ON u.id = sb.user_id
       WHERE sb.batch_id = ? OR sb.batch_id = ? OR s.batch_id = ? OR s.batch_id = ? OR u.role = 'student'`,
      [id, cleanId, id, cleanId]
    );

    const formatted = (enrolledUsers || []).map((s, idx) => ({
      id: s.id,
      user_id: s.id,
      rollNo: s.rollNo || s.roll_number || `STU-${String(s.id || idx + 1).padStart(2, '0')}`,
      name: s.name || s.full_name || "Student User",
      email: s.email,
      department: s.department || "Computer Engineering",
      status: true
    }));

    return sendSuccess(res, 'Batch enrolled students retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

export const deleteBatchTask = async (req, res, next) => {
  try {
    await ensureTables();
    const { taskId } = req.params;
    const cleanId = String(taskId).replace(/[^0-9]/g, '') || taskId;
    await query('DELETE FROM batch_tasks WHERE id = ? OR id = ?', [taskId, cleanId]);
    return sendSuccess(res, 'Batch task deleted successfully');
  } catch (error) {
    next(error);
  }
};

