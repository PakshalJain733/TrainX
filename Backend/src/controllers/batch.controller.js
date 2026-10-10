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
        language VARCHAR(50) DEFAULT 'Java',
        test_cases TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS batch_daily_topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        batch_id INT NOT NULL,
        topic_date VARCHAR(50) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status VARCHAR(50) DEFAULT 'Scheduled',
        trainer VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_batch_date (batch_id, topic_date)
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
    await safeAlter("ALTER TABLE batch_tasks ADD COLUMN language VARCHAR(50) DEFAULT 'Java'");

    tablesInitialized = true;
  } catch (e) {
    console.warn('[DB ensureTables error]', e.message);
  }
}

function parseTaskRecord(t, isStudent = false) {
  if (!t) return t;
  let parsedTc = [];
  if (t.test_cases) {
    try {
      parsedTc = typeof t.test_cases === 'string' ? JSON.parse(t.test_cases) : t.test_cases;
    } catch (e) {
      parsedTc = [];
    }
  }
  if (isStudent && Array.isArray(parsedTc)) {
    parsedTc = parsedTc.filter(tc => !(tc.is_hidden === true || tc.is_hidden === 1 || String(tc.is_hidden).toLowerCase() === 'true' || tc.isHidden === true || String(tc.isHidden) === 'true'));
  }
  return {
    ...t,
    language: t.language || 'Java',
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

    // 1. Check whether batch code exists in the database
    const rows = await query(
      `SELECT * FROM batches WHERE UPPER(code) = ? OR UPPER(join_code) = ? LIMIT 1`,
      [inputCode, inputCode]
    );

    const foundBatch = rows && rows.length > 0 ? rows[0] : null;

    if (!foundBatch) {
      return sendError(res, `Invalid batch join code '${inputCode}'. No matching batch exists in the database.`, 404);
    }

    // 2. Check whether batch is active
    const batchStatus = (foundBatch.status || 'Active').toLowerCase();
    if (batchStatus === 'inactive' || batchStatus === 'archived' || batchStatus === 'expired') {
      return sendError(res, `Batch '${foundBatch.name}' is currently ${batchStatus} and cannot be joined.`, 400);
    }

    // 3. Check whether batch join code has expired
    const expiresAtVal = foundBatch.code_expires_at || foundBatch.expires_at || foundBatch.code_expires;
    if (expiresAtVal && String(expiresAtVal).toLowerCase() !== 'never') {
      const expDate = new Date(expiresAtVal);
      if (!isNaN(expDate.getTime()) && expDate.getTime() < Date.now()) {
        return sendError(res, `The join code for batch '${foundBatch.name}' has expired. Please request an updated code from your instructor or administrator.`, 400);
      }
    }

    const userId = req.user?.userId || req.user?.id || 1;

    // 4. Check if student is already linked to this batch
    const existingLinks = await query(
      `SELECT * FROM student_batches WHERE user_id = ? AND batch_id = ? LIMIT 1`,
      [userId, foundBatch.id]
    );
    if (existingLinks && existingLinks.length > 0) {
      return sendSuccess(res, `You are already enrolled in batch '${foundBatch.name}'!`, {
        batch: foundBatch,
        batch_id: foundBatch.id,
        batch_name: foundBatch.name,
        join_code: foundBatch.code || foundBatch.join_code
      });
    }

    // 5. Update batch student count and insert student batch link in DB
    await query(`UPDATE batches SET students = GREATEST(COALESCE(students, 0) + 1, 1) WHERE id = ?`, [foundBatch.id]);
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
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return sendSuccess(res, 'Enrolled batches retrieved successfully', []);
    }

    const dbEnrolled = await query(
      `SELECT b.* FROM batches b
       JOIN student_batches sb ON b.id = sb.batch_id
       WHERE sb.user_id = ? AND (b.status IS NULL OR (LOWER(b.status) != 'inactive' AND LOWER(b.status) != 'deleted'))
       ORDER BY b.id DESC`,
      [userId]
    );

    return sendSuccess(res, 'Enrolled batches retrieved successfully', dbEnrolled || []);
  } catch (error) {
    next(error);
  }
};

export const getBatchTasks = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;
    const isStudent = req.user?.role?.toLowerCase() === 'student' || req.user?.role_name?.toLowerCase() === 'student';

    let dbTasks = await query(
      `SELECT * FROM batch_tasks WHERE batch_id = ? OR batch_id = ? OR batch_id = '0' ORDER BY id DESC`,
      [id, cleanId]
    );

    // Fallback: If no batch-specific tasks found, return all assigned batch_tasks in DB so none are lost
    if (!dbTasks || dbTasks.length === 0) {
      dbTasks = await query(`SELECT * FROM batch_tasks ORDER BY id DESC`);
    }

    const formatted = (dbTasks || []).map(t => parseTaskRecord(t, isStudent));
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
    const isStudent = req.user?.role?.toLowerCase() === 'student' || req.user?.role_name?.toLowerCase() === 'student';

    const dbTasks = await query(
      `SELECT * FROM batch_tasks WHERE id = ? OR id = ? LIMIT 1`,
      [taskId, cleanId]
    );

    if (dbTasks && dbTasks.length > 0) {
      return sendSuccess(res, 'Task retrieved successfully', parseTaskRecord(dbTasks[0], isStudent));
    }

    const allTasks = await query(`SELECT * FROM batch_tasks ORDER BY id DESC LIMIT 1`);
    return sendSuccess(res, 'Task retrieved successfully', parseTaskRecord(allTasks[0], isStudent) || null);
  } catch (error) {
    next(error);
  }
};

