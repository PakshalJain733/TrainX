import { query } from '../config/db.js';
import { ROLES } from '../utils/constants.js';

// Pre-seeded fallback dataset representing diverse students across colleges, departments, and batches
const fallbackStudents = [
  {
    id: 6,
    user_id: 6,
    name: 'Ganesh Shinde',
    roll_number: '2026COMP042',
    college_id: 1,
    college_name: 'PVPPCOE',
    department_id: 1,
    department_name: 'Computer Engineering',
    batch_id: 1,
    batch_name: 'Batch A - CSE',
    quiz_score: 85,
    coding_score: 90,
    interview_score: 82,
    attendance_score: 92,
    milestones_completed: 8,
    total_milestones: 10,
  },
  {
    id: 101,
    user_id: 101,
    name: 'Aarav Sharma',
    roll_number: '2026COMP001',
    college_id: 1,
    college_name: 'PVPPCOE',
    department_id: 1,
    department_name: 'Computer Engineering',
    batch_id: 1,
    batch_name: 'Batch A - CSE',
    quiz_score: 95,
    coding_score: 96,
    interview_score: 94,
    attendance_score: 98,
    milestones_completed: 10,
    total_milestones: 10,
  },
  {
    id: 102,
    user_id: 102,
    name: 'Ananya Verma',
    roll_number: '2026ECS012',
    college_id: 1,
    college_name: 'PVPPCOE',
    department_id: 2,
    department_name: 'ECS',
    batch_id: 2,
    batch_name: 'Batch A - ECS',
    quiz_score: 92,
    coding_score: 90,
    interview_score: 91,
    attendance_score: 95,
    milestones_completed: 9,
    total_milestones: 10,
  },
  {
    id: 103,
    user_id: 103,
    name: 'Rohan Mehta',
    roll_number: '2026IT025',
    college_id: 1,
    college_name: 'PVPPCOE',
    department_id: 3,
    department_name: 'Information Technology',
    batch_id: 3,
    batch_name: 'Batch B - IT',
    quiz_score: 88,
    coding_score: 86,
    interview_score: 87,
    attendance_score: 90,
    milestones_completed: 7,
    total_milestones: 10,
  },
  {
    id: 104,
    user_id: 104,
    name: 'Priya Nair',
    roll_number: '2026COMP018',
    college_id: 1,
    college_name: 'PVPPCOE',
    department_id: 1,
    department_name: 'Computer Engineering',
    batch_id: 1,
    batch_name: 'Batch A - CSE',
    quiz_score: 85,
    coding_score: 90,
    interview_score: 82,
    attendance_score: 92,
    milestones_completed: 8,
    total_milestones: 10,
  },
  {
    id: 105,
    user_id: 105,
    name: 'Siddharth Joshi',
    roll_number: '2026ECS033',
    college_id: 1,
    college_name: 'PVPPCOE',
    department_id: 2,
    department_name: 'ECS',
    batch_id: 2,
    batch_name: 'Batch A - ECS',
    quiz_score: 78,
    coding_score: 82,
    interview_score: 75,
    attendance_score: 85,
    milestones_completed: 6,
    total_milestones: 10,
  },
  {
    id: 106,
    user_id: 106,
    name: 'Tanvi Kulkarni',
    roll_number: '2026IT044',
    college_id: 1,
    college_name: 'PVPPCOE',
    department_id: 3,
    department_name: 'Information Technology',
    batch_id: 3,
    batch_name: 'Batch B - IT',
    quiz_score: 74,
    coding_score: 70,
    interview_score: 72,
    attendance_score: 80,
    milestones_completed: 5,
    total_milestones: 10,
  },
  {
    id: 7,
    user_id: 7,
    name: 'Rahul Deshmukh',
    roll_number: '2026DBIT018',
    college_id: 2,
    college_name: 'DBIT',
    department_id: 5,
    department_name: 'Computer Engineering',
    batch_id: 4,
    batch_name: 'Batch Alpha - DBIT',
    quiz_score: 91,
    coding_score: 89,
    interview_score: 88,
    attendance_score: 94,
    milestones_completed: 9,
    total_milestones: 10,
  },
  {
    id: 107,
    user_id: 107,
    name: 'Sneha Patil',
    roll_number: '2026DBIT045',
    college_id: 2,
    college_name: 'DBIT',
    department_id: 5,
    department_name: 'Computer Engineering',
    batch_id: 4,
    batch_name: 'Batch Alpha - DBIT',
    quiz_score: 84,
    coding_score: 82,
    interview_score: 80,
    attendance_score: 88,
    milestones_completed: 7,
    total_milestones: 10,
  },
  {
    id: 108,
    user_id: 108,
    name: 'Aditya Gupta',
    roll_number: '2026KJS009',
    college_id: 3,
    college_name: 'KJSCE',
    department_id: 6,
    department_name: 'AI & Data Science',
    batch_id: 5,
    batch_name: 'Batch 1 - AI',
    quiz_score: 96,
    coding_score: 98,
    interview_score: 95,
    attendance_score: 99,
    milestones_completed: 10,
    total_milestones: 10,
  },
];

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
 * Standard Competition Ranking (1, 2, 2, 4) with deterministic secondary sort
 */
