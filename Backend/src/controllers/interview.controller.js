import { sendSuccess, sendError } from '../utils/response.js';
import { query } from '../config/db.js';
import {
  createInterviewSessionModel,
  findInterviewSessionsByUserModel,
  getInterviewSessionByIdModel,
} from '../models/interview.model.js';

export const getInterviewData = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const sessions = await findInterviewSessionsByUserModel(userId, 10);
    return sendSuccess(res, 'Interview sessions retrieved successfully', sessions);
  } catch (error) {
    next(error);
  }
};

export const getInterviewById = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (req.params.id === 'history') {
      const sessions = await findInterviewSessionsByUserModel(userId, 10);
      return sendSuccess(res, 'Interview sessions retrieved successfully', sessions);
    }
    const session = await getInterviewSessionByIdModel(req.params.id);
    if (!session || Number(session.user_id) !== Number(userId)) {
      return sendError(res, 'Interview session not found', 404);
    }
    return sendSuccess(res, 'Interview session retrieved successfully', session);
  } catch (error) {
    next(error);
  }
};

export const saveInterviewSession = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { details, interviewType, overallScore, grade, feedback } = req.body || {};

    const payload = validateAndNormalizeSession({
      ...(details || {}),
      interviewType: interviewType || details?.interviewType || details?.topic || details?.role,
      overallScore: overallScore ?? details?.overallScore ?? details?.scorecard?.overallScore,
      grade: grade || details?.grade || details?.scorecard?.grade,
      feedback: feedback || details?.feedback || details?.scorecard?.feedback,
    });

    // Idempotency check: prevent duplicate insertion if socket or recent request already saved in last 30s
    const recent = await query(
      `SELECT * FROM interview_sessions 
       WHERE user_id = ? AND interview_type = ? AND created_at >= NOW() - INTERVAL 30 SECOND 
       ORDER BY id DESC LIMIT 1`,
      [userId, payload.interview_type]
    );
    if (recent && recent.length > 0) {
      const existing = recent[0];
      if (typeof existing.details === 'string') {
        try { existing.details = JSON.parse(existing.details); } catch { existing.details = null; }
      }
      return sendSuccess(res, 'Interview session already saved', existing, 200);
    }

    const session = await createInterviewSessionModel({
      user_id: userId,
      interview_type: payload.interview_type,
      overall_score: payload.overall_score,
      grade: payload.grade,
      feedback: payload.feedback,
      details: payload.details,
    });
    return sendSuccess(res, 'Interview session saved successfully', session, 201);
  } catch (error) {
    next(error);
  }
};

export const validateAndNormalizeSession = (details = {}) => {
  const normalized = {
    overall_score: details.overallScore ?? details.scorecard?.overallScore ?? statsOverall(details),
    grade: details.grade || details.scorecard?.grade || 'Average',
    feedback: details.feedback || details.scorecard?.feedback || '',
    interview_type: details.interviewType || details.topic || details.role || 'Technical Mock',
    details,
  };
  return normalized;
};

const statsOverall = (d) => {
  if (typeof d.overallScore === 'number') return d.overallScore;
  const history = Array.isArray(d.evaluationHistory) ? d.evaluationHistory : [];
  if (history.length === 0) return 0;
  return Number(((history.reduce((a, e) => a + (e.score || 0), 0) / history.length) * 10).toFixed(2));
};