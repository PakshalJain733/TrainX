import { sendSuccess, sendError } from '../utils/response.js';
import {
  getAllUsersModel,
  findUserById,
  getStudentByUserId,
  updateUserModel,
} from '../models/user.model.js';
import { ROLES } from '../utils/constants.js';

export const getStudentData = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Student data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const user = await findUserById(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    const studentProfile = await getStudentByUserId(userId);
    return sendSuccess(res, 'Student profile retrieved successfully', {
      ...user,
      studentProfile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStudentProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const updated = await updateUserModel(userId, req.body);
    return sendSuccess(res, 'Student profile updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboard = async (req, res, next) => {
  try {
    const collegeId = req.user.collegeId || 1;
    // Multi-college isolation: retrieve students from the same college
    const allUsers = await getAllUsersModel(collegeId);
    const students = allUsers.filter((u) => u.role === ROLES.STUDENT);

    const callerId = req.user.userId || req.user.id;

    // Build real leaderboard from registered students in this college
    const realLeaderboard = students.map((s, idx) => ({
      rank: idx + 1,
      name: s.name,
      score: `${(1500 + (students.length - idx) * 75).toLocaleString()} XP`,
      initials: s.name ? s.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST',
      badge: idx === 0 ? '🥇 Rank 1' : idx === 1 ? '🥈 Rank 2' : idx === 2 ? '🥉 Rank 3' : `Top ${Math.min(20, (idx + 1) * 5)}%`,
      you: s.id === callerId,
    }));

    const currentStudentIdx = students.findIndex((s) => s.id === callerId);
    const currentRank = currentStudentIdx !== -1 ? `${currentStudentIdx + 1} / ${students.length}` : `1 / ${Math.max(1, students.length)}`;

    const dashboardData = {
      attendanceSummary: {
        percentage: 95,
      },
      codingProgress: {
        currentRank,
      },
      upcomingDeadlines: [],
      leaderboard: realLeaderboard,
    };

    return sendSuccess(res, 'Student dashboard retrieved successfully', dashboardData);
  } catch (error) {
    next(error);
  }
};

import { getPracticeProblemsModel } from '../models/practiceProblem.model.js';

export const getStudentPracticeProblems = async (req, res, next) => {
  try {
    const dbProblems = await getPracticeProblemsModel();
    if (dbProblems && dbProblems.length > 0) {
      const mapped = dbProblems.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category || 'General DSA',
        difficulty: p.difficulty,
        points: p.points || 100,
        solve_status: 'Unsolved',
      }));
      return sendSuccess(res, 'Practice problems retrieved successfully', mapped);
    }

    const fallbackProblems = [
      { id: 1, title: 'Two Sum', category: 'Arrays & Hashing', difficulty: 'Easy', points: 100, solve_status: 'Solved' },
      { id: 2, title: 'Valid Palindrome', category: 'Two Pointers', difficulty: 'Easy', points: 100, solve_status: 'Solved' },
      { id: 3, title: 'Longest Substring Without Repeating Characters', category: 'Sliding Window', difficulty: 'Medium', points: 150, solve_status: 'Unsolved' },
      { id: 4, title: 'Reverse Linked List', category: 'Linked List', difficulty: 'Easy', points: 100, solve_status: 'Solved' },
      { id: 5, title: 'Maximum Subarray (Kadane\'s Algorithm)', category: 'Dynamic Programming', difficulty: 'Medium', points: 150, solve_status: 'Unsolved' },
      { id: 6, title: 'Binary Tree Level Order Traversal', category: 'Trees & Graphs', difficulty: 'Medium', points: 150, solve_status: 'Unsolved' },
      { id: 7, title: 'Merge k Sorted Lists', category: 'Heap / Priority Queue', difficulty: 'Hard', points: 250, solve_status: 'Unsolved' },
      { id: 8, title: 'Trapping Rain Water', category: 'Two Pointers', difficulty: 'Hard', points: 250, solve_status: 'Unsolved' },
    ];
    return sendSuccess(res, 'Practice problems retrieved successfully', fallbackProblems);
  } catch (error) {
    next(error);
  }
};

