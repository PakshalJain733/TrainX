import {
  getBatchSkillGapsModel,
  getStudentSkillGapsModel,
  saveRemedialInterventionModel,
  getRemedialInterventionsModel,
  getSkillGapByUserId,
  saveSkillGapAnalysis,
} from '../models/skillGap.model.js';
import {
  generateAIDiagnostics,
  generateRemedialAssignmentAI,
  analyzeStudentPerformance,
} from '../ai/skillGap.ai.js';
import { findUserById } from '../models/user.model.js';
import { query } from '../config/db.js';

/**
 * Service: Retrieve batch-level skill gaps for mentor & coordinator analytics
 */
export const getBatchSkillGapsService = async (collegeId = null, batchId = null) => {
  const gaps = await getBatchSkillGapsModel(collegeId, batchId);
  return {
    totalGapsIdentified: gaps.length,
    highPriorityCount: gaps.filter((g) => g.priority === 'High').length,
    mediumPriorityCount: gaps.filter((g) => g.priority === 'Medium').length,
    lowPriorityCount: gaps.filter((g) => g.priority === 'Low').length,
    skillGaps: gaps,
  };
};

/**
 * Service: Retrieve individual student skill gap report
 */
export const getStudentSkillGapReportService = async (userId) => {
  const weakAreas = await getStudentSkillGapsModel(userId);
  return {
    userId,
    identifiedGapsCount: weakAreas.length,
    weakTopics: weakAreas,
    suggestedRoadmapTrack: weakAreas.length > 0 ? weakAreas[0].topic : 'Full Stack Engineering',
    remedialActionNeeded: weakAreas.some((w) => w.severity === 'Critical'),
  };
};

/**
 * Service: Generate and trigger an AI-assisted remedial intervention
 */
export const triggerRemedialAssignmentService = async ({
  collegeId = 1,
  skillGapId = null,
  batchId = null,
  studentId = null,
  topic,
  batchName,
  difficultyLevel = 'Medium',
  createdBy = null,
}) => {
  if (!topic) {
    throw new Error('Topic is required to trigger a remedial assignment.');
  }

  // 1. Generate AI remedial content
  const aiAssignment = await generateRemedialAssignmentAI({
    topic,
    batchName,
    difficultyLevel,
  });

  // 2. Persist to database / mock store
  const savedIntervention = await saveRemedialInterventionModel({
    college_id: collegeId,
    skill_gap_id: skillGapId,
    batch_id: batchId,
    student_id: studentId,
    topic,
    title: aiAssignment.title || `Remedial Assignment: ${topic}`,
    description: aiAssignment.description || `Targeted practice for ${topic}`,
    assignment_details: {
      learningObjectives: aiAssignment.learningObjectives || [],
      source: aiAssignment.source || 'ai',
      modelUsed: aiAssignment.modelUsed,
    },
    recommended_problems: aiAssignment.practiceProblems || [],
    recommended_materials: aiAssignment.recommendedMaterials || [],
    created_by: createdBy,
    status: 'assigned',
  });

  return savedIntervention;
};

/**
 * Service: Retrieve AI diagnostic breakdown for a topic
 */
export const getAIDiagnosticForTopicService = async ({
  topic,
  batchName,
  deficiencyRate = '40%',
  avgScore = '55%',
}) => {
  if (!topic) {
    throw new Error('Topic is required for AI diagnostic.');
  }
  return await generateAIDiagnostics({
    topic,
    batchName,
    deficiencyRate,
    avgScore,
  });
};

/**
 * Service: Retrieve all past remedial interventions
 */
export const getRemedialInterventionsService = async (collegeId = null, batchId = null) => {
  return await getRemedialInterventionsModel(collegeId, batchId);
};

export const executeskillGapService = async (payload = {}) => {
  const result = await analyzeStudentPerformance(payload);
  if (payload.student_id || payload.studentId || payload.user_id) {
    const uid = payload.student_id || payload.studentId || payload.user_id;
    await saveSkillGapAnalysis(uid, result);
  }
  return result;
};

export const getStudentSkillGapAnalysis = async (studentId, customData = null) => {
  if (customData && Object.keys(customData).length > 0) {
    const result = await analyzeStudentPerformance({ student_id: studentId, ...customData });
    if (studentId) {
      await saveSkillGapAnalysis(studentId, result);
    }
    return result;
  }

  const numericId = parseInt(studentId, 10) || 1;

  // 1. First check if saved analysis exists in SQL DB
  const storedDbResult = await getSkillGapByUserId(numericId);
  if (storedDbResult) {
    return {
      student_id: numericId,
      overall_status: storedDbResult.overall_status,
      weak_areas_count: storedDbResult.weak_areas_count,
      weak_areas: storedDbResult.weak_areas,
      all_evaluated_skills: storedDbResult.all_evaluated_skills,
      suggestions: storedDbResult.suggestions,
    };
  }

  // 2. Query actual assessment attempts from DB
  let user = null;
  try {
    user = await findUserById(numericId);
  } catch (e) {}

  const studentName = user ? (user.name || user.fullName || 'Student') : 'Student';
  const quizMarks = {};
  const codingMarks = {};
  const interviewScores = {};
  const milestoneProgress = {};

  try {
    const attempts = await query(
      `SELECT a.percentage, q.title 
       FROM assessment_attempts a 
       LEFT JOIN assessments q ON a.assessment_id = q.id 
       WHERE a.user_id = ? AND a.status IN ('completed', 'finished', 'passed')`,
      [numericId]
    );

    if (Array.isArray(attempts) && attempts.length > 0) {
      for (const att of attempts) {
        const topic = att.title || 'General';
        quizMarks[topic] = Math.round(att.percentage || 0);
      }
    }
  } catch (err) {}

  const performancePayload = {
    student_id: numericId,
    student_name: studentName,
    quizMarks,
    codingMarks,
    interviewScores,
    milestoneProgress,
  };

  const freshAnalysis = await analyzeStudentPerformance(performancePayload);

  // Save to SQL Database table
  await saveSkillGapAnalysis(numericId, freshAnalysis);

  return freshAnalysis;
};
