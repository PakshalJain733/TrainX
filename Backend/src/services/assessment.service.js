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
const VALID_OPTIONS = new Set(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd']);

// ─── EXISTING SERVICES ─────────────────────────────────────────────────────────

/**
 * Fetch all available assessments filtered by college isolation
 */
export const getAssessmentsService = async (collegeId = null) => {
  return await getAssessmentsModel(collegeId);
};

/**
 * Fetch a single assessment with safe questions (without revealing answers to students)
 */
export const getAssessmentDetailsService = async (assessmentId, isStaff = false, userCollegeId = null) => {
  const assessment = await getAssessmentByIdModel(assessmentId);
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  // College isolation check: if assessment is bound to a college, user's college must match (unless super_admin / global)
  if (userCollegeId && assessment.college_id && parseInt(assessment.college_id, 10) !== parseInt(userCollegeId, 10)) {
    const error = new Error("Access forbidden: Cannot view quiz data belonging to another college");
    error.statusCode = 403;
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
 */
export const submitAssessmentAttemptService = async ({
  assessmentId,
  userId,
  collegeId = 1,
  submittedAnswers = [],
}) => {
  const assessment = await getAssessmentByIdModel(assessmentId);
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  const questions = await getAssessmentQuestionsModel(assessmentId, true);
  if (!questions || questions.length === 0) {
    const error = new Error('Assessment contains no questions to evaluate');
    error.statusCode = 400;
    throw error;
  }

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

  const percentage = totalMarks > 0 ? parseFloat(((marksObtained / totalMarks) * 100).toFixed(2)) : 0;
  const passingThreshold = parseFloat(assessment.pass_marks || assessment.passing_percentage || 60);
  const status = marksObtained >= passingThreshold ? 'passed' : 'failed';

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

// ─── QUIZ ATTEMPT & RESULT SERVICES ──────────────────────────────────────────

/**
 * Start Assessment Service
 * 
 * Flow:
 *   1. Role Check: user must be 'student'
 *   2. Validate assessment exists
 *   3. College Isolation check
 *   4. Check assessment is published
 *   5. Create or return in_progress attempt
 *   6. Return attempt + questions WITHOUT correct_option / explanation
 */
export const startAssessmentService = async (assessmentId, userId, userRole = 'student', userCollegeId = null) => {
  // 1. Role check: allow mentors/admins to test the quiz as well
  // Removed strict student-only check so staff can test the UI

  // 2. Validate assessment exists
  const assessment = await getAssessmentByIdModel(assessmentId);
  if (!assessment) {
    const error = new Error('Assessment not found');
    error.statusCode = 404;
    throw error;
  }

  // 3. College isolation check
  if (userCollegeId && assessment.college_id && parseInt(assessment.college_id, 10) !== parseInt(userCollegeId, 10)) {
    const error = new Error("Access forbidden: Cannot access quiz belonging to another college");
    error.statusCode = 403;
    throw error;
  }

  // 4. Check published
  const isAvailable = Boolean(assessment.is_published) || assessment.status === 'published';
  if (!isAvailable) {
    const error = new Error('This assessment is not available yet');
    error.statusCode = 403;
    throw error;
  }

  // 5. Create or return attempt
  const attempt = await startAttemptModel(assessmentId, userId);

  // 5a. If already completed, block re-start
  if (attempt.status === 'completed' || attempt.status === 'passed' || attempt.status === 'failed') {
    const error = new Error('You have already completed this assessment. View your result to see your score.');
    error.statusCode = 409;
    error.attemptId = attempt.id;
    throw error;
  }

  // 6. Fetch questions WITHOUT correct_option & explanation (safe for student before submission)
  const questions = await getAssessmentQuestionsModel(assessmentId, false);

  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      started_at: attempt.created_at || new Date().toISOString(),
    },
    assessment: {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description,
      category: assessment.category,
      duration_minutes: assessment.duration_minutes,
      total_marks: assessment.total_marks,
      pass_marks: assessment.pass_marks,
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
 *   1. Validate attempt exists
 *   2. Ownership check: student can only submit their own attempt
 *   3. Duplicate submission guard: block if attempt already completed
 *   4. Fetch associated assessment & College isolation check
 *   5. Fetch questions WITH correct answers
 *   6. Validate submitted question IDs & selected options
 *   7. Grade answers (full, partial, blank/unattempted)
 *   8. Calculate total marks obtained, percentage, status (passed/failed)
 *   9. Save graded per-question answers to assessment_answers
 *   10. Update attempt record in assessment_attempts (marks, percentage, status='completed')
 *   11. Return result summary
 */
export const submitAssessmentService = async (attemptId, userId, submittedAnswers = [], userRole = 'student', userCollegeId = null) => {
  // 0. Role check: allow mentors/admins to test the quiz as well
  // Removed strict student-only check so staff can test the UI

  // 1. Validate attempt
  const attempt = await getAttemptByIdModel(attemptId);
  if (!attempt) {
    const error = new Error('Assessment attempt not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Ownership check
  const attemptUserId = parseInt(attempt.user_id, 10);
  const requestingUserId = parseInt(userId, 10);
  if (attemptUserId !== requestingUserId) {
    const error = new Error('Access forbidden: You are not authorized to submit another student\'s attempt');
    error.statusCode = 403;
    throw error;
  }

  // 3. Duplicate submission guard
  if (attempt.status === 'completed' || attempt.status === 'passed' || attempt.status === 'failed') {
    const error = new Error('Assessment already submitted. You cannot submit again.');
    error.statusCode = 409;
    throw error;
  }

  // 4. Fetch assessment details & college check
  const assessment = await getAssessmentByIdModel(attempt.assessment_id);
  if (!assessment) {
    const error = new Error('Associated assessment not found');
    error.statusCode = 404;
    throw error;
  }

  if (userCollegeId && assessment.college_id && parseInt(assessment.college_id, 10) !== parseInt(userCollegeId, 10)) {
    const error = new Error("Access forbidden: Cannot submit quiz belonging to another college");
    error.statusCode = 403;
    throw error;
  }

  // 5. Fetch authoritative questions WITH correct answers
  const questions = await getAssessmentQuestionsModel(attempt.assessment_id, true);
  if (!questions || questions.length === 0) {
    const error = new Error('Assessment contains no questions to evaluate');
    error.statusCode = 400;
    throw error;
  }

  const validQuestionIds = new Set(questions.map((q) => parseInt(q.id, 10)));

  // 6. Validate submitted answers format & question IDs & options
  if (!Array.isArray(submittedAnswers)) {
    const error = new Error('Answers must be provided as an array');
    error.statusCode = 400;
    throw error;
  }

  const seenQuestionIds = new Set();
  for (const ans of submittedAnswers) {
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

    // Check invalid question ID (does not belong to this assessment)
    if (!validQuestionIds.has(qId)) {
      const error = new Error(`Question ID ${qId} does not belong to this assessment`);
      error.statusCode = 400;
      throw error;
    }

    // Check duplicate question in submission array
    if (seenQuestionIds.has(qId)) {
      const error = new Error(`Duplicate answer provided for Question ID ${qId}`);
      error.statusCode = 400;
      throw error;
    }
    seenQuestionIds.add(qId);

    // Validate option if provided
    if (ans.selected_option !== null && ans.selected_option !== undefined && String(ans.selected_option).trim() !== '') {
      const normalizedOption = String(ans.selected_option).trim().toUpperCase();
      if (!VALID_OPTIONS.has(normalizedOption)) {
        const error = new Error(`Invalid option '${ans.selected_option}' for question ${qId}. Option must be A, B, C, or D.`);
        error.statusCode = 400;
        throw error;
      }
    }
  }

  // 7. Build answer map (question_id -> normalized option)
  const answerMap = new Map();
  submittedAnswers.forEach((ans) => {
    const qId = parseInt(ans.question_id, 10);
    const option = (ans.selected_option !== null && ans.selected_option !== undefined && String(ans.selected_option).trim() !== '')
      ? String(ans.selected_option).trim().toUpperCase()
      : null;
    answerMap.set(qId, option);
  });

  // 8. Grade each question
  let totalQuestions = questions.length;
  let totalPossibleMarks = 0;
  let marksObtained = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  let attemptedQuestions = 0;
  const gradedAnswers = [];

  for (const q of questions) {
    const qId = parseInt(q.id, 10);
    const qMarks = parseFloat(q.marks) || 10;
    totalPossibleMarks += qMarks;

    const selectedOption = answerMap.has(qId) ? answerMap.get(qId) : null;
    const correctOption = q.correct_option ? String(q.correct_option).trim().toUpperCase() : '';

    if (!selectedOption) {
      unattemptedCount++;
      gradedAnswers.push({
        question_id: qId,
        question_text: q.question_text,
        selected_option: null,
        correct_option: correctOption,
        is_correct: false,
        marks_awarded: 0,
        max_marks: qMarks,
        explanation: q.explanation || null,
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
        explanation: q.explanation || null,
      });
    }
  }

  // 9. Calculate percentage & pass/fail status
  const percentage = totalPossibleMarks > 0
    ? parseFloat(((marksObtained / totalPossibleMarks) * 100).toFixed(2))
    : 0;

  const passMarksThreshold = assessment.pass_marks !== undefined && assessment.pass_marks !== null
    ? parseFloat(assessment.pass_marks)
    : (assessment.passing_percentage ? (parseFloat(assessment.passing_percentage) * totalPossibleMarks / 100) : (0.6 * totalPossibleMarks));

  const finalStatus = marksObtained >= passMarksThreshold ? 'passed' : 'failed';

  // 10. Save graded answers to DB
  await saveAnswersModel(attemptId, gradedAnswers);

  // 11. Update attempt record in assessment_attempts
  await updateAttemptModel(attemptId, {
    total_questions: totalQuestions,
    attempted_questions: attemptedQuestions,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    unattempted_count: unattemptedCount,
    marks_obtained: marksObtained,
    total_marks: totalPossibleMarks,
    percentage,
    status: 'completed',
  });

  // 12. Return full result summary
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
      total_marks: totalPossibleMarks,
      percentage: `${percentage}%`,
      pass_marks: passMarksThreshold,
      status: finalStatus,
    },
    breakdown: gradedAnswers,
    submitted_at: new Date().toISOString(),
  };
};

/**
 * Get Attempt Result Service
 * 
 * Flow:
 *   1. Fetch attempt
 *   2. Student Access: student can only view their own attempt result
 *   3. Staff Access (mentor, coordinator, college_admin): restricted to attempt/assessment in their college
 *   4. Super Admin: full access
 *   5. Ensure attempt is completed
 *   6. Fetch answers and build response payload
 */
export const getAttemptResultService = async (attemptId, userId, userRole, userCollegeId = null) => {
  const STAFF_ROLES = ['mentor', 'coordinator', 'college_admin', 'super_admin'];

  // 1. Fetch attempt
  const attempt = await getAttemptByIdModel(attemptId);
  if (!attempt) {
    const error = new Error('Assessment attempt not found');
    error.statusCode = 404;
    throw error;
  }

  // 2. Ownership & Role check
  const isSuperAdmin = userRole?.toLowerCase() === 'super_admin';
  const isStaff = STAFF_ROLES.includes(userRole?.toLowerCase());

  if (!isStaff) {
    // Student can ONLY view their own attempt
    const attemptUserId = parseInt(attempt.user_id, 10);
    const requestingUserId = parseInt(userId, 10);
    if (attemptUserId !== requestingUserId) {
      const error = new Error('Access forbidden: You are not authorized to view another student\'s attempt result');
      error.statusCode = 403;
      throw error;
    }
  } else if (!isSuperAdmin && userCollegeId) {
    // Staff (College Admin, Mentor, Coordinator) can only view results for their own college
    const assessment = await getAssessmentByIdModel(attempt.assessment_id);
    if (assessment && assessment.college_id && parseInt(assessment.college_id, 10) !== parseInt(userCollegeId, 10)) {
      const error = new Error('Access forbidden: Cannot access quiz result belonging to another college');
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
  const totalPossibleMarks = parseFloat(attempt.total_marks || assessment?.total_marks || 0);
  const marksObtained = parseFloat(attempt.marks_obtained || attempt.score || 0);

  const passMarksThreshold = assessment?.pass_marks !== undefined && assessment?.pass_marks !== null
    ? parseFloat(assessment.pass_marks)
    : (0.6 * totalPossibleMarks);

  const resultStatus = marksObtained >= passMarksThreshold ? 'passed' : 'failed';

  return {
    result: {
      attempt_id: attempt.id,
      status: attempt.status,
      final_result: resultStatus,
      submitted_at: attempt.submitted_at || null,
      started_at: attempt.created_at || null,
    },
    assessment: {
      id: attempt.assessment_id,
      title: attempt.assessment_title || assessment?.title,
      category: attempt.category || assessment?.category,
      pass_marks: passMarksThreshold,
      total_marks: totalPossibleMarks,
    },
    student: {
      user_id: attempt.user_id,
    },
    score: {
      total_marks: totalPossibleMarks,
      marks_obtained: marksObtained,
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