export const createBatchTask = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const { title, topic, difficulty, points, deadline, desc, description, language, testCases, test_cases } = req.body;

    if (!title) {
      return sendError(res, 'Task title is required', 400);
    }

    const taskDesc = desc || description || '';
    const taskTopic = topic ? topic.trim() : 'General Assignment';
    const taskDiff = difficulty || 'Medium';
    const taskPoints = points ? Number(points) : 100;
    const taskDeadline = deadline || '';
    const taskLang = language || 'Java';
    const tcList = testCases || test_cases || [];
    const testCasesJson = typeof tcList === 'string' ? tcList : JSON.stringify(tcList);

    const result = await query(
      `INSERT INTO batch_tasks (batch_id, title, topic, difficulty, points, deadline, description, language, test_cases)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, title.trim(), taskTopic, taskDiff, taskPoints, taskDeadline, taskDesc, taskLang, testCasesJson]
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

    // Query students enrolled explicitly via student_batches join table (joined via batch code)
    const enrolledUsers = await query(
      `SELECT DISTINCT u.id, u.name, u.email, u.mobile_number, s.roll_number AS rollNo, s.department
       FROM student_batches sb
       JOIN users u ON sb.user_id = u.id
       LEFT JOIN students s ON u.id = s.user_id
       WHERE sb.batch_id = ? OR sb.batch_id = ?
       ORDER BY u.name ASC`,
      [id, cleanId]
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

export const getBatchById = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;
    const rows = await query(
      `SELECT b.*, c.name AS collegeName, d.name AS departmentName
       FROM batches b
       LEFT JOIN colleges c ON b.college_id = c.id
       LEFT JOIN departments d ON b.department_id = d.id
       WHERE b.id = ? OR b.id = ? OR b.code = ? OR b.join_code = ?
       LIMIT 1`,
      [id, cleanId, id, id]
    );

    if (rows && rows.length > 0) {
      const b = rows[0];
      return sendSuccess(res, 'Batch retrieved successfully', {
        ...b,
        collegeId: b.college_id || 1,
        departmentId: b.department_id || 1,
        collegeName: b.collegeName || 'College Campus',
        departmentName: b.departmentName || 'Academic Stream',
        trainer: b.trainer || 'Faculty Instructor',
        schedule: b.schedule || 'Mon, Wed, Fri (10:00 AM)',
        studentsCount: b.students || 0,
        progressPct: b.progress || 0,
        status: b.status || 'Active',
      });
    }

    // Fallback response for new/synthetic batch IDs (e.g. batch-1, batch-3)
    return sendSuccess(res, 'Batch details retrieved', {
      id,
      code: id,
      name: `Batch ${id}`,
      trainer: 'Faculty Instructor',
      schedule: 'Mon, Wed, Fri (10:00 AM - 12:00 PM)',
      status: 'Active',
      progressPct: 0,
      studentsCount: 0
    });
  } catch (error) {
    next(error);
  }
};

export const getBatchDailyTopics = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;

    let dbTopics = await query(
      `SELECT * FROM batch_daily_topics WHERE batch_id = ? OR batch_id = ? ORDER BY topic_date DESC`,
      [id, cleanId]
    );

    if (!dbTopics || dbTopics.length === 0) {
      const [batchRow] = await query(`SELECT * FROM batches WHERE id = ? OR id = ? OR code = ? LIMIT 1`, [id, cleanId, id]);
      if (batchRow && batchRow.topic) {
        const defaultDate = batchRow.date || new Date().toISOString().split("T")[0];
        try {
          await query(
            `INSERT INTO batch_daily_topics (batch_id, topic_date, topic, description, status, trainer)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE topic = VALUES(topic)`,
            [batchRow.id, defaultDate, batchRow.topic, batchRow.description || '', batchRow.status || 'Scheduled', batchRow.trainer || null]
          );
          dbTopics = await query(
            `SELECT * FROM batch_daily_topics WHERE batch_id = ? OR batch_id = ? ORDER BY topic_date DESC`,
            [id, cleanId]
          );
        } catch (e) {
          console.warn('[Auto-populate daily topic error]', e.message);
        }
      }
    }

    return sendSuccess(res, 'Batch daily topics retrieved successfully', dbTopics || []);
  } catch (error) {
    next(error);
  }
};

export const saveBatchDailyTopic = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;
    const { topic_date, topic, description, status, trainer } = req.body;

    if (!topic_date || !topic) {
      return sendError(res, 'Topic date and topic title are required', 400);
    }

    const tDate = String(topic_date).trim();
    const tTopic = String(topic).trim();
    const tDesc = description || '';
    const tStatus = status || 'Scheduled';
    const tTrainer = trainer || null;

    const numericBatchId = parseInt(cleanId, 10) || id;

    await query(
      `INSERT INTO batch_daily_topics (batch_id, topic_date, topic, description, status, trainer)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         topic = VALUES(topic),
         description = VALUES(description),
         status = VALUES(status),
         trainer = VALUES(trainer)`,
      [numericBatchId, tDate, tTopic, tDesc, tStatus, tTrainer]
    );

    await query(
      `UPDATE batches 
       SET topic = ?, description = ?, date = ?, status = ?, trainer = COALESCE(?, trainer)
       WHERE id = ? OR id = ? OR code = ?`,
      [tTopic, tDesc, tDate, tStatus, tTrainer, id, numericBatchId, id]
    );

    const dbTopics = await query(
      `SELECT * FROM batch_daily_topics WHERE batch_id = ? OR batch_id = ? ORDER BY topic_date DESC`,
      [id, numericBatchId]
    );

    return sendSuccess(res, 'Daily topic saved successfully', dbTopics || []);
  } catch (error) {
    next(error);
  }
};



