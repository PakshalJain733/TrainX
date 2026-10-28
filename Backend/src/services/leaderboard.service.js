import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

// Pre-seeded fallback dataset representing diverse students across colleges, departments, and batches
const fallbackStudents = [];

/**
 * Calculates overall score from component metrics
 */
const calculateOverallScore = (item) => {
  const q = item.quiz_score || 0;
  const c = item.coding_score || 0;
  const i = item.interview_score || 0;
  const a = item.attendance_score || 0;
  
  // Weighted average: 30% Quiz, 30% Coding, 25% Interview, 15% Attendance
  return Math.round((q * 0.3) + (c * 0.3) + (i * 0.25) + (a * 0.15));
};

export const formatStudentName = (name, email = '') => {
  if (!name || typeof name !== 'string') {
    if (email) {
      name = email.split('@')[0];
    } else {
      return 'Student';
    }
  }

  let cleanName = name.trim();

  if (email && email.includes('@') && !cleanName.includes(' ')) {
    const handle = email.split('@')[0].replace(/\d+$/g, '');
    if (handle.includes('.') || handle.includes('_') || handle.includes('-')) {
      cleanName = handle;
    }
  }

  if (cleanName.includes('@')) {
    cleanName = cleanName.split('@')[0];
  }

  cleanName = cleanName.replace(/\d+$/g, '').trim();
  cleanName = cleanName.replace(/([a-z])([A-Z])/g, '$1 $2');
  cleanName = cleanName.replace(/[._-]+/g, ' ');

  const words = cleanName.split(/\s+/).filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  if (words.length > 0) {
    return words.join(' ');
  }

  return name || 'Student';
};

/**
 * Helper to get student initials for frontend UI avatars
 */
