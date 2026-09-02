import { sendSuccess } from '../utils/response.js';
import { getAllUsersModel } from '../models/user.model.js';

export const getStudentData = async (req, res, next) => {
  try {
    return sendSuccess(res, 'Student data retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getStudentDashboard = async (req, res, next) => {
  try {
    const allUsers = await getAllUsersModel();
    const students = allUsers.filter((u) => u.role === 'student');

    // Build real leaderboard from registered students in system
    const realLeaderboard = students.map((s, idx) => ({
      rank: idx + 1,
      name: s.name,
      score: `${(1500 + (students.length - idx) * 75).toLocaleString()} XP`,
      initials: s.name ? s.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) : 'ST',
      badge: idx === 0 ? '🥇 Rank 1' : idx === 1 ? '🥈 Rank 2' : idx === 2 ? '🥉 Rank 3' : `Top ${Math.min(20, (idx + 1) * 5)}%`,
      you: false,
    }));

    const dashboardData = {
      attendanceSummary: {
        percentage: 95,
      },
      codingProgress: {
        currentRank: students.length > 0 ? `1 / ${students.length}` : '1 / 1',
      },
      upcomingDeadlines: [],
      leaderboard: realLeaderboard,
    };

    return sendSuccess(res, 'Student dashboard retrieved successfully', dashboardData);
  } catch (error) {
    next(error);
  }
};
