import { sendSuccess, sendError } from '../utils/response.js';
import {
  fetchStudentRoadmap,
  fetchStudentRoadmapByRole,
  fetchAllStudentRoadmaps,
  generateNewRoadmap,
  updateMilestoneProgress,
  saveRoadmapProgress,
} from '../services/roadmap.service.js';
import { generateTopicQuizAI, generateMilestoneTheoryAI, generateMilestonePracticeAI } from '../ai/roadmap.ai.js';
import {
  getCachedTopicQuiz,
  saveCachedTopicQuiz,
  getCachedMilestoneTheory,
  saveCachedMilestoneTheory,
  getCachedMilestonePractice,
  saveCachedMilestonePractice,
} from '../models/roadmap.model.js';
import { searchYouTubeVideos } from '../services/youtube.service.js';


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
 * Controller: Update and persist full roadmap milestones progress
 */
export const saveRoadmapProgressController = async (req, res, next) => {
  try {
    const studentId = req.user?.id || req.user?.userId || 1;
    const roadmapId = req.params.id || req.body?.roadmapId;
    const { milestones } = req.body || {};

    if (!Array.isArray(milestones)) {
      return sendError(res, 'Milestones array is required', 400);
    }

    const updated = await saveRoadmapProgress(studentId, roadmapId, milestones);
    return sendSuccess(res, 'Roadmap progress saved successfully', updated);
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
 * Controller: Generate hands-on practical coding challenge for a milestone topic with DB caching
 */
export const generateMilestonePractice = async (req, res, next) => {
  try {
    const { milestoneTitle, targetRole, topic, forceRefresh } = req.body || {};
    if (!milestoneTitle || !String(milestoneTitle).trim()) {
      return sendError(res, 'milestoneTitle is required', 400);
    }

    const cleanTitle = String(milestoneTitle).trim();
    const cleanRole = String(targetRole || '').trim();
    const cleanTopic = String(topic || cleanTitle).trim();

    // 1. Check DB/Memory cache
    if (!forceRefresh) {
      const cached = await getCachedMilestonePractice(cleanTitle, cleanRole, cleanTopic);
      if (cached && cached.title && cached.prompt) {
        console.log(`[Practice Controller] DB Cache Hit for practice challenge "${cleanTopic}". Returning stored challenge.`);
        return sendSuccess(res, 'Milestone practice challenge retrieved from DB cache', cached);
      }
    }

    // 2. Generate via AI
    console.log(`[Practice Controller] Generating NEW AI practice challenge for "${cleanTopic}"...`);
    const challenge = await generateMilestonePracticeAI(cleanTitle, cleanRole, cleanTopic);

    // 3. Save to DB cache
    await saveCachedMilestonePractice(cleanTitle, cleanRole, cleanTopic, challenge);

    return sendSuccess(res, 'Milestone practice challenge generated via AI and saved to DB', challenge);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Generate deep technical AI Theory guide for a milestone with DB caching
 */
export const generateMilestoneTheory = async (req, res, next) => {
  try {
    const { milestoneTitle, targetRole, forceRefresh } = req.body || {};
    if (!milestoneTitle || !String(milestoneTitle).trim()) {
      return sendError(res, 'milestoneTitle is required', 400);
    }

    const cleanTitle = String(milestoneTitle).trim();
    const cleanRole = String(targetRole || '').trim();

    // 1. Check DB/Memory cache only if forceRefresh is not requested
    if (!forceRefresh) {
      const cachedTheory = await getCachedMilestoneTheory(cleanTitle, cleanRole);
      const hasPoints = cachedTheory && Array.isArray(cachedTheory.sections) && cachedTheory.sections.some(s => Array.isArray(s.points) && s.points.length > 0);
      const hasProgression = cachedTheory && (cachedTheory.difficultyProgression || (Array.isArray(cachedTheory.sections) && cachedTheory.sections.length >= 4 && cachedTheory.sections.some(s => s.level)));
      if (cachedTheory && cachedTheory.title && hasPoints && hasProgression) {
        console.log(`[Theory Controller] DB Cache Hit for progressive theory "${cleanTitle}". Returning stored theory.`);
        return sendSuccess(res, 'Milestone theory retrieved from DB cache', cachedTheory);
      }
    }

    // 2. Generate via AI
    console.log(`[Theory Controller] Generating NEW live AI theory for "${cleanTitle}" via Groq/NIM...`);
    const theoryData = await generateMilestoneTheoryAI(cleanTitle, cleanRole);

    // 3. Save to DB cache
    await saveCachedMilestoneTheory(cleanTitle, cleanRole, theoryData);

    return sendSuccess(res, 'Milestone theory generated via AI and saved to DB', theoryData);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Search YouTube video lectures for a milestone topic using YouTube API
 */
export const getMilestoneVideo = async (req, res, next) => {
  try {
    const q = req.query.q || req.query.query || '';
    if (!q || !String(q).trim()) {
      return sendError(res, 'Search query is required', 400);
    }
    const videos = await searchYouTubeVideos(String(q).trim(), 3);
    return sendSuccess(res, 'Milestone YouTube video fetched', videos[0] || null);
  } catch (error) {
    next(error);
  }
};

