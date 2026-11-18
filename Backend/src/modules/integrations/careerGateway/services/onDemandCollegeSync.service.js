import { query } from '../../../../config/db.js';
import { getRelatedCollegeIds } from '../../../../models/user.model.js';

/**
 * Calculates session duration in minutes.
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
 * Resolves the institutional college tenant from incoming request parameters.
 * Matches by code, career_gateway_college_id, id, or name.
 */
async function resolveCollegeTenant(collegeId, careerGatewayCollegeId) {
  const candidate = (careerGatewayCollegeId || collegeId || '').trim();

  if (candidate) {
    const isNum = !isNaN(Number(candidate));
    const [matched] = await query(
      `SELECT id, name, code, career_gateway_college_id 
       FROM colleges 
       WHERE LOWER(career_gateway_college_id) = LOWER(?)
          OR LOWER(code) = LOWER(?)
          OR LOWER(name) LIKE LOWER(?)
          ${isNum ? 'OR id = ?' : ''}
       LIMIT 1`,
      isNum ? [candidate, candidate, `%${candidate}%`, Number(candidate)] : [candidate, candidate, `%${candidate}%`]
    );

    if (matched) {
      return {
        id: matched.id,
        name: matched.name,
        code: matched.code || matched.career_gateway_college_id || String(matched.id),
        externalId: candidate || matched.career_gateway_college_id || matched.code,
      };
    }
  }

  // Fallback to configured environment college ID if available
  const envCollegeId = (process.env.CAREER_GATEWAY_COLLEGE_ID || '').trim();
  if (envCollegeId) {
    const [envMatched] = await query(
      `SELECT id, name, code, career_gateway_college_id 
       FROM colleges 
       WHERE LOWER(career_gateway_college_id) = LOWER(?)
          OR LOWER(code) = LOWER(?)
       LIMIT 1`,
      [envCollegeId, envCollegeId]
    );
    if (envMatched) {
      return {
        id: envMatched.id,
        name: envMatched.name,
        code: envMatched.code || envMatched.career_gateway_college_id || String(envMatched.id),
        externalId: envMatched.career_gateway_college_id || envMatched.code || candidate || envCollegeId,
      };
    }
  }

  // Fallback to primary college row
  const [firstCollege] = await query('SELECT id, name, code, career_gateway_college_id FROM colleges ORDER BY id ASC LIMIT 1');
  if (firstCollege) {
    return {
      id: firstCollege.id,
      name: firstCollege.name,
      code: firstCollege.code || firstCollege.career_gateway_college_id || String(firstCollege.id),
      externalId: candidate || firstCollege.career_gateway_college_id || firstCollege.code || String(firstCollege.id),
    };
  }

  return {
    id: 1,
    name: process.env.DEFAULT_COLLEGE_NAME || 'College of Engineering',
    code: candidate || process.env.CAREER_GATEWAY_COLLEGE_ID || 'default',
    externalId: candidate || process.env.CAREER_GATEWAY_COLLEGE_ID || 'default',
  };
}

/**
 * Service to execute synchronous on-demand College-wide training data extraction for Career Gateway.
 * Returns the exact 6 training categories required by Career Gateway's Batch Analytics Module:
 * 1. batches
 * 2. sessions
 * 3. attendance
 * 4. assessments
 * 5. assessment_results
 * 6. student_progress
 */
