import { sendSuccess } from '../utils/response.js';

export const getLeaderboardData = async (req, res, next) => {
  try {
    const data = {
      overall: [
        { rank: 1, name: "Student A", sub: "CSE", score: 95, initials: "SA", isCurrentUser: false },
        { rank: 2, name: "Student B", sub: "ECS", score: 91, initials: "SB", isCurrentUser: false },
        { rank: 3, name: "Student C", sub: "IT", score: 87, initials: "SC", isCurrentUser: false },
        { rank: 12, name: "Ganesh Shinde", sub: "ECS", score: 71, initials: "GS", isCurrentUser: true },
      ],
      department: [
        { rank: 1, name: "Student B", sub: "ECS", score: 91, initials: "SB", isCurrentUser: false },
        { rank: 2, name: "Student X", sub: "ECS", score: 85, initials: "SX", isCurrentUser: false },
        { rank: 3, name: "Ganesh Shinde", sub: "ECS", score: 71, initials: "GS", isCurrentUser: true },
      ],
      milestone: [
        { rank: 1, name: "Student Y", sub: "IT", score: 99, initials: "SY", isCurrentUser: false },
        { rank: 7, name: "Ganesh Shinde", sub: "ECS", score: 74, initials: "GS", isCurrentUser: true },
      ],
      topBatches: [
        { rank: 1, name: "Batch A - CSE", students: 120, score: 85, initials: "BC" },
        { rank: 2, name: "Batch B - IT", students: 100, score: 81, initials: "BI" },
        { rank: 3, name: "Batch A - ECS", students: 150, score: 78, initials: "BE" },
      ],
    };

    return sendSuccess(res, 'Leaderboard data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};