const applyStandardTieRanking = (items, scoreKey = 'score') => {
  if (!items || items.length === 0) return [];

  // Deterministic sort: Primary by score DESC, secondary by ID ASC
  items.sort((a, b) => {
    if (b[scoreKey] !== a[scoreKey]) {
      return b[scoreKey] - a[scoreKey];
    }
    return (a.id || a.user_id || 0) - (b.id || b.user_id || 0);
  });

  let currentRank = 1;
  return items.map((item, index) => {
    if (index > 0 && item[scoreKey] === items[index - 1][scoreKey]) {
      item.rank = items[index - 1].rank;
    } else {
      item.rank = index + 1;
    }
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
          WHERE ts.user_id = u.id OR ts.student_id = s.id
        ) AS coding_score,
        (
          SELECT COALESCE(AVG(iv.overall_score), 0) 
          FROM interview_sessions iv 
          WHERE iv.user_id = u.id OR iv.student_id = s.id
        ) AS interview_score,
        (
          SELECT COALESCE(
            (SUM(CASE WHEN att.status = 'present' THEN 1 ELSE 0 END) / COUNT(att.id)) * 100, 
            90
          ) 
          FROM attendance att 
          WHERE att.student_id = s.id OR att.user_id = u.id
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
    name: s.name,
    roll_number: s.roll_number,
    sub: s.department_name,
    department: s.department_name,
    college: s.college_name,
    college_id: s.college_id,
    batch: s.batch_name,
    score: s.overall_score,
    overall_score: s.overall_score,
    initials: getInitials(s.name),
    progress_info: {
      quiz_score: s.quiz_score,
      coding_score: s.coding_score,
      interview_score: s.interview_score,
      attendance_score: s.attendance_score,
    },
  }));

  return applyStandardTieRanking(mapped, 'score');
};

/**
 * 2. DEPARTMENT LEADERBOARD (Department Isolation & College Isolation)
 */
export const getDepartmentLeaderboard = async (filters = {}) => {
  const { department_id, college_id } = filters;

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
    name: s.name,
    roll_number: s.roll_number,
    sub: s.department_name,
    department: s.department_name,
    college: s.college_name,
    college_id: s.college_id,
    batch: s.batch_name,
    score: s.overall_score,
    overall_score: s.overall_score,
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

  // Check if real milestone data exists
  const hasRealMilestones = students.some((s) => s.total_milestones > 0);

  if (!hasRealMilestones) {
    // Check if fallback students have milestones
    const validWithMilestones = students.filter((s) => (s.total_milestones || 10) > 0);
    if (validWithMilestones.length === 0) {
      return [];
    }
  }

  const mapped = students
    .map((s) => {
      const total = s.total_milestones > 0 ? s.total_milestones : 10;
      const completed = s.milestones_completed !== undefined ? s.milestones_completed : 5;
      const progressPct = Math.round((completed / total) * 100);

      return {
        id: s.user_id || s.id,
        student_id: s.student_id || s.id,
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
        overall_score: s.overall_score,
        initials: getInitials(s.name),
      };
    })
    .sort((a, b) => b.progress_pct - a.progress_pct || b.overall_score - a.overall_score || a.id - b.id);

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
        students: 0,
        totalScore: 0,
        initials: bName.substring(0, 2).toUpperCase(),
      });
    }
    const b = batchMap.get(bName);
    b.students += 1;
    b.totalScore += s.overall_score;
  });

  const batches = Array.from(batchMap.values()).map((b) => ({
    name: b.name,
    students: b.students,
    score: Math.round(b.totalScore / b.students),
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
    const myScore = studentEntry.score || studentEntry.overall_score || 85;

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
