import {
  getAssessmentsModel,
  getAssessmentByIdModel,
  getAssessmentQuestionsModel,
  saveAssessmentAttemptModel,
  getStudentAttemptsModel,
  startAttemptModel,
  getAttemptByIdModel,
  updateAttemptModel,
  saveAnswersModel,
  getAttemptAnswersModel,
} from '../models/assessment.model.js';

// ─── VALID ANSWER OPTIONS ──────────────────────────────────────────────────────
const VALID_OPTIONS = new Set(['A', 'B', 'C', 'D']);

// ─── EXISTING SERVICES ─────────────────────────────────────────────────────────

/**
 * Fetch all available assessments filtered by college isolation
 */
export const getAssessmentsService = async (collegeId) => {
  return await getAssessmentsModel(collegeId);
};

/**
 * Fetch a single assessment with safe questions (without revealing answers to students)
 */
export const getAssessmentDetailsService = async (assessmentId, isStaff = false) => {
  const assessment = await getAssessmentByIdModel(assessmentId);
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  const questions = await getAssessmentQuestionsModel(assessmentId, isStaff);
  return {
    ...assessment,
    questions,
  };
};

/**
 * Legacy quiz submission service (kept for backward compatibility with old routes).
 * New code should use submitAssessmentService instead.
 */
