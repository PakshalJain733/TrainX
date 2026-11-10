import crypto from 'crypto';
import { query } from '../../../../config/db.js';

/**
 * Helper to calculate minutes between start_time and end_time (e.g. '10:00:00', '11:30:00')
 */
function calculateDurationMinutes(startTime, endTime, defaultMinutes = 90) {
  if (!startTime || !endTime) return defaultMinutes;
  try {
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    if (!isNaN(h1) && !isNaN(h2)) {
      const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
      return diff > 0 ? diff : defaultMinutes;
    }
  } catch (_) {}
  return defaultMinutes;
}

/**
 * Service to execute synchronous on-demand student training data extraction for Career Gateway.
 * Returns the exact 6 training categories required by Career Gateway's RPC contract:
 * - batches
 * - sessions
 * - attendance
 * - assessments
 * - assessment_results
 * - student_progress
 */
export async function fetchStudentTrainingSyncData(payload = {}) {
  const {
    student_id,
    career_gateway_student_id,
    clg_id,
    roll_number,
    email,
    college_id,
    career_gateway_college_id,
    requested_by = 'career_gateway',
  } = payload;

  const targetCgStudentId = career_gateway_student_id || student_id;
  const targetClgId = roll_number ? String(roll_number).trim() : (clg_id ? String(clg_id).trim() : null);
  const targetEmail = email ? String(email).trim().toLowerCase() : null;

  if (!targetCgStudentId && !targetClgId && !targetEmail) {
    const err = new Error('Student identifier (roll_number, student_id, career_gateway_student_id, email, or clg_id) is required.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Locate student in TrainX
  // Try mapping table first
  let mappedUser = null;
  const mappingParams = [];
  let mappingSql = `
    SELECT m.trainx_user_id, m.career_gateway_student_id, m.clg_id, m.assigned_batch,
           u.id as user_id, u.name, u.email, u.college_id,
           s.roll_number, s.department, s.batch_id as student_batch_id
    FROM career_gateway_student_mappings m
    JOIN users u ON u.id = m.trainx_user_id
    LEFT JOIN students s ON s.user_id = m.trainx_user_id
    WHERE 1=1
  `;

  if (targetEmail) {
    mappingSql += ' AND LOWER(u.email) = ?';
    mappingParams.push(targetEmail);
  } else if (targetCgStudentId && targetClgId) {
    mappingSql += ' AND (m.career_gateway_student_id = ? OR m.clg_id = ? OR s.roll_number = ?)';
    mappingParams.push(targetCgStudentId, targetClgId, targetClgId);
  } else if (targetCgStudentId) {
    mappingSql += ' AND m.career_gateway_student_id = ?';
    mappingParams.push(targetCgStudentId);
  } else {
    mappingSql += ' AND (m.clg_id = ? OR s.roll_number = ?)';
    mappingParams.push(targetClgId, targetClgId);
  }

  const mappingRows = await query(mappingSql, mappingParams);
  if (mappingRows && mappingRows.length > 0) {
    mappedUser = mappingRows[0];
  }

  // If not found in mapping table, look in students and users tables
  if (!mappedUser) {
    const studentParams = [];
    let studentSql = `
      SELECT u.id as user_id, u.name, u.email, u.college_id,
             s.career_gateway_student_id, s.clg_id, s.roll_number, s.department, s.batch_id as student_batch_id
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      WHERE 1=1
    `;
    if (targetEmail) {
      studentSql += ' AND LOWER(u.email) = ?';
      studentParams.push(targetEmail);
    } else if (targetCgStudentId && targetClgId) {
      studentSql += ' AND (s.career_gateway_student_id = ? OR s.clg_id = ? OR s.roll_number = ? OR u.id = ?)';
      studentParams.push(targetCgStudentId, targetClgId, targetClgId, targetCgStudentId);
    } else if (targetCgStudentId) {
      studentSql += ' AND (s.career_gateway_student_id = ? OR u.id = ?)';
      studentParams.push(targetCgStudentId, targetCgStudentId);
    } else {
      studentSql += ' AND (s.clg_id = ? OR s.roll_number = ?)';
      studentParams.push(targetClgId, targetClgId);
    }

    const studentRows = await query(studentSql, studentParams);
    if (studentRows && studentRows.length > 0) {
      mappedUser = studentRows[0];
      // Auto-register into mappings table for fast future lookups
      const resolvedCgId = mappedUser.career_gateway_student_id || targetCgStudentId || mappedUser.user_id;
      const resolvedClgId = mappedUser.clg_id || targetClgId || mappedUser.roll_number;
      await query(
        `INSERT INTO career_gateway_student_mappings
         (trainx_user_id, career_gateway_student_id, clg_id, eligibility_status, source_system)
         VALUES (?, ?, ?, 'eligible', 'career_gateway')
         ON DUPLICATE KEY UPDATE clg_id = VALUES(clg_id), last_synced_at = NOW()`,
        [mappedUser.user_id, resolvedCgId, resolvedClgId]
      ).catch(() => {});
    }
  }

  if (!mappedUser) {
    const notFoundErr = new Error(`Student ${targetCgStudentId || targetClgId || targetEmail} is not found or registered in TrainX.`);
    notFoundErr.statusCode = 404;
    throw notFoundErr;
  }

  const userId = mappedUser.user_id;
  const resolvedCgStudentId = mappedUser.career_gateway_student_id || targetCgStudentId || userId;
  const resolvedClgId = mappedUser.clg_id || targetClgId || mappedUser.roll_number || `STU-${userId}`;
  const studentCollegeId = mappedUser.college_id;

  // 2. Category 1: Batches
  const batchRows = await query(
    `SELECT DISTINCT b.id, b.name, b.topic, b.status, b.date, b.academic_year, b.created_at
     FROM batches b
     LEFT JOIN student_batches sb ON sb.batch_id = b.id AND sb.user_id = ?
     LEFT JOIN students s ON s.batch_id = b.id AND s.user_id = ?
     WHERE (sb.user_id IS NOT NULL OR s.user_id IS NOT NULL OR b.id = ?)
     ORDER BY b.id ASC`,
    [userId, userId, mappedUser.student_batch_id || -1]
  );

  const batches = (batchRows || []).map((b) => {
    const startDate = b.date
      ? new Date(b.date).toISOString().split('T')[0]
      : (b.created_at ? new Date(b.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

    let endDate = null;
    if (startDate) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + 6);
      endDate = d.toISOString().split('T')[0];
    }

    return {
      trainx_batch_id: `batch_${b.id}`,
      batch_name: b.name || `Batch ${b.id}`,
      course_name: b.topic || b.name || 'Technical Training Course',
      start_date: startDate,
      end_date: endDate,
      status: b.status || 'active',
    };
  });

  const studentBatchIds = batches.map(b => Number(b.trainx_batch_id.replace('batch_', ''))).filter(n => !isNaN(n));
  const batchPlaceholders = studentBatchIds.length > 0 ? studentBatchIds.map(() => '?').join(',') : 'NULL';

  // 3. Category 2: Sessions
  const sessionRows = await query(
    `SELECT DISTINCT s.id, s.batch_id, s.title, s.session_date, s.start_time, s.end_time,
            u.name as trainer_name
     FROM attendance_sessions s
     LEFT JOIN users u ON u.id = s.faculty_id
     LEFT JOIN attendance a ON a.session_id = s.id AND a.user_id = ?
     WHERE (a.user_id IS NOT NULL ${studentBatchIds.length > 0 ? `OR s.batch_id IN (${batchPlaceholders})` : ''})
     ORDER BY s.session_date DESC
     LIMIT 100`,
    [userId, ...studentBatchIds]
  );

  const sessions = (sessionRows || []).map((s) => ({
    trainx_session_id: `sess_${s.id}`,
    trainx_batch_id: `batch_${s.batch_id || (batches[0]?.trainx_batch_id?.replace('batch_', '') || 1)}`,
    topic_name: s.title || 'Technical Training Session',
    session_date: s.session_date ? new Date(s.session_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    duration_minutes: calculateDurationMinutes(s.start_time, s.end_time, 90),
    trainer_name: s.trainer_name || 'Faculty Trainer',
  }));

  // 4. Category 3: Attendance
  const attendanceRows = await query(
    `SELECT a.id, a.batch_id, a.session_id, a.session_date, a.status,
            s.start_time, s.end_time
     FROM attendance a
     LEFT JOIN attendance_sessions s ON s.id = a.session_id
     WHERE a.user_id = ?
     ORDER BY a.session_date DESC
     LIMIT 100`,
    [userId]
  );

  const primaryBatchId = batches[0]?.trainx_batch_id || 'batch_fsd_2026';
  const primaryBatchIdNum = Number(primaryBatchId.replace('batch_', '')) || 1;

  const attendance = (attendanceRows || []).map((a) => {
    const isPresent = a.status === 'present';
    const duration = calculateDurationMinutes(a.start_time, a.end_time, 90);
    return {
      student_id: Number(resolvedCgStudentId),
      career_gateway_student_id: Number(resolvedCgStudentId),
      clg_id: resolvedClgId,
      roll_number: resolvedClgId,
      trainx_session_id: `sess_${a.session_id || a.id}`,
      trainx_batch_id: `batch_${a.batch_id || primaryBatchIdNum}`,
      attended: isPresent ? 1 : 0,
      attendance_percentage: isPresent ? 100 : 0,
      duration_attended_minutes: isPresent ? duration : 0,
    };
  });

  // 5. Category 4: Assessments
  const assessmentRows = await query(
    `SELECT DISTINCT asm.id, asm.batch_id, asm.title, asm.category, asm.total_marks, asm.pass_marks
     FROM assessments asm
     LEFT JOIN assessment_attempts att ON att.assessment_id = asm.id AND att.user_id = ?
     WHERE (att.user_id IS NOT NULL ${studentBatchIds.length > 0 ? `OR asm.batch_id IN (${batchPlaceholders})` : ''})
     ORDER BY asm.id ASC
     LIMIT 100`,
    [userId, ...studentBatchIds]
  );

  const assessments = (assessmentRows || []).map((asm) => ({
    trainx_assessment_id: `asm_${asm.id}`,
    trainx_batch_id: `batch_${asm.batch_id || primaryBatchIdNum}`,
    title: asm.title || 'Technical Assessment',
    assessment_type: asm.category || 'quiz',
    max_score: Number(asm.total_marks || 100),
    passing_score: Number(asm.pass_marks || 60),
  }));

  // 6. Category 5: Assessment Results
  const attemptRows = await query(
    `SELECT att.id, att.assessment_id,
            COALESCE(att.marks_obtained, att.score, 0) as score,
            COALESCE(att.total_marks, asm.total_marks, 100) as max_score,
            COALESCE(asm.pass_marks, 60) as passing_score,
            att.percentage,
            COALESCE(att.submitted_at, att.completed_at, att.started_at, CURRENT_TIMESTAMP) as attempted_at,
            asm.batch_id
     FROM assessment_attempts att
     LEFT JOIN assessments asm ON asm.id = att.assessment_id
     WHERE att.user_id = ?
     ORDER BY att.id DESC
     LIMIT 100`,
    [userId]
  );

  const assessment_results = (attemptRows || []).map((att) => {
    const score = Number(att.score);
    const maxScore = Number(att.max_score);
    const passScore = Number(att.passing_score);
    const pct = att.percentage !== null && att.percentage !== undefined
      ? Number(att.percentage)
      : (maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0);
    const passed = score >= passScore ? 1 : 0;

    return {
      student_id: Number(resolvedCgStudentId),
      career_gateway_student_id: Number(resolvedCgStudentId),
      clg_id: resolvedClgId,
      roll_number: resolvedClgId,
      trainx_assessment_id: `asm_${att.assessment_id}`,
      trainx_batch_id: `batch_${att.batch_id || primaryBatchIdNum}`,
      score,
      max_score: maxScore,
      percentage: pct,
      passed,
      feedback: passed ? 'Passed assessment requirements' : 'Needs improvement on topic concepts',
      attempted_at: att.attempted_at
        ? new Date(att.attempted_at).toISOString().replace('T', ' ').substring(0, 19)
        : `${new Date().toISOString().split('T')[0]} 14:30:00`,
    };
  });

  // 7. Category 6: Student Progress
  const [roadmapStats] = await query(
    `SELECT 
       COUNT(*) as total_modules,
       SUM(CASE WHEN ri.status = 'completed' THEN 1 ELSE 0 END) as completed_modules,
       MAX(COALESCE(r.updated_at, r.created_at)) as last_roadmap_activity
     FROM roadmaps r
     JOIN roadmap_items ri ON ri.roadmap_id = r.id
     WHERE (r.student_id = ? OR r.user_id = ?)`,
    [userId, userId]
  );

  const [taskStats] = await query(
    `SELECT 
       COUNT(*) as total_tasks,
       SUM(CASE WHEN status IN ('completed', 'accepted', 'approved') THEN 1 ELSE 0 END) as approved_tasks,
       MAX(submitted_at) as last_task_activity
     FROM task_submissions
     WHERE user_id = ?`,
    [userId]
  );

  const totalTopics = Number(roadmapStats?.total_modules || 0) || Number(taskStats?.total_tasks || 0) || (sessions.length > 0 ? sessions.length : 20);
  const completedTopics = Number(roadmapStats?.completed_modules || 0) || Number(taskStats?.approved_tasks || 0) || attendance.filter(a => a.attended === 1).length;
  const completionPercentage = totalTopics > 0
    ? Number(Math.min(100, Math.round((completedTopics / totalTopics) * 100)))
    : 0;

  const dates = [
    roadmapStats?.last_roadmap_activity,
    taskStats?.last_task_activity,
    attemptRows?.[0]?.attempted_at,
    attendanceRows?.[0]?.session_date,
  ].filter(Boolean);
  const lastActiveDate = dates.length > 0
    ? new Date(Math.max(...dates.map(d => new Date(d)))).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  const student_progress = [
    {
      student_id: Number(resolvedCgStudentId),
      career_gateway_student_id: Number(resolvedCgStudentId),
      clg_id: resolvedClgId,
      roll_number: resolvedClgId,
      trainx_batch_id: primaryBatchId,
      completion_percentage: completionPercentage,
      completed_topics: completedTopics,
      total_topics: totalTopics,
      overall_status: completionPercentage >= 100 ? 'completed' : 'in_progress',
      last_active_at: `${new Date(lastActiveDate).toISOString().split('T')[0]} 16:00:00`,
    }
  ];

  // Look up external college slug
  let externalCollegeId = college_id || career_gateway_college_id || 'pvppcoe';
  if (studentCollegeId) {
    const [colRow] = await query('SELECT career_gateway_college_id, code FROM colleges WHERE id = ? LIMIT 1', [studentCollegeId]);
    if (colRow) {
      externalCollegeId = colRow.career_gateway_college_id || colRow.code || externalCollegeId;
    }
  }

  const dataPayload = {
    college_id: externalCollegeId,
    student_id: roll_number || resolvedClgId || Number(resolvedCgStudentId),
    batches,
    sessions,
    attendance,
    assessments,
    assessment_results,
    student_progress,
  };

  // 8. Record audit log entry in career_gateway_sync_executions and career_gateway_sync_log
  const syncId = `SYNC-RPC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const totalCount =
    batches.length +
    sessions.length +
    attendance.length +
    assessments.length +
    assessment_results.length +
    student_progress.length;

  try {
    await query(
      `INSERT INTO career_gateway_sync_executions
       (sync_id, request_id, sync_type, trigger_source, requested_by, college_id, career_gateway_college_id,
        career_gateway_student_id, trainx_user_id, status, records_processed, records_failed,
        payload_summary, started_at, completed_at)
       VALUES (?, ?, 'manual_student', 'career_gateway', ?, ?, ?, ?, ?, 'completed', ?, 0, ?, NOW(), NOW())`,
      [
        syncId,
        payload.request_id || `REQ-CG-${Date.now()}`,
        String(requested_by || 'career_gateway'),
        studentCollegeId,
        college_id || career_gateway_college_id || 'col_somaiya_eng_01',
        Number(resolvedCgStudentId),
        userId,
        totalCount,
        JSON.stringify({
          batches: batches.length,
          sessions: sessions.length,
          attendance: attendance.length,
          assessments: assessments.length,
          assessment_results: assessment_results.length,
          student_progress: student_progress.length,
        }),
      ]
    );

    await query(
      `INSERT INTO career_gateway_sync_log
       (sync_direction, entity_type, total_records, success_count, failure_count, status, details, triggered_by)
       VALUES ('inbound_from_cg', 'student_sync_rpc', ?, ?, 0, 'success', ?, ?)`,
      [totalCount, totalCount, JSON.stringify({ sync_id: syncId, student_id: resolvedCgStudentId, clg_id: resolvedClgId }), `career_gateway:${requested_by}`]
    );
  } catch (logErr) {
    console.warn('[OnDemandStudentSync] Logging notice:', logErr.message);
  }

  return dataPayload;
}

