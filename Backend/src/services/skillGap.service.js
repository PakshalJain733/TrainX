import {
  getBatchSkillGapsModel,
  getStudentSkillGapsModel,
  saveRemedialInterventionModel,
  getRemedialInterventionsModel,
} from '../models/skillGap.model.js';
import {
  generateAIDiagnostics,
  generateRemedialAssignmentAI,
} from '../ai/skillGap.ai.js';

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
