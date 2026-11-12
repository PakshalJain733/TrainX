import * as XLSX from 'xlsx';
import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';
import { getRelatedCollegeIds } from '../models/user.model.js';
import { query } from '../config/db.js';
import { getMentorAssignedBatchIds } from './mentor.controller.js';

export function generateAlphaNumericCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

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
    await safeAlter("ALTER TABLE users MODIFY COLUMN role ENUM('super_admin', 'college_admin', 'coordinator', 'mentor', 'student', 'trainer') NOT NULL DEFAULT 'student'");
    await safeAlter("ALTER TABLE batches ADD COLUMN trainer_id INT NULL");
    await safeAlter("ALTER TABLE batch_tasks ADD COLUMN created_by INT NULL");
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
    await safeAlter("ALTER TABLE batch_tasks ADD COLUMN task_date VARCHAR(50) NULL AFTER deadline");
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
    const { collegeId, departmentId, date: filterDate, status: filterStatus } = req.query;
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
        tu.name AS registeredTrainerName,
        tu.email AS registeredTrainerEmail,
        (
          SELECT COUNT(DISTINCT u_cnt.id)
          FROM users u_cnt
          LEFT JOIN students s ON u_cnt.id = s.user_id
          LEFT JOIN student_batches sb ON sb.user_id = u_cnt.id
          WHERE u_cnt.role = 'student'
            AND (sb.batch_id = b.id OR s.batch_id = b.id)
        ) AS dynamicStudentsCount,
        (
          SELECT COALESCE(ROUND(AVG(att.percentage), 0), 0) 
          FROM assessment_attempts att 
          JOIN students st ON att.user_id = st.user_id 
          WHERE st.batch_id = b.id
             OR EXISTS (SELECT 1 FROM student_batches sb WHERE sb.user_id = st.user_id AND sb.batch_id = b.id)
        ) AS dynamicProgressPct
      FROM batches b
      LEFT JOIN colleges c ON b.college_id = c.id
      LEFT JOIN departments d ON b.department_id = d.id
      LEFT JOIN batch_daily_topics bdt ON (bdt.batch_id = b.id AND bdt.topic_date = ?)
      LEFT JOIN users tu ON (b.trainer_id = tu.id OR (tu.role = 'trainer' AND LOWER(TRIM(tu.name)) = LOWER(TRIM(b.trainer))))
      WHERE 1=1
    `;
    const params = [queryDate];

    const effCollegeId = (collegeId && collegeId !== 'all')
      ? collegeId
      : (req.user?.role !== ROLES.SUPER_ADMIN ? (req.user?.college_id || req.user?.collegeId) : null);

    if (effCollegeId && effCollegeId !== 'all') {
      const relatedIds = await getRelatedCollegeIds(effCollegeId);
      if (relatedIds.length === 1) {
        sql += ' AND (b.college_id = ? OR b.college_id IS NULL)';
        params.push(relatedIds[0]);
      } else if (relatedIds.length > 1) {
        const placeholders = relatedIds.map(() => '?').join(', ');
        sql += ` AND (b.college_id IN (${placeholders}) OR b.college_id IS NULL)`;
        params.push(...relatedIds);
      }
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

    if (filterStatus && filterStatus !== 'all') {
      sql += " AND (LOWER(COALESCE(b.status, 'Active')) = ?)";
      params.push(filterStatus.toLowerCase().trim());
    }

    if (req.user?.role === 'mentor') {
      const mentorId = req.user?.userId || req.user?.id;
      const mentorCollegeId = req.user?.collegeId || req.user?.college_id;
      const assignedIds = await getMentorAssignedBatchIds(mentorId, mentorCollegeId);
      if (!assignedIds || assignedIds.length === 0) {
        return sendSuccess(res, 'Batches retrieved successfully', []);
      }
      sql += ` AND b.id IN (${assignedIds.map(() => '?').join(', ')})`;
      params.push(...assignedIds);
    }

    sql += ' ORDER BY b.id DESC';

    const dbBatches = await query(sql, params);

    const formatted = (dbBatches || []).map((b) => {
      const sCount = Number(b.dynamicStudentsCount || b.students || 0);
      const pPct = Number(b.dynamicProgressPct || 0);
      const activeTopic = b.dailyTopic || b.topic;
      const activeDesc = b.dailyDescription || b.description;
      const registeredTrainer = b.registeredTrainerName;
      const activeTrainer = registeredTrainer || b.dailyTrainer || (b.trainer && b.trainer !== 'Faculty Instructor' ? b.trainer : 'Unassigned');
      const rawStatus = b.status || 'Active';
      const cleanBatchStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
      const cleanDailyStatus = b.dailyStatus ? (b.dailyStatus.charAt(0).toUpperCase() + b.dailyStatus.slice(1)) : 'Scheduled';

      return {
        ...b,
        code: b.code || b.join_code,
        joinCode: b.join_code || b.code,
        join_code: b.join_code || b.code,
        codeExpiresAt: b.code_expires_at ? Number(b.code_expires_at) : null,
        code_expires_at: b.code_expires_at ? Number(b.code_expires_at) : null,
        collegeId: b.college_id || 1,
        departmentId: b.department_id || 1,
        collegeName: b.collegeName || b.college_name || 'College Campus',
        departmentName: b.departmentName || b.department_name || 'Academic Stream',
        trainer: activeTrainer,
        registeredTrainerName: registeredTrainer || null,
        registeredTrainerEmail: b.registeredTrainerEmail || null,
        isTrainerRegistered: Boolean(registeredTrainer),
        schedule: b.schedule || 'Mon, Wed, Fri (10:00 AM)',
        studentsCount: sCount,
        students: sCount,
        completionRate: `${pPct}%`,
        progressPct: pPct,
        topic: activeTopic || "DSA & System Architecture",
        description: activeDesc || "Core concepts and masterclass",
        date: queryDate,
        status: cleanBatchStatus,
        batchStatus: cleanBatchStatus,
        dailyStatus: cleanDailyStatus,
        topicStatus: cleanDailyStatus,
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
    const { name, code, join_code, code_expires_at, collegeId, departmentId, trainer, mentor, trainer_id, schedule, topic, description, date, year, division } = req.body;
    if (!name || (!name.trim())) {
      return sendError(res, 'Batch Name is required', 400);
    }

    const batchCode = ((code || join_code || '').toString().trim().toUpperCase()) || generateAlphaNumericCode(8);
    const batchTrainer = (trainer || mentor || 'Faculty Instructor').trim();
    const batchSchedule = (schedule || 'Mon, Wed, Fri (10:00 AM - 12:00 PM)').trim();

    // 1. Resolve valid targetCollegeId satisfying foreign key batches_ibfk_1
    let targetCollegeId = collegeId || req.user?.college_id || req.user?.collegeId;
    if (targetCollegeId) {
      const [colRow] = await query('SELECT id FROM colleges WHERE id = ? LIMIT 1', [targetCollegeId]);
      if (!colRow) targetCollegeId = null;
    }
    if (!targetCollegeId) {
      const [firstCollege] = await query('SELECT id FROM colleges ORDER BY id ASC LIMIT 1');
      if (!firstCollege) {
        return sendError(res, 'No college found in system to associate batch with', 400);
      }
      targetCollegeId = firstCollege.id;
    }

    // 2. Resolve valid targetDepartmentId satisfying foreign key batches_ibfk_2
    let targetDepartmentId = departmentId || req.user?.department_id || req.user?.departmentId;
    if (targetDepartmentId) {
      const [deptRow] = await query('SELECT id FROM departments WHERE id = ? AND college_id = ? LIMIT 1', [targetDepartmentId, targetCollegeId]);
      if (!deptRow) targetDepartmentId = null;
    }
    if (!targetDepartmentId) {
      const [firstDept] = await query('SELECT id FROM departments WHERE college_id = ? ORDER BY id ASC LIMIT 1', [targetCollegeId]);
      if (firstDept) {
        targetDepartmentId = firstDept.id;
      } else {
        // Automatically create a default department for this college so foreign key is satisfied
        const insertDept = await query(
          'INSERT INTO departments (college_id, name, code, status) VALUES (?, ?, ?, ?)',
          [targetCollegeId, 'General Engineering', 'GEN', 'Active']
        );
        targetDepartmentId = insertDept.insertId;
      }
    }

    // 3. Resolve trainerId
    let trainerId = trainer_id ? parseInt(trainer_id, 10) : null;
    if (!trainerId && batchTrainer && batchTrainer !== 'Faculty Instructor') {
      try {
        const [trainerUser] = await query(
          "SELECT id, name FROM users WHERE (name = ? OR email = ?) AND role = 'trainer' LIMIT 1",
          [batchTrainer, batchTrainer]
        );
        if (trainerUser) {
          trainerId = trainerUser.id;
        }
      } catch (_) {}
    }

    const expiresAt = code_expires_at ? Number(code_expires_at) : null;

    const result = await query(
      `INSERT INTO batches (name, code, join_code, code_expires_at, college_id, department_id, trainer, trainer_id, schedule, topic, description, date, year, division, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [
        name.trim(),
        batchCode,
        batchCode,
        expiresAt,
        targetCollegeId,
        targetDepartmentId,
        batchTrainer,
        trainerId || null,
        batchSchedule,
        topic || null,
        description || null,
        date || new Date().toISOString().split("T")[0],
        year || 'TE',
        division || 'A'
      ]
    );

    const insertedId = result.insertId;
    if (trainerId) {
      try {
        await query(
          `INSERT IGNORE INTO batch_trainers (user_id, batch_id) VALUES (?, ?)`,
          [trainerId, insertedId]
        );
      } catch (_) {}
    }

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
      collegeId: newBatch?.college_id || targetCollegeId,
      departmentId: newBatch?.department_id || targetDepartmentId,
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
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;
    const {
      name,
      code,
      join_code,
      joinCode,
      code_expires_at,
      codeExpiresAt,
      trainer,
      mentor,
      schedule,
      status,
      topic,
      description,
      date,
      year,
      division,
    } = req.body;

    const newCode = (code || join_code || joinCode || '').toString().trim() || null;
    const rawExpires = code_expires_at !== undefined ? code_expires_at : codeExpiresAt;
    const newExpiresAt = (rawExpires !== undefined && rawExpires !== null && rawExpires !== '')
      ? String(rawExpires)
      : (newCode ? String(Date.now() + 5 * 60 * 1000) : null);
    const effectiveTrainer = (trainer || mentor || '').trim() || null;

    await query(
      `UPDATE batches 
       SET name = COALESCE(?, name), 
           code = COALESCE(?, code), 
           join_code = COALESCE(?, join_code), 
           code_expires_at = COALESCE(?, code_expires_at),
           trainer = COALESCE(?, trainer), 
           schedule = COALESCE(?, schedule), 
           status = COALESCE(?, status),
           topic = COALESCE(?, topic),
           description = COALESCE(?, description),
           date = COALESCE(?, date),
           year = COALESCE(?, year),
           division = COALESCE(?, division),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? OR id = ? OR code = ? OR join_code = ?`,
      [
        name ? name.trim() : null,
        newCode,
        newCode,
        newExpiresAt,
        effectiveTrainer,
        schedule ? schedule.trim() : null,
        status || null,
        topic || null,
        description || null,
        date || null,
        year || null,
        division || null,
        id,
        cleanId,
        id,
        id,
      ]
    );

    if (effectiveTrainer) {
      try {
        const [trainerUser] = await query(
          "SELECT id, name FROM users WHERE (name = ? OR email = ?) AND role = 'trainer' LIMIT 1",
          [effectiveTrainer, effectiveTrainer]
        );
        if (trainerUser) {
          await query(
            `UPDATE batches SET trainer_id = ? WHERE id = ? OR id = ? OR code = ? OR join_code = ?`,
            [trainerUser.id, id, cleanId, id, id]
          );
          await query(
            `INSERT IGNORE INTO batch_trainers (user_id, batch_id) VALUES (?, ?)`,
            [trainerUser.id, cleanId]
          );
        }
      } catch (linkErr) {
        console.warn('[updateBatch trainer link warning]', linkErr.message);
      }
    }

    const [updatedBatch] = await query(
      'SELECT * FROM batches WHERE id = ? OR id = ? OR code = ? OR join_code = ? LIMIT 1',
      [id, cleanId, id, id]
    );

    if (updatedBatch) {
      updatedBatch.code = updatedBatch.code || updatedBatch.join_code || newCode;
      updatedBatch.joinCode = updatedBatch.join_code || updatedBatch.code || newCode;
      updatedBatch.join_code = updatedBatch.join_code || updatedBatch.code || newCode;
      updatedBatch.codeExpiresAt = updatedBatch.code_expires_at ? Number(updatedBatch.code_expires_at) : null;
      updatedBatch.code_expires_at = updatedBatch.code_expires_at ? Number(updatedBatch.code_expires_at) : null;
    }

    return sendSuccess(res, 'Batch updated successfully in database', updatedBatch || {
      id,
      name,
      code: newCode,
      joinCode: newCode,
      join_code: newCode,
      codeExpiresAt: newExpiresAt ? Number(newExpiresAt) : null,
      code_expires_at: newExpiresAt,
      trainer: effectiveTrainer,
      schedule,
      status,
      topic,
      description,
      date,
    });
  } catch (error) {
    next(error);
  }
};