export const getStudentAttendance = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    let verifications = [];
    let recentLogs = [];
    let totalClasses = 0;
    let presentClasses = 0;
    let absentClasses = 0;

    if (userId) {
      // 1. Query Leave Requests for this user from DB
      try {
        const leaves = await query(
          `SELECT id, category, start_date, end_date, days, reason, status, created_at
           FROM leave_requests WHERE user_id = ? ORDER BY id DESC`,
          [userId]
        );
        if (leaves && leaves.length > 0) {
          verifications = leaves.map(l => ({
            id: `LV-2026-${l.id}`,
            title: `${l.category} · ${l.reason ? l.reason.substring(0, 30) : 'Leave Request'}`,
            category: l.category,
            status: l.status,
            days: l.days,
            date: l.start_date
          }));
        }
      } catch (e) {
        console.error("[getStudentAttendance leave query error]", e.message);
      }

      // 2. Query Attendance logs for user's joined batches from DB
      try {
        const rows = await query(
          `SELECT a.*, b.name AS batch_name, b.code AS batch_code
           FROM attendance a
           LEFT JOIN batches b ON a.batch_id = b.id
           WHERE a.user_id = ?
           ORDER BY a.session_date DESC, a.id DESC`,
          [userId]
        );
        if (rows && rows.length > 0) {
          totalClasses = rows.length;
          presentClasses = rows.filter(r => String(r.status).toLowerCase() === 'present').length;
          absentClasses = rows.filter(r => String(r.status).toLowerCase() === 'absent').length;

          recentLogs = rows.map(r => ({
            id: r.id,
            date: r.session_date ? new Date(r.session_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Sep 06, 2026',
            session: `${r.batch_name || 'Training Cohort'} · Training Session`,
            time: '10:00 AM - 12:00 PM',
            status: r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Present',
            mode: 'Biometric / QR'
          }));
        }
      } catch (e) {
        console.error("[getStudentAttendance attendance query error]", e.message);
      }
    }

    // Query database leave requests if available
    try {
      const leaveRows = await query(
        `SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      if (leaveRows && leaveRows.length > 0) {
        verifications = leaveRows.map(l => ({
          id: `LV-${l.id}`,
          title: l.title,
          category: l.category || 'General Leave',
          status: l.status || 'Pending',
          days: l.days || 1,
          date: l.start_date ? new Date(l.start_date).toISOString().split('T')[0] : '2026-03-01'
        }));
      }
    } catch (e) {
      console.error("[getStudentAttendance leave_requests query error]", e.message);
    }

    const percentage = calculateAttendancePercentage(presentClasses, totalClasses);

    const attendanceData = {
      percentage,
      totalClasses,
      presentClasses,
      absentClasses,
      verifications,
      recentLogs,
    };
    return sendSuccess(res, 'Attendance data retrieved successfully', attendanceData);
  } catch (error) {
    next(error);
  }
};

export const applyStudentLeave = async (req, res, next) => {
  try {
    const { category, startDate, endDate, days, reason, attachment } = req.body;
    const newLeave = {
      id: `LV-2026-${Math.floor(100 + Math.random() * 900)}`,
      category: category || 'Medical Leave',
      startDate,
      endDate: endDate || startDate,
      days: days || 1,
      reason: reason || 'Personal Leave',
      attachment: attachment || null,
      status: 'Pending',
      submittedAt: new Date().toISOString(),
    };
    return sendSuccess(res, 'Leave application submitted successfully', newLeave, 201);
  } catch (error) {
    next(error);
  }
};

export const getStudentNotifications = async (req, res, next) => {
  try {
    const notifications = [
      {
        id: 1,
        title: 'New Coding Assessment Available',
        message: 'Sprint 3 Technical Assessment is now live. Complete before Friday 11:59 PM.',
        time: '10 mins ago',
        type: 'assessment',
        read: false,
      },
      {
        id: 2,
        title: 'Roadmap Milestone Unlocked',
        message: 'Congratulations! You unlocked Milestone 2: Statistical Foundations.',
        time: '2 hours ago',
        type: 'roadmap',
        read: false,
      },
      {
        id: 3,
        title: 'Attendance Marked Present',
        message: 'Your biometric check-in was verified for DSA Lab session.',
        time: '5 hours ago',
        type: 'attendance',
        read: true,
      },
    ];
    return sendSuccess(res, 'Notifications retrieved successfully', notifications);
  } catch (error) {
    next(error);
  }
};

export const getStudentPerformance = async (req, res, next) => {
  try {
    const performanceData = {
      overallScore: 85,
      codingScore: 88,
      quizScore: 82,
      interviewScore: 84,
      ranking: 12,
      totalStudents: 150,
      monthlyProgress: [
        { month: 'Jan', score: 75 },
        { month: 'Feb', score: 80 },
        { month: 'Mar', score: 85 },
      ],
    };
    return sendSuccess(res, 'Performance data retrieved successfully', performanceData);
  } catch (error) {
    next(error);
  }
};

