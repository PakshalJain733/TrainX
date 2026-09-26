import { sendSuccess, sendError } from '../utils/response.js';
import { query, pool } from '../config/db.js';
import { tableAvailabilityMap, inPlaceholders } from '../utils/tableAvailability.js';
import { DEFAULTER_THRESHOLDS } from '../services/intervention.service.js';
import { uploadFileToS3 } from '../utils/s3Upload.js';
import { ROLES } from '../utils/constants.js';
import { createSharedContent, deleteSharedContent } from '../models/sharedContent.model.js';
import { getBroadcastsModel } from '../models/broadcast.model.js';

const ATTENDANCE_THRESHOLD = DEFAULTER_THRESHOLDS.ATTENDANCE_THRESHOLD;
const PERFORMANCE_THRESHOLD = DEFAULTER_THRESHOLDS.PERFORMANCE_THRESHOLD;

const SCORE_WEIGHTS = { assessment: 0.3, coding: 0.3, interview: 0.25, attendance: 0.15 };

const toInt = (v) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

const round1 = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
};

const average = (values = []) => {
  const usable = values.filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (usable.length === 0) return null;
  return round1(usable.reduce((acc, v) => acc + v, 0) / usable.length);
};

const getMentorId = (req) => toInt(req.user?.userId || req.user?.id);
const getCollegeId = (req) => toInt(req.user?.collegeId || req.user?.college_id);

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

/** Frontend batch ids are stringified as `b-<id>`; accept both shapes. */
const parseBatchId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/^b-/i, '').trim();
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseUserId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/^u-/i, '').trim();
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStatus = (value) => {
  const key = String(value || '').trim().toLowerCase();
  if (key === 'present' || key === 'p') return 'present';
  if (key === 'absent' || key === 'a') return 'absent';
  if (key === 'late' || key === 'l') return 'late';
  if (key === 'excused') return 'excused';
  return null;
};

/**
 * Every student returned by the mentor API is resolved from
 * `mentor_student_assignments` for the authenticated mentor only.
 */
const loadMentorStudents = async (mentorId) => {
  const rows = await query(
    `SELECT
       u.id AS user_id,
       u.name,
       u.email,
       u.mobile_number,
       s.roll_number,
       s.year,
       s.division,
       s.semester,
       COALESCE(d.name, s.department) AS department,
       s.department_id,
       b.id AS batch_id,
       b.name AS batch_name,
       COALESCE(s.college_id, u.college_id) AS college_id,
       c.name AS college_name
     FROM mentor_student_assignments msa
     JOIN users u ON u.id = msa.student_id
     LEFT JOIN students s ON s.user_id = u.id
     LEFT JOIN departments d ON d.id = s.department_id
     LEFT JOIN batches b ON b.id = COALESCE(msa.batch_id, s.batch_id)
     LEFT JOIN colleges c ON c.id = COALESCE(s.college_id, u.college_id)
     WHERE msa.mentor_id = ?
     ORDER BY b.name ASC, u.name ASC`,
    [mentorId]
  );
  return rows || [];
};

/**
 * Real per-student metrics. Optional analytics tables are only queried when they
 * actually exist; every other database error is propagated.
 */
const loadMentorMetrics = async (userIds = []) => {
  const metrics = { attendance: new Map(), summary: new Map(), assessment: new Map(), coding: new Map(), interview: new Map(), weekly: new Map() };
  if (userIds.length === 0) return metrics;

  const availability = await tableAvailabilityMap([
    'attendance',
    'attendance_summary',
    'assessment_attempts',
    'coding_submissions',
    'interview_sessions',
    'weekly_reports',
  ]);
  const placeholders = inPlaceholders(userIds);

  const jobs = [];

  if (availability.attendance) {
    jobs.push(
      query(
        `SELECT user_id,
                COUNT(*) AS total_sessions,
                SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END) AS present_count,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_count
           FROM attendance
          WHERE user_id IN (${placeholders})
          GROUP BY user_id`,
        userIds
      ).then((rows) => {
        (rows || []).forEach((r) => metrics.attendance.set(Number(r.user_id), r));
      })
    );
  }

  if (availability.attendance_summary) {
    jobs.push(
      query(
        `SELECT user_id, total_classes, present_count, absent_count, attendance_percentage, attendance_status
           FROM attendance_summary
          WHERE user_id IN (${placeholders})`,
        userIds
      ).then((rows) => {
        (rows || []).forEach((r) => metrics.summary.set(Number(r.user_id), r));
      })
    );
  }

  if (availability.assessment_attempts) {
    jobs.push(
      query(
        `SELECT user_id, ROUND(AVG(percentage), 1) AS avg_percentage, COUNT(*) AS attempts
           FROM assessment_attempts
          WHERE user_id IN (${placeholders})
            AND status = 'completed'
          GROUP BY user_id`,
        userIds
      ).then((rows) => {
        (rows || []).forEach((r) => metrics.assessment.set(Number(r.user_id), r));
      })
    );
  }

  if (availability.coding_submissions) {
    jobs.push(
      query(
        `SELECT student_id,
                ROUND(AVG(percentage), 1) AS avg_percentage,
                COUNT(*) AS submissions,
                COUNT(DISTINCT problem_id) AS problems_attempted,
                COUNT(DISTINCT CASE WHEN status IN ('passed', 'accepted') THEN problem_id END) AS solved,
                COALESCE(SUM(marks), 0) AS total_marks
           FROM coding_submissions
          WHERE student_id IN (${placeholders})
          GROUP BY student_id`,
        userIds
      ).then((rows) => {
        (rows || []).forEach((r) => metrics.coding.set(Number(r.student_id), r));
      })
    );
  }

  if (availability.interview_sessions) {
    jobs.push(
      query(
        `SELECT user_id, ROUND(AVG(overall_score), 1) AS avg_score, COUNT(*) AS sessions
           FROM interview_sessions
          WHERE user_id IN (${placeholders})
          GROUP BY user_id`,
        userIds
      ).then((rows) => {
        (rows || []).forEach((r) => metrics.interview.set(Number(r.user_id), r));
      })
    );
  }

  if (availability.weekly_reports) {
    jobs.push(
      query(
        `SELECT id, student_id, user_id, week_label, overall_score, attendance_score, generated_at, created_at
           FROM weekly_reports
          WHERE user_id IN (${placeholders})
          ORDER BY id DESC
          LIMIT 1000`,
        userIds
      ).then((rows) => {
        (rows || []).forEach((r) => {
          const key = Number(r.student_id || r.user_id);
          if (!metrics.weekly.has(key)) metrics.weekly.set(key, []);
          metrics.weekly.get(key).push(r);
        });
      })
    );
  }

  await Promise.all(jobs);
  return metrics;
};