export const regenerateBatchCode = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;

    const [batch] = await query(
      'SELECT * FROM batches WHERE id = ? OR id = ? OR code = ? OR join_code = ? LIMIT 1',
      [id, cleanId, id, id]
    );

    if (!batch) {
      return sendError(res, 'Batch not found', 404);
    }

    let newCode = (req.body.code || req.body.join_code || req.body.joinCode || '').toString().trim().toUpperCase();
    if (!newCode) {
      newCode = generateAlphaNumericCode(8);
    }

    const durationMs = 5 * 60 * 1000;
    const rawExpires = req.body.code_expires_at !== undefined ? req.body.code_expires_at : req.body.codeExpiresAt;
    const expiresAt = (rawExpires !== undefined && rawExpires !== null && rawExpires !== '')
      ? String(rawExpires)
      : String(Date.now() + durationMs);

    await query(
      `UPDATE batches 
       SET code = ?, 
           join_code = ?, 
           code_expires_at = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [newCode, newCode, expiresAt, batch.id]
    );

    const [updated] = await query('SELECT * FROM batches WHERE id = ? LIMIT 1', [batch.id]);

    return sendSuccess(res, 'Batch code regenerated and updated in database successfully', {
      ...updated,
      id: updated?.id || batch.id,
      code: updated?.code || newCode,
      joinCode: updated?.join_code || updated?.code || newCode,
      join_code: updated?.join_code || updated?.code || newCode,
      code_expires_at: updated?.code_expires_at || expiresAt,
      codeExpiresAt: Number(updated?.code_expires_at || expiresAt),
    });
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
    const rawInput = (req.body.joinCode || req.body.join_code || req.body.code || req.body.batch_id || req.body.batchId || '').toString().trim();
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
    const role = (req.user?.role || req.user?.role_name || '').toLowerCase();
    const isTrainerOrMentor = role === 'mentor' || role === 'trainer' || role === 'faculty' || role === 'coordinator' || role === 'admin' || role === 'college_admin';

    const batchIdNum = parseInt(foundBatch.id, 10);
    const batchIdStr = String(foundBatch.id);
    const userIdNum = parseInt(userId, 10);
    const userIdStr = String(userId);

    if (isTrainerOrMentor) {
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS batch_trainers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            batch_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_trainer_batch (user_id, batch_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Check if trainer/mentor already joined this batch
        const [alreadyTrainer] = await query(
          `SELECT 1 FROM batch_trainers 
           WHERE (user_id = ? OR user_id = ?) 
             AND (batch_id = ? OR batch_id = ?)
           LIMIT 1`,
          [userIdNum, userIdStr, batchIdNum, batchIdStr]
        );

        const [alreadyAssignedTrainer] = await query(
          `SELECT 1 FROM batches 
           WHERE (id = ? OR id = ?) 
             AND (trainer_id = ? OR trainer_id = ?)
           LIMIT 1`,
          [batchIdNum, batchIdStr, userIdNum, userIdStr]
        );

        if (alreadyTrainer || alreadyAssignedTrainer) {
          return sendError(res, 'Batch already joined.', 400);
        }

        await query(
          `INSERT IGNORE INTO batch_trainers (user_id, batch_id) VALUES (?, ?)`,
          [userId, foundBatch.id]
        );

        let trainerName = req.user?.name;
        if (!trainerName) {
          const [uRow] = await query(`SELECT name FROM users WHERE id = ? LIMIT 1`, [userId]);
          trainerName = uRow?.name || 'Trainer';
        }

        await query(
          `UPDATE batches 
             SET trainer = ?,
                 trainer_id = ?,
                 mentor = CASE WHEN mentor IS NULL OR mentor = '' OR mentor = 'Faculty Mentor' THEN ? ELSE mentor END
           WHERE id = ?`,
          [trainerName, userId, trainerName, foundBatch.id]
        );

        return sendSuccess(res, `Successfully joined batch '${foundBatch.name}' as Trainer!`, {
          batch: foundBatch,
          batch_id: foundBatch.id,
          batch_name: foundBatch.name,
          join_code: foundBatch.code || foundBatch.join_code,
          is_trainer: true
        });
      } catch (err) {
        console.error('[joinBatch trainer link error]', err.message);
      }
    }

    // 3b. Check if student has already joined this batch (e.g. joined earlier with an old code or different join code)
    const [alreadyJoinedStudent] = await query(
      `SELECT 1 FROM student_batches 
       WHERE (user_id = ? OR user_id = ?) 
         AND (batch_id = ? OR batch_id = ?)
       UNION
       SELECT 1 FROM students 
       WHERE (user_id = ? OR user_id = ?) 
         AND (batch_id = ? OR batch_id = ?)
       LIMIT 1`,
      [userIdNum, userIdStr, batchIdNum, batchIdStr, userIdNum, userIdStr, batchIdNum, batchIdStr]
    );

    if (alreadyJoinedStudent) {
      return sendError(res, 'Batch already joined.', 400);
    }

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
      `SELECT DISTINCT b.*,
              c.name AS collegeName,
              d.name AS departmentName,
              (SELECT COUNT(*) FROM students st WHERE st.batch_id = b.id) AS dynamicStudentsCount,
              (SELECT COUNT(*) FROM batch_tasks bt2 WHERE bt2.batch_id = b.id) AS tasksCount
       FROM batches b
       LEFT JOIN student_batches sb ON b.id = sb.batch_id AND sb.user_id = ?
       LEFT JOIN students s ON s.user_id = ? AND s.batch_id = b.id
       LEFT JOIN batch_trainers bt ON bt.batch_id = b.id AND bt.user_id = ?
       LEFT JOIN colleges c ON b.college_id = c.id
       LEFT JOIN departments d ON b.department_id = d.id
       WHERE (sb.id IS NOT NULL OR s.id IS NOT NULL OR bt.id IS NOT NULL OR b.trainer_id = ?) 
         AND (b.status IS NULL OR LOWER(b.status) != 'deleted')
       ORDER BY b.id DESC`,
      [userId, userId, userId, userId]
    );

    const batchesWithProgress = await Promise.all((dbEnrolled || []).map(async (b) => {
      let progress = 0;
      try {
        const tasks = await query('SELECT id FROM batch_tasks WHERE batch_id = ?', [b.id]);
        if (tasks && tasks.length > 0) {
          const taskIds = tasks.map(t => t.id);
          const placeholders = taskIds.map(() => '?').join(',');
          const completed = await query(
            `SELECT COUNT(DISTINCT task_id) as count FROM task_submissions 
             WHERE user_id = ? AND task_id IN (${placeholders})`,
            [userId, ...taskIds]
          );
          const done = completed && completed[0] ? Number(completed[0].count) : 0;
          progress = Math.round((done / tasks.length) * 100);
        } else {
          progress = 0;
        }
      } catch (e) {
        progress = 0;
      }
      return {
        ...b,
        progress: Number(progress) || 0
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
    const cleanId = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
    if (!cleanId) {
      return sendError(res, 'Invalid batch ID', 400);
    }

    // 1. Verify batch exists
    const [batchRow] = await query('SELECT id, college_id, name FROM batches WHERE id = ? LIMIT 1', [cleanId]);
    if (!batchRow) {
      return sendError(res, 'Batch not found', 404);
    }

    const role = (req.user?.role || req.user?.role_name || '').toLowerCase();
    const studentId = req.user?.userId || req.user?.id;
    const isStudent = role === 'student';

    // 2. Strict Role Scoping:
    // Students can ONLY view tasks of batches they are enrolled in
    if (isStudent && studentId) {
      const enrollment = await query(
        `SELECT 1 FROM student_batches WHERE user_id = ? AND batch_id = ?
         UNION
         SELECT 1 FROM students WHERE user_id = ? AND batch_id = ? LIMIT 1`,
        [studentId, cleanId, studentId, cleanId]
      );
      if (!enrollment || enrollment.length === 0) {
        return sendError(res, 'Access denied. You are not enrolled in this batch.', 403);
      }
    }

    // Multi-college data isolation: College Admins, Mentors, and Coordinators can only access batches of their college
    if (role !== 'super_admin' && req.user?.college_id && batchRow.college_id) {
      if (Number(req.user.college_id) !== Number(batchRow.college_id)) {
        return sendError(res, 'Access denied. This batch belongs to another college.', 403);
      }
    }

    // 3. Query tasks strictly belonging to this batch_id (ordered chronologically by creation so Task 01 is first created)
    const dbTasks = await query(
      `SELECT * FROM batch_tasks WHERE batch_id = ? ORDER BY id ASC`,
      [cleanId]
    );

    let studentSubmissions = new Map();
    let studentRetakes = new Set();
    if (studentId && dbTasks && dbTasks.length > 0) {
      try {
        const taskIds = dbTasks.map(t => t.id);
        const taskPlaceholders = taskIds.map(() => '?').join(',');
        const subRows = await query(
          `SELECT task_id, status, COALESCE(marks_obtained, score, 0) as marks_obtained, COALESCE(score, marks_obtained, 0) as score, feedback, attempt_number, is_retake
           FROM task_submissions 
           WHERE user_id = ? AND (batch_id = ? OR task_id IN (${taskPlaceholders}))
           ORDER BY id DESC`,
          [studentId, cleanId, ...taskIds]
        );
        if (Array.isArray(subRows)) {
          subRows.forEach(s => {
            if (!studentSubmissions.has(Number(s.task_id))) {
              studentSubmissions.set(Number(s.task_id), s);
            }
          });
        }

        const retakeRows = await query(
          `SELECT target_id FROM coding_retake_permissions
           WHERE target_type = 'task' AND student_id = ? AND status = 'pending' AND target_id IN (${taskPlaceholders})`,
          [studentId, ...taskIds]
        );
        if (Array.isArray(retakeRows)) {
          retakeRows.forEach(r => studentRetakes.add(Number(r.target_id)));
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
        const rawStatus = String(sub.status || '').toLowerCase().trim();
        const totalPoints = Number(parsed.points ?? t.points ?? 0);
        const hasFeedback = Boolean(sub.feedback && String(sub.feedback).trim());
        const isPartialByFeedback = hasFeedback && String(sub.feedback).toLowerCase().startsWith('partial');

        if (rawStatus === 'passed' || rawStatus === 'completed' || rawStatus === 'accepted' || (totalPoints > 0 && scoreObtained >= totalPoints)) {
          taskStatus = 'Completed';
        } else if (rawStatus === 'partial' || isPartialByFeedback || (totalPoints > 0 && scoreObtained > 0 && scoreObtained < totalPoints)) {
          taskStatus = 'Partial';
        } else if (rawStatus === 'failed') {
          taskStatus = 'Failed';
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
        retakeAvailable: studentRetakes.has(Number(t.id)),
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
    const cleanTaskId = parseInt(String(taskId).replace(/[^0-9]/g, ''), 10);
    if (!cleanTaskId) {
      return sendError(res, 'Invalid task ID', 400);
    }

    const isStudent = req.user?.role?.toLowerCase() === 'student' || req.user?.role_name?.toLowerCase() === 'student';
    const studentId = req.user?.userId || req.user?.id;
    const role = (req.user?.role || req.user?.role_name || '').toLowerCase();

    // Fetch task and its batch info
    const dbTasks = await query(
      `SELECT bt.*, b.name as batch_name, b.college_id
       FROM batch_tasks bt
       JOIN batches b ON bt.batch_id = b.id
       WHERE bt.id = ? LIMIT 1`,
      [cleanTaskId]
    );

    if (!dbTasks || dbTasks.length === 0) {
      return sendError(res, 'Task not found', 404);
    }

    const targetTask = dbTasks[0];

    // Authorization: Students must be enrolled in this task's batch
    if (isStudent && studentId) {
      const enrollment = await query(
        `SELECT 1 FROM student_batches WHERE user_id = ? AND batch_id = ?
         UNION
         SELECT 1 FROM students WHERE user_id = ? AND batch_id = ? LIMIT 1`,
        [studentId, targetTask.batch_id, studentId, targetTask.batch_id]
      );
      if (!enrollment || enrollment.length === 0) {
        return sendError(res, 'Access denied. You are not enrolled in the batch this task belongs to.', 403);
      }
    }

    // College isolation
    if (role !== 'super_admin' && req.user?.college_id && targetTask.college_id) {
      if (Number(req.user.college_id) !== Number(targetTask.college_id)) {
        return sendError(res, 'Access denied. This task belongs to another college.', 403);
      }
    }

    let alreadySubmitted = false;
    let submission = null;
    let submissions = [];
    let retakeAvailable = false;
    let retakePermission = null;

    if (studentId) {
      const subRows = await query(
        `SELECT * FROM task_submissions 
         WHERE task_id = ? AND user_id = ? AND batch_id = ? 
         ORDER BY id DESC`,
        [targetTask.id, studentId, targetTask.batch_id]
      );
      if (subRows && subRows.length > 0) {
        alreadySubmitted = true;
        submission = subRows[0];
        submissions = subRows;
      }

      const retakeRows = await query(
        `SELECT * FROM coding_retake_permissions 
         WHERE target_type = 'task' AND target_id = ? AND student_id = ? AND status = 'pending' 
         ORDER BY id DESC LIMIT 1`,
        [targetTask.id, studentId]
      );
      if (retakeRows && retakeRows.length > 0) {
        retakeAvailable = true;
        retakePermission = retakeRows[0];
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
      submissions,
      retakeAvailable,
      retakePermission,
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
    const cleanBatchId = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
    if (!cleanBatchId) {
      return sendError(res, 'Invalid batch ID', 400);
    }

    const role = (req.user?.role || req.user?.role_name || '').toLowerCase();
    if (role === 'student') {
      return sendError(res, 'Access denied. Students cannot create tasks.', 403);
    }

    // Verify batch exists
    const [batchRow] = await query('SELECT id, college_id, name FROM batches WHERE id = ? LIMIT 1', [cleanBatchId]);
    if (!batchRow) {
      return sendError(res, 'Batch not found', 404);
    }

    // College data isolation
    if (role !== 'super_admin' && req.user?.college_id && batchRow.college_id) {
      if (Number(req.user.college_id) !== Number(batchRow.college_id)) {
        return sendError(res, 'Access denied. Cannot create tasks for another college.', 403);
      }
    }

    const { title, topic, difficulty, points, deadline, task_date, taskDate, date, desc, description, language, testCases, test_cases } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return sendError(res, 'Task title is required', 400);
    }

    const taskDesc = desc || description || '';
    const taskTopic = topic ? topic.trim() : 'General Assignment';
    const taskDiff = difficulty || 'Medium';
    const taskPoints = points ? Number(points) : 100;
    const taskDeadline = deadline || '';
    const scheduledDate = String(task_date || taskDate || date || new Date().toISOString().split('T')[0]).trim();
    const taskLang = language || 'Java';
    const tcList = testCases || test_cases || [];
    const testCasesJson = typeof tcList === 'string' ? tcList : JSON.stringify(tcList);

    const createdBy = req.user?.userId || req.user?.id || null;
    const result = await query(
      `INSERT INTO batch_tasks (batch_id, title, topic, difficulty, points, deadline, task_date, description, language, test_cases, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cleanBatchId, title.trim(), taskTopic, taskDiff, taskPoints, taskDeadline, scheduledDate, taskDesc, taskLang, testCasesJson, createdBy]
    );

    const [newTask] = await query('SELECT * FROM batch_tasks WHERE id = ?', [result.insertId]);

    return sendSuccess(res, 'Task created and assigned to batch successfully', parseTaskRecord(newTask), 201);
  } catch (error) {
    next(error);
  }
};