export const submitAssessmentAttemptService = async ({
  assessmentId,
  userId,
  collegeId = 1,
  submittedAnswers = [],
}) => {
  // 1. Fetch assessment details & passing threshold
  const assessment = await getAssessmentByIdModel(assessmentId);
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Fetch authoritative questions with correct answers
  const questions = await getAssessmentQuestionsModel(assessmentId, true);
  if (!questions || questions.length === 0) {
    const error = new Error('Assessment contains no questions to evaluate');
    error.statusCode = 400;
    throw error;
  }

  // 3. Map student submissions by question ID
  const answerMap = new Map();
  if (Array.isArray(submittedAnswers)) {
    submittedAnswers.forEach((ans) => {
      if (ans.question_id !== undefined) {
        answerMap.set(parseInt(ans.question_id, 10), ans.selected_option ? String(ans.selected_option).trim().toUpperCase() : null);
      }
    });
  }

  let totalQuestions = questions.length;
  let totalMarks = 0;
  let marksObtained = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let attemptedQuestions = 0;
  const evaluatedBreakdown = [];

  // 4. Compare answers and calculate scores
  for (const q of questions) {
    const qId = parseInt(q.id, 10);
    const qMarks = q.marks || 10;
    totalMarks += qMarks;

    const selectedOption = answerMap.has(qId) ? answerMap.get(qId) : null;
    const correctOption = q.correct_option ? q.correct_option.trim().toUpperCase() : '';

    if (!selectedOption) {
      unattemptedCount++;
      evaluatedBreakdown.push({
        question_id: qId,
        question_text: q.question_text,
        selected_option: null,
        correct_option: correctOption,
        is_correct: false,
        marks_awarded: 0,
        max_marks: qMarks,
        explanation: q.explanation,
      });
    } else {
      attemptedQuestions++;
      const isCorrect = selectedOption === correctOption;
      if (isCorrect) {
        correctCount++;
        marksObtained += qMarks;
        evaluatedBreakdown.push({
          question_id: qId,
          question_text: q.question_text,
          selected_option: selectedOption,
          correct_option: correctOption,
          is_correct: true,
          marks_awarded: qMarks,
          max_marks: qMarks,
          explanation: q.explanation,
        });
      } else {
        incorrectCount++;
        evaluatedBreakdown.push({
          question_id: qId,
          question_text: q.question_text,
          selected_option: selectedOption,
          correct_option: correctOption,
          is_correct: false,
          marks_awarded: 0,
          max_marks: qMarks,
          explanation: q.explanation,
        });
      }
    }
  }

  // 5. Calculate percentage & status
  const percentage = totalMarks > 0 ? parseFloat(((marksObtained / totalMarks) * 100).toFixed(2)) : 0;
  const passingThreshold = parseFloat(assessment.passing_percentage || 60);
  const status = percentage >= passingThreshold ? 'passed' : 'failed';

  // 6. Store attempt & result
  const attemptRecord = await saveAssessmentAttemptModel({
    assessment_id: parseInt(assessmentId, 10),
    user_id: parseInt(userId, 10),
    college_id: parseInt(collegeId, 10),
    total_questions: totalQuestions,
    attempted_questions: attemptedQuestions,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unattempted_count: unattemptedCount,
    marks_obtained: marksObtained,
    total_marks: totalMarks,
    percentage,
    status,
    answers: evaluatedBreakdown,
  });

  return {
    attemptId: attemptRecord.id,
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    category: assessment.category,
    scoring: {
      total_questions: totalQuestions,
      attempted_questions: attemptedQuestions,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unattempted_count: unattemptedCount,
      marks_obtained: marksObtained,
      total_marks: totalMarks,
      percentage: `${percentage}%`,
      passing_percentage: `${passingThreshold}%`,
      status,
    },
    breakdown: evaluatedBreakdown,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Fetch past attempts of a student
 */
export const getStudentAttemptsService = async (userId) => {
  return await getStudentAttemptsModel(userId);
};

// ─── NEW SERVICES ──────────────────────────────────────────────────────────────

/**
 * Start Assessment Service
 * 
 * Flow:
 *   1. Validate assessment exists
 *   2. Check assessment is published/active
 *   3. Check student hasn't already COMPLETED it (block if so)
 *   4. Create or return in_progress attempt
 *   5. Return attempt + questions WITHOUT correct_option
 */
export const startAssessmentService = async (assessmentId, userId) => {
  // 1. Validate assessment exists
  const assessment = await getAssessmentByIdModel(assessmentId);
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Check published
  if (!assessment.is_published) {
    const error = new Error('This assessment is not available yet');
    error.statusCode = 403;
    throw error;
  }

  // 3. Create or return attempt
  const attempt = await startAttemptModel(assessmentId, userId);

  // 3a. If already completed, block re-start
  if (attempt.status === 'completed' || attempt.status === 'passed' || attempt.status === 'failed') {
    const error = new Error('You have already completed this assessment. View your result to see your score.');
    error.statusCode = 409;
    error.attemptId = attempt.id;
    throw error;
  }

  // 4. Fetch questions WITHOUT correct_option (safe for student)
  const questions = await getAssessmentQuestionsModel(assessmentId, false);

  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      started_at: attempt.created_at,
    },
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      category: assessment.category,
      duration_minutes: assessment.duration_minutes,
      total_marks: assessment.total_marks,
      passing_percentage: assessment.passing_percentage,
      total_questions: questions.length,
    },
    questions,
    instructions: [
      'Each question carries marks as specified.',
      'Wrong answer: 0 marks. No negative marking.',
      'Unanswered: 0 marks.',
      'Once submitted, the assessment cannot be retaken.',
    ],
  };
};

/**
 * Submit Assessment Service
 * 
 * Flow:
 *   1. Validate attempt exists and belongs to this student
 *   2. Block if already completed (duplicate submission guard)
 *   3. Fetch questions with correct answers
 *   4. Validate submitted question IDs & options
 *   5. Grade answers — compare each, calculate marks
 *   6. Calculate percentage & pass/fail
 *   7. Save graded answers to assessment_answers
 *   8. Update attempt record (score, %, status=completed, submitted_at)
 *   9. Return result summary
 */