const resolveAttendance = (userId, metrics) => {
  const raw = metrics.attendance.get(userId);
  if (raw) {
    const total = toInt(raw.total_sessions) || 0;
    const present = toInt(raw.present_count) || 0;
    if (total > 0) {
      return {
        percentage: round1((present / total) * 100),
        totalSessions: total,
        present,
        absent: toInt(raw.absent_count) || 0,
        source: 'attendance',
      };
    }
    return { percentage: null, totalSessions: 0, present: 0, absent: 0, source: 'attendance' };
  }

  const summary = metrics.summary.get(userId);
  if (summary) {
    const total = toInt(summary.total_classes) || 0;
    return {
      percentage: total > 0 ? round1(summary.attendance_percentage) : null,
      totalSessions: total,
      present: toInt(summary.present_count) || 0,
      absent: toInt(summary.absent_count) || 0,
      source: 'attendance_summary',
    };
  }

  return { percentage: null, totalSessions: 0, present: 0, absent: 0, source: null };
};

const resolveOverallScore = (components) => {
  let weighted = 0;
  let weightTotal = 0;
  Object.entries(SCORE_WEIGHTS).forEach(([key, weight]) => {
    const value = components[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      weighted += value * weight;
      weightTotal += weight;
    }
  });
  if (weightTotal === 0) return null;
  return round1(weighted / weightTotal);
};

const buildRiskStatus = ({ overallScore, attendance }) => {
  const hasRecords = typeof overallScore === 'number' || typeof attendance === 'number';
  if (!hasRecords) return 'No Records';
  if (
    (typeof attendance === 'number' && attendance < ATTENDANCE_THRESHOLD) ||
    (typeof overallScore === 'number' && overallScore < PERFORMANCE_THRESHOLD)
  ) {
    return 'High Risk';
  }
  if (typeof overallScore === 'number' && overallScore >= 85) return 'Top Performer';
  if (
    (typeof attendance === 'number' && attendance < 85) ||
    (typeof overallScore === 'number' && overallScore < 70)
  ) {
    return 'Moderate Risk';
  }
  return 'Good';
};

const buildWeakAreas = ({ assessment, coding, interview, attendance }) => {
  const weak = [];
  if (typeof attendance === 'number' && attendance < ATTENDANCE_THRESHOLD) {
    weak.push({ area: 'Attendance', score: attendance, target: ATTENDANCE_THRESHOLD });
  }
  if (typeof assessment === 'number' && assessment < 65) {
    weak.push({ area: 'Assessments', score: assessment, target: 65 });
  }
  if (typeof coding === 'number' && coding < 65) {
    weak.push({ area: 'Coding / DSA', score: coding, target: 65 });
  }
  if (typeof interview === 'number' && interview < 65) {
    weak.push({ area: 'Interviews', score: interview, target: 65 });
  }
  return weak;
};

const buildRecommendations = ({ status, weakAreas, hasRecords }) => {
  if (!hasRecords) {
    return ['No attendance, assessment, coding or interview records yet. Mark attendance and publish an assessment to populate analytics.'];
  }
  if (status === 'No Records') {
    return ['No measurable records yet for this student.'];
  }
  if (weakAreas.length === 0) {
    return ['Performance is on track. Continue the current study plan.'];
  }
  return weakAreas.map((w) => `Schedule a remediation session for ${w.area} (${w.score}% recorded vs ${w.target}% target).`);
};

const buildTrend = (weeklyRows = []) => {
  if (!Array.isArray(weeklyRows) || weeklyRows.length < 2) {
    return { trend: 'none', trendDelta: null };
  }
  const latest = parseFloat(weeklyRows[0].overall_score);
  const previous = parseFloat(weeklyRows[1].overall_score);
  if (!Number.isFinite(latest) || !Number.isFinite(previous)) {
    return { trend: 'none', trendDelta: null };
  }
  const delta = round1(latest - previous);
  return {
    trend: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
    trendDelta: `${delta > 0 ? '+' : ''}${delta}%`,
  };
};

const buildStudentMetrics = (student, metrics) => {
  const userId = Number(student.user_id);
  const attendance = resolveAttendance(userId, metrics);
  const assessmentRow = metrics.assessment.get(userId);
  const codingRow = metrics.coding.get(userId);
  const interviewRow = metrics.interview.get(userId);

  const components = {
    assessment: assessmentRow ? round1(assessmentRow.avg_percentage) : null,
    coding: codingRow ? round1(codingRow.avg_percentage) : null,
    interview: interviewRow ? round1(interviewRow.avg_score) : null,
    attendance: attendance.percentage,
  };

  const overallScore = resolveOverallScore(components);
  const weakAreas = buildWeakAreas(components);
  const status = buildRiskStatus({ overallScore, attendance: components.attendance });
  const { trend, trendDelta } = buildTrend(metrics.weekly.get(userId));
  const hasRecords = Object.values(components).some((v) => typeof v === 'number');

  return {
    id: `u-${userId}`,
    userId,
    name: student.name,
    email: student.email || null,
    mobile: student.mobile_number || null,
    rollNo: student.roll_number || null,
    department: student.department || null,
    departmentId: student.department_id != null ? toInt(student.department_id) : null,
    batch: student.batch_name || null,
    batchId: student.batch_id != null ? toInt(student.batch_id) : null,
    college: student.college_name || null,
    collegeId: student.college_id != null ? toInt(student.college_id) : null,
    year: student.year || null,
    division: student.division || null,
    semester: student.semester || null,
    overallScore,
    assessment: components.assessment,
    assessmentAttempts: assessmentRow ? toInt(assessmentRow.attempts) : 0,
    coding: components.coding,
    codingSubmissions: codingRow ? toInt(codingRow.submissions) : 0,
    codingSolved: codingRow ? toInt(codingRow.solved) : 0,
    interview: components.interview,
    interviewSessions: interviewRow ? toInt(interviewRow.sessions) : 0,
    attendance: components.attendance,
    attendanceSessions: attendance.totalSessions,
    attendancePresent: attendance.present,
    attendanceAbsent: attendance.absent,
    hasRecords,
    status,
    trend,
    trendDelta,
    weakAreas,
    recommendations: buildRecommendations({ status, weakAreas, hasRecords }),
  };
};

