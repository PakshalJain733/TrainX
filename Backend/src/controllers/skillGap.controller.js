import { sendSuccess, sendError } from '../utils/response.js';
import {
  getBatchSkillGapsService,
  getStudentSkillGapReportService,
  triggerRemedialAssignmentService,
  getRemedialInterventionsService,
  getAIDiagnosticForTopicService,
} from '../services/skillGap.service.js';

/**
 * Controller: Get batch-wide skill gaps (Mentor / Coordinator / Admin)
 * GET /api/v1/skill-gaps
 */
export const getSkillGapData = async (req, res, next) => {
  try {
    const collegeId = req.query.collegeId || req.user?.collegeId || req.user?.college_id;
    const batchId = req.query.batchId || null;

    const data = await getBatchSkillGapsService(collegeId, batchId);
    return sendSuccess(res, 'Batch skill gaps retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get logged-in student's individual skill gap report
 * GET /api/v1/skill-gaps/my-gaps
 */
export const getMySkillGaps = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      return sendError(res, 'Student identity could not be verified', 400);
    }

    const data = await getStudentSkillGapReportService(userId);
    return sendSuccess(res, 'Student personal skill gaps retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get specific student's skill gap report (by mentor/coordinator)
 * GET /api/v1/skill-gaps/student/:studentId
 */
export const getStudentSkillGapsById = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!studentId) {
      return sendError(res, 'Student ID parameter is required', 400);
    }

    const data = await getStudentSkillGapReportService(studentId);
    return sendSuccess(res, 'Student skill gaps retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Trigger AI-assisted remedial assignment for a skill gap or batch
 * POST /api/v1/skill-gaps/remedial
 */
export const triggerRemedialAssignment = async (req, res, next) => {
  try {
    const {
      topic,
      skillGapId,
      batchId,
      studentId,
      batchName,
      difficultyLevel = 'Medium',
    } = req.body;

    if (!topic) {
      return sendError(res, 'Topic is required to create a remedial assignment', 400);
    }

    const collegeId = req.user?.collegeId || req.user?.college_id || 1;
    const createdBy = req.user?.userId || req.user?.id || null;

    const remedialData = await triggerRemedialAssignmentService({
      collegeId,
      skillGapId,
      batchId,
      studentId,
      topic,
      batchName,
      difficultyLevel,
      createdBy,
    });

    return sendSuccess(res, 'Remedial assignment created successfully', remedialData, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get list of remedial assignments and interventions
 * GET /api/v1/skill-gaps/remedial
 */
export const getRemedialInterventions = async (req, res, next) => {
  try {
    const collegeId = req.query.collegeId || req.user?.collegeId || req.user?.college_id;
    const batchId = req.query.batchId || null;

    const data = await getRemedialInterventionsService(collegeId, batchId);
    return sendSuccess(res, 'Remedial interventions retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Run live AI diagnostics on a topic
 * POST /api/v1/skill-gaps/diagnostics
 */
export const getAIDiagnostics = async (req, res, next) => {
  try {
    const { topic, batchName, deficiencyRate, avgScore } = req.body;
    if (!topic) {
      return sendError(res, 'Topic is required to run AI diagnostics', 400);
    }

    const diagnostics = await getAIDiagnosticForTopicService({
      topic,
      batchName,
      deficiencyRate,
      avgScore,
    });

    return sendSuccess(res, 'AI diagnostics generated successfully', diagnostics);
  } catch (error) {
    next(error);
  }
};