export const submitAssessmentService = async (attemptId, userId, submittedAnswers = []) => {
  // 1. Validate attempt
  const attempt = await getAttemptByIdModel(attemptId);
  if (!attempt) {
    const error = new Error('Assessment attempt not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Ownership check — student can only submit their own attempt
  const attemptUserId = parseInt(attempt.user_id, 10);
  const requestingUserId = parseInt(userId, 10);
  if (attemptUserId !== requestingUserId) {
    const error = new Error('You are not authorized to submit this attempt');
    error.statusCode = 403;
    throw error;
  }

  // 3. Duplicate submission guard
  if (attempt.status === 'completed' || attempt.status === 'passed' || attempt.status === 'failed') {
    const error = new Error('Assessment already submitted. You cannot submit again.');
    error.statusCode = 409;
    throw error;
  }

  // 4. Fetch assessment details
  const assessment = await getAssessmentByIdModel(attempt.assessment_id);
  if (!assessment) {
    const error = new Error('Associated assessment not found');
    error.statusCode = 404;
    throw error;
  }

  // 5. Fetch authoritative questions WITH correct answers
  const questions = await getAssessmentQuestionsModel(attempt.assessment_id, true);
  if (!questions || questions.length === 0) {
    const error = new Error('Assessment contains no questions to evaluate');
    error.statusCode = 400;
    throw error;
  }

  // Build a Set of valid question IDs for this assessment
  const validQuestionIds = new Set(questions.map((q) => parseInt(q.id, 10)));

  // 6. Validate submitted answers
  if (!Array.isArray(submittedAnswers)) {
    const error = new Error('Answers must be provided as an array');
    error.statusCode = 400;
    throw error;
  }

  for (const ans of submittedAnswers) {
    // Validate question_id is a number
    if (ans.question_id === undefined || ans.question_id === null) {
      const error = new Error('Each answer must include a question_id');
      error.statusCode = 400;
      throw error;
    }

    const qId = parseInt(ans.question_id, 10);
    if (isNaN(qId)) {
      const error = new Error(`Invalid question_id: ${ans.question_id}`);
      error.statusCode = 400;
      throw error;
    }

    // Validate question belongs to this assessment
    if (!validQuestionIds.has(qId)) {
      const error = new Error(`Question ID ${qId} does not belong to this assessment`);
      error.statusCode = 400;
      throw error;
    }

    // Validate option is A/B/C/D or null/undefined (unattempted)
    if (ans.selected_option !== null && ans.selected_option !== undefined && ans.selected_option !== '') {
      const normalizedOption = String(ans.selected_option).trim().toUpperCase();
      if (!VALID_OPTIONS.has(normalizedOption)) {
        const error = new Error(`Invalid option '${ans.selected_option}' for question ${qId}. Must be A, B, C, or D.`);
        error.statusCode = 400;
        throw error;
      }
    }
  }

  // 7. Build answer map (question_id → selected_option)
  const answerMap = new Map();
  submittedAnswers.forEach((ans) => {
    const qId = parseInt(ans.question_id, 10);
    const option = (ans.selected_option !== null && ans.selected_option !== undefined && ans.selected_option !== '')
      ? String(ans.selected_option).trim().toUpperCase()
      : null;
    answerMap.set(qId, option);
  });

  // 8. Grade each question
  let totalQuestions = questions.length;
  let totalMarks = 0;
  let marksObtained = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let attemptedQuestions = 0;
  const gradedAnswers = [];

  for (const q of questions) {
    const qId = parseInt(q.id, 10);
    const qMarks = parseFloat(q.marks) || 10;
    totalMarks += qMarks;

    const selectedOption = answerMap.has(qId) ? answerMap.get(qId) : null;
    const correctOption = q.correct_option ? String(q.correct_option).trim().toUpperCase() : '';

    if (!selectedOption) {
      // Unattempted
      unattemptedCount++;
      gradedAnswers.push({
        question_id: qId,
        question_text: q.question_text,
        selected_option: null,
        correct_option: correctOption,
        is_correct: false,
        marks_awarded: 0,
        max_marks: qMarks,
        explanation: q.explanation,
      });
    } else {
      attemptedQuestions++;
      const isCorrect = selectedOption === correctOption;

      if (isCorrect) {
        correctCount++;
        marksObtained += qMarks;
      } else {
        incorrectCount++;
      }

      gradedAnswers.push({
        question_id: qId,
        question_text: q.question_text,
        selected_option: selectedOption,
        correct_option: correctOption,
        is_correct: isCorrect,
        marks_awarded: isCorrect ? qMarks : 0,
        max_marks: qMarks,
        explanation: q.explanation,
      });
    }
  }

  // 9. Calculate percentage & status
  const percentage = totalMarks > 0
    ? parseFloat(((marksObtained / totalMarks) * 100).toFixed(2))
    : 0;
  const passingThreshold = parseFloat(assessment.passing_percentage || 60);
  const finalStatus = percentage >= passingThreshold ? 'passed' : 'failed';

  // 10. Save graded answers to DB
  await saveAnswersModel(attemptId, gradedAnswers);

  // 11. Update attempt record → mark completed
  await updateAttemptModel(attemptId, {
    total_questions: totalQuestions,
    attempted_questions: attemptedQuestions,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unattempted_count: unattemptedCount,
    marks_obtained: marksObtained,
    total_marks: totalMarks,
    percentage,
    status: finalStatus,
  });

  // 12. Return result summary
  return {
    attemptId: parseInt(attemptId, 10),
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    category: assessment.category,
    scoring: {
      total_questions: totalQuestions,
      attempted_questions: attemptedQuestions,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      unattempted_count: unattemptedCount,
      marks_obtained: marksObtained,
      total_marks: totalMarks,
      percentage: `${percentage}%`,
      passing_percentage: `${passingThreshold}%`,
      status: finalStatus,
    },
    breakdown: gradedAnswers,
    submitted_at: new Date().toISOString(),
  };
};

/**
 * Get Attempt Result Service
 * 
 * Returns full result for a completed attempt.
 * Students can only see their own results.
 * Staff (MENTOR, COORDINATOR, COLLEGE_ADMIN, SUPER_ADMIN) can see any result.
 */
export const getAttemptResultService = async (attemptId, userId, userRole) => {
  const STAFF_ROLES = ['mentor', 'coordinator', 'college_admin', 'super_admin'];

  // 1. Fetch attempt
  const attempt = await getAttemptByIdModel(attemptId);
  if (!attempt) {
    const error = new Error('Assessment attempt not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Access control — students can only view their own results
  const isStaff = STAFF_ROLES.includes(userRole?.toLowerCase());
  if (!isStaff) {
    const attemptUserId = parseInt(attempt.user_id, 10);
    const requestingUserId = parseInt(userId, 10);
    if (attemptUserId !== requestingUserId) {
      const error = new Error('You are not authorized to view this result');
      error.statusCode = 403;
      throw error;
    }
  }

  // 3. Check attempt is completed
  if (attempt.status === 'in_progress') {
    const error = new Error('This assessment has not been submitted yet');
    error.statusCode = 400;
    throw error;
  }

  // 4. Fetch assessment info
  const assessment = await getAssessmentByIdModel(attempt.assessment_id);

  // 5. Fetch saved per-question answers
  const savedAnswers = await getAttemptAnswersModel(attemptId);

  // 6. Build result response
  const percentage = parseFloat(attempt.percentage) || 0;
  const passingThreshold = parseFloat(assessment?.passing_percentage || attempt.passing_percentage || 60);

  return {
    result: {
      attempt_id: attempt.id,
      status: attempt.status,
      submitted_at: attempt.submitted_at || null,
      started_at: attempt.created_at || null,
    },
    assessment: {
      id: attempt.assessment_id,
      title: attempt.assessment_title || assessment?.title,
      category: attempt.category || assessment?.category,
      passing_percentage: `${passingThreshold}%`,
    },
    student: {
      user_id: attempt.user_id,
    },
    score: {
      total_marks: parseFloat(attempt.total_marks) || 0,
      marks_obtained: parseFloat(attempt.marks_obtained) || 0,
      percentage: `${percentage}%`,
      total_questions: parseInt(attempt.total_questions) || 0,
      attempted_questions: parseInt(attempt.attempted_questions) || 0,
      correct_count: parseInt(attempt.correct_count) || 0,
      incorrect_count: parseInt(attempt.incorrect_count) || 0,
      unattempted_count: parseInt(attempt.unattempted_count) || 0,
    },
    breakdown: savedAnswers.map((ans) => ({
      question_id: ans.question_id,
      question_text: ans.question_text || null,
      selected_option: ans.selected_option || null,
      correct_option: ans.correct_option || null,
      is_correct: Boolean(ans.is_correct),
      marks_awarded: parseFloat(ans.marks_awarded) || 0,
      explanation: ans.explanation || null,
    })),
  };
};
