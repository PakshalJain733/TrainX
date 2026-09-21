import {
  getCompleteLeaderboardData,
  getOverallLeaderboard,
  getDepartmentLeaderboard,
  getMilestoneLeaderboard,
  getTopBatchesLeaderboard,
} from '../services/leaderboard.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

/**
 * GET /api/v1/leaderboards
 * Retrieves multi-category leaderboard data (Overall, Department, Milestone, Top Batches, Student Rank Context)
 * Supports query params: type, college_id, department_id, batch_id, limit, page
 */
export const getLeaderboardData = async (req, res, next) => {
  try {
    const user = req.user || {};
    const { type, college_id, department_id, batch_id } = req.query;

    const data = await getCompleteLeaderboardData(user, {
      college_id,
      department_id,
      batch_id,
    });

    if (type) {
      const lowerType = String(type).toLowerCase();
      if (lowerType === 'overall') {
        return sendSuccess(res, 'Overall leaderboard retrieved successfully', data.overall);
      }
      if (lowerType === 'department') {
        return sendSuccess(res, 'Department leaderboard retrieved successfully', data.department);
      }
      if (lowerType === 'milestone') {
        return sendSuccess(res, 'Milestone leaderboard retrieved successfully', data.milestone);
      }
      if (lowerType === 'batches' || lowerType === 'topbatches') {
        return sendSuccess(res, 'Top batches leaderboard retrieved successfully', data.topBatches);
      }
    }

    return sendSuccess(res, 'Leaderboard data retrieved successfully', data);
  } catch (error) {
    console.error("[Leaderboard Controller] Error:", error.message);
    next(error);
  }
};

/**
 * GET /api/v1/leaderboards/overall
 */
export const getOverallLeaderboardController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const filters = {
      college_id: req.query.college_id || (user.role !== 'SUPER_ADMIN' ? user.college_id : null),
      department_id: req.query.department_id || req.query.department,
      batch_id: req.query.batch_id,
    };
    const data = await getOverallLeaderboard(filters);
    return sendSuccess(res, 'Overall leaderboard retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leaderboards/department
 */
export const getDepartmentLeaderboardController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const filters = {
      college_id: req.query.college_id || (user.role !== 'SUPER_ADMIN' ? user.college_id : null),
      department_id: req.query.department_id || req.query.department,
      batch_id: req.query.batch_id,
    };
    const data = await getDepartmentLeaderboard(filters);
    return sendSuccess(res, 'Department leaderboard retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leaderboards/milestone
 */
export const getMilestoneLeaderboardController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const filters = {
      college_id: req.query.college_id || (user.role !== 'SUPER_ADMIN' ? user.college_id : null),
      department_id: req.query.department_id || req.query.department,
      batch_id: req.query.batch_id,
    };
    const data = await getMilestoneLeaderboard(filters);
    return sendSuccess(res, 'Milestone leaderboard retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leaderboards/student/my-rank
 */
export const getStudentRankController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const data = await getCompleteLeaderboardData(user, req.query);
    return sendSuccess(res, 'Student rank context retrieved successfully', data.studentContext || {});
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leaderboards/overall
 */
export const getOverallLeaderboardController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const filters = {
      college_id: req.query.college_id || (user.role !== 'SUPER_ADMIN' ? user.college_id : null),
      department_id: req.query.department_id || req.query.department,
      batch_id: req.query.batch_id,
    };
    const data = await getOverallLeaderboard(filters);
    return sendSuccess(res, 'Overall leaderboard retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leaderboards/department
 */
export const getDepartmentLeaderboardController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const filters = {
      college_id: req.query.college_id || (user.role !== 'SUPER_ADMIN' ? user.college_id : null),
      department_id: req.query.department_id || req.query.department,
      batch_id: req.query.batch_id,
    };
    const data = await getDepartmentLeaderboard(filters);
    return sendSuccess(res, 'Department leaderboard retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leaderboards/milestone
 */
export const getMilestoneLeaderboardController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const filters = {
      college_id: req.query.college_id || (user.role !== 'SUPER_ADMIN' ? user.college_id : null),
      department_id: req.query.department_id || req.query.department,
      batch_id: req.query.batch_id,
    };
    const data = await getMilestoneLeaderboard(filters);
    return sendSuccess(res, 'Milestone leaderboard retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/leaderboards/student/my-rank
 */
export const getStudentRankController = async (req, res, next) => {
  try {
    const user = req.user || {};
    const data = await getCompleteLeaderboardData(user, req.query);
    return sendSuccess(res, 'Student rank context retrieved successfully', data.studentContext || {});
  } catch (error) {
    next(error);
  }
};
