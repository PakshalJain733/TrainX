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
    const attendanceData = {
      percentage: 68.4,
      totalClasses: 50,
      presentClasses: 34,
      absentClasses: 14,
      excusedClasses: 2,
      status: "Needs Attention",
      subjects: [
        { id: "s1", code: "CS-301", name: "Data Structures & Algorithms", faculty: "Prof. Sharma", total: 20, attended: 15, absent: 5, excused: 0, pct: 75, safeMargin: "Safe Margin: -1 Class" },
        { id: "s2", code: "CS-302", name: "Full Stack Web Development", faculty: "Prof. Gupta", total: 15, attended: 9, absent: 5, excused: 1, pct: 60, safeMargin: "Short by: 3 Classes" },
        { id: "s3", code: "CS-305", name: "Database Engineering & SQL", faculty: "Dr. Reddy", total: 15, attended: 10, absent: 4, excused: 1, pct: 66, safeMargin: "Short by: 2 Classes" }
      ],
      verifications: [
        { id: 'LV-2026-101', title: 'Medical Leave · Viral fever', category: 'Medical Leave', status: 'Approved', days: 2, startDate: '2026-03-01', endDate: '2026-03-02', currentStep: 3, mentor: "Prof. Reddy", remarks: "Approved for 2 days" },
        { id: 'LV-2026-102', title: 'On-Duty Leave · Smart India Hackathon', category: 'On-Duty', status: 'Pending', days: 1, startDate: '2026-03-04', endDate: '2026-03-04', currentStep: 2, mentor: "Prof. Reddy", remarks: "Pending HOD approval" },
      ],
      recentLogs: [
        { id: 'l1', date: '04 Mar 2026', subject: 'Data Structures & Algorithms', slot: '09:00 AM - 11:00 AM', status: 'Present', faculty: 'Prof. Sharma' },
        { id: 'l2', date: '03 Mar 2026', subject: 'Full Stack Web Development', slot: '11:15 AM - 01:15 PM', status: 'Absent', faculty: 'Prof. Gupta' },
        { id: 'l3', date: '02 Mar 2026', subject: 'System Design & Cloud Systems', slot: '02:00 PM - 04:00 PM', status: 'Excused', faculty: 'Prof. Patel' },
        { id: 'l4', date: '01 Mar 2026', subject: 'Database Engineering & SQL', slot: '09:00 AM - 11:00 AM', status: 'Present', faculty: 'Dr. Reddy' },
      ],
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
    const userId = req.user.userId || req.user.id;
    const user = await findUserById(userId);

    const performanceData = {
      studentName: user?.name || 'Student',
      department: user?.department || 'ECS',
      batch: 'Batch A – 2026',
      overallScore: 71,
      status: 'Average',
      trend: 'up',
      trendDelta: '+4%',
      lastUpdated: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      scores: {
        assessment: 78,
        coding: 65,
        interview: 58,
        attendance: 82,
        milestone: 74,
      },
      weakAreas: [
        {
          id: 'wa-1',
          skill: 'AI Mock Interview',
          score: 58,
          target: 75,
          reason: 'Low scores across last 3 AI interviews – confidence and problem articulation need improvement.',
          topics: ['STAR method', 'DSA explanation', 'Behavioural Q&A'],
          actions: ['Practice 2 mock interviews this week', 'Review recorded sessions', 'Attempt Interview Feedback module'],
          priority: 'Critical',
        },
        {
          id: 'wa-2',
          skill: 'Coding / DSA',
          score: 65,
          target: 80,
          reason: 'Struggling with dynamic programming and graph-based problems in practice submissions.',
          topics: ['Dynamic Programming', 'Graph traversal (BFS/DFS)', 'Recursion & Backtracking'],
          actions: ['Solve 5 DP problems this week', 'Complete Graph module on Learning Content', 'Join Weekend Coding Sprint'],
          priority: 'High',
        },
      ],
      suggestions: [
        { id: 's-1', icon: 'interview', text: 'Schedule 2 AI Mock Interview sessions before the next assessment cycle.', action: 'Go to AI Interview', link: '/student/ai-interview' },
        { id: 's-2', icon: 'coding', text: 'Complete the Dynamic Programming practice set (8 problems pending).', action: 'Open Practice', link: '/student/practice' },
        { id: 's-3', icon: 'learning', text: 'Watch the DBMS Normalization video and complete the follow-up quiz.', action: 'Open Learning', link: '/student/learning' },
        { id: 's-4', icon: 'attendance', text: 'Maintain 80%+ attendance to protect your eligibility for placements.', action: 'View Attendance', link: '/student/attendance' },
      ],
      scoreHistory: [
        { week: 'W1', assessment: 62, coding: 50, interview: 45 },
        { week: 'W2', assessment: 67, coding: 55, interview: 50 },
        { week: 'W3', assessment: 72, coding: 60, interview: 52 },
        { week: 'W4', assessment: 75, coding: 62, interview: 55 },
        { week: 'W5', assessment: 78, coding: 65, interview: 58 },
      ],
    };

    return sendSuccess(res, 'Performance data retrieved successfully', performanceData);
  } catch (error) {
    next(error);
  }
};

