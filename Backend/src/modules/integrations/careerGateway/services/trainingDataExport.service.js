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
  const { sinceTimestamp = null, collegeId = null, limit = 500 } = options;

  // 1. Retrieve active Career Gateway student mappings (scoped by college if provided)
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
  const inClause = userIds.join(',');
  const collegeInClause = Array.from(collegeIdsSet).join(',') || 'NULL';

  // 2. Category 1: Batches
  const batchRows = await query(
    `SELECT b.id as batch_id, b.college_id, b.name as batch_name, b.year, b.division, b.schedule, b.students as student_count
     FROM batches b
     WHERE b.college_id IN (${collegeInClause})
     ORDER BY b.id ASC`
  );
  const batches = (batchRows || []).map((b) => ({
    batch_id: b.batch_id,
    batch_name: b.batch_name,
    college_id: b.college_id,
    year: b.year,
    division: b.division,
    schedule: b.schedule,
    student_count: b.student_count,
  }));

  // 3. Category 2: Sessions
  let sessionSql = `
    SELECT s.id as session_id, s.college_id, s.batch_id, s.title, s.session_date, s.start_time, s.end_time, s.faculty_id
    FROM attendance_sessions s
    WHERE s.college_id IN (${collegeInClause})
  `;
  const sessionParams = [];
  if (sinceTimestamp) {
    sessionSql += ' AND s.created_at >= ?';
    sessionParams.push(sinceTimestamp);
  }
  sessionSql += ` ORDER BY s.session_date DESC LIMIT ${parseInt(limit, 10)}`;

  const sessionRows = await query(sessionSql, sessionParams);
  const sessions = (sessionRows || []).map((s) => ({
    session_id: s.session_id,
    batch_id: s.batch_id,
    title: s.title,
    session_date: s.session_date,
    start_time: s.start_time,
    end_time: s.end_time,
    trainer_id: s.faculty_id,
  }));

  // 4. Category 3: Attendance
  let attendanceSql = `
    SELECT a.id as attendance_id, a.user_id, a.batch_id, a.session_id, a.session_date, a.status as attendance_status, a.remarks
    FROM attendance a
    WHERE a.user_id IN (${inClause})
  `;
  const attendanceParams = [];
  if (sinceTimestamp) {
    attendanceSql += ' AND a.created_at >= ?';
    attendanceParams.push(sinceTimestamp);
  }
  attendanceSql += ` ORDER BY a.session_date DESC LIMIT ${parseInt(limit, 10)}`;

  const attendanceRows = await query(attendanceSql, attendanceParams);
  const attendance = [];
  for (const a of attendanceRows) {
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

  // 5. Category 4: Assessments
  const assessmentDefRows = await query(
    `SELECT asm.id as assessment_id, asm.college_id, asm.batch_id, asm.title, asm.category, asm.total_marks, asm.pass_marks, asm.passing_percentage
     FROM assessments asm
     WHERE asm.college_id IN (${collegeInClause})
     ORDER BY asm.id ASC`
  );
  const assessments = (assessmentDefRows || []).map((a) => ({
    assessment_id: a.assessment_id,
    batch_id: a.batch_id,
    title: a.title,
    category: a.category,
    total_marks: a.total_marks,
    pass_marks: a.pass_marks,
    passing_percentage: a.passing_percentage,
  }));

  // 6. Category 5: Assessment Results
  let attemptSql = `
    SELECT att.id as attempt_id, att.user_id, att.assessment_id, att.score, att.total_questions, att.attempted_questions, att.correct_count, att.created_at as attempt_date
    FROM assessment_attempts att
    WHERE att.user_id IN (${inClause})
  `;
  const attemptParams = [];
  if (sinceTimestamp) {
    attemptSql += ' AND att.created_at >= ?';
    attemptParams.push(sinceTimestamp);
  }
  attemptSql += ` ORDER BY att.created_at DESC LIMIT ${parseInt(limit, 10)}`;

  const attemptRows = await query(attemptSql, attemptParams);
  const assessment_results = [];
  for (const att of attemptRows) {
    const cgStudentId = userToCgMap.get(att.user_id);
    if (!cgStudentId) continue;
    assessment_results.push({
      attempt_id: att.attempt_id,
      student_id: cgStudentId,
      trainx_user_id: att.user_id,
      assessment_id: att.assessment_id,
      score: att.score,
      total_questions: att.total_questions,
      attempted_questions: att.attempted_questions,
      correct_count: att.correct_count,
      attempt_date: att.attempt_date,
    });
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
  };
}
