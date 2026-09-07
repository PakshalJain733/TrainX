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

import { findAssessments } from '../models/assessment.model.js';

export const getStudentDashboard = async (req, res, next) => {
  try {
    const collegeId = req.user.collegeId || req.user.college_id || 1;
    // Multi-college isolation: retrieve students from the same college
    const allUsers = await getAllUsersModel(collegeId);
    const students = allUsers.filter((u) => u.role === ROLES.STUDENT);

    const callerId = req.user.userId || req.user.id;

    // Fetch published assessments for this student's college
    let publishedAssessments = [];
    try {
      publishedAssessments = await findAssessments({ status: 'published', college_id: collegeId });
    } catch (_) {}

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

    const upcomingDeadlines = publishedAssessments.map((a) => ({
      title: a.title,
      dueDate: a.duration_minutes ? `${a.duration_minutes} Mins · ${a.total_marks || 0} Marks` : 'Live Quiz',
      status: 'Pending',
    }));

    const dashboardData = {
      attendanceSummary: {
        percentage: 95,
      },
      codingProgress: {
        currentRank,
      },
      upcomingDeadlines: upcomingDeadlines.length > 0 ? upcomingDeadlines : [
        { title: 'Data Structures Sprint Quiz', dueDate: '30 Mins · 50 Marks', status: 'Pending' }
      ],
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
      overallPercentage: 78,
      attendedClasses: 39,
      missedClasses: 11,
      totalClasses: 50,
      requiredThreshold: 75,
      status: 'Good', // Backend-provided official status: 'Good', 'Warning', 'Low', 'Critical'
      isLowAttendance: false,
      warningMessage: '⚠ Attendance is below the required level. You need to improve your attendance.',
      subjects: [
        { id: 'sub-1', code: 'CS-301', name: 'Java & OOP', attended: 14, total: 16, pct: 88, status: 'Good', safeMargin: '4 classes safe margin' },
        { id: 'sub-2', code: 'CS-302', name: 'DBMS', attended: 11, total: 15, pct: 73, status: 'Warning', safeMargin: 'Must attend next 2 classes' },
        { id: 'sub-3', code: 'CS-303', name: 'DSA', attended: 14, total: 19, pct: 74, status: 'Warning', safeMargin: 'Must attend next 1 class' }
      ],
      attendanceHistory: [
        { id: 1, date: '8 Sep 2026', month: 'September', subject: 'DBMS', status: 'Present', slot: '09:00 AM - 11:00 AM', faculty: 'Dr. Vikram Sharma' },
        { id: 2, date: '7 Sep 2026', month: 'September', subject: 'Java', status: 'Absent', slot: '11:15 AM - 01:15 PM', faculty: 'Prof. Reddy' },
        { id: 3, date: '6 Sep 2026', month: 'September', subject: 'DSA', status: 'Present', slot: '02:00 PM - 04:00 PM', faculty: 'Dr. Vikram Sharma' },
        { id: 4, date: '5 Sep 2026', month: 'September', subject: 'System Design', status: 'Present', slot: '09:00 AM - 11:00 AM', faculty: 'Prof. Ananya' },
        { id: 5, date: '4 Sep 2026', month: 'September', subject: 'DBMS', status: 'Present', slot: '11:15 AM - 01:15 PM', faculty: 'Dr. Vikram Sharma' },
        { id: 6, date: '3 Sep 2026', month: 'September', subject: 'Java', status: 'Absent', slot: '02:00 PM - 04:00 PM', faculty: 'Prof. Reddy' },
        { id: 7, date: '28 Aug 2026', month: 'August', subject: 'DSA', status: 'Present', slot: '09:00 AM - 11:00 AM', faculty: 'Dr. Vikram Sharma' },
        { id: 8, date: '27 Aug 2026', month: 'August', subject: 'System Design', status: 'Present', slot: '11:15 AM - 01:15 PM', faculty: 'Prof. Ananya' },
        { id: 9, date: '25 Aug 2026', month: 'August', subject: 'DBMS', status: 'Absent', slot: '09:00 AM - 11:00 AM', faculty: 'Dr. Vikram Sharma' }
      ],
      verifications: [
        { id: 'LV-2026-101', title: 'Medical Leave · Viral fever', category: 'Medical Leave', status: 'Approved', days: 2, startDate: '2026-09-01', endDate: '2026-09-02', currentStep: 3, mentor: 'Prof. Reddy', remarks: 'Approved with medical certificate verified.' },
        { id: 'LV-2026-102', title: 'On-Duty Leave · Smart India Hackathon', category: 'On-Duty', status: 'Pending', days: 1, startDate: '2026-09-07', endDate: '2026-09-07', currentStep: 2, mentor: 'Prof. Reddy', remarks: 'Under mentor verification.' }
      ]
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
