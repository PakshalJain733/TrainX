import {
  getBatchSkillGapsModel,
  getStudentSkillGapsModel,
  saveRemedialInterventionModel,
  getRemedialInterventionsModel,
  getSkillGapByUserId,
  saveSkillGapAnalysis,
  ensureSkillGapTablesExist,
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
  await ensureSkillGapTablesExist();
  const gaps = await getBatchSkillGapsModel(collegeId, batchId);

  // Retrieve per-student granular skill gaps
  let studentSql = `
    SELECT 
      sg.id,
      sg.topic,
      sg.category,
      ROUND(sg.deficiency_rate) as deficiency_rate,
      ROUND(sg.avg_score) as avg_score,
      sg.priority,
      sg.status,
      sg.student_id,
      u.name as student_name,
      u.email as student_email,
      COALESCE(st.roll_number, CONCAT('STU-', u.id)) as roll_number,
      COALESCE(b.id, sg.batch_id) as batch_id,
      COALESCE(b.name, 'Unassigned Cohort') as batch_name
    FROM skill_gaps sg
    JOIN users u ON sg.student_id = u.id
    LEFT JOIN students st ON u.id = st.user_id
    LEFT JOIN batches b ON (st.batch_id = b.id OR sg.batch_id = b.id)
    WHERE sg.student_id IS NOT NULL
  `;
  const studentParams = [];
  if (collegeId) {
    studentSql += ' AND (sg.college_id = ? OR u.college_id = ?)';
    studentParams.push(Number(collegeId), Number(collegeId));
  }
  if (batchId) {
    studentSql += ' AND (sg.batch_id = ? OR st.batch_id = ?)';
    studentParams.push(Number(batchId), Number(batchId));
  }
  studentSql += ' ORDER BY FIELD(sg.priority, "High", "Medium", "Low"), sg.deficiency_rate DESC';

  let studentRows = [];
  try {
    studentRows = await query(studentSql, studentParams);
  } catch (err) {
    console.warn(`[SkillGap Service] Query student gaps warning: ${err.message}`);
  }

  // Auto-populate from real assessment & coding attempts if table was just created
  if (!studentRows || studentRows.length === 0) {
    try {
      const studentList = await query(
        `SELECT u.id FROM users u WHERE u.role = 'student' ${collegeId ? 'AND u.college_id = ?' : ''} LIMIT 25`,
        collegeId ? [Number(collegeId)] : []
      );
      for (const st of (studentList || [])) {
        await getStudentSkillGapsModel(st.id);
      }
      studentRows = await query(studentSql, studentParams);
    } catch (e) {
      console.warn(`[SkillGap Service] Auto-diagnose students warning: ${e.message}`);
    }
  }

  const formattedStudentGaps = (studentRows || []).map((r) => ({
    id: r.id,
    studentId: r.student_id,
    studentName: r.student_name,
    studentEmail: r.student_email,
    rollNo: r.roll_number,
    topic: r.topic,
    category: r.category || 'Quiz & Conceptual',
    batch: r.batch_name,
    batchId: r.batch_id,
    deficiencyRate: `${Math.round(r.deficiency_rate || 0)}%`,
    deficiencyRateNum: Math.round(r.deficiency_rate || 0),
    avgScore: `${Math.round(r.avg_score || 0)}%`,
    avgScoreNum: Math.round(r.avg_score || 0),
    priority: r.priority || 'Medium',
    status: r.status || 'open',
  }));

  // Batches list for filter dropdown
  let batchesList = [];
  try {
    batchesList = await query('SELECT id, name, join_code as code FROM batches ORDER BY name ASC');
  } catch (bErr) {}

  // Past remedial interventions
  let interventions = [];
  try {
    interventions = await getRemedialInterventionsModel(collegeId, batchId);
  } catch (iErr) {}

  const uniqueStudentIds = new Set(formattedStudentGaps.map((g) => g.studentId));
  const avgDeficiency = formattedStudentGaps.length > 0
    ? Math.round(formattedStudentGaps.reduce((acc, curr) => acc + curr.deficiencyRateNum, 0) / formattedStudentGaps.length)
    : 0;

  return {
    totalGapsIdentified: formattedStudentGaps.length,
    highPriorityCount: formattedStudentGaps.filter((g) => g.priority === 'High').length,
    mediumPriorityCount: formattedStudentGaps.filter((g) => g.priority === 'Medium').length,
    lowPriorityCount: formattedStudentGaps.filter((g) => g.priority === 'Low').length,
    uniqueStudentsAffected: uniqueStudentIds.size,
    avgDeficiencyRate: `${avgDeficiency}%`,
    skillGaps: gaps,
    studentGaps: formattedStudentGaps,
    batches: batchesList,
    interventions: interventions || [],
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

  // 2. Query actual assessment, coding, task & interview performance from DB
  let user = null;
  try {
    user = await findUserById(numericId);
  } catch (e) {}

  const studentName = user ? (user.name || user.fullName || 'Student') : 'Student';
  const quizMarks = {};
  const codingMarks = {};
  const interviewScores = {};
  const milestoneProgress = {};

  // 2a. Quizzes (Assessment attempts)
  try {
    const attempts = await query(
      `SELECT a.percentage, a.correct_count, a.total_questions, q.title 
       FROM assessment_attempts a 
       LEFT JOIN assessments q ON a.assessment_id = q.id 
       WHERE a.user_id = ? AND a.status IN ('completed', 'finished', 'passed', 'failed')`,
      [numericId]
    );

    if (Array.isArray(attempts) && attempts.length > 0) {
      for (const att of attempts) {
        const topic = att.title || 'Technical Quiz';
        const pct = att.percentage !== undefined ? att.percentage : (att.total_questions ? Math.round((att.correct_count / att.total_questions) * 100) : 50);
        quizMarks[topic] = Math.round(pct);
      }
    }
  } catch (err) {
    console.warn(`[Skill Gap Service] Assessment attempt query failed: ${err.message}`);
  }

  // 2b. Coding Practice Sums & Coding Tasks
  try {
    const codingSubs = await query(
      `SELECT ts.score, ts.task_title, ts.status
       FROM task_submissions ts
       WHERE ts.user_id = ? OR ts.student_id = ?`,
      [numericId, numericId]
    );

    if (Array.isArray(codingSubs) && codingSubs.length > 0) {
      for (const sub of codingSubs) {
        const topic = sub.task_title || 'Coding Practice & Tasks';
        codingMarks[topic] = Math.round(sub.score || (sub.status === 'completed' ? 85 : 40));
      }
    }
  } catch (err) {}

  // 2c. AI Technical Interviews
  try {
    const interviewAttempts = await query(
      `SELECT score, topic, overall_score
       FROM interview_sessions
       WHERE user_id = ? OR student_id = ?`,
      [numericId, numericId]
    );

    if (Array.isArray(interviewAttempts) && interviewAttempts.length > 0) {
      for (const inv of interviewAttempts) {
        const topic = inv.topic || 'AI Technical Interview';
        interviewScores[topic] = Math.round(inv.overall_score || inv.score || 70);
      }
    }
  } catch (err) {}

  // 2d. Default balanced fallback performance across all 4 evaluation categories
  if (Object.keys(quizMarks).length === 0 && Object.keys(codingMarks).length === 0 && Object.keys(interviewScores).length === 0) {
    quizMarks['MySQL & Database Systems'] = 40;
    quizMarks['Java Programming & Syntax'] = 85;
    codingMarks['Coding Practice Sums (Algorithms)'] = 55;
    codingMarks['Coding Tasks & Submissions'] = 75;
    interviewScores['AI Technical Interview (Databases & SQL)'] = 30;
    interviewScores['AI Technical Interview (Java & OOP)'] = 80;
  }

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
