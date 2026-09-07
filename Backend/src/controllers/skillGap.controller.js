import { sendSuccess, sendError } from '../utils/response.js';
import { executeskillGapService, getStudentSkillGapAnalysis } from '../services/skillGap.service.js';

export const getSkillGapData = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user?.id || req.query.student_id;
    const analysis = await getStudentSkillGapAnalysis(studentId);
    return sendSuccess(res, 'Skill gap analysis retrieved successfully', analysis);
  } catch (error) {
    next(error);
  }
};

export const analyzePerformance = async (req, res, next) => {
  try {
    const payload = req.body || {};
    if (req.user?.id && !payload.student_id) {
      payload.student_id = req.user.id;
    }
    const analysis = await executeskillGapService(payload);
    return sendSuccess(res, 'Student performance analysis completed successfully', analysis);
  } catch (error) {
    next(error);
  }
};
