import { sendSuccess, sendError } from '../utils/response.js';
import {
  fetchStudentRoadmap,
  fetchStudentRoadmapByRole,
  fetchAllStudentRoadmaps,
  generateNewRoadmap,
  updateMilestoneProgress,
} from '../services/roadmap.service.js';
import { generateTopicQuizAI, generateMilestoneTheoryAI } from '../ai/roadmap.ai.js';
import {
  getCachedTopicQuiz,
  saveCachedTopicQuiz,
  getCachedMilestoneTheory,
  saveCachedMilestoneTheory,
} from '../models/roadmap.model.js';

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
 * Controller: Get all saved roadmaps for a student
 */
export const getAllRoadmaps = async (req, res, next) => {
  try {
    let studentId = req.params.id || req.user?.id || req.user?.userId || 1;
    if (req.user && req.user.role === 'student') {
      studentId = req.user.id || req.user.userId;
    }
    const roadmaps = await fetchAllStudentRoadmaps(studentId);
    return sendSuccess(res, 'All student roadmaps retrieved', roadmaps);
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
    const { status, progress, completedTopics } = req.body || {};

    if (!status) {
      return sendError(res, 'Status field is required (completed, in-progress, locked)', 400);
    }

    const updatedRoadmap = await updateMilestoneProgress(studentId, itemId, status, progress, completedTopics);
    return sendSuccess(res, 'Milestone status updated successfully', updatedRoadmap);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Generate 5-question AI Quiz for a specific topic with DB caching
 */
export const generateTopicQuiz = async (req, res, next) => {
  try {
    const { topicTitle, targetRole } = req.body || {};
    if (!topicTitle || !String(topicTitle).trim()) {
      return sendError(res, 'topicTitle is required', 400);
    }

    const cleanTopic = String(topicTitle).trim();

    // 1. Check if DB/Memory cache already has this topic's AI quiz (re-use for all users)
    const cachedQuiz = await getCachedTopicQuiz(cleanTopic);
    if (cachedQuiz && Array.isArray(cachedQuiz.questions) && cachedQuiz.questions.length >= 5) {
      console.log(`[Quiz Controller] DB Cache Hit for topic "${cleanTopic}". Returning stored AI quiz without calling API.`);
      return sendSuccess(res, 'Topic quiz retrieved from DB cache', cachedQuiz);
    }

    // 2. Generate via AI for the first time
    console.log(`[Quiz Controller] Generating NEW AI quiz for topic "${cleanTopic}"...`);
    const quiz = await generateTopicQuizAI(cleanTopic, targetRole);

    // 3. Save to DB for future requests by any user
    await saveCachedTopicQuiz(cleanTopic, quiz);

    return sendSuccess(res, 'Topic quiz generated via AI and saved to DB', quiz);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Generate deep technical AI Theory guide for a milestone with DB caching
 */
export const generateMilestoneTheory = async (req, res, next) => {
  try {
    const { milestoneTitle, targetRole } = req.body || {};
    if (!milestoneTitle || !String(milestoneTitle).trim()) {
      return sendError(res, 'milestoneTitle is required', 400);
    }

    const cleanTitle = String(milestoneTitle).trim();
    const cleanRole = String(targetRole || '').trim();

    // 1. Check DB/Memory cache
    const cachedTheory = await getCachedMilestoneTheory(cleanTitle, cleanRole);
    if (cachedTheory && cachedTheory.title && Array.isArray(cachedTheory.sections) && cachedTheory.sections.length > 0) {
      console.log(`[Theory Controller] DB Cache Hit for theory "${cleanTitle}". Returning stored theory.`);
      return sendSuccess(res, 'Milestone theory retrieved from DB cache', cachedTheory);
    }

    // 2. Generate via AI
    console.log(`[Theory Controller] Generating NEW AI theory for "${cleanTitle}"...`);
    const theoryData = await generateMilestoneTheoryAI(cleanTitle, cleanRole);

    // 3. Save to DB cache
    await saveCachedMilestoneTheory(cleanTitle, cleanRole, theoryData);

    return sendSuccess(res, 'Milestone theory generated via AI and saved to DB', theoryData);
  } catch (error) {
    next(error);
  }
};
