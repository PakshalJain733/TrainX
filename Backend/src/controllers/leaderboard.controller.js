import { sendSuccess } from '../utils/response.js';

export const getLeaderboardData = async (req, res, next) => { try { return sendSuccess(res, 'leaderboard data retrieved successfully'); } catch (error) { next(error); } };
