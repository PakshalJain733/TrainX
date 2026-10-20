import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import { validateCollegeForm } from '../utils/collegeValidation.js';

let tablesInitialized = false;
async function ensureCollegeTable() {
  if (tablesInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        location VARCHAR(255) DEFAULT 'Main Campus',
        city VARCHAR(100) DEFAULT 'Metropolis',
        type VARCHAR(100) DEFAULT 'Autonomous',
        status VARCHAR(50) DEFAULT 'Active',
        contact_email VARCHAR(255) NULL,
        contact_phone VARCHAR(50) NULL,
        admin_name VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    const cols = [
      "location VARCHAR(255) DEFAULT 'Main Campus'",
      "city VARCHAR(100) DEFAULT 'Metropolis'",
      "type VARCHAR(100) DEFAULT 'Autonomous'",
      "status VARCHAR(50) DEFAULT 'Active'",
      "contact_email VARCHAR(255) NULL",
      "contact_phone VARCHAR(50) NULL",
      "admin_name VARCHAR(255) NULL",
      "domain VARCHAR(255) NULL",
    ];
    for (const c of cols) {
      try { await query(`ALTER TABLE colleges ADD COLUMN ${c}`); } catch (err) { }
    }
    tablesInitialized = true;
  } catch (e) {
    console.warn('[DB ensureCollegeTable error]', e.message);
  }
}

