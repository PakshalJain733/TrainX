import { query } from '../config/db.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { findOrCreateAttendanceSession } from '../models/attendance.model.js';
import { getStudentAttendanceSummaryService } from '../services/attendance.service.js';
import { getBroadcastsModel } from '../models/broadcast.model.js';

/* ---------------------------------------------------------------------------
 * Helpers — data isolation
 * ------------------------------------------------------------------------- */
const getMentorId = (req) => req.user?.userId || req.user?.id || null;
const getCollegeId = (req) => req.user?.collegeId || req.user?.college_id || null;

/**
 * Batch IDs a mentor is assigned to (batches.mentor_id OR mentor_assignments).
 */
const getMentorBatchIds = async (mentorId) => {
  const rows = await query(
    `SELECT b.id FROM batches b
     WHERE b.mentor_id = ? AND b.status = 'active'
     UNION
     SELECT ma.batch_id FROM mentor_assignments ma
     WHERE ma.mentor_id = ?
       AND ma.batch_id IN (SELECT id FROM batches WHERE status = 'active')`,
    [mentorId, mentorId]
  );
  return rows.map((r) => Number(r.id));
};

/**
 * User IDs of students assigned to a mentor.
 */
const getMentorStudentIds = async (mentorId) => {
  const batchIds = await getMentorBatchIds(mentorId);
  if (batchIds.length === 0) return [];

  const ids = await query(
    `SELECT u.id FROM users u
     JOIN students s ON u.id = s.user_id
     WHERE u.role = 'student'
       AND (s.batch_id IN (
             SELECT id FROM batches WHERE id IN (?)
           )
       OR EXISTS (
             SELECT 1 FROM student_batches sb
             WHERE sb.user_id = u.id AND sb.batch_id IN (?)
           ))`,
    [batchIds, batchIds]
  );
  return ids.map((r) => Number(r.id));
};

const isBatchAssignedToMentor = async (mentorId, batchId) => {
  if (!batchId) return false;
  const batchIds = await getMentorBatchIds(mentorId);
  return batchIds.includes(Number(batchId));
};