export const updateBatchTask = async (req, res, next) => {
  try {
    await ensureTables();
    const { id, taskId } = req.params;
    const cleanTaskId = parseInt(String(taskId).replace(/[^0-9]/g, ''), 10);
    if (!cleanTaskId) {
      return sendError(res, 'Invalid task ID', 400);
    }

    const role = (req.user?.role || req.user?.role_name || '').toLowerCase();
    if (role === 'student') {
      return sendError(res, 'Access denied. Students cannot modify tasks.', 403);
    }

    // Verify task exists and belongs to batch
    const [taskRow] = await query(
      `SELECT bt.*, b.college_id 
       FROM batch_tasks bt
       JOIN batches b ON bt.batch_id = b.id
       WHERE bt.id = ? LIMIT 1`,
      [cleanTaskId]
    );

    if (!taskRow) {
      return sendError(res, 'Task not found', 404);
    }

    if (id) {
      const cleanBatchId = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
      if (cleanBatchId && Number(taskRow.batch_id) !== cleanBatchId) {
        return sendError(res, 'Task does not belong to the specified batch', 400);
      }
    }

    // College isolation
    if (role !== 'super_admin' && req.user?.college_id && taskRow.college_id) {
      if (Number(req.user.college_id) !== Number(taskRow.college_id)) {
        return sendError(res, 'Access denied. Cannot modify tasks of another college.', 403);
      }
    }

    const { title, topic, difficulty, points, deadline, task_date, taskDate, date, desc, description, language, testCases, test_cases } = req.body;

    const taskTitle = title !== undefined ? String(title).trim() : taskRow.title;
    const taskDesc = desc !== undefined ? desc : (description !== undefined ? description : taskRow.description);
    const taskTopic = topic !== undefined ? String(topic).trim() : taskRow.topic;
    const taskDiff = difficulty !== undefined ? difficulty : taskRow.difficulty;
    const taskPoints = points !== undefined ? Number(points) : taskRow.points;
    const taskDeadline = deadline !== undefined ? deadline : taskRow.deadline;
    const scheduledDate = task_date !== undefined ? String(task_date).trim() : (taskDate !== undefined ? String(taskDate).trim() : (date !== undefined ? String(date).trim() : (taskRow.task_date || new Date().toISOString().split('T')[0])));
    const taskLang = language !== undefined ? language : taskRow.language;
    let testCasesJson = taskRow.test_cases;
    if (testCases !== undefined || test_cases !== undefined) {
      const tc = testCases !== undefined ? testCases : test_cases;
      testCasesJson = typeof tc === 'string' ? tc : JSON.stringify(tc);
    }

    await query(
      `UPDATE batch_tasks 
       SET title = ?, topic = ?, difficulty = ?, points = ?, deadline = ?, task_date = ?, description = ?, language = ?, test_cases = ?
       WHERE id = ?`,
      [taskTitle, taskTopic, taskDiff, taskPoints, taskDeadline, scheduledDate, taskDesc, taskLang, testCasesJson, cleanTaskId]
    );

    const [updatedTask] = await query('SELECT * FROM batch_tasks WHERE id = ?', [cleanTaskId]);
    return sendSuccess(res, 'Batch task updated successfully', parseTaskRecord(updatedTask));
  } catch (error) {
    next(error);
  }
};