export const getColleges = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const userRole = (req.user?.role || '').toLowerCase();
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    const userCollegeId = req.user?.college_id || req.user?.collegeId;

    let sql = `
      SELECT 
        c.*,
        COALESCE(NULLIF(c.contact_email, ''), (SELECT a.email FROM users a WHERE a.college_id = c.id AND a.role = 'college_admin' ORDER BY a.id ASC LIMIT 1)) AS adminEmail,
        COALESCE(NULLIF(c.admin_name, ''), (SELECT a.name FROM users a WHERE a.college_id = c.id AND a.role = 'college_admin' ORDER BY a.id ASC LIMIT 1)) AS adminName,
        (SELECT COUNT(*) FROM departments d WHERE d.college_id = c.id) AS department_count,
        (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id AND u.role = 'student') AS student_count
      FROM colleges c
    `;
    let params = [];

    // Filter colleges for College Admin users so they only see their assigned college
    if (userRole && !userRole.includes('super')) {
      const emailDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      sql += ` WHERE LOWER(c.contact_email) = ? OR c.id = ? OR (c.domain IS NOT NULL AND c.domain != '' AND LOWER(c.domain) = ?)`;
      params = [userEmail, userCollegeId || -1, emailDomain];
    }

    sql += ` ORDER BY c.id DESC`;

    let dbColleges = await query(sql, params);

    // Fallback: If no direct match found for non-superadmin, query all and match by email/domain/college_id
    if (userRole && !userRole.includes('super') && (!dbColleges || dbColleges.length === 0)) {
      const allCols = await query(`
        SELECT c.*, c.contact_email AS adminEmail, c.admin_name AS adminName,
        (SELECT COUNT(*) FROM departments d WHERE d.college_id = c.id) AS department_count,
        (SELECT COUNT(*) FROM users u WHERE u.college_id = c.id AND u.role = 'student') AS student_count
        FROM colleges c ORDER BY c.id DESC
      `);
      const emailDomain = userEmail.includes('@') ? userEmail.split('@')[1] : '';
      const matched = (allCols || []).filter(c =>
        String(c.id) === String(userCollegeId) ||
        (c.contact_email && c.contact_email.toLowerCase() === userEmail) ||
        (c.admin_name && c.admin_name.toLowerCase().includes(userEmail.split('@')[0])) ||
        (c.domain && emailDomain && emailDomain.endsWith(c.domain.toLowerCase().replace(/^@/, '')))
      );
      dbColleges = matched.length > 0 ? matched : [];
    }

    const formatted = (dbColleges || []).map((c) => ({
      ...c,
      adminEmail: c.adminEmail || c.contact_email || '',
      adminName: c.adminName || c.admin_name || '',
    }));
    return sendSuccess(res, 'Colleges retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

export const createCollege = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const { name, code, location, city, type, contactEmail, contactPhone, adminName, adminEmail, domain } = req.body;
    const cleanName = String(name || '').trim();
    const cleanCode = String(code || '').trim().toUpperCase();
    const cleanLocation = String(location || city || '').trim();
    const cleanAdminName = String(adminName || '').trim();
    const cleanAdminEmail = String(adminEmail || contactEmail || '').trim();
    const cleanDomain = String(domain || '').trim().toLowerCase();

    const validation = validateCollegeForm({
      name: cleanName,
      code: cleanCode,
      location: cleanLocation,
      domain: cleanDomain,
      adminName: cleanAdminName,
      adminEmail: cleanAdminEmail,
    });

    if (!validation.isValid) {
      const firstErrorMessage = Object.values(validation.errors)[0];
      return sendError(res, firstErrorMessage, 400);
    }

    // Check if college code already exists
    const existingCode = await query('SELECT id, name FROM colleges WHERE LOWER(code) = LOWER(?) LIMIT 1', [cleanCode]);
    if (existingCode && existingCode.length > 0) {
      return sendError(
        res,
        `College code '${cleanCode}' is already registered to "${existingCode[0].name}". Please enter a unique college code.`,
        400
      );
    }

    const finalEmail = cleanAdminEmail;
    const finalAdminName = cleanAdminName;

    let derivedDomain = (domain || '').trim().toLowerCase();
    if (!derivedDomain && finalEmail.includes('@')) {
      derivedDomain = finalEmail.split('@')[1].trim().toLowerCase();
    }

    let newCollege = null;

    try {
      const result = await query(
        `INSERT INTO colleges (name, code, location, city, type, contact_email, contact_phone, admin_name, domain, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           location = VALUES(location),
           city = VALUES(city),
           type = VALUES(type),
           contact_email = VALUES(contact_email),
           admin_name = VALUES(admin_name),
           domain = VALUES(domain),
           status = 'Active'`,
        [
          cleanName,
          cleanCode,
          location || 'Main Campus',
          city || location || 'Metropolis',
          type || 'Autonomous',
          finalEmail,
          contactPhone || '+91 90000 00000',
          finalAdminName,
          derivedDomain,
        ]
      );

      const rows = await query('SELECT * FROM colleges WHERE LOWER(code) = LOWER(?) OR id = ? LIMIT 1', [cleanCode, result?.insertId || 0]);
      if (rows && rows.length > 0) {
        newCollege = rows[0];
      }
    } catch (dbErr) {
      console.warn(`[College Controller] DB create fallback: ${dbErr.message}`);
    }

    if (!newCollege) {
      newCollege = {
        id: Date.now(),
        name: cleanName,
        code: cleanCode,
        location: location || 'Main Campus',
        city: city || location || 'Metropolis',
        type: type || 'Autonomous',
        status: 'Active',
        contact_email: finalEmail,
        contact_phone: contactPhone || '+91 90000 00000',
        admin_name: finalAdminName,
        domain: derivedDomain,
        created_at: new Date(),
      };
    }

    const formattedCollege = {
      ...newCollege,
      adminEmail: newCollege?.contact_email || finalEmail,
      adminName: newCollege?.admin_name || finalAdminName,
    };

    return sendSuccess(res, 'College registered successfully', formattedCollege, 201);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062 || (error.message && error.message.includes('Duplicate entry'))) {
      return sendError(res, `College code is already in use. Please enter a unique college code.`, 400);
    }
    next(error);
  }
};

export const updateCollege = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const { id } = req.params;
    const { name, code, location, city, type, status, contactEmail, contactPhone, adminName, adminEmail, domain } = req.body;

    const email = (contactEmail || adminEmail || '').trim();
    const admin = (adminName || '').trim();

    if (code) {
      const existingCode = await query('SELECT id FROM colleges WHERE LOWER(code) = LOWER(?) AND id != ? LIMIT 1', [code.trim(), id]);
      if (existingCode && existingCode.length > 0) {
        return sendError(res, `College code '${code.trim()}' is already in use by another college.`, 400);
      }
    }

    let derivedDomain = domain !== undefined ? (domain ? domain.trim().toLowerCase() : '') : null;
    if (derivedDomain === null && email && email.includes('@')) {
      derivedDomain = email.split('@')[1].trim().toLowerCase();
    }

    await query(
      `UPDATE colleges 
       SET name = COALESCE(?, name),
           code = COALESCE(?, code),
           location = COALESCE(?, location),
           city = COALESCE(?, city),
           type = COALESCE(?, type),
           status = COALESCE(?, status),
           contact_email = COALESCE(?, contact_email),
           contact_phone = COALESCE(?, contact_phone),
           admin_name = COALESCE(?, admin_name),
           domain = COALESCE(?, domain)
       WHERE id = ?`,
      [name, code, location, city, type, status, email || null, contactPhone, admin || null, derivedDomain, id]
    );

    const [updated] = await query('SELECT * FROM colleges WHERE id = ?', [id]);
    if (!updated) {
      return sendError(res, 'College not found', 404);
    }

    const formatted = {
      ...updated,
      adminEmail: updated.contact_email || email,
      adminName: updated.admin_name || admin,
    };

    return sendSuccess(res, 'College updated successfully', formatted);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062 || (error.message && error.message.includes('Duplicate entry'))) {
      return sendError(res, `College code is already in use. Please enter a unique college code.`, 400);
    }
    next(error);
  }
};

