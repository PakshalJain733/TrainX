import { processroadmapAI } from '../ai/roadmap.ai.js';
import {
  getRoadmapByStudentId,
  saveRoadmap,
  updateMilestoneItemStatus,
} from '../models/roadmap.model.js';

/**
 * Service: Fetch current student's active roadmap.
 * Auto-generates a personalized roadmap if none exists yet for the student.
 */
export const fetchStudentRoadmap = async (studentId) => {
  const roadmap = await getRoadmapByStudentId(studentId);
  return roadmap || null;
};

/**
 * Service: Generate & save a brand new personalized roadmap via AI for any requested topic/role
 */
export const generateNewRoadmap = async (studentId, targetRole = 'Backend Developer', signalData = {}) => {
  const careerTrackName = targetRole;

  // 1. Process AI roadmap engine for the exact requested target role
  const aiResult = await processroadmapAI({
    targetRole,
    studentProfile: signalData.studentProfile || {},
    currentSkills: signalData.currentSkills || [],
    assessmentScores: signalData.assessmentScores || {},
    practicePerformance: signalData.practicePerformance || {},
    milestoneProgress: signalData.milestoneProgress || {},
    weakSkills: signalData.weakSkills || [],
    interviewSignals: signalData.interviewSignals || {},
  });

  const milestones = aiResult.milestones || [];

  // 2. Persist to DB / mock store
  const savedData = await saveRoadmap(studentId, targetRole, careerTrackName, milestones);

  return {
    ...savedData,
    aiSource: aiResult.source,
    evaluatedSignals: {
      targetRole,
      currentSkillsCount: (signalData.currentSkills || []).length,
    },
  };
};

/**
 * Service: Update progress of a specific milestone item
 */
export const updateMilestoneProgress = async (studentId, itemId, status, progress) => {
  const updated = await updateMilestoneItemStatus(studentId, itemId, status, progress);
  if (!updated) {
    throw new Error('Milestone item not found or update failed');
  }
  return updated;
};