export const deleteBatchTask = async (req, res, next) => {
  try {
    await ensureTables();
    const { id, taskId } = req.params;
    const cleanTaskId = parseInt(String(taskId).replace(/[^0-9]/g, ''), 10);
    if (!cleanTaskId) {
      return sendError(res, 'Invalid task ID', 400);
    }

    const role = (req.user?.role || req.user?.role_name || '').toLowerCase();
    if (role === 'student') {
      return sendError(res, 'Access denied. Students cannot delete tasks.', 403);
    }

    // Verify task exists
    const [taskRow] = await query(
      `SELECT bt.*, b.college_id 
       FROM batch_tasks bt
       JOIN batches b ON bt.batch_id = b.id
       WHERE bt.id = ? LIMIT 1`,
      [cleanTaskId]
    );

    if (!taskRow) {
      return sendError(res, 'Task not found', 404);
    }

    if (id) {
      const cleanBatchId = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
      if (cleanBatchId && Number(taskRow.batch_id) !== cleanBatchId) {
        return sendError(res, 'Task does not belong to the specified batch', 400);
      }
    }

    // College isolation
    if (role !== 'super_admin' && req.user?.college_id && taskRow.college_id) {
      if (Number(req.user.college_id) !== Number(taskRow.college_id)) {
        return sendError(res, 'Access denied. Cannot delete tasks of another college.', 403);
      }
    }

    // Delete task submissions belonging to this specific task and batch
    await query('DELETE FROM task_submissions WHERE task_id = ? AND batch_id = ?', [cleanTaskId, taskRow.batch_id]);

    // Delete task
    await query('DELETE FROM batch_tasks WHERE id = ?', [cleanTaskId]);

    return sendSuccess(res, 'Batch task deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const getBatchStudents = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanId = String(id).replace(/[^0-9]/g, '') || id;

    // Query only students who joined/enrolled in this specific batch, including earned XP from evaluated batch task submissions
    const enrolledUsers = await query(
      `SELECT DISTINCT 
         u.id, 
         u.name, 
         u.email, 
         u.mobile_number, 
         COALESCE(s.roll_number, '') AS rollNo, 
         COALESCE(s.department, d.name, '') AS department,
         COALESCE(xp_stats.batch_xp, 0) AS xp
       FROM users u
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN departments d ON s.department_id = d.id
       LEFT JOIN student_batches sb ON sb.user_id = u.id
       LEFT JOIN attendance att ON att.user_id = u.id AND (att.batch_id = ? OR att.batch_id = ?)
       LEFT JOIN (
         SELECT best_per_task.user_id, SUM(best_per_task.task_xp) AS batch_xp
         FROM (
           SELECT ts.user_id, ts.task_id, MAX(COALESCE(ts.marks_obtained, ts.score, 0)) AS task_xp
           FROM task_submissions ts
           LEFT JOIN batch_tasks bt ON ts.task_id = bt.id
           WHERE (ts.batch_id = ? OR ts.batch_id = ? OR bt.batch_id = ? OR bt.batch_id = ?)
           GROUP BY ts.user_id, ts.task_id
         ) best_per_task
         GROUP BY best_per_task.user_id
       ) xp_stats ON xp_stats.user_id = u.id
       WHERE (
         sb.batch_id = ? 
         OR sb.batch_id = ? 
         OR s.batch_id = ? 
         OR s.batch_id = ? 
         OR att.batch_id IS NOT NULL
       )
       AND u.role = 'student'
       ORDER BY xp DESC, u.name ASC`,
      [id, cleanId, id, cleanId, id, cleanId, id, cleanId, id, cleanId]
    );

    const formatted = (enrolledUsers || []).map((s, idx) => {
      const xpVal = Number(s.xp) || 0;
      return {
        id: s.id,
        user_id: s.id,
        userId: s.id,
        studentId: s.id,
        rollNo: s.rollNo || `STU-${String(s.id || idx + 1).padStart(2, '0')}`,
        name: s.name || s.full_name || "Student User",
        email: s.email,
        department: s.department || null,
        xp: xpVal,
        points: xpVal,
        score: xpVal,
        status: true
      };
    });

    return sendSuccess(res, 'Batch enrolled students retrieved', formatted);
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
        code: b.code || b.join_code,
        joinCode: b.join_code || b.code,
        join_code: b.join_code || b.code,
        codeExpiresAt: b.code_expires_at ? Number(b.code_expires_at) : null,
        code_expires_at: b.code_expires_at ? Number(b.code_expires_at) : null,
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

    if (tTrainer) {
      try {
        const [trainerUser] = await query(
          "SELECT id, name FROM users WHERE name = ? AND role = 'trainer' LIMIT 1",
          [tTrainer]
        );
        if (trainerUser) {
          await query(
            `UPDATE batches SET trainer_id = ? WHERE id = ? OR id = ?`,
            [trainerUser.id, id, numericBatchId]
          );
          await query(
            `INSERT IGNORE INTO batch_trainers (user_id, batch_id) VALUES (?, ?)`,
            [trainerUser.id, numericBatchId]
          );
        }
      } catch (linkErr) {
        console.warn('[saveDailyTopic trainer link warning]', linkErr.message);
      }
    }

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
    const { id, taskId } = req.params;
    const cleanTaskId = parseInt(String(taskId).replace(/[^0-9]/g, ''), 10);
    if (!cleanTaskId) {
      return sendSuccess(res, 'Submissions retrieved successfully', []);
    }

    const role = (req.user?.role || req.user?.role_name || '').toLowerCase();
    if (role === 'student') {
      return sendError(res, 'Access denied. Students cannot view all batch submissions.', 403);
    }

    // Verify task exists and get batch_id
    const [taskRow] = await query(
      `SELECT bt.*, b.college_id 
       FROM batch_tasks bt
       JOIN batches b ON bt.batch_id = b.id
       WHERE bt.id = ? LIMIT 1`,
      [cleanTaskId]
    );

    if (!taskRow) {
      return sendError(res, 'Task not found', 404);
    }

    if (id) {
      const cleanBatchId = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
      if (cleanBatchId && Number(taskRow.batch_id) !== cleanBatchId) {
        return sendError(res, 'Task does not belong to specified batch', 400);
      }
    }

    if (role !== 'super_admin' && req.user?.college_id && taskRow.college_id) {
      if (Number(req.user.college_id) !== Number(taskRow.college_id)) {
        return sendError(res, 'Access denied. Cannot view submissions of another college.', 403);
      }
    }

    const rows = await query(
      `SELECT ts.id, ts.task_id, ts.user_id, ts.batch_id, 
              COALESCE(ts.code_submission, ts.submitted_code) AS code_submission, 
              ts.status, 
              COALESCE(ts.marks_obtained, ts.score, 0) AS marks_obtained,
              COALESCE(ts.score, ts.marks_obtained, 0) AS score,
              ts.feedback, 
              ts.submitted_at,
              COALESCE(bt.language, 'Java') AS language,
              bt.title AS task_title,
              COALESCE(bt.points, 100) AS total_marks,
              COALESCE(u.name, 'Student') AS name, u.email, s.roll_number, s.department
       FROM task_submissions ts
       JOIN users u ON ts.user_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN batch_tasks bt ON ts.task_id = bt.id
       WHERE ts.task_id = ? AND ts.batch_id = ?
       ORDER BY ts.submitted_at DESC`,
      [cleanTaskId, taskRow.batch_id]
    );

    return sendSuccess(res, 'Submissions retrieved successfully', rows || []);
  } catch (error) {
    next(error);
  }
};

export const getBatchAllSubmissions = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanBatchId = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
    if (!cleanBatchId) {
      return sendSuccess(res, 'Submissions retrieved successfully', []);
    }

    const callerId = req.user?.userId || req.user?.id;
    const isStudent = req.user?.role === 'student';

    // 1. Task submissions directly tied to this batch (students only see their own)
    let taskRows = [];
    try {
      const taskSql = `SELECT ts.id, ts.task_id, ts.user_id, ts.batch_id, 
                COALESCE(ts.code_submission, ts.submitted_code) AS submitted_code, 
                ts.status, 
                COALESCE(ts.marks_obtained, ts.score, 0) AS marks_obtained,
                COALESCE(ts.score, ts.marks_obtained, 0) AS score,
                ts.feedback, 
                ts.submitted_at,
                COALESCE(bt.language, 'Java') AS language,
                COALESCE(bt.title, 'Batch Assignment') AS task_title,
                COALESCE(bt.points, 100) AS total_marks,
                COALESCE(u.name, 'Student') AS student_name, 
                u.email AS student_email, 
                s.roll_number, 
                s.department,
                'batch_task' AS submission_type
         FROM task_submissions ts
         JOIN users u ON ts.user_id = u.id
         LEFT JOIN students s ON s.user_id = u.id
         LEFT JOIN batch_tasks bt ON ts.task_id = bt.id
         WHERE ts.batch_id = ? ${isStudent ? 'AND ts.user_id = ?' : ''}
         ORDER BY ts.submitted_at DESC`;
      const taskParams = isStudent ? [cleanBatchId, callerId] : [cleanBatchId];
      taskRows = await query(taskSql, taskParams);
    } catch (_e) {}

    // 2. Practice/coding problem submissions from students in this batch (students only see their own)
    let codingRows = [];
    try {
      const codingSql = `SELECT cs.id, NULL AS task_id, cs.student_id AS user_id, s.batch_id,
                cs.submitted_code,
                cs.status,
                COALESCE(cs.marks, cs.score, 0) AS marks_obtained,
                COALESCE(cs.score, cs.marks, 0) AS score,
                cs.feedback,
                COALESCE(cs.submitted_at, cs.created_at) AS submitted_at,
                cs.language,
                COALESCE(pp.title, cp.title, CONCAT('Problem #', cs.problem_id)) AS task_title,
                100 AS total_marks,
                COALESCE(u.name, 'Student') AS student_name,
                u.email AS student_email,
                s.roll_number,
                s.department,
                'coding_problem' AS submission_type
         FROM coding_submissions cs
         JOIN users u ON cs.student_id = u.id
         JOIN students s ON s.user_id = u.id
         LEFT JOIN practice_problems pp ON cs.problem_id = pp.id
         LEFT JOIN coding_problems cp ON cs.problem_id = cp.id
         WHERE s.batch_id = ? ${isStudent ? 'AND cs.student_id = ?' : ''}
         ORDER BY cs.submitted_at DESC`;
      const codingParams = isStudent ? [cleanBatchId, callerId] : [cleanBatchId];
      codingRows = await query(codingSql, codingParams);
    } catch (_e) {}

    const allSubmissions = [...(taskRows || []), ...(codingRows || [])];
    allSubmissions.sort((a, b) => new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0));

    return sendSuccess(res, 'Batch submissions retrieved successfully', allSubmissions);
  } catch (error) {
    next(error);
  }
};

