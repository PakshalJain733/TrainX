import { sendSuccess, sendError } from '../utils/response.js';
import {
  fetchStudentRoadmap,
  fetchStudentRoadmapByRole,
  generateNewRoadmap,
  updateMilestoneProgress,
} from '../services/roadmap.service.js';

/**
 * Controller: Get student's current active roadmap
 */
export const getRoadmapData = async (req, res, next) => {
  try {
    let studentId = req.params.id || req.user?.id || req.user?.userId || 1;
    if (req.user && req.user.role === 'student') {
      studentId = req.user.id || req.user.userId;
    }

    // If a specific role is requested, look up that role's saved roadmap
    const { role } = req.query;
    if (role && String(role).trim()) {
      const roadmap = await fetchStudentRoadmapByRole(studentId, String(role).trim());
      return sendSuccess(res, roadmap ? 'Roadmap found' : 'No roadmap for this role', roadmap);
    }

    const roadmap = await fetchStudentRoadmap(studentId);
    return sendSuccess(res, 'Roadmap retrieved successfully', roadmap);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Trigger AI roadmap generation with student inputs
 */
export const generateRoadmap = async (req, res, next) => {
  try {
    let studentId = req.params.id || req.user?.id || req.user?.userId || 1;
    if (req.user && req.user.role === 'student') {
      studentId = req.user.id || req.user.userId;
    }
    const {
      targetRole,
      studentProfile,
      currentSkills,
      assessmentScores,
      practicePerformance,
      milestoneProgress,
      weakSkills,
      interviewSignals,
    } = req.body || {};

    const requestedRole = targetRole ? String(targetRole).trim() : '';
    console.log(`[Roadmap Controller] Generating AI roadmap for student #${studentId}, role: "${requestedRole}"`);
    
    const roadmap = await generateNewRoadmap(studentId, requestedRole, {
      studentProfile,
      currentSkills,
      assessmentScores,
      practicePerformance,
      milestoneProgress,
      weakSkills,
      interviewSignals,
    });

    return sendSuccess(res, 'AI Roadmap generated successfully', roadmap);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Update status of a specific milestone item
 */
export const updateMilestone = async (req, res, next) => {
  try {
    const studentId = req.user?.id || req.user?.userId || 1;
    const { itemId } = req.params;
    const { status, progress } = req.body || {};

    if (!status) {
      return sendError(res, 'Status field is required (completed, in-progress, locked)', 400);
    }

    const updatedRoadmap = await updateMilestoneProgress(studentId, itemId, status, progress);
    return sendSuccess(res, 'Milestone status updated successfully', updatedRoadmap);
  } catch (error) {
    next(error);
  }
};
