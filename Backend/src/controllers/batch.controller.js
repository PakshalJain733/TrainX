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
    await safeAlter("ALTER TABLE task_submissions ADD COLUMN batch_id INT NULL");
    await safeAlter("ALTER TABLE task_submissions ADD COLUMN code_submission TEXT NULL");
    await safeAlter("ALTER TABLE task_submissions ADD COLUMN marks_obtained INT DEFAULT 0");
    await safeAlter("ALTER TABLE task_submissions ADD COLUMN feedback TEXT NULL");
    await safeAlter("ALTER TABLE task_submissions ADD COLUMN score INT DEFAULT 0");
    await safeAlter("ALTER TABLE task_submissions ADD COLUMN submitted_code LONGTEXT NULL");

    // Ensure all batches have unique persistent join codes
    try {
      await query(`
        UPDATE batches 
        SET code = COALESCE(NULLIF(code, ''), NULLIF(join_code, ''), CONCAT('BTCH-', LPAD(id, 4, '0'))),
            join_code = COALESCE(NULLIF(join_code, ''), NULLIF(code, ''), CONCAT('BTCH-', LPAD(id, 4, '0')))
        WHERE code IS NULL OR code = '' OR join_code IS NULL OR join_code = ''
      `);
      await query(`
        INSERT IGNORE INTO student_batches (user_id, batch_id)
        SELECT user_id, batch_id FROM students WHERE batch_id IS NOT NULL AND user_id IS NOT NULL
      `);
    } catch (e) {}

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
    const { collegeId, departmentId, date: filterDate } = req.query;
    const queryDate = (filterDate || new Date().toISOString().split('T')[0]).trim();

    let sql = `
      SELECT 
        b.*,
        c.name AS collegeName,
        d.name AS departmentName,
        bdt.topic AS dailyTopic,
        bdt.description AS dailyDescription,
        bdt.trainer AS dailyTrainer,
        bdt.status AS dailyStatus,
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
      LEFT JOIN batch_daily_topics bdt ON (bdt.batch_id = b.id AND bdt.topic_date = ?)
      WHERE 1=1
    `;
    const params = [queryDate];

    if (collegeId && collegeId !== 'all') {
      sql += ' AND (b.college_id = ? OR b.college_id IS NULL)';
      params.push(collegeId);
    }
    let effDeptId = departmentId;
    if ((!effDeptId || effDeptId === 'all') && (req.user?.role === 'coordinator' || String(req.user?.role || '').toLowerCase().includes('coordinator'))) {
      effDeptId = req.user.department_id || req.user.departmentId;
      if (!effDeptId && req.user.department) {
        try {
          const dRows = await query(
            'SELECT id FROM departments WHERE LOWER(name) = LOWER(?) OR LOWER(code) = LOWER(?) LIMIT 1',
            [req.user.department, req.user.department]
          );
          if (dRows && dRows.length > 0) effDeptId = dRows[0].id;
        } catch (_) {}
      }
    }

    if (effDeptId && effDeptId !== 'all') {
      sql += ' AND (b.department_id = ? OR b.department_id IS NULL)';
      params.push(effDeptId);
    }

    sql += ' ORDER BY b.id DESC';

    const dbBatches = await query(sql, params);

    const formatted = (dbBatches || []).map((b) => {
      const sCount = Number(b.dynamicStudentsCount || b.students || 0);
      const pPct = Number(b.dynamicProgressPct || 0);
      const activeTopic = b.dailyTopic || b.topic;
      const activeDesc = b.dailyDescription || b.description;
      const activeTrainer = b.dailyTrainer || b.trainer || b.mentor || 'Faculty Instructor';
      const activeStatus = b.dailyStatus || b.status;
      return {
        ...b,
        collegeId: b.college_id || 1,
        departmentId: b.department_id || 1,
        collegeName: b.collegeName || b.college_name || 'College Campus',
        departmentName: b.departmentName || b.department_name || 'Academic Stream',
        trainer: activeTrainer,
        schedule: b.schedule || 'Mon, Wed, Fri (10:00 AM)',
        studentsCount: sCount,
        students: sCount,
        completionRate: `${pPct}%`,
        progressPct: pPct,
        topic: activeTopic || "DSA & System Architecture",
        description: activeDesc || "Core concepts and masterclass",
        date: queryDate,
        status: activeStatus ? (activeStatus.charAt(0).toUpperCase() + activeStatus.slice(1)) : 'Active',
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
    const targetCollegeId = collegeId || req.user?.college_id || req.user?.collegeId || 1;

    const result = await query(
      `INSERT INTO batches (name, code, join_code, code_expires_at, college_id, department_id, trainer, schedule, topic, description, date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      [
        name.trim(),
        batchCode,
        batchCode,
        code_expires_at || null,
        targetCollegeId,
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
    const rawInput = (req.body.joinCode || req.body.join_code || req.body.code || '').trim();
    if (!rawInput) {
      return sendError(res, 'Join code is required', 400);
    }

    const cleanRaw = rawInput.trim();
    const upperInput = cleanRaw.toUpperCase();
    const alphanumericOnly = upperInput.replace(/[^A-Z0-9]/g, '');
    const numericOnly = parseInt(upperInput.replace(/[^0-9]/g, ''), 10);

    // 1. Flexible multi-tier matching:
    // (a) Exact match on code, join_code, or batch name (case-insensitive)
    let rows = await query(
      `SELECT * FROM batches 
       WHERE UPPER(TRIM(COALESCE(code, ''))) = ? 
          OR UPPER(TRIM(COALESCE(join_code, ''))) = ? 
          OR UPPER(TRIM(name)) = ?
       LIMIT 1`,
      [upperInput, upperInput, upperInput]
    );

    // (b) Alphanumeric match (ignoring dashes, underscores, spaces)
    if (!rows || rows.length === 0) {
      rows = await query(
        `SELECT * FROM batches 
         WHERE REPLACE(REPLACE(REPLACE(UPPER(COALESCE(code, '')), '-', ''), '_', ''), ' ', '') = ?
            OR REPLACE(REPLACE(REPLACE(UPPER(COALESCE(join_code, '')), '-', ''), '_', ''), ' ', '') = ?
            OR REPLACE(REPLACE(REPLACE(UPPER(name), '-', ''), '_', ''), ' ', '') = ?
         LIMIT 1`,
        [alphanumericOnly, alphanumericOnly, alphanumericOnly]
      );
    }

    // (c) Standard generated batch code formats (e.g. BATCH-1, BTCH-0001)
    if (!rows || rows.length === 0) {
      rows = await query(
        `SELECT * FROM batches 
         WHERE UPPER(CONCAT('BATCH-', id)) = ?
            OR UPPER(CONCAT('BTCH-', id)) = ?
            OR UPPER(CONCAT('BTCH-', LPAD(id, 4, '0'))) = ?
            OR UPPER(CONCAT('BTCH', LPAD(id, 4, '0'))) = ?
         LIMIT 1`,
        [upperInput, upperInput, upperInput, upperInput]
      );
    }

    // (d) Direct numeric ID match if purely a number
    if ((!rows || rows.length === 0) && !isNaN(numericOnly) && numericOnly > 0 && String(cleanRaw) === String(numericOnly)) {
      rows = await query(`SELECT * FROM batches WHERE id = ? LIMIT 1`, [numericOnly]);
    }

    const foundBatch = rows && rows.length > 0 ? rows[0] : null;

    if (!foundBatch) {
      return sendError(res, `Invalid batch join code '${rawInput}'. No matching batch exists in the database.`, 404);
    }

    // 2. Prevent joining permanently deleted batches
    const batchStatus = (foundBatch.status || 'active').toLowerCase();
    if (batchStatus === 'deleted') {
      return sendError(res, `Batch '${foundBatch.name}' has been deleted and cannot be joined.`, 400);
    }

    // 3. If batch exists in database but was inactive or archived, reactivate it so the student can access it
    if (batchStatus !== 'active') {
      try {
        await query(`UPDATE batches SET status = 'active' WHERE id = ?`, [foundBatch.id]);
        foundBatch.status = 'active';
      } catch (err) {
        console.warn('[joinBatch] auto-reactivate status warning:', err.message);
      }
    }

    const userId = req.user?.userId || req.user?.id || 1;

    // 4. Link student in student_batches join table
    await query(
      `INSERT IGNORE INTO student_batches (user_id, batch_id) VALUES (?, ?)`,
      [userId, foundBatch.id]
    );

    // 5. Link student profile in students table
    try {
      const studentRows = await query(`SELECT id FROM students WHERE user_id = ? LIMIT 1`, [userId]);
      if (studentRows && studentRows.length > 0) {
        await query(
          `UPDATE students 
           SET batch_id = ?, 
               college_id = COALESCE(college_id, ?) 
           WHERE user_id = ?`,
          [foundBatch.id, foundBatch.college_id, userId]
        );
      } else {
        await query(
          `INSERT INTO students (user_id, batch_id, college_id) VALUES (?, ?, ?)`,
          [userId, foundBatch.id, foundBatch.college_id]
        );
      }
    } catch (err) {
      console.warn('[joinBatch] update students table warning:', err.message);
    }

    // 6. Update dynamic student enrollment count on batches table
    try {
      const countResult = await query(
        `SELECT COUNT(DISTINCT user_id) as cnt FROM student_batches WHERE batch_id = ?`,
        [foundBatch.id]
      );
      const studentCount = countResult && countResult[0] && Number(countResult[0].cnt) > 0 ? Number(countResult[0].cnt) : 1;
      await query(`UPDATE batches SET students = ? WHERE id = ?`, [studentCount, foundBatch.id]);
    } catch (err) {
      console.warn('[joinBatch] update batches student count warning:', err.message);
    }

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
      `SELECT DISTINCT b.* FROM batches b
       LEFT JOIN student_batches sb ON b.id = sb.batch_id AND sb.user_id = ?
       LEFT JOIN students s ON s.user_id = ? AND s.batch_id = b.id
       WHERE (sb.id IS NOT NULL OR s.id IS NOT NULL) 
         AND (b.status IS NULL OR LOWER(b.status) != 'deleted')
       ORDER BY b.id DESC`,
      [userId, userId]
    );

    const batchesWithProgress = await Promise.all((dbEnrolled || []).map(async (b) => {
      let progress = 0;
      try {
        const tasks = await query(`SELECT id FROM batch_tasks WHERE batch_id = ?`, [b.id]);
        if (tasks && tasks.length > 0) {
          const taskIds = tasks.map(t => t.id);
          const completed = await query(
            `SELECT COUNT(DISTINCT task_id) as count FROM task_submissions 
             WHERE user_id = ? AND task_id IN (?) AND LOWER(status) IN ('completed', 'passed')`,
            [userId, taskIds]
          );
          const done = completed && completed[0] ? Number(completed[0].count) : 0;
          progress = Math.round((done / tasks.length) * 100);
        } else {
          // If no specific batch tasks, check general activity or fallback
          const generalSub = await query(
            `SELECT COUNT(*) as count FROM task_submissions WHERE user_id = ? AND LOWER(status) IN ('completed', 'passed')`,
            [userId]
          );
          if (generalSub && generalSub[0] && Number(generalSub[0].count) > 0) {
            progress = Math.min(100, Number(generalSub[0].count) * 20);
          } else {
            progress = Number(b.progress) || 0;
          }
        }
      } catch (e) {
        progress = Number(b.progress) || 0;
      }
      return {
        ...b,
        progress: Number(progress) || Number(b.progress) || 0
      };
    }));

    return sendSuccess(res, 'Enrolled batches retrieved successfully', batchesWithProgress);
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
    const studentId = req.user?.userId || req.user?.id;

    let dbTasks = await query(
      `SELECT * FROM batch_tasks WHERE batch_id = ? OR batch_id = ? OR batch_id = '0' ORDER BY id DESC`,
      [id, cleanId]
    );

    // Fallback: If no batch-specific tasks found, return all assigned batch_tasks in DB so none are lost
    if (!dbTasks || dbTasks.length === 0) {
      dbTasks = await query(`SELECT * FROM batch_tasks ORDER BY id DESC`);
    }

    let studentSubmissions = new Map();
    if (studentId) {
      try {
        const subRows = await query(
          `SELECT task_id, status, COALESCE(marks_obtained, score, 0) as marks_obtained, COALESCE(score, marks_obtained, 0) as score
           FROM task_submissions 
           WHERE user_id = ?`,
          [studentId]
        );
        if (Array.isArray(subRows)) {
          subRows.forEach(s => {
            studentSubmissions.set(Number(s.task_id), s);
          });
        }
        const cSubRows = await query(
          `SELECT problem_id as task_id, status, marks as marks_obtained, score
           FROM coding_submissions
           WHERE student_id = ?`,
          [studentId]
        );
        if (Array.isArray(cSubRows)) {
          cSubRows.forEach(s => {
            const tId = Number(s.task_id);
            if (!studentSubmissions.has(tId)) {
              studentSubmissions.set(tId, s);
            }
          });
        }
      } catch (e) {
        console.warn('[getBatchTasks submissions query error]', e.message);
      }
    }

    const isDeadlineExpired = (deadline) => {
      if (!deadline || typeof deadline !== 'string') return false;
      const clean = deadline.replace(/^Due\s+/i, '').trim();
      if (!clean || clean.toLowerCase() === 'no deadline' || clean.toLowerCase() === 'none') return false;
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          d.setHours(23, 59, 59, 999);
        }
        return d.getTime() < Date.now();
      }
      return false;
    };

    const formatted = (dbTasks || []).map(t => {
      const parsed = parseTaskRecord(t, isStudent);
      const sub = studentSubmissions.get(Number(t.id));
      let taskStatus = 'Pending';
      let scoreObtained = null;
      let alreadySubmitted = false;
      const isExpired = isDeadlineExpired(t.deadline) && !sub;

      if (sub) {
        alreadySubmitted = true;
        scoreObtained = sub.marks_obtained ?? sub.score ?? 0;
        const lower = String(sub.status || '').toLowerCase();
        if (lower === 'passed' || lower === 'completed' || lower === 'accepted') {
          taskStatus = 'Completed';
        } else if (lower === 'partial' || scoreObtained > 0) {
          taskStatus = 'Partial';
        } else {
          taskStatus = 'Submitted';
        }
      } else if (isExpired) {
        taskStatus = 'Expired';
      }

      return {
        ...parsed,
        status: taskStatus,
        alreadySubmitted,
        scoreObtained,
        marksObtained: scoreObtained,
        isExpired,
      };
    });

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
    const studentId = req.user?.userId || req.user?.id;

    let targetTask = null;
    const dbTasks = await query(
      `SELECT * FROM batch_tasks WHERE id = ? OR id = ? LIMIT 1`,
      [taskId, cleanId]
    );

    if (dbTasks && dbTasks.length > 0) {
      targetTask = dbTasks[0];
    }

    if (!targetTask) {
      return sendSuccess(res, 'Task retrieved successfully', null);
    }

    let alreadySubmitted = false;
    let submission = null;
    if (studentId) {
      const subRows = await query(
        `SELECT * FROM task_submissions WHERE task_id = ? AND user_id = ? ORDER BY id DESC LIMIT 1`,
        [targetTask.id, studentId]
      );
      if (subRows && subRows.length > 0) {
        alreadySubmitted = true;
        submission = subRows[0];
      } else {
        const codeSubRows = await query(
          `SELECT * FROM coding_submissions WHERE problem_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1`,
          [targetTask.id, studentId]
        );
        if (codeSubRows && codeSubRows.length > 0) {
          alreadySubmitted = true;
          submission = codeSubRows[0];
        }
      }
    }

    const isDeadlineExpired = (deadline) => {
      if (!deadline || typeof deadline !== 'string') return false;
      const clean = deadline.replace(/^Due\s+/i, '').trim();
      if (!clean || clean.toLowerCase() === 'no deadline' || clean.toLowerCase() === 'none') return false;
      const d = new Date(clean);
      if (!isNaN(d.getTime())) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
          d.setHours(23, 59, 59, 999);
        }
        return d.getTime() < Date.now();
      }
      return false;
    };

    const isExpired = isDeadlineExpired(targetTask.deadline) && !alreadySubmitted;
    const parsed = parseTaskRecord(targetTask, isStudent);
    return sendSuccess(res, 'Task retrieved successfully', {
      ...parsed,
      alreadySubmitted,
      submission,
      isExpired,
      status: alreadySubmitted ? (submission?.status || 'Submitted') : (isExpired ? 'Expired' : 'Pending'),
    });
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

    // Query students enrolled via student_batches join table or students table
    const enrolledUsers = await query(
      `SELECT DISTINCT u.id, u.name, u.email, u.mobile_number, COALESCE(s.roll_number, '') AS rollNo, s.department
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN student_batches sb ON sb.user_id = u.id
       WHERE (sb.batch_id = ? OR sb.batch_id = ? OR s.batch_id = ? OR s.batch_id = ?)
         AND u.role = 'student'
       ORDER BY u.name ASC`,
      [id, cleanId, id, cleanId]
    );

    const formatted = (enrolledUsers || []).map((s, idx) => ({
      id: s.id,
      user_id: s.id,
      userId: s.id,
      studentId: s.id,
      rollNo: s.rollNo || `STU-${String(s.id || idx + 1).padStart(2, '0')}`,
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

export const getTaskSubmissions = async (req, res, next) => {
  try {
    await ensureTables();
    const { taskId } = req.params;
    const cleanId = parseInt(String(taskId).replace(/[^0-9]/g, ''), 10);
    if (!cleanId) {
      return sendSuccess(res, 'Submissions retrieved successfully', []);
    }

    const rows = await query(
      `SELECT ts.id, ts.task_id, ts.user_id, ts.batch_id, 
              COALESCE(ts.code_submission, ts.submitted_code) AS code_submission, 
              ts.status, 
              COALESCE(ts.marks_obtained, ts.score, 0) AS marks_obtained,
              COALESCE(ts.score, ts.marks_obtained, 0) AS score,
              ts.feedback, 
              ts.submitted_at,
              COALESCE(bt.points, 100) AS total_marks,
              COALESCE(u.name, 'Student') AS name, u.email, s.roll_number, s.department
       FROM task_submissions ts
       JOIN users u ON ts.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN batch_tasks bt ON ts.task_id = bt.id
       WHERE ts.task_id = ?
       ORDER BY ts.submitted_at DESC`,
      [cleanId]
    );

    return sendSuccess(res, 'Submissions retrieved successfully', rows || []);
  } catch (error) {
    next(error);
  }
};