export async function fetchCollegeTrainingSyncData(payload = {}) {
  const {
    college_id,
    career_gateway_college_id,
    requested_by = 'career_gateway',
  } = payload;

  // 1. Strict Tenant Resolution
  const collegeTenant = await resolveCollegeTenant(college_id, career_gateway_college_id);
  const targetCollegeId = collegeTenant.id;
  const externalCollegeSlug = collegeTenant.externalId;

  // 2. Category 1: Batches (support target college and any institutional alias IDs)
  const relatedCollegeIds = await getRelatedCollegeIds(targetCollegeId);
  const collegeIdsToSearch = relatedCollegeIds.length > 0 ? relatedCollegeIds : [targetCollegeId];
  const collegePlaceholders = collegeIdsToSearch.map(() => '?').join(',');

  const batchRows = await query(
    `SELECT b.id, b.name, b.topic, b.description, b.status, b.date, b.academic_year, b.created_at
     FROM batches b
     WHERE b.college_id IN (${collegePlaceholders})
     ORDER BY b.id ASC`,
    collegeIdsToSearch
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
      course_name: b.topic || b.description || b.name || 'Technical Training Course',
      start_date: startDate,
      end_date: endDate,
      status: b.status || 'active',
    };
  });

  const batchIds = batches.map(b => Number(b.trainx_batch_id.replace('batch_', ''))).filter(n => !isNaN(n));
  const fallbackBatchId = batchIds.length > 0 ? `batch_${batchIds[0]}` : null;
  const batchPlaceholders = batchIds.length > 0 ? batchIds.map(() => '?').join(',') : 'NULL';

  // 3. Category 2: Sessions
  let sessionRows = [];
  if (batchIds.length > 0) {
    sessionRows = await query(
      `SELECT s.id, s.batch_id, s.title, s.session_date, s.start_time, s.end_time,
              u.name as trainer_name
       FROM attendance_sessions s
       LEFT JOIN users u ON u.id = s.faculty_id
       WHERE s.batch_id IN (${batchPlaceholders}) OR s.college_id = ?
       ORDER BY s.session_date DESC
       LIMIT 500`,
      [...batchIds, targetCollegeId]
    );
  }

  const sessions = (sessionRows || []).map((s) => ({
    trainx_session_id: `sess_${s.id}`,
    trainx_batch_id: s.batch_id ? `batch_${s.batch_id}` : fallbackBatchId,
    topic_name: s.title || 'Technical Training Session',
    session_date: s.session_date
      ? new Date(s.session_date).toISOString().replace('T', ' ').substring(0, 19)
      : `${new Date().toISOString().split('T')[0]} 10:00:00`,
    duration_minutes: calculateDurationMinutes(s.start_time, s.end_time, 90),
    trainer_name: s.trainer_name || 'Faculty Trainer',
  }));

  // 4. Category 3: Attendance
  const attendanceRows = await query(
    `SELECT a.id, a.batch_id, a.session_id, a.user_id, a.session_date, a.status,
            s.start_time, s.end_time,
            st.roll_number, st.clg_id, st.career_gateway_student_id,
            m.career_gateway_student_id as mapped_cg_id, m.clg_id as mapped_clg_id
     FROM attendance a
     JOIN users u ON u.id = a.user_id
     LEFT JOIN attendance_sessions s ON s.id = a.session_id
     LEFT JOIN students st ON st.user_id = a.user_id
     LEFT JOIN career_gateway_student_mappings m ON m.trainx_user_id = a.user_id
     WHERE a.college_id IN (${collegePlaceholders}) OR u.college_id IN (${collegePlaceholders})
     ORDER BY a.session_date DESC
     LIMIT 2000`,
    [...collegeIdsToSearch, ...collegeIdsToSearch]
  );

  const attendance = (attendanceRows || []).map((a) => {
    const isPresent = a.status === 'present';
    const studentIdentifier = a.roll_number || a.mapped_clg_id || a.clg_id || a.mapped_cg_id || a.career_gateway_student_id || `STU-${a.user_id}`;
    return {
      student_id: studentIdentifier,
      career_gateway_student_id: a.mapped_cg_id || a.career_gateway_student_id || null,
      clg_id: a.clg_id || a.mapped_clg_id || a.roll_number || null,
      trainx_session_id: `sess_${a.session_id || a.id}`,
      trainx_batch_id: a.batch_id ? `batch_${a.batch_id}` : fallbackBatchId,
      attended: isPresent,
      attendance_percentage: isPresent ? 100 : 0,
    };
  });

  // 5. Category 4: Assessments
  let assessmentRows = [];
  if (batchIds.length > 0) {
    assessmentRows = await query(
      `SELECT asm.id, asm.batch_id, asm.title, asm.category, asm.total_marks, asm.pass_marks
       FROM assessments asm
       WHERE asm.college_id IN (${collegePlaceholders}) OR asm.batch_id IN (${batchPlaceholders})
       ORDER BY asm.id ASC
       LIMIT 500`,
      [...collegeIdsToSearch, ...batchIds]
    );
  } else {
    assessmentRows = await query(
      `SELECT asm.id, asm.batch_id, asm.title, asm.category, asm.total_marks, asm.pass_marks
       FROM assessments asm
       WHERE asm.college_id IN (${collegePlaceholders})
       ORDER BY asm.id ASC
       LIMIT 500`,
      collegeIdsToSearch
    );
  }

  const assessments = (assessmentRows || []).map((asm) => ({
    trainx_assessment_id: `asm_${asm.id}`,
    trainx_batch_id: asm.batch_id ? `batch_${asm.batch_id}` : fallbackBatchId,
    title: asm.title || 'Technical Assessment',
    max_score: Number(asm.total_marks || 100),
    passing_score: Number(asm.pass_marks || 50),
    assessment_type: asm.category || 'quiz',
  }));

  // 6. Category 5: Assessment Results
  const attemptRows = await query(
    `SELECT att.id, att.assessment_id, att.user_id,
            COALESCE(att.marks_obtained, att.score, 0) as score,
            COALESCE(att.total_marks, asm.total_marks, 100) as max_score,
            COALESCE(asm.pass_marks, 50) as passing_score,
            att.percentage,
            COALESCE(att.submitted_at, att.completed_at, att.started_at, CURRENT_TIMESTAMP) as attempted_at,
            asm.batch_id,
            st.roll_number, st.clg_id, st.career_gateway_student_id,
            m.career_gateway_student_id as mapped_cg_id, m.clg_id as mapped_clg_id
     FROM assessment_attempts att
     JOIN assessments asm ON asm.id = att.assessment_id
     JOIN users u ON u.id = att.user_id
     LEFT JOIN students st ON st.user_id = att.user_id
     LEFT JOIN career_gateway_student_mappings m ON m.trainx_user_id = att.user_id
     WHERE u.college_id IN (${collegePlaceholders}) OR asm.college_id IN (${collegePlaceholders})
     ORDER BY att.id DESC
     LIMIT 2000`,
    [...collegeIdsToSearch, ...collegeIdsToSearch]
  );

  const assessment_results = (attemptRows || []).map((att) => {
    const score = Number(att.score);
    const maxScore = Number(att.max_score);
    const passScore = Number(att.passing_score);
    const passed = score >= passScore;
    const studentIdentifier = att.roll_number || att.mapped_clg_id || att.clg_id || att.mapped_cg_id || att.career_gateway_student_id || `STU-${att.user_id}`;

    return {
      student_id: studentIdentifier,
      career_gateway_student_id: att.mapped_cg_id || att.career_gateway_student_id || null,
      clg_id: att.clg_id || att.mapped_clg_id || att.roll_number || null,
      trainx_assessment_id: `asm_${att.assessment_id}`,
      trainx_batch_id: att.batch_id ? `batch_${att.batch_id}` : fallbackBatchId,
      score,
      max_score: maxScore,
      passed,
      feedback: passed ? 'Passed assessment requirements' : 'Needs improvement on core concepts',
      attempted_at: att.attempted_at
        ? new Date(att.attempted_at).toISOString().replace('T', ' ').substring(0, 19)
        : `${new Date().toISOString().split('T')[0]} 14:30:00`,
    };
  });

  // 7. Category 6: Student Progress
  const studentRows = await query(
    `SELECT u.id as user_id, u.name, u.email,
            st.roll_number, st.clg_id, st.career_gateway_student_id, st.batch_id,
            m.career_gateway_student_id as mapped_cg_id, m.clg_id as mapped_clg_id
     FROM users u
     LEFT JOIN students st ON st.user_id = u.id
     LEFT JOIN career_gateway_student_mappings m ON m.trainx_user_id = u.id
     WHERE (u.college_id IN (${collegePlaceholders}) OR st.college_id IN (${collegePlaceholders})) AND u.role = 'student'
     LIMIT 1000`,
    [...collegeIdsToSearch, ...collegeIdsToSearch]
  );

  // Quick lookup of attendance counts per student
  const attendanceCounts = new Map();
  for (const a of attendanceRows || []) {
    const uid = a.user_id;
    attendanceCounts.set(uid, (attendanceCounts.get(uid) || 0) + (a.status === 'present' ? 1 : 0));
  }

  const student_progress = (studentRows || []).map((s) => {
    const studentIdentifier = s.roll_number || s.mapped_clg_id || s.clg_id || s.mapped_cg_id || s.career_gateway_student_id || `STU-${s.user_id}`;
    const completedTopics = attendanceCounts.get(s.user_id) || 0;
    const totalTopics = sessions.length;
    const completionPercentage = totalTopics > 0
      ? Number(Math.min(100, Math.round((completedTopics / totalTopics) * 100)))
      : 0;

    return {
      student_id: studentIdentifier,
      career_gateway_student_id: s.mapped_cg_id || s.career_gateway_student_id || null,
      clg_id: s.clg_id || s.mapped_clg_id || s.roll_number || null,
      trainx_batch_id: s.batch_id ? `batch_${s.batch_id}` : fallbackBatchId,
      completion_percentage: completionPercentage,
      overall_status: completionPercentage >= 100 ? 'completed' : 'in_progress',
      completed_topics: completedTopics,
      total_topics: totalTopics,
      last_active_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
  });

  return {
    college_id: externalCollegeSlug,
    batches,
    sessions,
    attendance,
    assessments,
    assessment_results,
    student_progress,
  };
}