const loadMentorStudentsWithMetrics = async (mentorId) => {
  const students = await loadMentorStudents(mentorId);
  const metrics = await loadMentorMetrics(students.map((s) => Number(s.user_id)));
  return students.map((s) => buildStudentMetrics(s, metrics));
};

const requireMentor = (req, res) => {
  const mentorId = getMentorId(req);
  if (!mentorId) {
    sendError(res, 'Mentor identity could not be resolved from the authentication token', 401);
    return null;
  }
  return mentorId;
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/overview
// ---------------------------------------------------------------------------
export const getMentorOverview = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const collegeId = getCollegeId(req);
    const [mentorRows, students] = await Promise.all([
      query(
        `SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.target_track, u.created_at,
                c.id AS college_id, c.name AS college_name
           FROM users u
           LEFT JOIN colleges c ON c.id = u.college_id
          WHERE u.id = ?`,
        [mentorId]
      ),
      loadMentorStudentsWithMetrics(mentorId),
    ]);

    const mentor = (mentorRows || [])[0] || null;
    const batchIds = [...new Set(students.map((s) => s.batchId).filter((v) => v != null))];
    const withRecords = students.filter((s) => s.hasRecords);
    const defaulters = students.filter((s) => s.status === 'High Risk' || s.status === 'Moderate Risk');

    const availability = await tableAvailabilityMap(['shared_content', 'weekly_reports', 'live_sessions']);

    const assignmentCount = batchIds.length > 0 && availability.shared_content
      ? toInt(
          (
            await query(
              `SELECT COUNT(*) AS n FROM shared_content
                WHERE type = 'coding' AND batch_id IN (${inPlaceholders(batchIds)})`,
              batchIds
            )
          )[0]?.n
        ) || 0
      : 0;

    const weeklyReportCount = students.length > 0 && availability.weekly_reports
      ? toInt(
          (
            await query(
              `SELECT COUNT(*) AS n FROM weekly_reports
                WHERE user_id IN (${inPlaceholders(students.map((s) => s.userId))})`,
              students.map((s) => s.userId)
            )
          )[0]?.n
        ) || 0
      : 0;

    const upcomingSessions = availability.live_sessions
      ? toInt(
          (
            await query(
              `SELECT COUNT(*) AS n FROM live_sessions
                WHERE mentor_id = ? AND status = 'Upcoming'`,
              [mentorId]
            )
          )[0]?.n
        ) || 0
      : 0;

    return sendSuccess(res, 'Mentor overview retrieved successfully', {
      mentor: mentor
        ? {
            id: toInt(mentor.id),
            name: mentor.name,
            email: mentor.email,
            mobile: mentor.mobile_number || null,
            role: mentor.role,
            targetTrack: mentor.target_track || null,
            college: mentor.college_name || null,
            collegeId: mentor.college_id != null ? toInt(mentor.college_id) : null,
          }
        : null,
      stats: {
        totalStudents: students.length,
        studentsWithRecords: withRecords.length,
        studentsWithoutRecords: students.length - withRecords.length,
        totalBatches: batchIds.length,
        defaulters: defaulters.length,
        averageAttendance: average(withRecords.map((s) => s.attendance)),
        averageOverallScore: average(withRecords.map((s) => s.overallScore)),
        averageAssessment: average(withRecords.map((s) => s.assessment)),
        averageCoding: average(withRecords.map((s) => s.coding)),
        assignments: assignmentCount,
        weeklyReports: weeklyReportCount,
        upcomingSessions,
      },
      batchIds,
      collegeId,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/batches
// ---------------------------------------------------------------------------
export const getMentorBatches = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const students = await loadMentorStudentsWithMetrics(mentorId);
    const batchIds = [...new Set(students.map((s) => s.batchId).filter((v) => v != null))];

    const batchRows = batchIds.length
      ? await query(
          `SELECT b.id, b.name, b.schedule, b.year, b.division, b.status, b.academic_year,
                  COALESCE(d.name, '—') AS department,
                  c.name AS college
             FROM batches b
             LEFT JOIN departments d ON d.id = b.department_id
             LEFT JOIN colleges c ON c.id = b.college_id
            WHERE b.id IN (${inPlaceholders(batchIds)})`,
          batchIds
        )
      : [];

    const byId = new Map((batchRows || []).map((b) => [toInt(b.id), b]));

    const batches = batchIds.map((batchId) => {
      const row = byId.get(batchId) || {};
      const roster = students.filter((s) => s.batchId === batchId);
      const withRecords = roster.filter((s) => s.hasRecords);
      const status = row.status === 'inactive' ? 'Inactive' : 'Active';
      return {
        id: `b-${batchId}`,
        batchId,
        name: row.name || `Batch ${batchId}`,
        college: row.college || roster.find((s) => s.college)?.college || null,
        department: row.department && row.department !== '—' ? row.department : roster.find((s) => s.department)?.department || null,
        schedule: row.schedule || null,
        year: row.year || null,
        division: row.division || null,
        academicYear: row.academic_year || null,
        enrolledStudents: roster.length,
        studentsWithRecords: withRecords.length,
        averageAttendance: average(withRecords.map((s) => s.attendance)),
        averageScore: average(withRecords.map((s) => s.overallScore)),
        defaulters: roster.filter((s) => s.status === 'High Risk' || s.status === 'Moderate Risk').length,
        status,
      };
    });

    return sendSuccess(res, 'Mentor batches retrieved successfully', { batches });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/leaderboard
// ---------------------------------------------------------------------------
export const getMentorLeaderboard = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const students = await loadMentorStudentsWithMetrics(mentorId);
    const ranked = students
      .filter((s) => s.hasRecords)
      .sort((a, b) => {
        const scoreDiff = (b.overallScore || 0) - (a.overallScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.name.localeCompare(b.name);
      });

    const leaderboard = ranked.map((s, index) => ({
      rank: index + 1,
      userId: s.userId,
      name: s.name,
      rollNo: s.rollNo,
      batch: s.batch,
      points: s.overallScore,
      codingPoints: s.coding,
      solved: s.codingSolved,
      submissions: s.codingSubmissions,
      assessment: s.assessment,
      attendance: s.attendance,
      status: s.status,
      badge:
        s.status === 'Top Performer'
          ? 'Top Performer'
          : s.status === 'High Risk'
            ? 'Needs Support'
            : s.status === 'Moderate Risk'
              ? 'Watchlist'
              : 'Consistent',
    }));

    return sendSuccess(res, 'Mentor leaderboard retrieved successfully', {
      leaderboard,
      rankedStudents: leaderboard.length,
      unrankedStudents: students.length - leaderboard.length,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/defaulters
// ---------------------------------------------------------------------------
export const getMentorDefaulters = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const students = await loadMentorStudentsWithMetrics(mentorId);

    // Defaulters require real attendance history: students without a single
    // attendance record are never flagged.
    const defaulters = students
      .filter((s) => s.attendanceSessions > 0 && s.attendance !== null)
      .filter((s) => s.attendance < ATTENDANCE_THRESHOLD || (s.overallScore !== null && s.overallScore < PERFORMANCE_THRESHOLD))
      .map((s) => {
        const reasons = [];
        if (s.attendance < ATTENDANCE_THRESHOLD) {
          reasons.push(`Low attendance (${s.attendance}% < ${ATTENDANCE_THRESHOLD}%)`);
        }
        if (s.overallScore !== null && s.overallScore < PERFORMANCE_THRESHOLD) {
          reasons.push(`Low overall performance (${s.overallScore}% < ${PERFORMANCE_THRESHOLD}%)`);
        }
        const riskLevel = s.status === 'High Risk' ? 'High Risk' : 'Moderate Risk';
        return {
          userId: s.userId,
          name: s.name,
          rollNo: s.rollNo,
          batch: s.batch,
          department: s.department,
          attendance: s.attendance,
          attendanceThreshold: ATTENDANCE_THRESHOLD,
          totalSessions: s.attendanceSessions,
          present: s.attendancePresent,
          absent: s.attendanceAbsent,
          overallScore: s.overallScore,
          lastTestScore: s.assessment,
          missedAssignments: null,
          riskLevel,
          reason: reasons.join(' · '),
          reasons,
          weakAreas: s.weakAreas,
          status: 'Needs Attention',
        };
      })
      .sort((a, b) => (a.attendance ?? 0) - (b.attendance ?? 0));

    return sendSuccess(res, 'Mentor defaulters retrieved successfully', {
      defaulters,
      attendanceThreshold: ATTENDANCE_THRESHOLD,
      performanceThreshold: PERFORMANCE_THRESHOLD,
      trackedStudents: students.filter((s) => s.attendanceSessions > 0).length,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/students/performance
// ---------------------------------------------------------------------------
export const getMentorStudentsPerformance = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const students = await loadMentorStudentsWithMetrics(mentorId);
    return sendSuccess(res, 'Mentor students performance retrieved successfully', { students });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/weekly-reports
// ---------------------------------------------------------------------------
export const getMentorWeeklyReports = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const availability = await tableAvailabilityMap(['weekly_reports']);
    if (!availability.weekly_reports) {
      return sendSuccess(res, 'Mentor weekly reports retrieved successfully', { reports: [] });
    }

    const students = await loadMentorStudents(mentorId);
    if (students.length === 0) {
      return sendSuccess(res, 'Mentor weekly reports retrieved successfully', { reports: [] });
    }

    const byUserId = new Map(students.map((s) => [Number(s.user_id), s]));
    const userIds = [...byUserId.keys()];
    const rows = await query(
      `SELECT id, student_id, user_id, week_label, start_date, end_date, overall_score,
              attendance_score, quiz_score, coding_score, interview_score,
              strong_areas, weak_areas, suggestions,
              trend_status, score_delta, generated_at, created_at
         FROM weekly_reports
        WHERE user_id IN (${inPlaceholders(userIds)})
        ORDER BY id DESC`,
      userIds
    );

    const parseJsonField = (value) => {
      if (value === null || value === undefined) return [];
      if (Array.isArray(value)) return value;
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const reports = (rows || []).map((r) => {
      const student = byUserId.get(Number(r.student_id || r.user_id)) || {};
      return {
        id: toInt(r.id),
        title: r.week_label || `Weekly Report ${toInt(r.id)}`,
        weekLabel: r.week_label || null,
        startDate: r.start_date || null,
        endDate: r.end_date || null,
        student: student.name || null,
        studentId: toInt(r.student_id || r.user_id),
        rollNo: student.roll_number || null,
        batch: student.batch_name || null,
        batchId: student.batch_id != null ? toInt(student.batch_id) : null,
        department: student.department || null,
        overallScore: r.overall_score != null ? round1(r.overall_score) : null,
        attendance: r.attendance_score != null ? round1(r.attendance_score) : null,
        quiz: r.quiz_score != null ? round1(r.quiz_score) : null,
        coding: r.coding_score != null ? round1(r.coding_score) : null,
        interview: r.interview_score != null ? round1(r.interview_score) : null,
        trendStatus: r.trend_status || null,
        scoreDelta: r.score_delta || null,
        status: 'Generated',
        submittedAt: r.generated_at || r.created_at || null,
        strongAreas: parseJsonField(r.strong_areas),
        weakAreas: parseJsonField(r.weak_areas),
        suggestions: parseJsonField(r.suggestions),
      };
    });

    return sendSuccess(res, 'Mentor weekly reports retrieved successfully', { reports });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/assignments
// ---------------------------------------------------------------------------
export const getMentorAssignments = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const availability = await tableAvailabilityMap(['shared_content', 'coding_submissions']);
    if (!availability.shared_content) {
      return sendSuccess(res, 'Mentor assignments retrieved successfully', { assignments: [] });
    }

    const students = await loadMentorStudents(mentorId);
    const batchIds = [...new Set(students.map((s) => (s.batch_id != null ? toInt(s.batch_id) : null)).filter((v) => v != null))];

    const mentorBatchClause = batchIds.length > 0 ? `batch_id IN (${inPlaceholders(batchIds)})` : '1 = 0';
    const rows = await query(
      `SELECT * FROM shared_content
        WHERE type = 'coding'
          AND (created_by = ? OR (${mentorBatchClause}))
        ORDER BY id DESC`,
      [mentorId, ...batchIds]
    );

    let submissionByProblem = new Map();
    if (availability.coding_submissions && students.length > 0) {
      const userIds = students.map((s) => Number(s.user_id));
      const submissionRows = await query(
        `SELECT problem_id,
                COUNT(*) AS submissions,
                COUNT(DISTINCT student_id) AS students,
                COUNT(DISTINCT CASE WHEN status IN ('passed', 'accepted') THEN student_id END) AS accepted_students
           FROM coding_submissions
          WHERE student_id IN (${inPlaceholders(userIds)})
          GROUP BY problem_id`,
        userIds
      );
      submissionByProblem = new Map((submissionRows || []).map((r) => [toInt(r.problem_id), r]));
    }

    const batchNameById = new Map(students.map((s) => [toInt(s.batch_id), s.batch_name]));

    const assignments = (rows || []).map((r) => {
      let data = {};
      try {
        data = JSON.parse(r.data_json || '{}') || {};
      } catch {
        data = {};
      }
      const problems = Array.isArray(data.problems) ? data.problems : [];
      const problemIds = problems.map((p) => toInt(p?.problemId ?? p?.id)).filter((v) => v != null);
      const submissions = problemIds.reduce(
        (acc, pid) => acc + (toInt(submissionByProblem.get(pid)?.submissions) || 0),
        0
      );
      const evaluatedStudents = problemIds.reduce(
        (acc, pid) => acc + (toInt(submissionByProblem.get(pid)?.accepted_students) || 0),
        0
      );
      const batchId = r.batch_id != null ? toInt(r.batch_id) : null;

      return {
        id: `as-${toInt(r.id)}`,
        sharedContentId: toInt(r.id),
        title: r.title,
        description: r.description || '',
        type: r.type,
        status: r.status || 'Active',
        batch: r.batch_name || (batchId ? batchNameById.get(batchId) || null : null),
        batchId,
        dueDate: data.dueDate || null,
        problems,
        problemCount: problems.length,
        totalStudents: students.filter((s) => (s.batch_id != null ? toInt(s.batch_id) : null) === batchId).length,
        totalSubmitted: submissions,
        evaluated: availability.coding_submissions ? evaluatedStudents : null,
        pendingReview: availability.coding_submissions ? Math.max(0, submissions - evaluatedStudents) : null,
        createdAt: r.created_at || null,
      };
    });

    return sendSuccess(res, 'Mentor assignments retrieved successfully', { assignments });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/mentor/assignments
// ---------------------------------------------------------------------------
export const createMentorAssignment = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const { title, description, batchId, dueDate, problems, target } = req.body || {};
    if (!title || !String(title).trim()) {
      return sendError(res, 'title is required', 400);
    }

    const parsedBatchId = parseBatchId(batchId);
    if (!parsedBatchId) {
      return sendError(res, 'batchId is required and must be a batch assigned to you', 400);
    }

    const students = await loadMentorStudents(mentorId);
    const batchStudents = students.filter((s) => s.batch_id != null && toInt(s.batch_id) === parsedBatchId);
    if (batchStudents.length === 0) {
      return sendError(res, 'You can only publish assignments for a batch assigned to you', 403);
    }

    const batchRow = (await query(`SELECT id, name FROM batches WHERE id = ?`, [parsedBatchId]))[0] || null;
    const normalizedProblems = (Array.isArray(problems) ? problems : [])
      .filter((p) => p && (p.title || p.problemTitle))
      .map((p, index) => ({
        order: index + 1,
        problemId: toInt(p.problemId ?? p.id),
        title: String(p.title || p.problemTitle).trim(),
        description: p.description || '',
        difficulty: p.difficulty || 'Medium',
        points: toInt(p.points) || 100,
      }));

    const item = await createSharedContent({
      type: 'coding',
      title: String(title).trim(),
      description: description || '',
      data: {
        kind: 'mentor-assignment',
        batchId: parsedBatchId,
        batchName: batchRow?.name || null,
        dueDate: dueDate || null,
        problems: normalizedProblems,
        createdByMentorId: mentorId,
      },
      status: 'Active',
      college_id: getCollegeId(req) || batchStudents[0]?.college_id || 1,
      created_by: mentorId,
      batch_name: batchRow?.name || target || 'Assigned Batch',
      target: target || batchRow?.name || 'Assigned Batch',
      batch_id: parsedBatchId,
    });

    if (!item || item.id == null) {
      return sendError(res, 'Assignment could not be persisted', 500);
    }

    return sendSuccess(
      res,
      'Assignment published successfully',
      {
        id: `as-${toInt(item.id)}`,
        sharedContentId: toInt(item.id),
        title: item.title,
        description: item.description || '',
        type: item.type,
        status: item.status || 'Active',
        batch: item.batch_name || batchRow?.name || null,
        batchId: parsedBatchId,
        dueDate: dueDate || null,
        problems: normalizedProblems,
        problemCount: normalizedProblems.length,
        totalStudents: batchStudents.length,
        totalSubmitted: 0,
        evaluated: 0,
        pendingReview: 0,
        createdAt: item.created_at || null,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/v1/mentor/assignments/:id
// ---------------------------------------------------------------------------
export const deleteMentorAssignment = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const id = parseInt(String(req.params.id || '').replace(/^as-/i, ''), 10);
    if (!Number.isFinite(id)) {
      return sendError(res, 'Invalid assignment id', 400);
    }

    const rows = await query(`SELECT id, created_by FROM shared_content WHERE id = ? AND type = 'coding'`, [id]);
    const row = (rows || [])[0];
    if (!row) {
      return sendError(res, 'Assignment not found', 404);
    }
    if (toInt(row.created_by) !== mentorId) {
      return sendError(res, 'You can only delete assignments that you created', 403);
    }

    await deleteSharedContent(id);
    return sendSuccess(res, 'Assignment deleted successfully', { id: `as-${id}`, sharedContentId: id });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/attendance/batches
// ---------------------------------------------------------------------------
export const getMentorAttendanceBatches = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const sessionDate = req.query?.date || new Date().toISOString().slice(0, 10);
    const students = await loadMentorStudents(mentorId);
    const batchIds = [...new Set(students.map((s) => (s.batch_id != null ? toInt(s.batch_id) : null)).filter((v) => v != null))];

    const availability = await tableAvailabilityMap(['attendance', 'batches']);

    const batchRows =
      batchIds.length > 0 && availability.batches
        ? await query(
            `SELECT b.id, b.name FROM batches b WHERE b.id IN (${inPlaceholders(batchIds)}) ORDER BY b.name`,
            batchIds
          )
        : [];
    const batchNameById = new Map((batchRows || []).map((b) => [toInt(b.id), b.name]));

    let markedByStudent = new Map();
    if (availability.attendance && students.length > 0) {
      const userIds = students.map((s) => Number(s.user_id));
      const markedRows = await query(
        `SELECT user_id, status FROM attendance WHERE user_id IN (${inPlaceholders(userIds)}) AND session_date = ?`,
        [...userIds, sessionDate]
      );
      markedByStudent = new Map((markedRows || []).map((r) => [toInt(r.user_id), r.status]));
    }

    const batches = batchIds.map((batchId) => ({
      id: `b-${batchId}`,
      batchId,
      name: batchNameById.get(batchId) || `Batch ${batchId}`,
      students: students
        .filter((s) => s.batch_id != null && toInt(s.batch_id) === batchId)
        .map((s) => ({
          id: toInt(s.user_id),
          userId: toInt(s.user_id),
          name: s.name,
          roll: s.roll_number || '',
          status: markedByStudent.get(toInt(s.user_id)) || null,
        })),
    }));

    return sendSuccess(res, 'Batches retrieved', { batches, date: sessionDate });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// POST /api/v1/mentor/attendance/save
// ---------------------------------------------------------------------------
export const saveMentorAttendance = async (req, res, next) => {
  let connection = null;
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const { session, date, attendance } = req.body || {};
    const batchId = parseBatchId(req.body?.batchId);
    if (!batchId) {
      return sendError(res, 'batchId is required', 400);
    }
    if (!Array.isArray(attendance) || attendance.length === 0) {
      return sendError(res, 'attendance records are required', 400);
    }

    const sessionDate = date || new Date().toISOString().slice(0, 10);
    const students = await loadMentorStudents(mentorId);
    const assignedIds = new Set(
      students.filter((s) => s.batch_id != null && toInt(s.batch_id) === batchId).map((s) => Number(s.user_id))
    );
    if (assignedIds.size === 0) {
      return sendError(res, 'You can only mark attendance for a batch assigned to you', 403);
    }

    const batchRow = (await query(`SELECT id, college_id, name FROM batches WHERE id = ?`, [batchId]))[0] || null;
    if (!batchRow) {
      return sendError(res, 'Batch not found', 404);
    }

    const records = attendance
      .map((entry) => ({ userId: parseUserId(entry?.studentId ?? entry?.userId ?? entry?.id), status: normalizeStatus(entry?.status) }))
      .filter((entry) => entry.userId && entry.status);

    if (records.length === 0) {
      return sendError(res, 'No valid attendance records were provided', 400);
    }

    const unauthorized = records.filter((entry) => !assignedIds.has(entry.userId));
    if (unauthorized.length > 0) {
      return sendError(res, 'Attendance payload contains students that are not assigned to you', 403);
    }

    const sessionTitle = String(session || 'Training Session').trim();
    const sessionCode = `MENTOR-${batchId}-${sessionDate}-${slugify(sessionTitle) || 'session'}`.slice(0, 100);

    const availability = await tableAvailabilityMap(['attendance_sessions']);
    let sessionId = null;
    if (availability.attendance_sessions) {
      const existing = await query(`SELECT id FROM attendance_sessions WHERE LOWER(session_code) = LOWER(?) LIMIT 1`, [sessionCode]);
      if ((existing || []).length > 0) {
        sessionId = toInt(existing[0].id);
      } else {
        const inserted = await query(
          `INSERT INTO attendance_sessions (college_id, batch_id, session_code, title, session_date, faculty_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [toInt(batchRow.college_id) || getCollegeId(req) || 1, batchId, sessionCode, sessionTitle, sessionDate, mentorId]
        );
        sessionId = toInt(inserted?.insertId);
      }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    // Re-marking the same batch/date replaces only this mentor's own rows so
    // saving twice is idempotent and admin-marked sessions are untouched.
    await connection.execute(
      `DELETE FROM attendance WHERE batch_id = ? AND session_date = ? AND marked_by = ?`,
      [batchId, sessionDate, mentorId]
    );
    for (const record of records) {
      await connection.execute(
        `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, marked_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [toInt(batchRow.college_id) || getCollegeId(req) || 1, batchId, record.userId, sessionId, sessionDate, record.status, mentorId]
      );
    }
    await connection.commit();
    connection.release();
    connection = null;

    return sendSuccess(res, 'Attendance saved successfully', {
      recorded: records.length,
      batchId,
      batch: batchRow.name,
      sessionId,
      session: sessionTitle,
      date: sessionDate,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch {
        /* ignore rollback failure */
      }
      connection.release();
    }
    next(error);
  }
};

// ---------------------------------------------------------------------------
// GET /api/v1/mentor/profile
// ---------------------------------------------------------------------------
export const getMentorProfile = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const rows = await query(
      `SELECT u.id, u.name, u.email, u.mobile_number, u.role, u.gender, u.city,
              u.target_track, u.linkedin_url, u.is_active, u.created_at,
              c.id AS college_id, c.name AS college_name, c.code AS college_code,
              (SELECT COUNT(*) FROM mentor_student_assignments msa WHERE msa.mentor_id = u.id) AS assigned_students,
              (SELECT COUNT(DISTINCT COALESCE(msa.batch_id, s.batch_id))
                 FROM mentor_student_assignments msa
                 LEFT JOIN students s ON s.user_id = msa.student_id
                WHERE msa.mentor_id = u.id) AS assigned_batches
         FROM users u
         LEFT JOIN colleges c ON c.id = u.college_id
        WHERE u.id = ?`,
      [mentorId]
    );
    const row = (rows || [])[0];
    if (!row) {
      return sendError(res, 'Mentor profile not found', 404);
    }

    const availability = await tableAvailabilityMap(['live_sessions', 'shared_content', 'weekly_reports']);
    const students = await loadMentorStudents(mentorId);
    const batchIds = [...new Set(students.map((s) => (s.batch_id != null ? toInt(s.batch_id) : null)).filter((v) => v != null))];

    const upcomingSessions = availability.live_sessions
      ? toInt(
          (await query(`SELECT COUNT(*) AS n FROM live_sessions WHERE mentor_id = ? AND status = 'Upcoming'`, [mentorId]))[0]?.n
        ) || 0
      : 0;

    const assignments = availability.shared_content
      ? toInt(
          (
            await query(
              `SELECT COUNT(*) AS n FROM shared_content
                WHERE type = 'coding'
                  AND (created_by = ?${
                    batchIds.length > 0 ? ` OR batch_id IN (${inPlaceholders(batchIds)})` : ''
                  })`,
              batchIds.length > 0 ? [mentorId, ...batchIds] : [mentorId]
            )
          )[0]?.n
        ) || 0
      : 0;

    const weeklyReports = availability.weekly_reports && students.length > 0
      ? toInt(
          (
            await query(
              `SELECT COUNT(*) AS n FROM weekly_reports WHERE user_id IN (${inPlaceholders(students.map((s) => Number(s.user_id)))})`,
              students.map((s) => Number(s.user_id))
            )
          )[0]?.n
        ) || 0
      : 0;

    return sendSuccess(res, 'Mentor profile retrieved successfully', {
      id: toInt(row.id),
      name: row.name,
      email: row.email,
      mobile: row.mobile_number || null,
      role: row.role,
      gender: row.gender || null,
      city: row.city || null,
      targetTrack: row.target_track || null,
      specialization: row.target_track || null,
      linkedinUrl: row.linkedin_url || null,
      isActive: row.is_active === null || row.is_active === undefined ? null : Boolean(row.is_active),
      joinedAt: row.created_at || null,
      college: row.college_name || null,
      collegeCode: row.college_code || null,
      collegeId: row.college_id != null ? toInt(row.college_id) : null,
      experience: null,
      rating: null,
      totalStudentsAssigned: toInt(row.assigned_students) || 0,
      allocatedBatchesCount: toInt(row.assigned_batches) || 0,
      pendingEvaluationsCount: null,
      upcomingSessionsCount: upcomingSessions,
      assignmentsCount: assignments,
      weeklyReportsCount: weeklyReports,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Live Sessions
// ---------------------------------------------------------------------------
export const getLiveSessions = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const sessions = await query(
      `SELECT ls.id, ls.mentor_id, ls.title, ls.subject, ls.batch, ls.date, ls.time,
              ls.duration, ls.meeting_link, ls.status, ls.created_at
         FROM live_sessions ls
        WHERE ls.mentor_id = ?
        ORDER BY ls.id DESC`,
      [mentorId]
    );

    return sendSuccess(res, 'Live sessions retrieved', sessions || []);
  } catch (error) {
    next(error);
  }
};

export const createLiveSession = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const { title, subject, batch, batchId, date, time, duration, meetingLink } = req.body || {};
    if (!title || !date || !time) {
      return sendError(res, 'title, date and time are required', 400);
    }

    let batchLabel = batch || null;
    const parsedBatchId = parseBatchId(batchId);
    if (parsedBatchId) {
      const assigned = await loadMentorStudents(mentorId);
      const owns = assigned.some((s) => s.batch_id != null && toInt(s.batch_id) === parsedBatchId);
      if (!owns) {
        return sendError(res, 'You can only schedule sessions for a batch assigned to you', 403);
      }
      const row = (await query(`SELECT name FROM batches WHERE id = ?`, [parsedBatchId]))[0];
      batchLabel = row?.name || batchLabel;
    }

    const result = await query(
      `INSERT INTO live_sessions (mentor_id, title, subject, batch, date, time, duration, meeting_link, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Upcoming')`,
      [mentorId, title, subject || 'General', batchLabel || 'All Batches', date, time, duration || '60 mins', meetingLink || null]
    );

    const created = await query(
      `SELECT id, mentor_id, title, subject, batch, date, time, duration, meeting_link, status, created_at
         FROM live_sessions WHERE id = ?`,
      [result.insertId]
    );

    return sendSuccess(res, 'Live session created successfully', (created || [])[0] || null, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteLiveSession = async (req, res, next) => {
  try {
    const mentorId = requireMentor(req, res);
    if (!mentorId) return;

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return sendError(res, 'Invalid live session id', 400);
    }

    const rows = await query(`SELECT id, mentor_id FROM live_sessions WHERE id = ?`, [id]);
    const row = (rows || [])[0];
    if (!row) {
      return sendError(res, 'Live session not found', 404);
    }
    if (toInt(row.mentor_id) !== mentorId) {
      return sendError(res, 'You can only delete your own live sessions', 403);
    }

    await query(`DELETE FROM live_sessions WHERE id = ?`, [id]);
    return sendSuccess(res, 'Live session deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

// --- Study Materials Database Endpoints ---
let materialsTableInitialized = false;
async function ensureMaterialsTable() {
  if (materialsTableInitialized) return;
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS study_materials (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uploaded_by INT DEFAULT 1,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        subject VARCHAR(100) DEFAULT 'General',
        batch VARCHAR(100) DEFAULT 'All Batches',
        type VARCHAR(50) DEFAULT 'PDF',
        file_url TEXT NULL,
        link TEXT NULL,
        downloads INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    materialsTableInitialized = true;
  } catch (e) {
    console.warn('[DB ensureMaterialsTable error]', e.message);
  }
}

export const getStudyMaterials = async (req, res, next) => {
  try {
    await ensureMaterialsTable();
    let materials = [];
    try {
      materials = await query(`SELECT * FROM study_materials ORDER BY id DESC`);
    } catch (e) {
      console.warn('[DB getStudyMaterials fallback]', e.message);
    }
    return sendSuccess(res, 'Study materials retrieved', materials || []);
  } catch (error) {
    next(error);
  }
};

export const createStudyMaterial = async (req, res, next) => {
  try {
    await ensureMaterialsTable();
    const userId = toInt(req.user?.userId || req.user?.id) || 1;

    const { title, description, subject, batch, batchId, type, link } = req.body || {};
    if (!title) {
      return sendError(res, 'title is required', 400);
    }

    let fileUrl = req.body?.fileUrl || null;
    if (req.file) {
      fileUrl = await uploadFileToS3(req.file);
    }

    let batchLabel = batch || 'All Batches';
    const parsedBatchId = parseBatchId ? parseBatchId(batchId) : null;
    if (parsedBatchId) {
      try {
        const row = (await query(`SELECT name FROM batches WHERE id = ?`, [parsedBatchId]))[0];
        batchLabel = row?.name || batchLabel;
      } catch (e) {}
    }

    let insertId = Date.now();
    try {
      const result = await query(
        `INSERT INTO study_materials (uploaded_by, title, description, subject, batch, type, file_url, link)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, title || 'Untitled Resource', description || null, subject || 'General', batchLabel, type || 'PDF', fileUrl || null, link || null]
      );
      if (result && result.insertId) insertId = result.insertId;
    } catch (e) {
      console.warn('[DB createStudyMaterial fallback]', e.message);
    }

    let created = null;
    try {
      created = (await query(`SELECT * FROM study_materials WHERE id = ?`, [insertId]))[0];
    } catch (e) {}

    const newMaterial = created || {
      id: insertId,
      uploaded_by: userId,
      title: title || 'Untitled Resource',
      description: description || null,
      subject: subject || 'General',
      batch: batchLabel,
      type: type || 'PDF',
      file_url: fileUrl || null,
      link: link || null,
      downloads: 0,
      created_at: new Date().toISOString()
    };
    return sendSuccess(res, 'Study material uploaded successfully', newMaterial, 201);
  } catch (error) {
    next(error);
  }
};

export const deleteStudyMaterial = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return sendError(res, 'Invalid study material id', 400);
    }

    const [row] = await query(`SELECT id, uploaded_by FROM study_materials WHERE id = ?`, [id]);
    if (!row) {
      return sendError(res, 'Study material not found', 404);
    }

    const role = req.user?.role;
    if (role !== ROLES.SUPER_ADMIN && role !== ROLES.COLLEGE_ADMIN && toInt(row.uploaded_by) !== toInt(req.user?.userId || req.user?.id)) {
      return sendError(res, 'You can only delete study materials that you uploaded', 403);
    }

    await query(`DELETE FROM study_materials WHERE id = ?`, [id]);
    return sendSuccess(res, 'Study material deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};

export const getMentorNotifications = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const broadcasts = await getBroadcastsModel(collegeId);
    return sendSuccess(res, 'Notifications retrieved successfully', broadcasts);
  } catch (error) {
    next(error);
  }
};

export const getMentorMenteeInterviews = async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT 
        iv.id,
        iv.user_id,
        iv.interview_type,
        iv.overall_score,
        iv.grade,
        iv.feedback,
        iv.conducted_date,
        iv.status,
        iv.created_at,
        u.name AS student_name,
        u.email AS student_email,
        s.roll_number,
        COALESCE(b.name, s.department, 'Batch A') AS batch_name
       FROM interview_sessions iv
       JOIN users u ON iv.user_id = u.id
       LEFT JOIN students s ON u.id = s.user_id
       LEFT JOIN batches b ON s.batch_id = b.id
       ORDER BY iv.created_at DESC, iv.id DESC`
    );

    const formatted = (rows || []).map((r) => ({
      id: r.id,
      studentName: r.student_name || 'Student',
      rollNo: r.roll_number || 'N/A',
      batch: r.batch_name || 'Batch A',
      targetRole: r.interview_type || 'Software Engineer',
      topic: r.interview_type || 'General AI Mock',
      score: r.overall_score || 0,
      grade: r.grade || (r.overall_score >= 80 ? 'Excellent' : r.overall_score >= 60 ? 'Good' : 'Needs Work'),
      status: r.status || 'Completed',
      feedback: r.feedback || 'Completed AI Mock Interview session.',
      date: r.conducted_date || (r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent')
    }));

    return sendSuccess(res, 'Mentee interview progress retrieved successfully', formatted);
  } catch (error) {
    next(error);
  }
};

