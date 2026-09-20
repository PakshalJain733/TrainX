import { processroadmapAI } from '../ai/roadmap.ai.js';
import {
  getRoadmapByStudentId,
  saveRoadmap,
  updateMilestoneItemStatus,
} from '../models/roadmap.model.js';
import { query } from '../config/db.js';

/**
 * Service: Fetch current student's active roadmap
 * Returns null if the student has not generated any roadmap yet.
 */
export const fetchStudentRoadmap = async (studentId) => {
  const roadmap = await getRoadmapByStudentId(studentId);
  return roadmap;
};

/**
 * Service: Load REAL student signals from the database to feed roadmap personalization.
 * Returns assessment scores by topic plus weak skill areas from persisted skill-gap analysis.
 */
export const collectRealStudentSignals = async (studentId) => {
  const sId = Number(studentId);
  const assessmentScores = {};
  const weakSkills = [];
  let suggestedTrack = 'Full Stack Engineering';

  // 1. Real assessment scores by topic
  try {
    const attempts = await query(
      `SELECT a.title, ROUND(AVG(COALESCE(aa.percentage, aa.score, 0)), 1) AS avg_score
       FROM assessment_attempts aa
       JOIN assessments a ON aa.assessment_id = a.id
       WHERE aa.user_id = ? AND aa.status != 'in_progress'
       GROUP BY a.title`,
      [sId]
    );
    if (Array.isArray(attempts)) {
      for (const row of attempts) {
        if (row.title && row.avg_score != null) {
          assessmentScores[row.title] = Math.round(row.avg_score);
        }
      }
    }
  } catch (err) {
    console.warn(`[Roadmap Service] Assessment signal lookup warning: ${err.message}`);
  }

  // 2. Real weak skill areas from skill_gaps (computed from assessments/coding submissions)
  try {
    const gaps = await query(
      `SELECT topic FROM skill_gaps WHERE student_id = ? ORDER BY deficiency_rate DESC`,
      [sId]
    );
    if (Array.isArray(gaps) && gaps.length > 0) {
      weakSkills.push(...gaps.map((g) => g.topic));
      suggestedTrack = gaps[0].topic;
    }
  } catch (err) {
    console.warn(`[Roadmap Service] Skill gap lookup warning: ${err.message}`);
  }

  // 3. Fall back to persisted skill_gap_analysis if skill_gaps has no student rows
  if (weakSkills.length === 0) {
    try {
      const rows = await query('SELECT weak_areas FROM skill_gap_analysis WHERE user_id = ?', [sId]);
      if (rows && rows.length > 0) {
        const parsed = typeof rows[0].weak_areas === 'string' ? JSON.parse(rows[0].weak_areas) : (rows[0].weak_areas || []);
        if (Array.isArray(parsed)) {
          parsed.forEach((w) => {
            const topic = typeof w === 'string' ? w : (w && (w.topic || w.skill));
            if (topic && !weakSkills.includes(topic)) weakSkills.push(topic);
          });
          if (weakSkills.length > 0) suggestedTrack = weakSkills[0];
        }
      }
    } catch (err) {
      console.warn(`[Roadmap Service] Persisted gap analysis lookup warning: ${err.message}`);
    }
  }

  return { assessmentScores, weakSkills, suggestedTrack };
};

/**
 * Service: Generate & save a brand new personalized roadmap via AI for any requested topic/role
 */
export const generateNewRoadmap = async (studentId, targetRole = '', signalData = {}) => {
  const numericId = Number(studentId);

  // Merge in REAL signals from the database so client-supplied data cannot spoof personalization.
  const realSignals = await collectRealStudentSignals(numericId);

  const weakSkills = Array.isArray(signalData.weakSkills) && signalData.weakSkills.length > 0
    ? signalData.weakSkills
    : realSignals.weakSkills;

  const assessmentScores = (signalData.assessmentScores && Object.keys(signalData.assessmentScores).length > 0)
    ? signalData.assessmentScores
    : realSignals.assessmentScores;

  // Use the targeted role when provided, otherwise derive from the student's real weak areas.
  const requestedRole = (targetRole && String(targetRole).trim())
    || (weakSkills.length > 0 ? weakSkills[0] : realSignals.suggestedTrack);

  const careerTrackName = requestedRole;

  // 1. Process AI roadmap engine for the exact requested target role + real skill signals
  const aiResult = await processroadmapAI({
    targetRole: requestedRole,
    studentProfile: signalData.studentProfile || {},
    currentSkills: signalData.currentSkills || [],
    assessmentScores,
    practicePerformance: signalData.practicePerformance || {},
    milestoneProgress: signalData.milestoneProgress || {},
    weakSkills,
    interviewSignals: signalData.interviewSignals || {},
  });

  const milestones = aiResult.milestones || [];

  // 2. Persist to DB
  const savedData = await saveRoadmap(numericId, requestedRole, careerTrackName, milestones);

  return {
    ...savedData,
    aiSource: aiResult.source,
    evaluatedSignals: {
      targetRole: requestedRole,
      currentSkillsCount: (signalData.currentSkills || []).length,
      weakSkillsCount: weakSkills.length,
      assessmentTopicCount: Object.keys(assessmentScores).length,
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