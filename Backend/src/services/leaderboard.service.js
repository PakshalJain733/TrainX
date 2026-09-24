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

/**
 * Helper to get student initials for frontend UI avatars
 */
const getInitials = (name) => {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Standard Competition Ranking with registration order (user_created_at / user_id ASC) as tie-breaker
 */
const applyStandardTieRanking = (items, scoreKey = 'score') => {
  if (!items || items.length === 0) return [];

  // Sort: Primary by score DESC, secondary by registration order (earliest registered student comes first)
  items.sort((a, b) => {
    if (b[scoreKey] !== a[scoreKey]) {
      return (b[scoreKey] || 0) - (a[scoreKey] || 0);
    }
    const aTime = a.user_created_at ? new Date(a.user_created_at).getTime() : (a.user_id || a.student_id || a.id || 0);
    const bTime = b.user_created_at ? new Date(b.user_created_at).getTime() : (b.user_id || b.student_id || b.id || 0);
    return aTime - bTime;
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
  const { college_id, department_id, batch_id } = filters;

  try {
    let sql = `
      SELECT 
        s.id AS student_id,
        s.user_id,
        u.name,
        u.email,
        u.created_at AS user_created_at,
        s.roll_number,
        s.college_id,
        c.name AS college_name,
        s.department_id,
        COALESCE(d.name, s.department) AS department_name,
        s.batch_id,
        b.name AS batch_name,
        (
          SELECT COALESCE(AVG(a.percentage), 0) 
          FROM assessment_attempts a 
          WHERE a.user_id = u.id AND a.status IN ('completed', 'finished', 'passed')
        ) AS quiz_score,
        (
          SELECT COALESCE(AVG(ts.score), 0) 
          FROM task_submissions ts 
          WHERE ts.user_id = u.id
        ) AS coding_score,
        (
          SELECT COALESCE(AVG(iv.overall_score), 0) 
          FROM interview_sessions iv 
          WHERE iv.user_id = u.id
        ) AS interview_score,
        (
          SELECT COALESCE(
            (SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) / COUNT(att.id)) * 100, 
            0
          ) 
          FROM attendance att 
          WHERE att.user_id = u.id
        ) AS attendance_score,
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
      JOIN students s ON u.id = s.user_id
      LEFT JOIN colleges c ON s.college_id = c.id
      LEFT JOIN departments d ON s.department_id = d.id
      LEFT JOIN batches b ON s.batch_id = b.id
      WHERE u.role IN ('student', 'STUDENT')
    `;

    const params = [];
    if (college_id) {
      sql += ' AND s.college_id = ?';
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

    sql += ' ORDER BY u.created_at ASC, u.id ASC';

    const rows = await query(sql, params);

    if (rows && Array.isArray(rows) && rows.length > 0) {
      return rows.map((r) => {
        const quizScore = Math.round(Number(r.quiz_score) || 0);
        const codingScore = Math.round(Number(r.coding_score) || 0);
        const interviewScore = Math.round(Number(r.interview_score) || 0);
        const attendanceScore = Math.round(Number(r.attendance_score) || 0);

        const overall = calculateOverallScore({
          quiz_score: quizScore,
          coding_score: codingScore,
          interview_score: interviewScore,
          attendance_score: attendanceScore,
        });

        return {
          id: r.user_id || r.student_id,
          student_id: r.student_id,
          user_id: r.user_id,
          user_created_at: r.user_created_at,
          name: r.name,
          roll_number: r.roll_number || 'N/A',
          college_id: r.college_id,
          college_name: r.college_name || 'College',
          department_id: r.department_id,
          department_name: r.department_name || 'General',
          batch_id: r.batch_id,
          batch_name: r.batch_name || 'General Batch',
          quiz_score: quizScore,
          coding_score: codingScore,
          interview_score: interviewScore,
          attendance_score: attendanceScore,
          overall_score: overall,
          milestones_completed: Number(r.milestones_completed) || 0,
          total_milestones: Number(r.total_milestones) || 0,
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
    score: s.overall_score || 0,
    overall_score: s.overall_score || 0,
    quiz_score: s.quiz_score || 0,
    coding_score: s.coding_score || 0,
    interview_score: s.interview_score || 0,
    attendance_score: s.attendance_score || 0,
    initials: getInitials(s.name),
    progress_info: {
      quiz_score: s.quiz_score || 0,
      coding_score: s.coding_score || 0,
      interview_score: s.interview_score || 0,
      attendance_score: s.attendance_score || 0,
    },
  }));

  return applyStandardTieRanking(mapped, 'score');
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
    score: s.overall_score || 0,
    overall_score: s.overall_score || 0,
    quiz_score: s.quiz_score || 0,
    coding_score: s.coding_score || 0,
    interview_score: s.interview_score || 0,
    attendance_score: s.attendance_score || 0,
    initials: getInitials(s.name),
  }));

  return applyStandardTieRanking(mapped, 'score');
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
    // Lock to user's college
    filters.college_id = userCollegeId || 1;
  } else if (role === ROLES.MENTOR) {
    // Lock to mentor's college or batch
    if (!filters.college_id && userCollegeId) {
      filters.college_id = userCollegeId;
    }
  } else if (role === ROLES.STUDENT) {
    // Lock student to their own college
    if (!filters.college_id && userCollegeId) {
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