const getInitials = (name) => {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const formatDurationSeconds = (seconds) => {
  const s = Math.round(Number(seconds) || 0);
  if (s <= 0) return '0s';
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const remSecs = s % 60;
  if (mins < 60) {
    return remSecs > 0 ? `${mins}m ${remSecs}s` : `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
};

/**
 * Standard Competition Ranking with time taken as secondary tie-breaker (less time = higher rank)
 */
export const applyStandardTieRanking = (items, scoreKey = 'score', timeKey = 'total_time_seconds') => {
  if (!items || items.length === 0) return [];

  // Sort: Primary by score/points DESC, secondary by time taken ASC (faster = higher rank), tertiary by registration order
  items.sort((a, b) => {
    const aScore = a[scoreKey] !== undefined ? Number(a[scoreKey]) : Number(a.overall_score || a.total_points || 0);
    const bScore = b[scoreKey] !== undefined ? Number(b[scoreKey]) : Number(b.overall_score || b.total_points || 0);
    if (bScore !== aScore) {
      return bScore - aScore;
    }
    const aTime = Number(a[timeKey] !== undefined ? a[timeKey] : (a.total_time_seconds || 0));
    const bTime = Number(b[timeKey] !== undefined ? b[timeKey] : (b.total_time_seconds || 0));
    if (aTime > 0 && bTime > 0 && aTime !== bTime) {
      return aTime - bTime;
    }
    const aReg = a.user_created_at ? new Date(a.user_created_at).getTime() : (a.user_id || a.student_id || a.id || 0);
    const bReg = b.user_created_at ? new Date(b.user_created_at).getTime() : (b.user_id || b.student_id || b.id || 0);
    return aReg - bReg;
  });

  return items.map((item, index) => {
    item.rank = index + 1;
    return item;
  });
};

/**
 * Fetch raw student performance data from MySQL DB or Fallback Data
 */
export const getStudentsRawPerformance = async (filters = {}) => {
  const { college_id, department_id, batch_id, mentor_id, mentor_name, mentor_email } = filters;

  try {
    let sql = `
      SELECT 
        u.id AS user_id,
        s.id AS student_id,
        u.name,
        u.email,
        u.is_approved,
        u.is_active,
        u.created_at AS user_created_at,
        s.roll_number,
        s.college_id,
        c.name AS college_name,
        s.department_id,
        COALESCE(d.name, s.department) AS department_name,
        s.batch_id,
        b.name AS batch_name,
        
        -- 1. Quiz stats (points, quizzes taken, avg percentage, time taken)
        COALESCE(quiz_stats.total_quiz_points, 0) AS quiz_points,
        COALESCE(quiz_stats.quizzes_taken, 0) AS quizzes_taken,
        COALESCE(quiz_stats.avg_quiz_score, 0) AS quiz_score,
        COALESCE(quiz_stats.quiz_time_seconds, 0) AS quiz_time_seconds,

        -- 2. Practice Coding stats (points, problems solved, execution/solve time)
        COALESCE(practice_stats.coding_points, 0) AS coding_points,
        COALESCE(practice_stats.problems_solved, 0) AS problems_solved,
        COALESCE(practice_stats.coding_time_seconds, 0) AS coding_time_seconds,

        -- 3. Coursework Task stats (points, tasks completed, time spent)
        COALESCE(task_stats.task_points, 0) AS task_points,
        COALESCE(task_stats.tasks_completed, 0) AS tasks_completed,
        COALESCE(task_stats.task_time_seconds, 0) AS task_time_seconds,

        -- 4. Interview stats
        (
          SELECT COALESCE(AVG(iv.overall_score), 0) 
          FROM interview_sessions iv 
          WHERE iv.user_id = u.id
        ) AS interview_score,
        (
          SELECT COUNT(*) 
          FROM interview_sessions iv 
          WHERE iv.user_id = u.id
        ) AS interviews_count,

        -- 5. Attendance stats
        (
          SELECT COALESCE(
            (SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(att.id), 0)) * 100, 
            0
          ) 
          FROM attendance att 
          WHERE att.user_id = u.id
        ) AS attendance_score,

        -- 6. Roadmap / Milestone stats
        (
          SELECT COUNT(*) 
          FROM roadmap_items ri 
          JOIN roadmaps r ON ri.roadmap_id = r.id 
          WHERE r.student_id = u.id AND ri.status = 'completed'
        ) AS milestones_completed,
        (
          SELECT COUNT(*) 
          FROM roadmap_items ri 
          JOIN roadmaps r ON ri.roadmap_id = r.id 
          WHERE r.student_id = u.id
        ) AS total_milestones

      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      LEFT JOIN colleges c ON s.college_id = c.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN batches b ON s.batch_id = b.id
      
      -- Subquery for Quiz performance & time
      LEFT JOIN (
        SELECT 
          a.user_id,
          SUM(COALESCE(a.marks_obtained, a.score, 0)) AS total_quiz_points,
          COUNT(DISTINCT a.id) AS quizzes_taken,
          AVG(a.percentage) AS avg_quiz_score,
          SUM(CASE 
            WHEN a.started_at IS NOT NULL AND a.submitted_at IS NOT NULL 
              AND a.submitted_at >= a.started_at
            THEN TIMESTAMPDIFF(SECOND, a.started_at, a.submitted_at)
            ELSE 120 
          END) AS quiz_time_seconds
        FROM assessment_attempts a
        WHERE a.status IN ('completed', 'finished', 'passed')
        GROUP BY a.user_id
      ) quiz_stats ON quiz_stats.user_id = u.id

      -- Subquery for Practice Coding performance & time
      LEFT JOIN (
        SELECT 
          best_cs.student_id,
          SUM(best_cs.max_score) AS coding_points,
          COUNT(DISTINCT CASE WHEN best_cs.is_solved = 1 THEN best_cs.problem_id END) AS problems_solved,
          SUM(best_cs.execution_seconds) AS coding_time_seconds
        FROM (
          SELECT 
            student_id,
            problem_id,
            MAX(COALESCE(marks, score, 0)) AS max_score,
            MAX(CASE WHEN status IN ('accepted', 'passed') OR (passed_test_cases = total_test_cases AND total_test_cases > 0) THEN 1 ELSE 0 END) AS is_solved,
            ROUND(AVG(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(execution_details, '$.execution_time_ms')), 250)) / 1000, 2) AS execution_seconds
          FROM coding_submissions
          GROUP BY student_id, problem_id
        ) best_cs
        GROUP BY best_cs.student_id
      ) practice_stats ON practice_stats.student_id = u.id

      -- Subquery for Coursework Tasks performance & time
      LEFT JOIN (
        SELECT 
          ts.user_id,
          SUM(COALESCE(ts.marks_obtained, ts.score, 0)) AS task_points,
          COUNT(DISTINCT CASE WHEN LOWER(ts.status) IN ('passed', 'completed') THEN ts.task_id END) AS tasks_completed,
          COUNT(ts.id) * 300 AS task_time_seconds
        FROM task_submissions ts
        GROUP BY ts.user_id
      ) task_stats ON task_stats.user_id = u.id

      WHERE u.role IN ('student', 'STUDENT')
        AND COALESCE(u.is_approved, 0) = 1
        AND COALESCE(u.is_active, 1) = 1
    `;

    const params = [];
    if (college_id) {
      sql += ' AND (s.college_id = ? OR s.college_id IS NULL)';
      params.push(parseInt(college_id, 10));
    }
    if (department_id) {
      sql += ' AND (s.department_id = ? OR d.name = ?)';
      params.push(parseInt(department_id, 10), String(department_id));
    }
    if (batch_id) {
      sql += ' AND s.batch_id = ?';
      params.push(parseInt(batch_id, 10));
    }
    if (mentor_id) {
      sql += ` AND (
        s.mentor_id = ?
        OR u.mentor_id = ?
        OR (s.mentor_name IS NOT NULL AND LOWER(s.mentor_name) = LOWER(?))
        OR (u.mentor_name IS NOT NULL AND LOWER(u.mentor_name) = LOWER(?))
        OR s.user_id IN (SELECT student_id FROM mentor_student_assignments WHERE mentor_id = ?)
        OR s.user_id IN (SELECT student_id FROM mentor_assignments WHERE mentor_id = ? OR LOWER(mentor_name) = LOWER(?) OR LOWER(mentor_email) = LOWER(?))
        OR s.batch_id IN (SELECT id FROM batches WHERE mentor = ? OR trainer = ? OR LOWER(mentor) = LOWER(?))
      )`;
      params.push(
        mentor_id,
        mentor_id,
        mentor_name || '',
        mentor_name || '',
        mentor_id,
        mentor_id,
        mentor_name || '',
        mentor_email || '',
        mentor_name || '',
        mentor_name || '',
        mentor_name || ''
      );
    }

    sql += ' ORDER BY u.created_at ASC, u.id ASC';

    const rows = await query(sql, params);

    if (rows && Array.isArray(rows) && rows.length > 0) {
      return rows.map((r) => {
        const quizPoints = Math.round(Number(r.quiz_points) || 0);
        const codingPoints = Math.round(Number(r.coding_points) || 0);
        const taskPoints = Math.round(Number(r.task_points) || 0);
        const totalPoints = quizPoints + codingPoints + taskPoints;

        const quizTimeSeconds = Math.round(Number(r.quiz_time_seconds) || 0);
        const codingTimeSeconds = Math.round(Number(r.coding_time_seconds) || 0);
        const taskTimeSeconds = Math.round(Number(r.task_time_seconds) || 0);
        const totalTimeSeconds = quizTimeSeconds + codingTimeSeconds + taskTimeSeconds;

        const quizScore = Math.round(Number(r.quiz_score) || 0);
        const interviewScore = Math.round(Number(r.interview_score) || 0);
        const attendanceScore = Math.round(Number(r.attendance_score) || 0);

        const overall = totalPoints > 0 
          ? totalPoints 
          : calculateOverallScore({
              quiz_score: quizScore,
              coding_score: codingPoints > 0 ? Math.min(100, codingPoints) : 0,
              interview_score: interviewScore,
              attendance_score: attendanceScore,
            });

        return {
          id: r.user_id || r.student_id,
          student_id: r.student_id,
          user_id: r.user_id,
          user_created_at: r.user_created_at,
          name: formatStudentName(r.name, r.email),
          roll_number: r.roll_number || 'N/A',
          college_id: r.college_id,
          college_name: r.college_name || 'College',
          department_id: r.department_id,
          department_name: r.department_name || 'General',
          batch_id: r.batch_id,
          batch_name: r.batch_name || 'General Batch',

          quiz_points: quizPoints,
          quizzes_taken: Number(r.quizzes_taken) || 0,
          quiz_score: quizScore,
          quiz_time_seconds: quizTimeSeconds,
          quiz_time_formatted: formatDurationSeconds(quizTimeSeconds),

          coding_points: codingPoints,
          problems_solved: Number(r.problems_solved) || 0,
          coding_time_seconds: codingTimeSeconds,
          coding_time_formatted: formatDurationSeconds(codingTimeSeconds),

          task_points: taskPoints,
          tasks_completed: Number(r.tasks_completed) || 0,
          task_time_seconds: taskTimeSeconds,
          task_time_formatted: formatDurationSeconds(taskTimeSeconds),

          total_points: totalPoints,
          total_time_seconds: totalTimeSeconds,
          total_time_formatted: formatDurationSeconds(totalTimeSeconds),

          interview_score: interviewScore,
          interviews_count: Number(r.interviews_count) || 0,
          attendance_score: attendanceScore,
          overall_score: overall,
          score: overall,

          milestones_completed: Number(r.milestones_completed) || 0,
          total_milestones: Number(r.total_milestones) || 0,
          initials: getInitials(r.name),
        };
      });
    }
  } catch (error) {
    console.warn(`[Leaderboard Service] DB query fallback: ${error.message}`);
  }

  // Fallback Dataset Filtering
  return fallbackStudents
    .filter((s) => {
      if (college_id && s.college_id !== parseInt(college_id, 10)) return false;
      if (
        department_id &&
        s.department_id !== parseInt(department_id, 10) &&
        s.department_name.toLowerCase() !== String(department_id).toLowerCase()
      ) {
        return false;
      }
      if (batch_id && s.batch_id !== parseInt(batch_id, 10)) return false;
      return true;
    })
    .map((s) => {
      const overall = calculateOverallScore(s);
      return {
        ...s,
        overall_score: overall,
      };
    });
};

/**
 * 1. OVERALL LEADERBOARD
 */
export const getOverallLeaderboard = async (filters = {}) => {
  const students = await getStudentsRawPerformance(filters);

  if (!students || students.length === 0) return [];

  const mapped = students.map((s) => ({
    id: s.user_id || s.id,
    student_id: s.student_id || s.id,
    user_created_at: s.user_created_at,
    name: s.name,
    roll_number: s.roll_number,
    sub: s.department_name,
    department: s.department_name,
    college: s.college_name,
    college_id: s.college_id,
    batch: s.batch_name,
    score: s.score || s.total_points || s.overall_score || 0,
    overall_score: s.overall_score || 0,
    total_points: s.total_points || 0,
    total_time_seconds: s.total_time_seconds || 0,
    total_time_formatted: s.total_time_formatted || '0s',
    quiz_points: s.quiz_points || 0,
    quizzes_taken: s.quizzes_taken || 0,
    quiz_score: s.quiz_score || 0,
    quiz_time_seconds: s.quiz_time_seconds || 0,
    quiz_time_formatted: s.quiz_time_formatted || '0s',
    coding_points: s.coding_points || 0,
    problems_solved: s.problems_solved || 0,
    coding_time_seconds: s.coding_time_seconds || 0,
    coding_time_formatted: s.coding_time_formatted || '0s',
    task_points: s.task_points || 0,
    tasks_completed: s.tasks_completed || 0,
    task_time_seconds: s.task_time_seconds || 0,
    task_time_formatted: s.task_time_formatted || '0s',
    interview_score: s.interview_score || 0,
    interviews_count: s.interviews_count || 0,
    attendance_score: s.attendance_score || 0,
    initials: getInitials(s.name),
    progress_info: {
      quiz_points: s.quiz_points || 0,
      quiz_time: s.quiz_time_formatted || '0s',
      coding_points: s.coding_points || 0,
      coding_time: s.coding_time_formatted || '0s',
      task_points: s.task_points || 0,
      total_time: s.total_time_formatted || '0s',
    },
  }));

  return applyStandardTieRanking(mapped, 'score', 'total_time_seconds');
};

/**
 * 2. DEPARTMENT LEADERBOARD (Department Isolation & College Isolation)
 */
export const getDepartmentLeaderboard = async (filters = {}) => {
  const { department_id } = filters;

  const students = await getStudentsRawPerformance(filters);

  if (!students || students.length === 0) return [];

  // Filter specifically if department_id was passed
  let filtered = students;
  if (department_id) {
    filtered = students.filter(
      (s) =>
        s.department_id === parseInt(department_id, 10) ||
        s.department_name.toLowerCase() === String(department_id).toLowerCase()
    );
  }

  const mapped = filtered.map((s) => ({
    id: s.user_id || s.id,
    student_id: s.student_id || s.id,
    user_created_at: s.user_created_at,
    name: s.name,
    roll_number: s.roll_number,
    sub: s.department_name,
    department: s.department_name,
    college: s.college_name,
    college_id: s.college_id,
    batch: s.batch_name,
    score: s.score || s.total_points || s.overall_score || 0,
    overall_score: s.overall_score || 0,
    total_points: s.total_points || 0,
    total_time_seconds: s.total_time_seconds || 0,
    total_time_formatted: s.total_time_formatted || '0s',
    quiz_points: s.quiz_points || 0,
    quizzes_taken: s.quizzes_taken || 0,
    quiz_score: s.quiz_score || 0,
    quiz_time_seconds: s.quiz_time_seconds || 0,
    quiz_time_formatted: s.quiz_time_formatted || '0s',
    coding_points: s.coding_points || 0,
    problems_solved: s.problems_solved || 0,
    coding_time_seconds: s.coding_time_seconds || 0,
    coding_time_formatted: s.coding_time_formatted || '0s',
    task_points: s.task_points || 0,
    tasks_completed: s.tasks_completed || 0,
    task_time_seconds: s.task_time_seconds || 0,
    task_time_formatted: s.task_time_formatted || '0s',
    interview_score: s.interview_score || 0,
    interviews_count: s.interviews_count || 0,
    attendance_score: s.attendance_score || 0,
    initials: getInitials(s.name),
  }));

  return applyStandardTieRanking(mapped, 'score', 'total_time_seconds');
};

/**
 * 3. MILESTONE LEADERBOARD (Real milestone progress or empty response)
 */
export const getMilestoneLeaderboard = async (filters = {}) => {
  const students = await getStudentsRawPerformance(filters);

  if (!students || students.length === 0) return [];

  const mapped = students
    .map((s) => {
      const total = s.total_milestones || 0;
      const completed = s.milestones_completed || 0;
      const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: s.user_id || s.id,
        student_id: s.student_id || s.id,
        user_created_at: s.user_created_at,
        name: s.name,
        roll_number: s.roll_number,
        sub: s.department_name,
        department: s.department_name,
        college: s.college_name,
        college_id: s.college_id,
        batch: s.batch_name,
        milestones_completed: completed,
        total_milestones: total,
        progress_pct: progressPct,
        score: progressPct,
        overall_score: s.overall_score || 0,
        initials: getInitials(s.name),
      };
    });

  return applyStandardTieRanking(mapped, 'progress_pct');
};

/**
 * 4. TOP BATCHES LEADERBOARD
 */
export const getTopBatchesLeaderboard = async (filters = {}) => {
  const students = await getStudentsRawPerformance(filters);

  if (!students || students.length === 0) return [];

  const batchMap = new Map();

  students.forEach((s) => {
    const bName = s.batch_name || 'General Batch';
    if (!batchMap.has(bName)) {
      batchMap.set(bName, {
        name: bName,
        college: s.college_name || 'College',
        students: 0,
        totalScore: 0,
        quizScore: 0,
        codingScore: 0,
        interviewScore: 0,
        attendanceScore: 0,
        initials: bName.substring(0, 2).toUpperCase(),
      });
    }
    const b = batchMap.get(bName);
    b.students += 1;
    b.totalScore += s.overall_score;
    b.quizScore += (s.quiz_score || 0);
    b.codingScore += (s.coding_score || 0);
    b.interviewScore += (s.interview_score || 0);
    b.attendanceScore += (s.attendance_score || 0);
  });

  const batches = Array.from(batchMap.values()).map((b) => ({
    name: b.name,
    college: b.college,
    students: b.students,
    score: Math.round(b.totalScore / b.students),
    avg_quiz: Math.round(b.quizScore / b.students),
    avg_coding: Math.round(b.codingScore / b.students),
    avg_interview: Math.round(b.interviewScore / b.students),
    avg_attendance: Math.round(b.attendanceScore / b.students),
    initials: b.initials,
  }));

  return applyStandardTieRanking(batches, 'score');
};

/**
 * 5. COMPLETE LEADERBOARD SUITE WITH ROLE ACCESS & STUDENT CONTEXT
 */
export const getCompleteLeaderboardData = async (user = {}, queryParams = {}) => {
  const role = user.role || ROLES.STUDENT;
  const userCollegeId = user.college_id || user.collegeId;
  const currentUserId = user.userId || user.id || 6;

  // Build filter options based on role permissions
  const filters = {
    college_id: queryParams.college_id,
    department_id: queryParams.department_id || queryParams.department,
    batch_id: queryParams.batch_id,
  };

  // Role Isolation Enforcement
  if (role === ROLES.COLLEGE_ADMIN || role === ROLES.COORDINATOR) {
    if (userCollegeId) {
      filters.college_id = userCollegeId;
    }
    if (role === ROLES.COORDINATOR && !filters.department_id && (user.department_id || user.department)) {
      filters.department_id = user.department_id || user.department;
    }
  } else if (role === ROLES.MENTOR) {
    if (userCollegeId) {
      filters.college_id = userCollegeId;
    }
    filters.mentor_id = user.userId || user.id;
    filters.mentor_name = user.name || '';
    filters.mentor_email = user.email || '';
  } else if (role === ROLES.STUDENT) {
    if (userCollegeId) {
      filters.college_id = userCollegeId;
    }
  }

  // Fetch all leaderboards concurrently
  const [overall, department, milestone, topBatches] = await Promise.all([
    getOverallLeaderboard(filters),
    getDepartmentLeaderboard(filters),
    getMilestoneLeaderboard(filters),
    getTopBatchesLeaderboard(filters),
  ]);

  // Mark `isCurrentUser` flag on entries
  const markCurrentUser = (list) =>
    list.map((item) => ({
      ...item,
      isCurrentUser: item.id === currentUserId || item.user_id === currentUserId,
    }));

  const markedOverall = markCurrentUser(overall);
  const markedDept = markCurrentUser(department);
  const markedMilestone = markCurrentUser(milestone);

  // Student specific ranking context & nearby ranks
  let studentContext = null;

  const currentStudentInOverall = markedOverall.find((s) => s.isCurrentUser);
  if (currentStudentInOverall || role === ROLES.STUDENT) {
    const studentEntry = currentStudentInOverall || markedOverall[0] || {};
    const myRank = studentEntry.rank || 1;
    const myScore = studentEntry.score !== undefined ? studentEntry.score : (studentEntry.overall_score !== undefined ? studentEntry.overall_score : 0);

    // Get nearby students surrounding rank (e.g. ±2 ranks)
    const totalStudents = markedOverall.length;
    const userIndex = markedOverall.findIndex((s) => s.isCurrentUser);

    let nearby = [];
    if (userIndex !== -1) {
      const start = Math.max(0, userIndex - 2);
      const end = Math.min(totalStudents, userIndex + 3);
      nearby = markedOverall.slice(start, end);
    } else {
      nearby = markedOverall.slice(0, Math.min(5, totalStudents));
    }

    studentContext = {
      myRank: {
        overallRank: myRank,
        departmentRank: (markedDept.find((s) => s.isCurrentUser) || {}).rank || 1,
        milestoneRank: (markedMilestone.find((s) => s.isCurrentUser) || {}).rank || 1,
        score: myScore,
        totalStudents,
      },
      nearby,
    };
  }

  return {
    overall: markedOverall,
    department: markedDept,
    milestone: markedMilestone,
    topBatches,
    studentContext,
  };
};