export const updateTaskSubmissionFeedback = async (req, res, next) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    if (role === 'student') {
      return sendError(res, 'Access denied: Students cannot evaluate submissions.', 403);
    }
    await ensureTables();
    const { submissionId } = req.params;
    const { feedback, marks_obtained, score, status, submission_type } = req.body || {};
    const cleanId = parseInt(String(submissionId).replace(/[^0-9]/g, ''), 10);
    if (!cleanId) return sendError(res, 'Invalid submission ID', 400);

    const reviewerName = req.user?.name || 'Trainer';

    if (submission_type === 'coding_problem') {
      await query(
        `UPDATE coding_submissions 
         SET feedback = ?, feedback_by = ?, feedback_at = NOW() 
         WHERE id = ?`,
        [feedback || '', reviewerName, cleanId]
      );
      return sendSuccess(res, 'Feedback saved successfully');
    }

    const updateFields = [];
    const params = [];
    if (feedback !== undefined) {
      updateFields.push('feedback = ?');
      params.push(feedback);
    }
    const finalScore = marks_obtained !== undefined ? marks_obtained : score;
    if (finalScore !== undefined) {
      updateFields.push('marks_obtained = ?');
      params.push(Number(finalScore));
      updateFields.push('score = ?');
      params.push(Number(finalScore));
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (updateFields.length > 0) {
      params.push(cleanId);
      await query(`UPDATE task_submissions SET ${updateFields.join(', ')} WHERE id = ?`, params);
    }

    return sendSuccess(res, 'Feedback updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/batches/:id/task-report
 * GET /api/v1/batches/:id/task-report/download
 *
 * Matrix report of task submissions per batch:
 * - Columns: Name of Task (plus Roll No, Student Name, Email, Department, and Summary Stats)
 * - Rows: Student Names
 * - Role Access Scoping:
 *     - Admin & Trainer: ALL students enrolled in this batch
 *     - Mentor: ONLY assigned students of this mentor enrolled in this batch
 * - Formats: JSON matrix or downloadable Excel (.xlsx) file
 */
export const getBatchTaskReport = async (req, res, next) => {
  try {
    await ensureTables();
    const { id } = req.params;
    const cleanBatchId = parseInt(String(id).replace(/[^0-9]/g, ''), 10);
    if (!cleanBatchId) {
      return sendError(res, 'Invalid batch ID', 400);
    }

    // 1. Fetch batch information
    const [batch] = await query(
      `SELECT b.*, c.name AS college_name, d.name AS department_name
       FROM batches b
       LEFT JOIN colleges c ON b.college_id = c.id
       LEFT JOIN departments d ON b.department_id = d.id
       WHERE b.id = ? LIMIT 1`,
      [cleanBatchId]
    );

    if (!batch) {
      return sendError(res, 'Batch not found', 404);
    }

    const callerRole = (req.user?.role || req.user?.role_name || '').toLowerCase();
    const callerId = req.user?.userId || req.user?.id;
    const callerEmail = req.user?.email || '';
    const callerName = req.user?.name || '';

    if (callerRole === 'student') {
      return sendError(res, 'Access denied: Students cannot access batch task submission reports.', 403);
    }

    // Multi-college data isolation: Non-super-admins cannot access batches belonging to another college
    if (callerRole !== 'super_admin' && req.user?.college_id && batch.college_id) {
      if (Number(req.user.college_id) !== Number(batch.college_id)) {
        return sendError(res, 'Access denied: This batch belongs to another college.', 403);
      }
    }

    // 2. Fetch all tasks assigned to this batch
    const tasks = await query(
      `SELECT id, title, topic, difficulty, points, deadline, created_at
       FROM batch_tasks
       WHERE batch_id = ?
       ORDER BY id ASC`,
      [cleanBatchId]
    );

    // 3. Fetch students based on caller role:
    // - Admin / Trainer / Coordinator: ALL students enrolled in this batch
    // - Mentor: ONLY assigned students of this mentor enrolled in this batch
    let students = [];
    const isMentor = callerRole === 'mentor';

    if (isMentor) {
      students = await query(
        `SELECT DISTINCT 
           u.id AS student_id,
           u.name,
           u.email,
           u.mobile_number,
           COALESCE(s.roll_number, CONCAT('STU-', LPAD(u.id, 3, '0'))) AS roll_number,
           COALESCE(s.department, u.department, 'Engineering') AS department,
           s.division,
           s.year
         FROM users u
         LEFT JOIN students s ON u.id = s.user_id
         LEFT JOIN student_batches sb ON sb.user_id = u.id
         WHERE (sb.batch_id = ? OR s.batch_id = ?)
           AND u.role = 'student'
           AND COALESCE(u.is_active, 1) = 1
           AND (
             u.id IN (SELECT student_id FROM mentor_student_assignments WHERE mentor_id = ?)
             OR u.id IN (SELECT student_id FROM mentor_assignments WHERE mentor_id = ? OR LOWER(mentor_email) = LOWER(?) OR LOWER(mentor_name) = LOWER(?))
             OR s.mentor_id = ?
             OR u.mentor_id = ?
           )
         ORDER BY u.name ASC`,
        [cleanBatchId, cleanBatchId, callerId, callerId, callerEmail, callerName, callerId, callerId]
      );
    } else {
      students = await query(
        `SELECT DISTINCT 
           u.id AS student_id,
           u.name,
           u.email,
           u.mobile_number,
           COALESCE(s.roll_number, CONCAT('STU-', LPAD(u.id, 3, '0'))) AS roll_number,
           COALESCE(s.department, u.department, 'Engineering') AS department,
           s.division,
           s.year
         FROM users u
         LEFT JOIN students s ON u.id = s.user_id
         LEFT JOIN student_batches sb ON sb.user_id = u.id
         WHERE (sb.batch_id = ? OR s.batch_id = ?)
           AND u.role = 'student'
           AND COALESCE(u.is_active, 1) = 1
         ORDER BY u.name ASC`,
        [cleanBatchId, cleanBatchId]
      );
    }

    // 4. Fetch all task submissions for this batch
    let submissions = [];
    if (tasks.length > 0) {
      const taskIds = tasks.map((t) => t.id);
      submissions = await query(
        `SELECT ts.id, ts.task_id, ts.user_id, ts.status, 
                COALESCE(ts.marks_obtained, ts.score, 0) AS score, 
                ts.feedback, ts.submitted_at
         FROM task_submissions ts
         WHERE ts.batch_id = ? OR ts.task_id IN (?)`,
        [cleanBatchId, taskIds]
      );
    }

    // Index submissions by `${studentId}_${taskId}`
    const submissionMap = new Map();
    (submissions || []).forEach((sub) => {
      const key = `${sub.user_id}_${sub.task_id}`;
      if (!submissionMap.has(key) || Number(sub.score || 0) > Number(submissionMap.get(key).score || 0)) {
        submissionMap.set(key, sub);
      }
    });

    // 5. Build report rows (one row per student, one column per task)
    const totalBatchTasks = tasks.length;
    const maxBatchScore = tasks.reduce((sum, t) => sum + (Number(t.points) || 100), 0);

    const reportRows = students.map((st, idx) => {
      let completedCount = 0;
      let totalStudentScore = 0;
      const taskDetails = {};
      const excelRow = {
        'S.No': idx + 1,
        'Roll No': st.roll_number || `STU-${String(st.student_id).padStart(3, '0')}`,
        'Student Name': st.name,
        'Email': st.email,
        'Department': st.department || 'General',
      };

      tasks.forEach((task) => {
        const key = `${st.student_id}_${task.id}`;
        const sub = submissionMap.get(key);
        const taskPoints = Number(task.points) || 100;
        const taskTitle = task.title || `Task ${task.id}`;

        if (sub) {
          const score = Number(sub.score) || 0;
          const statusLower = String(sub.status || '').toLowerCase();
          const isPassed =
            statusLower === 'passed' ||
            statusLower === 'completed' ||
            statusLower === 'accepted' ||
            score > 0;
          if (isPassed) {
            completedCount++;
          }
          totalStudentScore += score;

          // Excel cell value formatted for this task column
          excelRow[taskTitle] = `${sub.status || 'Submitted'} (${score}/${taskPoints})`;

          taskDetails[task.id] = {
            taskId: task.id,
            taskTitle: task.title,
            submitted: true,
            status: sub.status || 'Submitted',
            score: score,
            maxPoints: taskPoints,
            submittedAt: sub.submitted_at || null,
          };
        } else {
          excelRow[taskTitle] = 'Not Submitted';
          taskDetails[task.id] = {
            taskId: task.id,
            taskTitle: task.title,
            submitted: false,
            status: 'Not Submitted',
            score: 0,
            maxPoints: taskPoints,
            submittedAt: null,
          };
        }
      });

      const completionPct =
        totalBatchTasks > 0 ? Math.round((completedCount / totalBatchTasks) * 100) : 0;
      excelRow['Completed Tasks'] = `${completedCount}/${totalBatchTasks}`;
      excelRow['Total Score'] = totalStudentScore;
      excelRow['Max Score'] = maxBatchScore;
      excelRow['Completion Rate (%)'] = `${completionPct}%`;

      return {
        studentId: st.student_id,
        rollNo: st.roll_number,
        name: st.name,
        email: st.email,
        department: st.department,
        completedTasks: completedCount,
        totalTasks: totalBatchTasks,
        totalScore: totalStudentScore,
        maxScore: maxBatchScore,
        completionPercentage: completionPct,
        tasks: taskDetails,
        excelRow,
      };
    });

    const isDownload =
      req.path.endsWith('/download') ||
      req.query.format === 'excel' ||
      req.query.format === 'xlsx';

    if (isDownload) {
      const excelData = reportRows.map((r) => r.excelRow);

      // Create Worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns based on maximum content width
      const colKeys = excelData.length > 0 ? Object.keys(excelData[0]) : [];
      worksheet['!cols'] = colKeys.map((k) => {
        let maxLen = k.length;
        excelData.forEach((row) => {
          const val = row[k] ? String(row[k]) : '';
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 45) };
      });

      const workbook = XLSX.utils.book_new();
      const safeSheetName = (batch.name || 'Batch')
        .slice(0, 31)
        .replace(/[:\\\/\?\*\[\]]/g, '_');
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

      const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
      const safeBatchName = (batch.name || `Batch_${cleanBatchId}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeBatchName}_Task_Submissions_Report.xlsx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(buffer);
    }

    return sendSuccess(res, 'Batch task submission report generated successfully', {
      batch: {
        id: batch.id,
        name: batch.name,
        code: batch.code || batch.join_code,
        schedule: batch.schedule,
        college: batch.college_name,
        department: batch.department_name,
      },
      summary: {
        totalTasks: totalBatchTasks,
        totalStudents: students.length,
        scopedRole: callerRole,
        isMentorScoped: isMentor,
      },
      tasks: tasks.map((t) => ({ id: t.id, title: t.title, points: t.points, topic: t.topic })),
      students: reportRows,
    });
  } catch (error) {
    next(error);
  }
};