export const deleteCollege = async (req, res, next) => {
  try {
    await ensureCollegeTable();
    const { id } = req.params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return sendError(res, 'Invalid college ID', 400);
    }

    // 1. Fetch college details
    const collegeRows = await query('SELECT id, name, code FROM colleges WHERE id = ? LIMIT 1', [numId]);
    if (!collegeRows || collegeRows.length === 0) {
      return sendError(res, 'College not found', 404);
    }
    const targetCollege = collegeRows[0];
    const collegeName = targetCollege.name || '';
    const collegeCode = targetCollege.code || '';

    // 2. Fetch associated users, departments, and batches
    const userRows = await query('SELECT id, email FROM users WHERE college_id = ?', [numId]);
    const userIds = userRows.map((u) => u.id);
    const userEmails = userRows.map((u) => u.email).filter(Boolean);

    const deptRows = await query('SELECT id FROM departments WHERE college_id = ?', [numId]);
    const deptIds = deptRows.map((d) => d.id);

    const batchRows = await query('SELECT id FROM batches WHERE college_id = ?', [numId]);
    const batchIds = batchRows.map((b) => b.id);

    // Disable foreign key checks temporarily for seamless cascading deletion across interrelated tables
    await query('SET FOREIGN_KEY_CHECKS = 0');

    try {
      // 3. Delete records belonging to users of this college
      if (userIds.length > 0) {
        const uPlaceholders = userIds.map(() => '?').join(',');

        await query(`DELETE FROM students WHERE user_id IN (${uPlaceholders}) OR college_id = ?`, [...userIds, numId]);
        await query(`DELETE FROM student_batches WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM student_quiz_completions WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM coordinator_departments WHERE coordinator_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM mentor_student_assignments WHERE mentor_id IN (${uPlaceholders}) OR student_id IN (${uPlaceholders})`, [...userIds, ...userIds]);
        await query(`DELETE FROM mentor_assignments WHERE student_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM attendance_summary WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM attendance_scans WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM attendance WHERE user_id IN (${uPlaceholders}) OR college_id = ?`, [...userIds, numId]);
        await query(`DELETE FROM defaulters WHERE user_id IN (${uPlaceholders}) OR student_id IN (${uPlaceholders})`, [...userIds, ...userIds]);
        await query(`DELETE FROM interventions WHERE user_id IN (${uPlaceholders}) OR student_id IN (${uPlaceholders})`, [...userIds, ...userIds]);
        await query(`DELETE FROM interview_sessions WHERE user_id IN (${uPlaceholders}) OR student_id IN (${uPlaceholders})`, [...userIds, ...userIds]);
        await query(`DELETE FROM interview_submissions WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM interviews WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM leave_requests WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM live_sessions WHERE mentor_id IN (${uPlaceholders}) OR student_id IN (${uPlaceholders})`, [...userIds, ...userIds]);
        await query(`DELETE FROM milestones WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM practice_problem_submissions WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM roadmaps WHERE user_id IN (${uPlaceholders}) OR student_id IN (${uPlaceholders})`, [...userIds, ...userIds]);
        await query(`DELETE FROM skill_gap_analysis WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM study_materials WHERE uploaded_by IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM support_tickets WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM task_submissions WHERE user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM weekly_reports WHERE user_id IN (${uPlaceholders}) OR student_id IN (${uPlaceholders})`, [...userIds, ...userIds]);
        await query(`DELETE FROM coding_submissions WHERE student_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM drive_participations WHERE student_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM training_enrollments WHERE student_user_id IN (${uPlaceholders})`, userIds);
        await query(`DELETE FROM c2c_enrollments WHERE student_id IN (${uPlaceholders})`, userIds);
      }

      // 4. Delete OTP records of users
      if (userEmails.length > 0) {
        const emailPlaceholders = userEmails.map(() => '?').join(',');
        await query(`DELETE FROM otps WHERE LOWER(email) IN (${emailPlaceholders})`, userEmails.map((e) => e.toLowerCase()));
      }

      // 5. Delete Batch tasks and batch-scoped records
      if (batchIds.length > 0) {
        const bPlaceholders = batchIds.map(() => '?').join(',');
        await query(`DELETE FROM batch_daily_topics WHERE batch_id IN (${bPlaceholders})`, batchIds);
        await query(`DELETE FROM task_submissions WHERE task_id IN (SELECT id FROM batch_tasks WHERE batch_id IN (${bPlaceholders}))`, batchIds);
        await query(`DELETE FROM batch_tasks WHERE batch_id IN (${bPlaceholders})`, batchIds);
        await query(`DELETE FROM attendance_sessions WHERE batch_id IN (${bPlaceholders})`, batchIds);
        await query(`DELETE FROM student_batches WHERE batch_id IN (${bPlaceholders})`, batchIds);
        await query(`DELETE FROM mentor_student_assignments WHERE batch_id IN (${bPlaceholders})`, batchIds);
        await query(`DELETE FROM training_enrollments WHERE batch_id IN (${bPlaceholders})`, batchIds);
        await query(`DELETE FROM practice_problems WHERE batch_id IN (${bPlaceholders})`, batchIds);
      }

      // 6. Delete Department associations
      if (deptIds.length > 0) {
        const dPlaceholders = deptIds.map(() => '?').join(',');
        await query(`DELETE FROM coordinator_departments WHERE department_id IN (${dPlaceholders})`, deptIds);
      }

      // 7. Delete College-level assessments and quizzes
      await query(`DELETE FROM assessment_answers WHERE attempt_id IN (SELECT id FROM assessment_attempts WHERE college_id = ?)`, [numId]);
      await query(`DELETE FROM assessment_attempts WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM assessment_questions WHERE assessment_id IN (SELECT id FROM assessments WHERE college_id = ?)`, [numId]);
      await query(`DELETE FROM assessments WHERE college_id = ?`, [numId]);

      // 8. Delete Broadcasts and notifications
      await query(`DELETE FROM broadcast_notifications WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM broadcasts WHERE college_id = ?`, [numId]);

      // 9. Delete Mock Drives & Training Programs
      await query(`DELETE FROM drive_participations WHERE drive_id IN (SELECT id FROM mock_drives WHERE college_id = ?)`, [numId]);
      await query(`DELETE FROM mock_drives WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM training_enrollments WHERE program_id IN (SELECT id FROM training_programs WHERE college_id = ?)`, [numId]);
      await query(`DELETE FROM training_programs WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM trainings WHERE college_id = ?`, [numId]);

      // 10. Delete Attendance sessions, shared content, practice problems
      await query(`DELETE FROM attendance_sessions WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM attendance WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM shared_content WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM practice_problems WHERE college_id = ?`, [numId]);

      // 11. Delete Batches, Departments, Students
      await query(`DELETE FROM batches WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM departments WHERE college_id = ?`, [numId]);
      await query(`DELETE FROM students WHERE college_id = ?`, [numId]);

      // 12. Delete Secure codes, code requests, and C2C enrollments referencing this college name/code
      if (collegeName) {
        await query(`DELETE FROM secure_codes WHERE LOWER(TRIM(college_name)) = LOWER(TRIM(?))`, [collegeName]);
        await query(`DELETE FROM secure_code_requests WHERE LOWER(TRIM(college_name)) = LOWER(TRIM(?))`, [collegeName]);
        await query(`DELETE FROM c2c_enrollments WHERE LOWER(TRIM(college)) = LOWER(TRIM(?))`, [collegeName]);
      }
      if (collegeCode) {
        await query(`DELETE FROM c2c_enrollments WHERE LOWER(TRIM(college)) = LOWER(TRIM(?))`, [collegeCode]);
      }

      // 13. Delete ALL users belonging to this college
      await query(`DELETE FROM users WHERE college_id = ?`, [numId]);

      // 14. Finally, delete the college row itself
      await query(`DELETE FROM colleges WHERE id = ?`, [numId]);
    } finally {
      // Re-enable foreign key checks
      await query('SET FOREIGN_KEY_CHECKS = 1');
    }

    return sendSuccess(res, `College '${collegeName}' and all associated users, departments, batches, and records were permanently deleted.`);
  } catch (error) {
    next(error);
  }
};

export const getCollegeData = getColleges;