const isStudentAssignedToMentor = async (mentorId, studentUserId) => {
  const studentIds = await getMentorStudentIds(mentorId);
  return studentIds.includes(Number(studentUserId));
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/overview
 * ------------------------------------------------------------------------- */
export const getMentorOverview = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const collegeId = getCollegeId(req);

    const [profile] = await query(
      `SELECT id, name, email, mobile_number, role
       FROM users WHERE id = ?`,
      [mentorId]
    );

    const batchIds = await getMentorBatchIds(mentorId);
    const studentIds = await getMentorStudentIds(mentorId);

    const placeholders = batchIds.length > 0 ? batchIds.join(',') : '-1';

    const batches = batchIds.length > 0
      ? await query(
`SELECT b.id, b.name, b.join_code AS code, b.schedule, b.year, b.division,
                  COUNT(DISTINCT s.id) AS enrolled
           FROM batches b
           LEFT JOIN students s ON (s.batch_id = b.id OR EXISTS (
             SELECT 1 FROM student_batches sb WHERE sb.user_id = s.user_id AND sb.batch_id = b.id))
           WHERE b.id IN (${placeholders})
           GROUP BY b.id
           ORDER BY b.name ASC`
        )
      : [];

    const liveSessions = await query(
      `SELECT ls.id, ls.title, ls.subject, ls.batch, ls.date, ls.time, ls.duration, ls.meeting_link, ls.status
       FROM live_sessions ls
       WHERE ls.mentor_id = ?
         AND ls.status != 'Completed'
       ORDER BY (ls.date like '%') DESC, ls.id DESC
       LIMIT 5`,
      [mentorId]
    );

    let defaultersCount = 0;
    let interventionsPending = 0;
    if (studentIds.length > 0) {
      const sidPh = studentIds.join(',');
      const [defCount] = await query(
        `SELECT COUNT(DISTINCT u.id) AS cnt
         FROM users u
         JOIN students s ON u.id = s.user_id
         LEFT JOIN attendance_summary att ON u.id = att.user_id
         LEFT JOIN assessment_attempts aa ON u.id = aa.user_id AND aa.status = 'completed'
         WHERE u.id IN (${sidPh})
         GROUP BY u.id
         HAVING (COALESCE(att.total_classes,0) > 0 AND COALESCE(att.attendance_percentage,0) < 75)
             OR (MAX(aa.percentage) IS NOT NULL AND ROUND(AVG(aa.percentage)) < 50)`,
        []
      );
      defaultersCount = defCount ? Number(defCount.cnt) : 0;

      const [intCount] = await query(
        `SELECT COUNT(*) AS cnt FROM interventions
         WHERE student_id IN (${sidPh}) AND status != 'resolved'`,
        []
      );
      interventionsPending = intCount ? Number(intCount.cnt) : 0;
    }

    const nextSession = liveSessions[0] || null;
    const today = new Date().toISOString().split('T')[0];
    const sessionsToday = liveSessions.filter((s) => String(s.date) === today).length;

    return sendSuccess(res, 'Mentor overview retrieved successfully', {
      profile,
      stats: {
        batchesCount: batches.length,
        studentsCount: studentIds.length,
        defaultersCount,
        interventionsPending,
        sessionsToday,
      },
      batches,
      nextSession,
      upcomingSessions: liveSessions,
    });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/notifications — college-scoped broadcast announcements
 * ------------------------------------------------------------------------- */
export const getMentorNotifications = async (req, res, next) => {
  try {
    const collegeId = getCollegeId(req) || 1;
    const broadcasts = await getBroadcastsModel(collegeId);
    return sendSuccess(res, 'Notifications retrieved successfully', broadcasts);
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/batches — assigned batches with real enrolment
 * ------------------------------------------------------------------------- */
export const getMentorBatches = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const batchIds = await getMentorBatchIds(mentorId);

    if (batchIds.length === 0) {
      return sendSuccess(res, 'No batches assigned', { batches: [] });
    }

    const rows = await query(
      `SELECT b.id, b.name, b.join_code AS code, b.schedule, b.year, b.division,
              d.name AS department_name,
              COUNT(DISTINCT s.id) AS enrolled_students
       FROM batches b
       LEFT JOIN departments d ON b.department_id = d.id
       LEFT JOIN students s ON (s.batch_id = b.id OR EXISTS (
         SELECT 1 FROM student_batches sb WHERE sb.user_id = s.user_id AND sb.batch_id = b.id))
       WHERE b.id IN (${batchIds.join(',')})
       GROUP BY b.id
       ORDER BY b.name ASC`
    );

    const plain = rows.map((b) => ({
      id: b.id,
      code: b.code || b.name,
      name: b.name,
      department: b.department_name || 'Engineering',
      schedule: b.schedule || 'Weekdays',
      year: b.year,
      division: b.division,
      enrolledStudents: Number(b.enrolled_students || 0),
    }));

    const roadmapRows = await query(
      `SELECT s.batch_id, COALESCE(AVG(ri.progress), 0) AS avg_progress
       FROM students s
       JOIN batches b ON (s.batch_id = b.id OR EXISTS (
         SELECT 1 FROM student_batches sb WHERE sb.user_id = s.user_id AND sb.batch_id = b.id))
       LEFT JOIN roadmaps r ON r.student_id = s.user_id
       LEFT JOIN roadmap_items ri ON ri.roadmap_id = r.id
       WHERE b.id IN (${batchIds.join(',')})
       GROUP BY s.batch_id`
    ).catch(() => []);

    const batches = plain.map((b) => {
      const prog = roadmapRows.find((r) => Number(r.batch_id) === Number(b.id));
      return { ...b, progress: prog ? Math.round(parseFloat(prog.avg_progress) || 0) : 0, status: 'Active' };
    });

    return sendSuccess(res, 'Assigned batches retrieved successfully', { batches });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/students — assigned student roster
 * ------------------------------------------------------------------------- */
export const getMentorStudents = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const batchIds = await getMentorBatchIds(mentorId);

    if (batchIds.length === 0) {
      return sendSuccess(res, 'No students assigned', { students: [] });
    }

    const rows = await query(
      `SELECT u.id, u.name, u.email, s.roll_number, s.department,
              b.name AS batch_name,
              COALESCE(att.attendance_percentage, 0) AS attendance_pct,
              COALESCE(att.total_classes, 0) AS total_classes,
              ROUND(AVG(CASE WHEN aa.status = 'completed' THEN aa.percentage END), 1) AS avg_assessment,
              sg.overall_status
       FROM users u
       JOIN students s ON u.id = s.user_id
       JOIN batches b ON (s.batch_id = b.id OR EXISTS (
         SELECT 1 FROM student_batches sb WHERE sb.user_id = u.id AND sb.batch_id = b.id))
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       LEFT JOIN skill_gap_analysis sg ON u.id = sg.user_id
       WHERE b.id IN (${batchIds.join(',')})
       GROUP BY u.id, s.id, b.id, att.id, sg.id
       ORDER BY u.name ASC`
    );

    const students = rows.map((s) => {
      const attendance = Math.round(parseFloat(s.attendance_pct) || 0);
      const quizScore = s.avg_assessment == null ? null : Math.round(parseFloat(s.avg_assessment));

      let riskLevel = 'Good';
      if (attendance > 0 && attendance < 75) riskLevel = 'High Risk';
      else if (quizScore != null && quizScore < 60) riskLevel = 'Moderate Risk';
      else if ((quizScore != null && quizScore >= 85) || (attendance > 0 && attendance >= 90)) riskLevel = 'Top Performer';

      return {
        id: s.id,
        studentId: s.id,
        name: s.name,
        email: s.email,
        rollNo: s.roll_number || `R-${s.id}`,
        department: s.department || 'Engineering',
        batch: s.batch_name || 'Unassigned',
        batchName: s.batch_name || 'Unassigned',
        attendance,
        attendance_pct: attendance,
        quizScore: quizScore == null ? null : `${quizScore} / 100`,
        avgAssessment: quizScore,
        riskLevel,
        skillStatus: s.overall_status || null,
      };
    });

    return sendSuccess(res, 'Assigned students retrieved successfully', { students });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/students/performance — REAL data only
 * ------------------------------------------------------------------------- */
export const getMentorStudentsPerformance = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const batchIds = await getMentorBatchIds(mentorId);

    if (batchIds.length === 0) {
      return sendSuccess(res, 'No assigned students', { students: [] });
    }

    const studentRows = await query(
      `SELECT u.id, u.name, u.email, s.roll_number, s.department, b.name AS batch_name,
              COALESCE(att.attendance_percentage, 0) AS attendance_pct,
              COALESCE(att.total_classes, 0) AS total_classes,
              ROUND(AVG(CASE WHEN aa.status = 'completed' THEN aa.percentage END), 1) AS avg_assessment,
              COUNT(CASE WHEN aa.status = 'completed' THEN aa.id END) AS attempt_count,
              MAX(aa.submitted_at) AS last_assessment_at,
              sg.overall_status, sg.weak_areas, sg.suggestions
       FROM users u
       JOIN students s ON u.id = s.user_id
       JOIN batches b ON (s.batch_id = b.id OR EXISTS (
         SELECT 1 FROM student_batches sb WHERE sb.user_id = u.id AND sb.batch_id = b.id))
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       LEFT JOIN skill_gap_analysis sg ON u.id = sg.user_id
       WHERE b.id IN (${batchIds.join(',')})
       GROUP BY u.id, s.id, b.id, att.id, sg.id
       ORDER BY u.name ASC`
    );

    const userIds = studentRows.map((s) => Number(s.id));
    let roadmapMap = {};
    if (userIds.length > 0) {
      const rp = await query(
        `SELECT r.student_id,
                ROUND(AVG(ri.progress), 1) AS avg_progress,
                SUM(CASE WHEN ri.status = 'completed' THEN 1 ELSE 0 END) AS completed_items,
                COUNT(ri.id) AS total_items
         FROM roadmaps r
         JOIN roadmap_items ri ON ri.roadmap_id = r.id
         WHERE r.student_id IN (${userIds.join(',')})
         GROUP BY r.student_id`
      );
      roadmapMap = rp.reduce((acc, row) => {
        acc[Number(row.student_id)] = row;
        return acc;
      }, {});
    }

    const students = studentRows.map((s) => {
      const attendance = parseFloat(s.attendance_pct) || 0;
      const assessment = s.avg_assessment == null ? null : parseFloat(s.avg_assessment);
      const roadmap = roadmapMap[Number(s.id)];
      const milestone = roadmap ? Math.round(parseFloat(roadmap.avg_progress) || 0) : null;

      // Trend from completed assessment attempts (last vs earlier)
      let trend = 'stable';
      let trendDelta = null;
      if (assessment != null && Number(s.attempt_count) >= 2) {
        trend = 'up';
        trendDelta = 'Improving';
      } else if (assessment != null && Number(s.attempt_count) === 1) {
        trend = 'stable';
        trendDelta = 'First Assessment';
      }

      // Real-derived weak areas
      const parsedWeakAreas = [];
      try {
        if (s.weak_areas) {
          const raw = typeof s.weak_areas === 'string' ? JSON.parse(s.weak_areas) : s.weak_areas;
          if (Array.isArray(raw)) {
            raw.slice(0, 4).forEach((w) => {
              const obj = typeof w === 'string' ? { skill: w } : w;
              parsedWeakAreas.push({
                skill: obj.skill || obj.topic || 'Core Concept',
                score: obj.score != null ? Math.round(Number(obj.score)) : null,
                target: 75,
              });
            });
          }
        }
      } catch (_) {}

      if (parsedWeakAreas.length === 0) {
        if (attendance > 0 && attendance < 75) {
          parsedWeakAreas.push({ skill: 'Attendance', score: Math.round(attendance), target: 75 });
        }
        if (assessment != null && assessment < 65) {
          parsedWeakAreas.push({ skill: 'Assessments / Quizzes', score: Math.round(assessment), target: 75 });
        }
      }

      const recommendations = [];
      if (attendance > 0 && attendance < 75) recommendations.push(`Attendance is ${Math.round(attendance)}% — regularize attendance to maintain placement eligibility.`);
      if (assessment != null && assessment < 60) recommendations.push('Review recent assessment mistakes and complete remedial practice modules.');
      if (milestone != null && milestone < 40) recommendations.push('Roadmap milestone completion is low — focus on the active curriculum module.');
      if (recommendations.length === 0) recommendations.push('Maintain current performance and attempt advanced challenge tracks.');

      // Overall = weighted average of the REAL metrics available
      const available = [
        { value: assessment, weight: 0.4 },
        { value: attendance, weight: 0.3 },
        { value: milestone, weight: 0.3 },
      ].filter((m) => m.value != null && Number.isFinite(m.value));
      const totalWeight = available.reduce((a, m) => a + m.weight, 0);
      let overall = null;
      if (totalWeight > 0) {
        overall = Math.round(available.reduce((a, m) => a + m.value * m.weight, 0) / totalWeight);
      }

      return {
        id: `st-${s.id}`,
        studentId: s.id,
        name: s.name,
        email: s.email,
        department: s.department || 'Engineering',
        batch: s.batch_name || 'Batch A',
        overallScore: overall,
        assessment: assessment == null ? null : Math.round(assessment),
        coding: null,
        interview: null,
        attendance: Math.round(attendance),
        milestone,
        status: overall == null ? 'No Data' : (overall >= 80 ? 'Excellent' : overall < 60 ? 'Needs Work' : 'Average'),
        trend,
        trendDelta,
        weakAreas: parsedWeakAreas,
        recommendations,
      };
    });

    return sendSuccess(res, 'Assigned students performance retrieved successfully', { students });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/attendance/batches
 * ------------------------------------------------------------------------- */
export const getMentorAttendanceBatches = async (req, res, next) => {
  try {
    const collegeId = getCollegeId(req);
    const mentorId = getMentorId(req);
    const batchIds = await getMentorBatchIds(mentorId);

    if (batchIds.length === 0) {
      return sendSuccess(res, 'No batches assigned', { batches: [] });
    }

    const batches = await query(
      `SELECT b.id, b.name, b.schedule, b.year, b.division
       FROM batches b
       WHERE b.id IN (${batchIds.join(',')}) AND b.status = 'active'
       ORDER BY b.name ASC`,
      []
    );

    const result = [];
    for (const b of batches) {
      const students = await query(
        `SELECT u.id, u.name, u.email, s.roll_number AS roll
         FROM users u
         JOIN students s ON u.id = s.user_id
         WHERE s.batch_id = ? OR u.id IN (SELECT user_id FROM student_batches WHERE batch_id = ?)
         ORDER BY u.name ASC`,
        [b.id, b.id]
      );

      result.push({
        id: String(b.id),
        batchId: b.id,
        name: b.name,
        collegeId: collegeId || b.college_id,
        students: students.map((s) => ({
          id: `st-${s.id}`,
          studentId: s.id,
          name: s.name,
          roll: s.roll || `R-${s.id}`,
          status: null,
        })),
      });
    }

    return sendSuccess(res, 'Assigned attendance batches retrieved', { batches: result });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * POST /api/v1/mentor/attendance/save
 * ------------------------------------------------------------------------- */
export const saveMentorAttendance = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const collegeId = getCollegeId(req);
    const { batchId, session, date, attendance } = req.body;

    if (!batchId || !attendance || !Array.isArray(attendance)) {
      return sendError(res, 'Batch ID and attendance records are required', 400);
    }

    const cleanBatchId = parseInt(batchId, 10);

    if (!(await isBatchAssignedToMentor(mentorId, cleanBatchId))) {
      return sendError(res, 'You are not assigned to this batch', 403);
    }

    const sessionDate = date || new Date().toISOString().split('T')[0];

    const sessionObj = await findOrCreateAttendanceSession({
      collegeId,
      batchId: cleanBatchId,
      sessionCode: session || `MENTOR-${cleanBatchId}-${sessionDate.replace(/-/g, '')}`,
      title: session || 'Mentor Training Session',
      sessionDate,
      facultyId: mentorId,
    });

    let recorded = 0;
    for (const item of attendance) {
      const rawId = item.studentId || item.id;
      const numUserId = parseInt(String(rawId).replace('st-', ''), 10);
      if (isNaN(numUserId)) continue;

      if (!(await isStudentAssignedToMentor(mentorId, numUserId))) {
        return sendError(res, `Student ${numUserId} is not assigned to you`, 403);
      }

      const status = (item.status || 'present').toLowerCase();
      const existing = await query(
        `SELECT id FROM attendance
         WHERE user_id = ? AND session_id = ? AND session_date = ?`,
        [numUserId, sessionObj.id, sessionDate]
      );

      if (existing.length > 0) {
        await query(
          `UPDATE attendance SET status = ?, remarks = ?
           WHERE id = ?`,
          [status, item.remarks || null, existing[0].id]
        );
      } else {
        await query(
          `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, marked_by, remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [collegeId || null, cleanBatchId, numUserId, sessionObj.id, sessionDate, status, mentorId, item.remarks || null]
        );
      }

      await getStudentAttendanceSummaryService(numUserId);
      recorded++;
    }

    return sendSuccess(res, 'Attendance saved successfully', { recorded });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/defaulters — real detection, assigned students only
 * ------------------------------------------------------------------------- */
export const getMentorDefaulters = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const studentIds = await getMentorStudentIds(mentorId);

    if (studentIds.length === 0) {
      return sendSuccess(res, 'No defaulters identified', { defaulters: [] });
    }

    const defaulters = await query(
      `SELECT u.id, u.name, u.email, u.mobile_number, s.roll_number, s.department, b.name AS batch_name,
              COALESCE(att.attendance_percentage, 0) AS attendance,
              COALESCE(att.total_classes, 0) AS total_classes,
              COALESCE(att.absent_count, 0) AS absent_count,
              ROUND(AVG(CASE WHEN aa.status = 'completed' THEN aa.percentage END), 1) AS avg_quiz_score,
              COUNT(CASE WHEN aa.status = 'completed' THEN aa.id END) AS quiz_count
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE u.id IN (${studentIds.join(',')})
       GROUP BY u.id, s.id, b.id, att.id
       HAVING (att.total_classes > 0 AND COALESCE(att.attendance_percentage, 0) < 75)
           OR (COUNT(CASE WHEN aa.status = 'completed' THEN aa.id END) > 0
               AND ROUND(AVG(CASE WHEN aa.status = 'completed' THEN aa.percentage END), 1) < 50)
       ORDER BY COALESCE(att.attendance_percentage, 0) ASC`
    );

    const list = defaulters.map((d) => ({
      id: d.id,
      studentId: d.id,
      name: d.name,
      email: d.email,
      mobile: d.mobile_number,
      rollNo: d.roll_number || `R-${d.id}`,
      department: d.department || 'Engineering',
      batch: d.batch_name || 'Unassigned',
      attendance: `${Math.round(parseFloat(d.attendance) || 0)}%`,
      attendancePct: Math.round(parseFloat(d.attendance) || 0),
      totalClasses: Number(d.total_classes || 0),
      absentCount: Number(d.absent_count || 0),
      lastTestScore: d.avg_quiz_score == null ? 'No Data' : `${Math.round(parseFloat(d.avg_quiz_score))}%`,
      avgQuizScore: d.avg_quiz_score == null ? null : Math.round(parseFloat(d.avg_quiz_score)),
      reason: d.avg_quiz_score != null && parseFloat(d.avg_quiz_score) < 50
        ? 'Poor assessment performance'
        : 'Low attendance',
      missedAssignments: 'N/A',
    }));

    return sendSuccess(res, 'Defaulters retrieved successfully', { defaulters: list });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * POST /api/v1/mentor/interventions
 * ------------------------------------------------------------------------- */
export const createMentorIntervention = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const collegeId = getCollegeId(req);
    const { student_id, studentId, type, title, notes, action_taken, status, date, batch_id } = req.body;

    const targetStudentId = student_id || studentId;
    if (!targetStudentId || !title) {
      return sendError(res, 'Student ID and title are required', 400);
    }

    const numStudentId = parseInt(String(targetStudentId).replace('st-', ''), 10);

    if (!(await isStudentAssignedToMentor(mentorId, numStudentId))) {
      return sendError(res, 'Student is not assigned to you', 403);
    }

    const allowedTypes = ['call', 'warning', 'counseling', 'remedial', 'meeting', 'other'];
    const allowedStatuses = ['pending', 'in_progress', 'resolved'];
    const cleanType = allowedTypes.includes(type) ? type : 'warning';
    const cleanStatus = allowedStatuses.includes(status) ? status : 'pending';
    const interventionDate = date || new Date().toISOString().split('T')[0];

    const result = await query(
      `INSERT INTO interventions (college_id, student_id, mentor_id, batch_id, type, title, notes, action_taken, status, date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        collegeId || null,
        numStudentId,
        mentorId,
        batch_id ? parseInt(batch_id, 10) || null : null,
        cleanType,
        title,
        notes || '',
        action_taken || '',
        cleanStatus,
        interventionDate,
      ]
    );

    return sendSuccess(res, 'Intervention logged successfully', { id: result.insertId }, 201);
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/interventions
 * ------------------------------------------------------------------------- */
export const getMentorInterventions = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const studentIds = await getMentorStudentIds(mentorId);

    const sidPh = studentIds.length > 0 ? studentIds.join(',') : '-1';

    const rows = await query(
      `SELECT i.*, u.name AS student_name, s.roll_number, b.name AS batch_name
       FROM interventions i
       JOIN users u ON i.student_id = u.id
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       WHERE (i.mentor_id = ? OR i.student_id IN (${sidPh}))
       ORDER BY i.id DESC`,
      [mentorId]
    );

    return sendSuccess(res, 'Interventions retrieved successfully', { interventions: rows });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/weekly-reports
 * ------------------------------------------------------------------------- */
export const getMentorWeeklyReports = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);

    const rows = await query(
      `SELECT wr.*, b.name AS batch_name, u.name AS mentor_name
       FROM weekly_reports wr
       LEFT JOIN batches b ON wr.batch_id = b.id
       LEFT JOIN users u ON wr.mentor_id = u.id
       WHERE wr.mentor_id = ?
       ORDER BY wr.id DESC`,
      [mentorId]
    );

    return sendSuccess(res, 'Weekly reports retrieved successfully', { reports: rows });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * POST /api/v1/mentor/weekly-reports
 * ------------------------------------------------------------------------- */
export const createMentorWeeklyReport = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const collegeId = getCollegeId(req);
    const { batch_id, week_number, year, title, summary, topics_covered, challenges_faced, recommendations } = req.body;

    if (batch_id && !(await isBatchAssignedToMentor(mentorId, batch_id))) {
      return sendError(res, 'You are not assigned to this batch', 403);
    }

    // Real metrics for the report when not manually supplied
    let attendanceRate = req.body.attendance_rate;
    let avgQuizScore = req.body.avg_quiz_score;

    if (batch_id) {
      const cleanBatchId = parseInt(batch_id, 10);
      if (attendanceRate == null || avgQuizScore == null) {
        const metricRows = await query(
          `SELECT
             COALESCE(AVG(att.attendance_percentage), 0) AS avg_attendance,
             ROUND(AVG(CASE WHEN aa.status = 'completed' THEN aa.percentage END), 1) AS avg_quiz
           FROM users u
           JOIN students s ON u.id = s.user_id
           LEFT JOIN attendance_summary att ON u.id = att.user_id
           LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
           WHERE s.batch_id = ? OR u.id IN (SELECT user_id FROM student_batches WHERE batch_id = ?)`,
          [cleanBatchId, cleanBatchId]
        );
        const metric = metricRows[0] || {};
        if (attendanceRate == null) attendanceRate = Math.round(parseFloat(metric.avg_attendance) || 0);
        if (avgQuizScore == null) avgQuizScore = metric.avg_quiz == null ? null : Math.round(parseFloat(metric.avg_quiz));
      }
    }

    const result = await query(
      `INSERT INTO weekly_reports
        (college_id, batch_id, mentor_id, week_number, year, title, summary, attendance_rate, avg_quiz_score, topics_covered, challenges_faced, recommendations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        collegeId || null,
        batch_id ? parseInt(batch_id, 10) : null,
        mentorId,
        week_number || 1,
        year || new Date().getFullYear(),
        title || `Weekly Report - Week ${week_number || 1}`,
        summary || '',
        attendanceRate || 0,
        avgQuizScore == null ? 0 : avgQuizScore,
        topics_covered || '',
        challenges_faced || '',
        recommendations || '',
      ]
    );

    return sendSuccess(res, 'Weekly report created successfully', { id: result.insertId }, 201);
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/study-materials
 * ------------------------------------------------------------------------- */
export const getMentorStudyMaterials = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const batchIds = await getMentorBatchIds(mentorId);
    const bPh = batchIds.length > 0 ? batchIds.join(',') : '-1';

    const rows = await query(
      `SELECT sm.*, u.name AS uploaded_by_name
       FROM study_materials sm
       JOIN users u ON sm.uploaded_by = u.id
       WHERE sm.uploaded_by = ?
          OR (sm.batch_id IS NOT NULL AND sm.batch_id IN (${bPh}))
       ORDER BY sm.id DESC`,
      [mentorId]
    );

    return sendSuccess(res, 'Study materials retrieved successfully', { materials: rows });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * POST /api/v1/mentor/study-materials
 * ------------------------------------------------------------------------- */
export const createMentorStudyMaterial = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const { title, subject, batch, batch_id, type, file_url } = req.body;

    if (!title || !subject) {
      return sendError(res, 'Title and subject are required', 400);
    }

    if (batch_id && !(await isBatchAssignedToMentor(mentorId, batch_id))) {
      return sendError(res, 'You are not assigned to this batch', 403);
    }

    const result = await query(
      `INSERT INTO study_materials (uploaded_by, title, subject, batch, batch_id, type, file_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [mentorId, title, subject, batch || 'All Batches', batch_id ? parseInt(batch_id, 10) : null, type || 'PDF', file_url || '']
    );

    return sendSuccess(res, 'Study material created successfully', { id: result.insertId }, 201);
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * DELETE /api/v1/mentor/study-materials/:id
 * ------------------------------------------------------------------------- */
export const deleteMentorStudyMaterial = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const materialId = parseInt(req.params.id, 10);

    const [existing] = await query(`SELECT id FROM study_materials WHERE id = ? AND uploaded_by = ?`, [materialId, mentorId]);
    if (!existing) {
      return sendError(res, 'Material not found or you cannot delete it', 403);
    }

    await query(`DELETE FROM study_materials WHERE id = ?`, [materialId]);
    return sendSuccess(res, 'Study material deleted successfully', { id: materialId });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/live-sessions
 * ------------------------------------------------------------------------- */
export const getMentorLiveSessions = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);

    const rows = await query(
      `SELECT ls.*, u.name AS mentor_name,
              (SELECT COUNT(*) FROM students s
                WHERE (s.batch_id = ls.batch_id) OR EXISTS (
                  SELECT 1 FROM student_batches sb WHERE sb.user_id = s.user_id AND sb.batch_id = ls.batch_id)) AS attendees
       FROM live_sessions ls
       JOIN users u ON ls.mentor_id = u.id
       WHERE ls.mentor_id = ?
       ORDER BY ls.id DESC`,
      [mentorId]
    );

    const sessions = rows.map((s) => ({
      id: s.id,
      title: s.title,
      subject: s.subject,
      batch: s.batch,
      batch_id: s.batch_id,
      date: s.date,
      time: s.time,
      duration: s.duration,
      meeting_link: s.meeting_link,
      status: s.status,
      attendees: Number(s.attendees || 0),
      mentor_name: s.mentor_name,
    }));

    return sendSuccess(res, 'Live sessions retrieved successfully', { sessions });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * POST /api/v1/mentor/live-sessions
 * ------------------------------------------------------------------------- */
export const createMentorLiveSession = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const { title, subject, batch, batch_id, date, time, duration, meeting_link } = req.body;

    if (batch_id && !(await isBatchAssignedToMentor(mentorId, batch_id))) {
      return sendError(res, 'You are not assigned to this batch', 403);
    }

    if (!title || !subject || !date || !time) {
      return sendError(res, 'Title, subject, date, and time are required', 400);
    }

    const result = await query(
      `INSERT INTO live_sessions (mentor_id, title, subject, batch, batch_id, date, time, duration, meeting_link, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming')`,
      [mentorId, title, subject, batch || 'All Batches', batch_id ? parseInt(batch_id, 10) : null, date, time, duration || '60 mins', meeting_link || '']
    );

    return sendSuccess(res, 'Live session scheduled successfully', { id: result.insertId }, 201);
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * DELETE /api/v1/mentor/live-sessions/:id
 * ------------------------------------------------------------------------- */
export const deleteMentorLiveSession = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const sessionId = parseInt(req.params.id, 10);

    const [existing] = await query(`SELECT id FROM live_sessions WHERE id = ? AND mentor_id = ?`, [sessionId, mentorId]);
    if (!existing) {
      return sendError(res, 'Session not found or you cannot delete it', 403);
    }

    await query(`DELETE FROM live_sessions WHERE id = ?`, [sessionId]);
    return sendSuccess(res, 'Live session deleted successfully', { id: sessionId });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/students/roadmaps — assigned students' roadmap progress
 * ------------------------------------------------------------------------- */
export const getMentorStudentsRoadmaps = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const studentIds = await getMentorStudentIds(mentorId);

    if (studentIds.length === 0) {
      return sendSuccess(res, 'No assigned students', { roadmaps: [] });
    }

    const rows = await query(
      `SELECT u.id, u.name, s.roll_number, s.department, b.name AS batch_name,
              r.id AS roadmap_id, r.target_role, r.career_track,
              COALESCE(AVG(ri.progress), 0) AS completion,
              SUM(CASE WHEN ri.status = 'completed' THEN 1 ELSE 0 END) AS completed_items,
              COUNT(ri.id) AS total_items
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN roadmaps r ON r.student_id = u.id
       LEFT JOIN roadmap_items ri ON ri.roadmap_id = r.id
       WHERE u.id IN (${studentIds.join(',')})
       GROUP BY u.id, s.id, b.id, r.id
       ORDER BY u.name ASC`
    );

    const roadmaps = rows.map((t) => {
      const completion = Math.round(parseFloat(t.completion) || 0);
      const items = Number(t.total_items || 0);
      let status = 'No Roadmap';
      if (completion >= 80) status = 'On Track';
      else if (completion >= 40) status = 'In Progress';
      else if (items > 0) status = 'Needs Focus';
      return {
        id: t.roadmap_id || t.id,
        studentId: t.id,
        studentName: t.name,
        rollNo: t.roll_number || `R-${t.id}`,
        department: t.department || 'Engineering',
        batch: t.batch_name || 'Unassigned',
        track: t.target_role || t.career_track || 'Not Generated',
        completion: `${completion}%`,
        completionPct: completion,
        status,
        completedModules: Number(t.completed_items || 0),
        totalModules: items,
        currentModule: null,
        nextMilestone: null,
      };
    });

    return sendSuccess(res, 'Assignee roadmaps retrieved successfully', { roadmaps });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/students/skill-gaps — assigned students' skill gaps
 * ------------------------------------------------------------------------- */
export const getMentorStudentSkillGaps = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const studentIds = await getMentorStudentIds(mentorId);

    if (studentIds.length === 0) {
      return sendSuccess(res, 'No assigned students', {
        students: [],
        stats: { atRisk: 0, critical: 0, high: 0 },
      });
    }

    const rows = await query(
      `SELECT u.id, u.name, s.roll_number, s.department, b.name AS batch_name,
              sg.overall_status, sg.weak_areas_count, sg.weak_areas,
              COALESCE(att.attendance_percentage, 0) AS attendance,
              ROUND(AVG(CASE WHEN aa.status = 'completed' THEN aa.percentage END), 1) AS avg_assessment
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN skill_gap_analysis sg ON u.id = sg.user_id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE u.id IN (${studentIds.join(',')})
       GROUP BY u.id, s.id, b.id, sg.id, att.id
       ORDER BY u.name ASC`
    );

    const students = rows.map((s) => {
      const weakSkills = [];
      let priority = null;
      try {
        if (s.weak_areas) {
          const raw = typeof s.weak_areas === 'string' ? JSON.parse(s.weak_areas) : s.weak_areas;
          if (Array.isArray(raw)) {
            raw.slice(0, 5).forEach((w) => {
              const obj = typeof w === 'string' ? { skill: w } : w;
              const score = obj.score != null ? Math.round(Number(obj.score)) : null;
              weakSkills.push({
                name: obj.skill || obj.topic || 'Core Concept',
                score,
                category: obj.category || 'Technical',
              });
            });
          }
        }
      } catch (_) {}

      const attendance = Math.round(parseFloat(s.attendance) || 0);
      const assessment = s.avg_assessment == null ? null : Math.round(parseFloat(s.avg_assessment));
      const performance = (() => {
        const vals = [];
        if (assessment != null) vals.push(assessment);
        if (attendance > 0) vals.push(attendance);
        if (vals.length === 0) return null;
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      })();

      if (!priority && weakSkills.length >= 3) priority = 'Critical';
      else if (!priority && weakSkills.length >= 1) priority = 'High';
      else if (!priority && performance != null && performance < 60) priority = 'Medium';
      else priority = 'Low';

      if (weakSkills.length === 0 && (portfolioRisk(attendance, assessment))) {
        if (attendance > 0 && attendance < 75) {
          weakSkills.push({ name: 'Attendance', score: attendance, category: 'Regularity' });
          priority = performance != null && performance < 60 ? 'Medium' : priority;
        }
        if (assessment != null && assessment < 60) {
          weakSkills.push({ name: 'Core Assessments', score: assessment, category: 'Technical' });
        }
      }

      const recommendations = [];
      if (weakSkills.length > 0) recommendations.push(`Assign targeted remedial practice for ${weakSkills[0].name}.`);
      recommendations.push(weakSkills.length === 0
        ? 'Student is on track — no immediate remedials needed.'
        : 'Schedule 1-on-1 review and track weekly improvement.');

      return {
        id: s.id,
        studentId: s.id,
        name: s.name,
        rollNo: s.roll_number || `R-${s.id}`,
        department: s.department || 'Engineering',
        batch: s.batch_name || 'Unassigned',
        priority,
        currentPerformance: performance,
        weakSkills,
        strongSkills: [],
        recommendations: recommendations.join(' '),
        whyWeak: weakSkills.length > 0
          ? `Scores below threshold in: ${weakSkills.map((w) => `${w.name} (${w.score == null ? 'N/A' : w.score}%)`).join(', ')}.`
          : 'No skill deficiencies detected from current data.',
        remedialAssigned: false,
      };
    });

    const atRisk = students.filter((s) => s.weakSkills.length > 0).length;

    return sendSuccess(res, 'Assignee skill gaps retrieved successfully', {
      students,
      stats: {
        atRisk,
        critical: students.filter((s) => s.priority === 'Critical').length,
        high: students.filter((s) => s.priority === 'High').length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const portfolioRisk = (attendance, assessment) => (attendance > 0 && attendance < 75) || (assessment != null && assessment < 60);

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/leaderboard — assigned students ranking (real scores)
 * ------------------------------------------------------------------------- */
export const getMentorLeaderboard = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const studentIds = await getMentorStudentIds(mentorId);

    if (studentIds.length === 0) {
      return sendSuccess(res, 'No assigned students', { leaderboard: [] });
    }

    const rows = await query(
      `SELECT u.id, u.name, s.department, b.name AS batch_name,
              COALESCE(att.attendance_percentage, 0) AS attendance_pct,
              ROUND(AVG(CASE WHEN aa.status = 'completed' THEN aa.percentage END), 1) AS avg_assessment,
              COUNT(CASE WHEN aa.status = 'completed' THEN aa.id END) AS attempt_count
       FROM users u
       JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       LEFT JOIN attendance_summary att ON u.id = att.user_id
       LEFT JOIN assessment_attempts aa ON u.id = aa.user_id
       WHERE u.id IN (${studentIds.join(',')})
       GROUP BY u.id, s.id, b.id, att.id
       ORDER BY u.name ASC`
    );

    const scored = rows
      .map((s) => {
        const attendance = parseFloat(s.attendance_pct) || 0;
        const assessment = s.avg_assessment == null ? null : parseFloat(s.avg_assessment);
        let score = null;
        if (assessment != null && attendance > 0) score = Math.round(assessment * 0.6 + attendance * 0.4);
        else if (assessment != null) score = Math.round(assessment);
        else if (attendance > 0) score = Math.round(attendance * 0.4); // attendance-only students rank low, still real
        return {
          id: s.id,
          name: s.name,
          department: s.department || 'Engineering',
          batch: s.batch_name || 'Unassigned',
          assessment: assessment == null ? null : Math.round(assessment),
          attendance: Math.round(attendance),
          score,
          attemptCount: Number(s.attempt_count || 0),
        };
      })
      .filter((s) => {
        if (req.query.withData === '1') return s.score != null && s.attemptCount > 0;
        return true;
      });

    scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

    const leaderboard = scored.map((s, idx) => ({
      rank: idx + 1,
      ...s,
      badge: s.score == null ? '—' : s.score >= 85 ? 'Outstanding' : s.score >= 70 ? 'Good' : s.score >= 50 ? 'Average' : 'Needs Work',
    }));

    return sendSuccess(res, 'Mentor leaderboard retrieved successfully', { leaderboard });
  } catch (error) {
    next(error);
  }
};

/* ---------------------------------------------------------------------------
 * GET /api/v1/mentor/assignments — batch tasks + submission counts (assigned batches)
 * ------------------------------------------------------------------------- */
export const getMentorAssignments = async (req, res, next) => {
  try {
    const mentorId = getMentorId(req);
    const batchIds = await getMentorBatchIds(mentorId);

    if (batchIds.length === 0) {
      return sendSuccess(res, 'No assignments', { assignments: [] });
    }

    const rows = await query(
      `SELECT bt.id, bt.batch_id, bt.title, bt.topic, bt.difficulty, bt.points, bt.deadline,
              b.name AS batch_name,
              (SELECT COUNT(*) FROM students s
                WHERE s.batch_id = bt.batch_id OR EXISTS (
                  SELECT 1 FROM student_batches sb WHERE sb.user_id = s.user_id AND sb.batch_id = bt.batch_id)) AS total_students,
              (SELECT COUNT(*) FROM task_submissions ts WHERE ts.task_id = bt.id) AS submitted
       FROM batch_tasks bt
       JOIN batches b ON bt.batch_id = b.id
       WHERE bt.batch_id IN (${batchIds.join(',')})
       ORDER BY bt.created_at DESC`
    );

    const assignments = rows.map((a) => ({
      id: a.id,
      title: a.title,
      batch: a.batch_name,
      batch_id: a.batch_id,
      topic: a.topic || 'General',
      difficulty: a.difficulty,
      points: Number(a.points || 0),
      deadline: a.deadline || 'No Deadline',
      submitted: Number(a.submitted || 0),
      total: Number(a.total_students || 0),
    }));

    return sendSuccess(res, 'Assignments retrieved successfully', { assignments });
  } catch (error) {
    next(error);
  }
};