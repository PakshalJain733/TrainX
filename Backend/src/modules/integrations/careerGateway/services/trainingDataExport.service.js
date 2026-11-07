import { query } from '../../../../config/db.js';

/**
 * Extracts and partitions verified training records for all Career Gateway-linked students.
 * Scoped strictly by college tenant and returns the 6 contract categories:
 * 1. batches
 * 2. sessions
 * 3. attendance
 * 4. assessments
 * 5. assessment_results
 * 6. student_progress
 *
 * @param {Object} options - { sinceTimestamp, collegeId, limit }
 */
export async function collectTrainingExportRecords(options = {}) {
  const { sinceTimestamp = null, collegeId = null, studentId = null, userId = null, limit = 500 } = options;

  // 1. Retrieve active Career Gateway student mappings (scoped by college and/or individual student)
  let mappingSql = `
    SELECT m.trainx_user_id, m.career_gateway_student_id, m.clg_id, u.email, u.name, u.college_id, s.department, s.roll_number
    FROM career_gateway_student_mappings m
    JOIN users u ON u.id = m.trainx_user_id
    LEFT JOIN students s ON s.user_id = m.trainx_user_id
    WHERE m.eligibility_status = 'eligible'
  `;
  const mappingParams = [];
  if (collegeId) {
    mappingSql += ' AND u.college_id = ?';
    mappingParams.push(collegeId);
  }
  if (studentId !== null && studentId !== undefined) {
    mappingSql += ' AND m.career_gateway_student_id = ?';
    mappingParams.push(studentId);
  }
  if (userId !== null && userId !== undefined) {
    mappingSql += ' AND m.trainx_user_id = ?';
    mappingParams.push(userId);
  }

  const mappings = await query(mappingSql, mappingParams);

  if (!mappings || mappings.length === 0) {
    return {
      data: {
        batches: [],
        sessions: [],
        attendance: [],
        assessments: [],
        assessment_results: [],
        student_progress: [],
      },
      total: 0,
      studentsCount: 0,
    };
  }

  const userToCgMap = new Map();
  const collegeIdsSet = new Set();

  for (const m of mappings) {
    userToCgMap.set(m.trainx_user_id, m.career_gateway_student_id);
    if (m.college_id) collegeIdsSet.add(m.college_id);
  }

  const userIds = Array.from(userToCgMap.keys());
  const collegeIds = Array.from(collegeIdsSet);
  const isIndividualStudent = (studentId !== null && studentId !== undefined) || (userId !== null && userId !== undefined);

  // 2. Category 1: Batches
  let batches = [];
  if (isIndividualStudent && userIds.length === 1) {
    // Individual student sync: select batches the student is enrolled in
    const targetUserId = userIds[0];
    const collegeParamClause = collegeIds.length > 0 ? `AND b.college_id IN (${collegeIds.map(() => '?').join(',')})` : '';
    const batchRows = await query(
      `SELECT DISTINCT b.id as batch_id, b.college_id, b.name as batch_name, b.year, b.division, b.schedule, b.students as student_count
       FROM batches b
       LEFT JOIN student_batches sb ON sb.batch_id = b.id AND sb.user_id = ?
       LEFT JOIN students s ON s.batch_id = b.id AND s.user_id = ?
       WHERE (sb.user_id IS NOT NULL OR s.user_id IS NOT NULL) ${collegeParamClause}
       ORDER BY b.id ASC`,
      [targetUserId, targetUserId, ...collegeIds]
    );
    batches = (batchRows || []).map((b) => ({
      batch_id: b.batch_id,
      batch_name: b.batch_name,
      college_id: b.college_id,
      year: b.year,
      division: b.division,
      schedule: b.schedule,
      student_count: b.student_count,
    }));
  } else if (collegeIds.length > 0) {
    const collegePlaceholders = collegeIds.map(() => '?').join(',');
    const batchRows = await query(
      `SELECT b.id as batch_id, b.college_id, b.name as batch_name, b.year, b.division, b.schedule, b.students as student_count
       FROM batches b
       WHERE b.college_id IN (${collegePlaceholders})
       ORDER BY b.id ASC`,
      collegeIds
    );
    batches = (batchRows || []).map((b) => ({
      batch_id: b.batch_id,
      batch_name: b.batch_name,
      college_id: b.college_id,
      year: b.year,
      division: b.division,
      schedule: b.schedule,
      student_count: b.student_count,
    }));
  }

  // 3. Category 2: Sessions
  let sessions = [];
  if (isIndividualStudent && userIds.length === 1) {
    const studentBatchIds = batches.map(b => b.batch_id).filter(Boolean);
    const sessionBatchPlaceholders = studentBatchIds.length > 0 ? studentBatchIds.map(() => '?').join(',') : 'NULL';
    let sessionSql = `
      SELECT DISTINCT s.id as session_id, s.college_id, s.batch_id, s.title, s.session_date, s.start_time, s.end_time, s.faculty_id
      FROM attendance_sessions s
      LEFT JOIN attendance a ON a.session_id = s.id AND a.user_id = ?
      WHERE (a.user_id IS NOT NULL ${studentBatchIds.length > 0 ? `OR s.batch_id IN (${sessionBatchPlaceholders})` : ''})
    `;
    const sessionParams = [userIds[0], ...studentBatchIds];
    if (sinceTimestamp) {
      sessionSql += ' AND s.created_at >= ?';
      sessionParams.push(sinceTimestamp);
    }
    sessionSql += ` ORDER BY s.session_date DESC LIMIT ?`;
    sessionParams.push(parseInt(limit, 10));

    const sessionRows = await query(sessionSql, sessionParams);
    sessions = (sessionRows || []).map((s) => ({
      session_id: s.session_id,
      batch_id: s.batch_id,
      title: s.title,
      session_date: s.session_date,
      start_time: s.start_time,
      end_time: s.end_time,
      trainer_id: s.faculty_id,
    }));
  } else if (collegeIds.length > 0) {
    const collegePlaceholders = collegeIds.map(() => '?').join(',');
    let sessionSql = `
      SELECT s.id as session_id, s.college_id, s.batch_id, s.title, s.session_date, s.start_time, s.end_time, s.faculty_id
      FROM attendance_sessions s
      WHERE s.college_id IN (${collegePlaceholders})
    `;
    const sessionParams = [...collegeIds];
    if (sinceTimestamp) {
      sessionSql += ' AND s.created_at >= ?';
      sessionParams.push(sinceTimestamp);
    }
    sessionSql += ` ORDER BY s.session_date DESC LIMIT ?`;
    sessionParams.push(parseInt(limit, 10));

    const sessionRows = await query(sessionSql, sessionParams);
    sessions = (sessionRows || []).map((s) => ({
      session_id: s.session_id,
      batch_id: s.batch_id,
      title: s.title,
      session_date: s.session_date,
      start_time: s.start_time,
      end_time: s.end_time,
      trainer_id: s.faculty_id,
    }));
  }

  // 4. Category 3: Attendance
  let attendance = [];
  if (userIds.length > 0) {
    const userPlaceholders = userIds.map(() => '?').join(',');
    let attendanceSql = `
      SELECT a.id as attendance_id, a.user_id, a.batch_id, a.session_id, a.session_date, a.status as attendance_status, a.remarks
      FROM attendance a
      WHERE a.user_id IN (${userPlaceholders})
    `;
    const attendanceParams = [...userIds];
    if (sinceTimestamp) {
      attendanceSql += ' AND a.created_at >= ?';
      attendanceParams.push(sinceTimestamp);
    }
    attendanceSql += ` ORDER BY a.session_date DESC LIMIT ?`;
    attendanceParams.push(parseInt(limit, 10));

    const attendanceRows = await query(attendanceSql, attendanceParams);
    for (const a of (attendanceRows || [])) {
      const cgStudentId = userToCgMap.get(a.user_id);
      if (!cgStudentId) continue;
      attendance.push({
        attendance_id: a.attendance_id,
        student_id: cgStudentId,
        trainx_user_id: a.user_id,
        batch_id: a.batch_id,
        session_id: a.session_id,
        session_date: a.session_date,
        status: a.attendance_status,
        remarks: a.remarks,
      });
    }
  }

  // 5. Category 4: Assessments
  // Uses actual MySQL schema: total_marks, pass_marks (passing_percentage is computed dynamically)
  let assessments = [];
  if (isIndividualStudent && userIds.length === 1) {
    const studentBatchIds = batches.map(b => b.batch_id).filter(Boolean);
    const batchPlaceholders = studentBatchIds.length > 0 ? studentBatchIds.map(() => '?').join(',') : 'NULL';
    const collegePlaceholders = collegeIds.length > 0 ? collegeIds.map(() => '?').join(',') : 'NULL';
    const assessmentDefRows = await query(
      `SELECT DISTINCT asm.id as assessment_id, asm.college_id, asm.batch_id, asm.title, asm.category, asm.total_marks, asm.pass_marks
       FROM assessments asm
       LEFT JOIN assessment_attempts att ON att.assessment_id = asm.id AND att.user_id = ?
       WHERE (att.user_id IS NOT NULL 
              ${studentBatchIds.length > 0 ? `OR asm.batch_id IN (${batchPlaceholders})` : ''} 
              ${collegeIds.length > 0 ? `OR (asm.college_id IN (${collegePlaceholders}) AND asm.batch_id IS NULL)` : 'OR asm.college_id IS NULL'})
       ORDER BY asm.id ASC`,
      [userIds[0], ...studentBatchIds, ...collegeIds]
    );
    assessments = (assessmentDefRows || []).map((a) => {
      const totalMarks = parseFloat(a.total_marks) || 0;
      const passMarks = parseFloat(a.pass_marks) || 0;
      const passingPct = totalMarks > 0 ? Math.round((passMarks / totalMarks) * 100) : 60;
      return {
        assessment_id: a.assessment_id,
        batch_id: a.batch_id,
        title: a.title,
        category: a.category,
        total_marks: a.total_marks,
        pass_marks: a.pass_marks,
        passing_percentage: passingPct,
      };
    });
  } else if (collegeIds.length > 0) {
    const collegePlaceholders = collegeIds.map(() => '?').join(',');
    const assessmentDefRows = await query(
      `SELECT asm.id as assessment_id, asm.college_id, asm.batch_id, asm.title, asm.category, asm.total_marks, asm.pass_marks
       FROM assessments asm
       WHERE asm.college_id IN (${collegePlaceholders}) OR asm.college_id IS NULL
       ORDER BY asm.id ASC`,
      collegeIds
    );
    assessments = (assessmentDefRows || []).map((a) => {
      const totalMarks = parseFloat(a.total_marks) || 0;
      const passMarks = parseFloat(a.pass_marks) || 0;
      const passingPct = totalMarks > 0 ? Math.round((passMarks / totalMarks) * 100) : 60;
      return {
        assessment_id: a.assessment_id,
        batch_id: a.batch_id,
        title: a.title,
        category: a.category,
        total_marks: a.total_marks,
        pass_marks: a.pass_marks,
        passing_percentage: passingPct,
      };
    });
  }

  // 6. Category 5: Assessment Results
  // LEFT JOINs assessments table to ensure student attempts are never dropped even if an assessment is unassigned.
  // Computes score, max_score, passing_score, passing_percentage, and pass/fail status safely.
  let assessment_results = [];
  if (userIds.length > 0) {
    const userPlaceholders = userIds.map(() => '?').join(',');
    let attemptSql = `
      SELECT 
        att.id as attempt_id, 
        att.user_id, 
        att.assessment_id, 
        COALESCE(att.marks_obtained, att.score, 0) as score,
        COALESCE(att.total_marks, asm.total_marks, 100) as max_score,
        COALESCE(asm.pass_marks, 0) as passing_score,
        ROUND(IF(COALESCE(asm.total_marks, 0) > 0, (COALESCE(asm.pass_marks, 0) / asm.total_marks) * 100, 60.00), 2) as passing_percentage,
        COALESCE(att.percentage, ROUND(IF(COALESCE(asm.total_marks, 0) > 0, (COALESCE(att.marks_obtained, att.score, 0) / asm.total_marks) * 100, 0), 2)) as percentage,
        CASE WHEN COALESCE(att.marks_obtained, att.score, 0) >= COALESCE(asm.pass_marks, 0) THEN 'passed' ELSE 'failed' END as status,
        IF(COALESCE(att.marks_obtained, att.score, 0) >= COALESCE(asm.pass_marks, 0), 1, 0) as passed,
        COALESCE(att.total_questions, 0) as total_questions, 
        COALESCE(att.correct_count, att.correct_answers, 0) as attempted_questions, 
        COALESCE(att.correct_count, att.correct_answers, 0) as correct_count, 
        COALESCE(att.submitted_at, att.completed_at, att.started_at, CURRENT_TIMESTAMP) as attempt_date
      FROM assessment_attempts att
      LEFT JOIN assessments asm ON asm.id = att.assessment_id
      WHERE att.user_id IN (${userPlaceholders})
    `;
    const attemptParams = [...userIds];
    if (sinceTimestamp) {
      attemptSql += ' AND COALESCE(att.submitted_at, att.completed_at, att.started_at) >= ?';
      attemptParams.push(sinceTimestamp);
    }
    attemptSql += ` ORDER BY COALESCE(att.submitted_at, att.completed_at, att.started_at) DESC LIMIT ?`;
    attemptParams.push(parseInt(limit, 10));

    const attemptRows = await query(attemptSql, attemptParams);
    for (const att of (attemptRows || [])) {
      const cgStudentId = userToCgMap.get(att.user_id);
      if (!cgStudentId) continue;
      assessment_results.push({
        attempt_id: att.attempt_id,
        student_id: cgStudentId,
        trainx_user_id: att.user_id,
        assessment_id: att.assessment_id,
        score: att.score,
        max_score: att.max_score,
        passing_score: att.passing_score,
        passing_percentage: att.passing_percentage,
        percentage: att.percentage,
        status: att.status,
        passed: Boolean(att.passed),
        total_questions: att.total_questions,
        attempted_questions: att.attempted_questions,
        correct_count: att.correct_count,
        attempt_date: att.attempt_date,
      });
    }
  }

  // 7. Category 6: Student Progress
  // Aggregated from roadmap items and task submissions for each student
  const student_progress = [];
  for (const m of mappings) {
    const cgStudentId = m.career_gateway_student_id;
    const userId = m.trainx_user_id;

    // Roadmaps completion
    const [roadmapStats] = await query(
      `SELECT 
         COUNT(*) as total_modules,
         SUM(CASE WHEN ri.status = 'completed' THEN 1 ELSE 0 END) as completed_modules,
         MAX(ri.created_at) as last_roadmap_activity
       FROM roadmaps r
       JOIN roadmap_items ri ON ri.roadmap_id = r.id
       WHERE r.student_id = ?`,
      [userId]
    );

    // Task submissions completion
    const [taskStats] = await query(
      `SELECT 
         COUNT(*) as total_tasks_submitted,
         SUM(CASE WHEN ts.status IN ('completed', 'accepted', 'approved') THEN 1 ELSE 0 END) as approved_tasks,
         MAX(ts.created_at) as last_task_activity
       FROM task_submissions ts
       WHERE ts.user_id = ?`,
      [userId]
    );

    const totalModules = Number(roadmapStats?.total_modules || 0);
    const completedModules = Number(roadmapStats?.completed_modules || 0);
    const completionPercentage = totalModules > 0
      ? Number(((completedModules / totalModules) * 100).toFixed(2))
      : 0;

    const dates = [roadmapStats?.last_roadmap_activity, taskStats?.last_task_activity].filter(Boolean);
    const lastActivity = dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d)))) : null;

    student_progress.push({
      student_id: cgStudentId,
      trainx_user_id: userId,
      clg_id: m.clg_id,
      email: m.email,
      total_modules: totalModules,
      completed_modules: completedModules,
      completion_percentage: completionPercentage,
      tasks_submitted: Number(taskStats?.total_tasks_submitted || 0),
      tasks_approved: Number(taskStats?.approved_tasks || 0),
      last_activity_date: lastActivity,
    });
  }

  const grandTotal =
    batches.length +
    sessions.length +
    attendance.length +
    assessments.length +
    assessment_results.length +
    student_progress.length;

  let resolvedExternalCollegeId = null;
  const targetColId = collegeId || (collegeIdsSet.size === 1 ? Array.from(collegeIdsSet)[0] : null);
  if (targetColId) {
    const colRows = await query(
      'SELECT id, code, career_gateway_college_id FROM colleges WHERE id = ? OR career_gateway_college_id = ? LIMIT 1',
      [isNaN(Number(targetColId)) ? -1 : Number(targetColId), String(targetColId)]
    );
    if (colRows && colRows.length > 0) {
      resolvedExternalCollegeId = colRows[0].career_gateway_college_id || colRows[0].code || String(colRows[0].id);
    }
  }

  return {
    data: {
      batches,
      sessions,
      attendance,
      assessments,
      assessment_results,
      student_progress,
    },
    total: grandTotal,
    studentsCount: mappings.length,
    resolvedCollegeId: resolvedExternalCollegeId,
    collegeCount: collegeIdsSet.size,
  };
}
