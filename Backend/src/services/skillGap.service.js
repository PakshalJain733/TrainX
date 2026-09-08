import { analyzeStudentPerformance } from '../ai/skillGap.ai.js';
import { findUserById } from '../models/user.model.js';
import { query } from '../config/db.js';
import { getSkillGapByUserId, saveSkillGapAnalysis } from '../models/skillGap.model.js';

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
