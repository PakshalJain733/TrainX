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
  let defaultTrack = 'Technical Development';
  try {
    const [pref] = await query(
      `SELECT COALESCE(s.target_track, u.target_track, b.topic, b.name, d.name) AS pref_track
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN batches b ON (b.id = s.batch_id OR b.id = (SELECT batch_id FROM student_batches WHERE user_id = u.id LIMIT 1))
       LEFT JOIN departments d ON (d.id = u.department_id OR d.id = s.department_id)
       WHERE u.id = ? LIMIT 1`,
      [userId]
    );
    if (pref && pref.pref_track && String(pref.pref_track).trim()) {
      defaultTrack = String(pref.pref_track).trim();
    }
  } catch (_) {}

  return {
    userId,
    identifiedGapsCount: weakAreas.length,
    weakTopics: weakAreas,
    suggestedRoadmapTrack: weakAreas.length > 0 ? weakAreas[0].topic : defaultTrack,
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

  // 1. Student identity and enrolled batch
  let user = null;
  try {
    user = await findUserById(numericId);
  } catch (e) {}
  const studentName = user ? (user.name || user.fullName || 'Student') : 'Student';

  let batchName = 'Core Technical';
  let batchId = null;
  let enrolledBatchIds = [];
  try {
    const studentBatches = await query(`
      SELECT sb.batch_id, b.name as batch_name
      FROM student_batches sb
      JOIN batches b ON sb.batch_id = b.id
      WHERE sb.user_id = ?
      ORDER BY sb.id ASC
    `, [numericId]);

    if (studentBatches && studentBatches.length > 0) {
      enrolledBatchIds = studentBatches.map(b => b.batch_id);
      batchName = studentBatches[0].batch_name;
      batchId = studentBatches[0].batch_id;
    } else {
      const [stu] = await query(`
        SELECT s.batch_id, b.name as batch_name 
        FROM students s
        LEFT JOIN batches b ON s.batch_id = b.id
        WHERE s.user_id = ? LIMIT 1
      `, [numericId]);
      if (stu && stu.batch_name) {
        batchName = stu.batch_name;
        batchId = stu.batch_id;
        if (batchId) enrolledBatchIds.push(batchId);
      }
    }
  } catch (_) {}

  // ── FACTOR 1: Academic Quizzes (Assessment attempts) ──
  let quizzes = [];
  try {
    quizzes = await query(`
      SELECT aa.id, aa.assessment_id, COALESCE(a.title, CONCAT('Quiz #', aa.assessment_id)) as title,
             COALESCE(a.category, 'Technical Quiz') as category,
             aa.marks_obtained, aa.total_marks, aa.score, aa.percentage, aa.status
      FROM assessment_attempts aa
      LEFT JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.user_id = ? AND aa.status != 'in_progress' AND (aa.submitted_at IS NOT NULL OR aa.completed_at IS NOT NULL)
      ORDER BY aa.id DESC
    `, [numericId]);
  } catch (err) {
    console.warn(`[Skill Gap] Quiz query warning: ${err.message}`);
  }

  const dedupQuizzesMap = new Map();
  for (const q of (quizzes || [])) {
    const key = String(q.assessment_id || q.title);
    if (!dedupQuizzesMap.has(key)) {
      const pct = Number(q.percentage) || (q.total_marks ? Math.round((Number(q.marks_obtained) / Number(q.total_marks)) * 100) : Number(q.score) || 0);
      dedupQuizzesMap.set(key, { ...q, computedScore: Math.min(100, Math.max(0, pct)) });
    }
  }
  const dedupQuizzes = Array.from(dedupQuizzesMap.values());
  const quizAvg = dedupQuizzes.length > 0 ? Math.round(dedupQuizzes.reduce((acc, q) => acc + q.computedScore, 0) / dedupQuizzes.length) : 0;
  const quizPassed = dedupQuizzes.filter(q => q.computedScore >= 50 || String(q.status).toLowerCase() === 'passed').length;

  // ── FACTOR 2: Batch Coursework Tasks ──
  let batchTasks = [];
  try {
    batchTasks = await query(`
      SELECT bt.id, bt.title, bt.topic, bt.difficulty, bt.language, bt.points,
             ts.status as sub_status, ts.score as sub_score, ts.marks_obtained, ts.feedback, ts.submitted_at
      FROM batch_tasks bt
      LEFT JOIN task_submissions ts ON (bt.id = ts.task_id AND ts.user_id = ?)
      WHERE (
        bt.batch_id IN (SELECT batch_id FROM student_batches WHERE user_id = ?)
        OR bt.batch_id = ?
        OR ts.user_id = ?
      )
      ORDER BY bt.id DESC
    `, [numericId, numericId, batchId || 0, numericId]);
  } catch (err) {
    console.warn(`[Skill Gap] Batch tasks query warning: ${err.message}`);
  }

  const tasksMap = new Map();
  for (const t of (batchTasks || [])) {
    if (!tasksMap.has(t.id)) tasksMap.set(t.id, t);
  }
  const uniqueTasks = Array.from(tasksMap.values());
  const submittedTasks = uniqueTasks.filter(t => t.sub_status !== null && t.sub_status !== undefined);
  const passedTasks = uniqueTasks.filter(t => {
    const s = String(t.sub_status || '').toLowerCase();
    return s === 'passed' || s === 'completed' || s === 'accepted' || (Number(t.points || 0) > 0 && Number(t.marks_obtained ?? t.sub_score ?? 0) >= Number(t.points));
  });
  const failedTasks = submittedTasks.filter(t => !passedTasks.some(p => p.id === t.id));
  const taskCompletionRate = uniqueTasks.length > 0 ? Math.round((submittedTasks.length / uniqueTasks.length) * 100) : 0;
  const taskPassRate = submittedTasks.length > 0 ? Math.round((passedTasks.length / submittedTasks.length) * 100) : 0;

  // ── FACTOR 3: Coding Practice (Problems & Test Cases) ──
  let codingSubs = [];
  let totalProblemsCount = 1;
  try {
    codingSubs = await query(`
      SELECT cs.id, cs.status, cs.passed_test_cases, cs.total_test_cases,
             COALESCE(p.title, 'Algorithm Practice') as title
      FROM coding_submissions cs
      LEFT JOIN practice_problems p ON cs.problem_id = p.id
      WHERE cs.student_id = ?
    `, [numericId]);
    const [totalProblemsRow] = await query(`SELECT COUNT(*) as count FROM practice_problems`);
    if (totalProblemsRow && Number(totalProblemsRow.count) > 0) {
      totalProblemsCount = Number(totalProblemsRow.count);
    }
  } catch (err) {
    console.warn(`[Skill Gap] Coding practice query warning: ${err.message}`);
  }

  const solvedCount = (codingSubs || []).filter(c => {
    const s = String(c.status || '').toLowerCase();
    return s === 'passed' || s === 'accepted' || (c.total_test_cases > 0 && c.passed_test_cases === c.total_test_cases);
  }).length;
  const codingScore = Math.min(100, Math.round((solvedCount / totalProblemsCount) * 100));

  // ── FACTOR 4: AI Technical Interviews ──
  let interviewSubs = [];
  try {
    interviewSubs = await query(`
      SELECT id, interview_type, overall_score, feedback, status FROM interview_submissions WHERE user_id = ?
    `, [numericId]);
  } catch (_) {
    try {
      interviewSubs = await query(`
        SELECT id, topic as interview_type, overall_score, feedback, status FROM interview_sessions WHERE user_id = ? OR student_id = ?
      `, [numericId, numericId]);
    } catch (__) {}
  }
  const interviewMean = interviewSubs && interviewSubs.length > 0 ? Math.round(interviewSubs.reduce((acc, i) => acc + (Number(i.overall_score) || 0), 0) / interviewSubs.length) : 0;

  // ── FACTOR 5: AI Learning Roadmap ──
  let roadmapItems = [];
  try {
    roadmapItems = await query(`
      SELECT ri.title, ri.status, r.goal_name FROM roadmap_items ri
      JOIN roadmaps r ON ri.roadmap_id = r.id
      WHERE r.student_id = ? OR r.user_id = ?
    `, [numericId, numericId]);
  } catch (_) {}
  const roadmapDone = (roadmapItems || []).filter(r => r.status === 'completed').length;
  const roadmapProgress = roadmapItems && roadmapItems.length > 0 ? Math.round((roadmapDone / roadmapItems.length) * 100) : 0;

  // Multi-factor summary object (Excluding attendance as requested)
  const factorsSummary = {
    quizzes: {
      name: 'Academic Quizzes',
      weight: '25%',
      score: quizAvg,
      status: quizAvg >= 70 ? 'Strong' : quizAvg >= 50 ? 'Needs Review' : 'Critical',
      detail: dedupQuizzes.length > 0 ? `${dedupQuizzes.length} Quizzes Attempted (${quizPassed} Passed, ${dedupQuizzes.length - quizPassed} Failed)` : 'No Quizzes Attempted'
    },
    coding: {
      name: 'Coding Practice Problems',
      weight: '25%',
      score: codingScore,
      status: codingScore >= 70 ? 'Strong' : codingScore > 0 ? 'In Progress' : 'Critical',
      detail: `${solvedCount} of ${totalProblemsCount} Problems Solved`
    },
    coursework: {
      name: 'Batch Coursework Tasks',
      weight: '20%',
      score: taskCompletionRate,
      status: taskCompletionRate >= 70 ? 'Strong' : taskCompletionRate >= 50 ? 'In Progress' : 'Critical',
      detail: uniqueTasks.length > 0 ? `${submittedTasks.length} of ${uniqueTasks.length} Tasks Submitted (${passedTasks.length} Passed, ${failedTasks.length} Failed)` : 'No Tasks Assigned'
    },
    interviews: {
      name: 'AI Technical Interviews',
      weight: '15%',
      score: interviewMean,
      status: interviewSubs.length === 0 ? 'Not Attempted' : interviewMean >= 70 ? 'Strong' : 'Needs Review',
      detail: interviewSubs.length === 0 ? '0 Mock Interviews Completed' : `${interviewMean}% across ${interviewSubs.length} sessions`
    },
    roadmap: {
      name: 'AI Learning Roadmap',
      weight: '15%',
      score: roadmapProgress,
      status: roadmapItems.length === 0 ? 'Not Started' : roadmapProgress >= 70 ? 'On Track' : 'Needs Focus',
      detail: roadmapItems.length === 0 ? '0 Milestones Initiated' : `${roadmapProgress}% (${roadmapDone}/${roadmapItems.length} Milestones)`
    }
  };

  // Build evaluated technical skill competencies dynamically from these 5 real factors
  const skills = [];

  // Skill 1: Core Language & Syntax Foundations
  const coreLangScore = Math.round(0.6 * quizAvg + 0.4 * taskPassRate);
  const coreFailedTaskNames = failedTasks.map(t => t.title).slice(0, 3);
  const coreTaskReason = coreFailedTaskNames.length > 0 ? `Failed ${failedTasks.length} tasks (${coreFailedTaskNames.join(', ')}) due to compilation/syntax errors.` : '';
  skills.push({
    id: 'skill-core-lang',
    name: `${batchName} Core & Syntax Foundations`,
    skill: `${batchName} Core & Syntax Foundations`,
    score: coreLangScore,
    category: 'Core Programming',
    status: coreLangScore >= 80 ? 'Strong' : coreLangScore >= 70 ? 'Good' : coreLangScore >= 50 ? 'Weak' : 'Critical',
    is_weak: coreLangScore < 65,
    lastAssessed: 'Recent Evaluation',
    priority: coreLangScore < 50 ? 'High' : coreLangScore < 65 ? 'Medium' : 'Low',
    reason: `Evaluated across Academic Quizzes (${quizAvg}%) and Batch Coursework Pass Rate (${taskPassRate}%).`,
    factorsSummary: `Quiz Score: ${quizAvg}% · Task Pass Rate: ${taskPassRate}%`,
    factors: [
      { factor: 'Academic Quizzes', score: quizAvg, detail: `${dedupQuizzes.length} Quizzes (${quizPassed} Passed, ${dedupQuizzes.length - quizPassed} Failed)` },
      { factor: 'Batch Coursework', score: taskPassRate, detail: `${submittedTasks.length} Submitted (${passedTasks.length} Passed, ${failedTasks.length} Failed)` }
    ],
    whyWeak: coreLangScore < 65 ? `Average quiz score is ${quizAvg}% and ${coreTaskReason || 'syntax accuracy requires improvement'}` : null,
    targetScore: 85,
    recommendedTopics: [`${batchName} Standard I/O & Scanner`, `${batchName} Syntax Rules & Compilation`, `${batchName} Control Flow & Methods`],
    checklist: [
      { id: 1, text: `Revise ${batchName} input/output handling and compilation syntax`, completed: false, type: 'revise', route: '/student/learning' },
      { id: 2, text: `Debug and re-submit failed ${batchName} batch tasks`, completed: false, type: 'practice', route: '/student/batches' },
      { id: 3, text: `Retake ${batchName} assessment to improve score above 75%`, completed: false, type: 'quiz', route: '/student/quiz' }
    ]
  });

  // Skill 2: Algorithmic Problem Solving & Code Execution
  const algoScore = Math.round(0.7 * codingScore + 0.3 * (taskPassRate > 0 ? taskPassRate : 0));
  skills.push({
    id: 'skill-algo',
    name: 'Algorithmic Problem Solving & Code Execution',
    skill: 'Algorithmic Problem Solving & Code Execution',
    score: algoScore,
    category: 'Data Structures & Algorithms',
    status: algoScore >= 80 ? 'Strong' : algoScore >= 70 ? 'Good' : algoScore >= 50 ? 'Weak' : 'Critical',
    is_weak: algoScore < 65,
    lastAssessed: 'Recent Evaluation',
    priority: algoScore < 50 ? 'High' : algoScore < 65 ? 'Medium' : 'Low',
    reason: `Evaluated across Practice Arena (${codingScore}%) and Task Execution (${taskPassRate}%).`,
    factorsSummary: `Practice Arena: ${codingScore}% (${solvedCount}/${totalProblemsCount} Solved)`,
    factors: [
      { factor: 'Coding Practice Arena', score: codingScore, detail: `${solvedCount}/${totalProblemsCount} problems solved` },
      { factor: 'Algorithmic Tasks', score: taskPassRate, detail: `${passedTasks.length}/${submittedTasks.length} tasks passed all test cases` }
    ],
    whyWeak: algoScore < 65 ? `Only ${solvedCount} of ${totalProblemsCount} coding practice problems solved; test case pass rate is ${taskPassRate}%.` : null,
    targetScore: 80,
    recommendedTopics: ['Arithmetic Algorithms', 'Loop Traversal & Edge Cases', 'Test Case Debugging'],
    checklist: [
      { id: 1, text: 'Solve unattempted coding practice problem in Practice Arena', completed: false, type: 'practice', route: '/student/practice' },
      { id: 2, text: 'Review algorithmic time complexity and edge case handling', completed: false, type: 'revise', route: '/student/learning' },
      { id: 3, text: 'Pass all hidden test cases without time limit exceeded', completed: false, type: 'practice', route: '/student/practice' }
    ]
  });

  // Skill 3: Batch Coursework & Practical Deliverables
  const courseworkScore = Math.round(0.5 * taskCompletionRate + 0.5 * taskPassRate);
  skills.push({
    id: 'skill-coursework',
    name: 'Batch Coursework & Practical Deliverables',
    skill: 'Batch Coursework & Practical Deliverables',
    score: courseworkScore,
    category: 'Practical Engineering',
    status: courseworkScore >= 80 ? 'Strong' : courseworkScore >= 70 ? 'Good' : courseworkScore >= 50 ? 'Weak' : 'Critical',
    is_weak: courseworkScore < 65,
    lastAssessed: 'Recent Evaluation',
    priority: courseworkScore < 50 ? 'High' : courseworkScore < 65 ? 'Medium' : 'Low',
    reason: `Evaluated across Task Submission Velocity (${taskCompletionRate}%) and Verification Pass Rate (${taskPassRate}%).`,
    factorsSummary: `Tasks Submitted: ${submittedTasks.length}/${uniqueTasks.length} (${taskCompletionRate}%) · Passed: ${passedTasks.length}`,
    factors: [
      { factor: 'Submission Velocity', score: taskCompletionRate, detail: `${submittedTasks.length} of ${uniqueTasks.length} assigned tasks submitted` },
      { factor: 'Solution Correctness', score: taskPassRate, detail: `${passedTasks.length} of ${submittedTasks.length} solutions accepted` }
    ],
    whyWeak: courseworkScore < 65 ? `${failedTasks.length} task submissions failed verification; ${uniqueTasks.length - submittedTasks.length} tasks remain unattempted.` : null,
    targetScore: 90,
    recommendedTopics: ['Code Verification', 'Clean Code Guidelines', 'Error Log Analysis'],
    checklist: [
      { id: 1, text: 'Fix compilation & logical bugs in submitted coursework', completed: false, type: 'practice', route: '/student/batches' },
      { id: 2, text: 'Submit solutions for any pending coursework assignments', completed: false, type: 'practice', route: '/student/batches' }
    ]
  });

  // Skill 4: Technical Interview Articulation & Depth
  skills.push({
    id: 'skill-interview',
    name: 'Technical Interview Articulation & Depth',
    skill: 'Technical Interview Articulation & Depth',
    score: interviewMean,
    category: 'Technical Communication',
    status: interviewSubs.length === 0 ? 'Critical' : interviewMean >= 80 ? 'Strong' : interviewMean >= 70 ? 'Good' : 'Weak',
    is_weak: interviewSubs.length === 0 || interviewMean < 65,
    lastAssessed: 'Interview Arena',
    priority: interviewSubs.length === 0 || interviewMean < 50 ? 'High' : 'Medium',
    reason: interviewSubs.length === 0 ? '0 Mock Interviews Completed.' : `Average interview score: ${interviewMean}%.`,
    factorsSummary: interviewSubs.length === 0 ? '0 Mock Interviews Completed' : `Overall Score: ${interviewMean}% across ${interviewSubs.length} interviews`,
    factors: [
      { factor: 'AI Mock Interviews', score: interviewMean, detail: `${interviewSubs.length} sessions completed` }
    ],
    whyWeak: interviewSubs.length === 0 ? 'No technical mock interviews attempted; verbal problem explanation and technical reasoning remain unassessed.' : interviewMean < 65 ? `Interview performance averaged ${interviewMean}%; conceptual articulation requires practice.` : null,
    targetScore: 80,
    recommendedTopics: ['Verbal Code Walkthrough', `${batchName} Conceptual Explanation`, 'Scenario-Based Reasoning'],
    checklist: [
      { id: 1, text: `Attempt an AI Mock Technical Interview for ${batchName}`, completed: false, type: 'interview', route: '/student/interview' },
      { id: 2, text: 'Practice explaining code logic aloud with clarity', completed: false, type: 'practice', route: '/student/interview' }
    ]
  });

  // Skill 5: Curriculum Roadmap Milestone Completion
  skills.push({
    id: 'skill-roadmap',
    name: 'Curriculum Roadmap Milestone Completion',
    skill: 'Curriculum Roadmap Milestone Completion',
    score: roadmapProgress,
    category: 'Curriculum Velocity',
    status: roadmapItems.length === 0 ? 'Critical' : roadmapProgress >= 80 ? 'Strong' : roadmapProgress >= 70 ? 'Good' : 'Weak',
    is_weak: roadmapItems.length === 0 || roadmapProgress < 65,
    lastAssessed: 'Roadmap Tracker',
    priority: roadmapItems.length === 0 || roadmapProgress < 50 ? 'High' : 'Medium',
    reason: roadmapItems.length === 0 ? 'Roadmap milestones not started.' : `Milestone completion: ${roadmapProgress}%.`,
    factorsSummary: roadmapItems.length === 0 ? '0 Roadmap Milestones Completed' : `Roadmap Progress: ${roadmapProgress}% (${roadmapDone}/${roadmapItems.length} Milestones)`,
    factors: [
      { factor: 'AI Learning Roadmap', score: roadmapProgress, detail: `${roadmapDone}/${roadmapItems.length} modules completed` }
    ],
    whyWeak: roadmapItems.length === 0 ? 'Learning roadmap has not been initiated; curriculum progression is stalled.' : roadmapProgress < 65 ? `Roadmap completion is at ${roadmapProgress}%; pending topics must be completed.` : null,
    targetScore: 85,
    recommendedTopics: ['Structured Syllabus Milestones', 'Self-Paced Learning', 'Concept Mastery Checklists'],
    checklist: [
      { id: 1, text: 'Open your personalized AI Learning Roadmap', completed: false, type: 'roadmap', route: '/student/roadmap' },
      { id: 2, text: 'Complete and check off upcoming curriculum milestones', completed: false, type: 'revise', route: '/student/roadmap' }
    ]
  });

  // Compute overall weighted competency across the 5 evaluated factors (Attendance excluded):
  // Quizzes (25%), Coding (25%), Batch Tasks (20%), Roadmap (15%), Interview (15%)
  const overallCompetency = Math.round(
    0.25 * quizAvg +
    0.25 * codingScore +
    0.20 * taskCompletionRate +
    0.15 * roadmapProgress +
    0.15 * interviewMean
  );

  const weakAreas = skills.filter(s => s.is_weak);
  const overallStatus = weakAreas.length === 0 ? 'Strong' : weakAreas.length <= 2 ? 'Needs Focus' : 'Needs Improvement';

  // Generate suggestions list for compatibility with ST_ProgressAnalytics
  const suggestions = weakAreas.map(w => ({
    skill: w.name,
    score: w.score,
    priority: w.priority,
    actions: w.checklist.map(c => c.text),
    recommendations: w.recommendedTopics,
    study_materials: [
      { title: `${w.name} Master Guide`, link: '/student/learning' },
      { title: 'Interactive Practice Modules', link: '/student/practice' }
    ]
  }));

  const analysisResult = {
    student_id: numericId,
    student_name: studentName,
    batch_name: batchName,
    overall_score: overallCompetency,
    overall_status: overallStatus,
    weak_areas_count: weakAreas.length,
    weak_areas: weakAreas,
    all_evaluated_skills: skills,
    skills: skills,
    factors_summary: factorsSummary,
    suggestions: suggestions
  };

  // Persist to SQL Database table
  await saveSkillGapAnalysis(numericId, analysisResult);

  return analysisResult;
};
