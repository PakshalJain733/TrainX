import { sendSuccess, sendError } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';
import { query } from '../config/db.js';
import {
  getAssessmentsService,
  getAssessmentDetailsService,
  submitAssessmentAttemptService,
  getStudentAttemptsService,
  startAssessmentService,
  submitAssessmentService,
  getAttemptResultService,
} from '../services/assessment.service.js';
import {
  findAssessments,
  findAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
  findQuestionsByAssessment,
  findQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  findAttemptById,
  findAttemptByUserAndAssessment,
  findAttemptsByUser,
  createAttempt,
  completeAttempt,
  saveAnswer,
  findAnswersByAttempt
} from '../models/assessment.model.js';

// ─── Assessment Listing (Student + Staff) ─────────────────────────────────────

export const getAssessments = async (req, res, next) => {
  try {
    const filters = {
      college_id: req.query.college_id,
      batch_id: req.query.batch_id,
      status: req.query.status
    };
    const assessments = await findAssessments(filters);
    return sendSuccess(res, 'Assessments retrieved successfully', assessments);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStaff = [ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN, ROLES.COORDINATOR, ROLES.MENTOR].includes(req.user.role);
    // Try service first (which may have richer logic), fall back to direct model
    try {
      const data = await getAssessmentDetailsService(id, isStaff);
      return sendSuccess(res, 'Assessment details retrieved successfully', data);
    } catch (_) {
      const assessment = await findAssessmentById(id);
      if (!assessment) return sendError(res, 'Assessment not found', 404);
      return sendSuccess(res, 'Assessment retrieved successfully', assessment);
    }
  } catch (error) {
    next(error);
  }
};

// ─── Assessment CRUD (Mentor/Admin) ─────────────────────────────────────────

export const addAssessment = async (req, res, next) => {
  try {
    const { title, description, college_id, batch_id, duration_minutes, total_marks, pass_marks } = req.body;
    if (!title) return sendError(res, 'title is required', 400);

    const created_by = req.user.id;
    const assessment = await createAssessment({ title, description, college_id, batch_id, created_by, duration_minutes, total_marks, pass_marks, status: 'draft' });
    return sendSuccess(res, 'Assessment created successfully', assessment, 201);
  } catch (error) {
    next(error);
  }
};

export const editAssessment = async (req, res, next) => {
  try {
    const existing = await findAssessmentById(req.params.id);
    if (!existing) return sendError(res, 'Assessment not found', 404);

    if (existing.status === 'published') {
      return sendError(res, 'Cannot edit a published assessment. Archive it first.', 400);
    }

    const { title, description, college_id, batch_id, duration_minutes, total_marks, pass_marks, status } = req.body;
    const updated = await updateAssessment(req.params.id, {
      title: title || existing.title,
      description: description !== undefined ? description : existing.description,
      college_id: college_id !== undefined ? college_id : existing.college_id,
      batch_id: batch_id !== undefined ? batch_id : existing.batch_id,
      duration_minutes: duration_minutes !== undefined ? duration_minutes : existing.duration_minutes,
      total_marks: total_marks !== undefined ? total_marks : existing.total_marks,
      pass_marks: pass_marks !== undefined ? pass_marks : existing.pass_marks,
      status: status || existing.status
    });
    return sendSuccess(res, 'Assessment updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const removeAssessment = async (req, res, next) => {
  try {
    const existing = await findAssessmentById(req.params.id);
    if (!existing) return sendError(res, 'Assessment not found', 404);
    await deleteAssessment(req.params.id);
    return sendSuccess(res, 'Assessment deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const publishAssessmentCtrl = async (req, res, next) => {
  try {
    const existing = await findAssessmentById(req.params.id);
    if (!existing) return sendError(res, 'Assessment not found', 404);

    const questions = await findQuestionsByAssessment(req.params.id, true);
    if (!questions.length) return sendError(res, 'Cannot publish: assessment has no questions', 400);

    const updated = await publishAssessment(req.params.id);
    return sendSuccess(res, 'Assessment published successfully', updated);
  } catch (error) {
    next(error);
  }
};

// ─── Question CRUD (Mentor/Admin) ────────────────────────────────────────────

export const getQuestions = async (req, res, next) => {
  try {
    const assessment = await findAssessmentById(req.params.id);
    if (!assessment) return sendError(res, 'Assessment not found', 404);

    const questions = await findQuestionsByAssessment(req.params.id, true);
    return sendSuccess(res, 'Questions retrieved successfully', questions);
  } catch (error) {
    next(error);
  }
};

export const addQuestion = async (req, res, next) => {
  try {
    const assessment = await findAssessmentById(req.params.id);
    if (!assessment) return sendError(res, 'Assessment not found', 404);
    if (assessment.status === 'published') return sendError(res, 'Cannot add questions to a published assessment', 400);

    const { question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order } = req.body;

    if (!question_text || !option_a || !option_b || !correct_option) {
      return sendError(res, 'question_text, option_a, option_b, and correct_option are required', 400);
    }
    const validOptions = ['a', 'b', 'c', 'd'];
    if (!validOptions.includes(correct_option.toLowerCase())) {
      return sendError(res, 'correct_option must be one of: a, b, c, d', 400);
    }

    const question = await createQuestion({
      assessment_id: req.params.id,
      question_text,
      option_a,
      option_b,
      option_c: option_c || null,
      option_d: option_d || null,
      correct_option: correct_option.toLowerCase(),
      marks,
      question_order
    });
    return sendSuccess(res, 'Question added successfully', question, 201);
  } catch (error) {
    next(error);
  }
};

export const editQuestion = async (req, res, next) => {
  try {
    const assessment = await findAssessmentById(req.params.id);
    if (!assessment) return sendError(res, 'Assessment not found', 404);

    const existing = await findQuestionById(req.params.qid);
    if (!existing || existing.assessment_id != req.params.id) {
      return sendError(res, 'Question not found in this assessment', 404);
    }

    const { question_text, option_a, option_b, option_c, option_d, correct_option, marks, question_order } = req.body;

    if (correct_option) {
      const validOptions = ['a', 'b', 'c', 'd'];
      if (!validOptions.includes(correct_option.toLowerCase())) {
        return sendError(res, 'correct_option must be one of: a, b, c, d', 400);
      }
    }

    const updated = await updateQuestion(req.params.qid, {
      question_text: question_text || existing.question_text,
      option_a: option_a || existing.option_a,
      option_b: option_b || existing.option_b,
      option_c: option_c !== undefined ? option_c : existing.option_c,
      option_d: option_d !== undefined ? option_d : existing.option_d,
      correct_option: correct_option ? correct_option.toLowerCase() : existing.correct_option,
      marks: marks !== undefined ? marks : existing.marks,
      question_order: question_order !== undefined ? question_order : existing.question_order
    });
    return sendSuccess(res, 'Question updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const removeQuestion = async (req, res, next) => {
  try {
    const assessment = await findAssessmentById(req.params.id);
    if (!assessment) return sendError(res, 'Assessment not found', 404);

    const existing = await findQuestionById(req.params.qid);
    if (!existing || existing.assessment_id != req.params.id) {
      return sendError(res, 'Question not found in this assessment', 404);
    }
    await deleteQuestion(req.params.qid);
    return sendSuccess(res, 'Question deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ─── Student: View Published Assessments ─────────────────────────────────────

export const getPublishedAssessments = async (req, res, next) => {
  try {
    const filters = { status: 'published' };
    if (req.query.college_id) filters.college_id = req.query.college_id;
    if (req.query.batch_id) filters.batch_id = req.query.batch_id;
    const assessments = await findAssessments(filters);
    return sendSuccess(res, 'Available assessments retrieved successfully', assessments);
  } catch (error) {
    next(error);
  }
};

// ─── Student: Start Assessment ───────────────────────────────────────────────

export const startAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;

    if (!id || isNaN(parseInt(id, 10))) {
      return sendError(res, 'Invalid assessment ID', 400);
    }
    if (!userId) {
      return sendError(res, 'Invalid student — user ID not found in token', 401);
    }

    // Try the service first (which handles Ganesh's quiz flow)
    try {
      const result = await startAssessmentService(id, userId);
      return sendSuccess(res, 'Assessment started successfully', result, 200);
    } catch (serviceError) {
      if (serviceError.statusCode === 409) {
        return sendError(
          res,
          serviceError.message,
          409,
          serviceError.attemptId ? [{ hint: `View result at /attempts/${serviceError.attemptId}/result` }] : []
        );
      }
      // Fall back to direct DB flow
      const assessment = await findAssessmentById(id);
      if (!assessment) return sendError(res, 'Assessment not found', 404);
      if (assessment.status !== 'published') return sendError(res, 'Assessment is not available', 400);

      const completedAttempt = await findAttemptByUserAndAssessment(userId, id);
      if (completedAttempt) return sendError(res, 'You have already completed this assessment', 400);

      const inProgressRows = await query(
        "SELECT * FROM assessment_attempts WHERE user_id = ? AND assessment_id = ? AND status = 'in_progress' LIMIT 1",
        [userId, id]
      );

      let attempt;
      if (inProgressRows.length) {
        attempt = inProgressRows[0];
      } else {
        attempt = await createAttempt({ user_id: userId, assessment_id: id });
      }

      const questions = await findQuestionsByAssessment(id, false);

      return sendSuccess(res, 'Assessment started successfully', {
        attempt_id: attempt.id,
        assessment: {
          id: assessment.id,
          title: assessment.title,
          description: assessment.description,
          duration_minutes: assessment.duration_minutes,
          total_marks: assessment.total_marks,
          pass_marks: assessment.pass_marks
        },
        questions
      });
    }
  } catch (error) {
    next(error);
  }
};

// ─── Student: Submit Assessment ───────────────────────────────────────────────

export const submitAssessment = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!attemptId || isNaN(parseInt(attemptId, 10))) {
      return sendError(res, 'Invalid attempt ID', 400);
    }
    if (!answers || !Array.isArray(answers)) {
      return sendError(res, 'Answers must be provided as an array', 400);
    }
    if (answers.length === 0) {
      return sendError(res, 'At least one answer must be submitted', 400);
    }

    // Try service first
    try {
      const result = await submitAssessmentService(attemptId, userId, answers);
      return sendSuccess(res, 'Assessment submitted and evaluated successfully', result, 200);
    } catch (serviceError) {
      if (serviceError.statusCode) {
        return sendError(res, serviceError.message, serviceError.statusCode);
      }
      // Fall back to direct DB flow
      const attempt = await findAttemptById(attemptId);
      if (!attempt) return sendError(res, 'Attempt not found', 404);
      if (attempt.user_id !== userId) return sendError(res, 'Unauthorized', 403);
      if (attempt.status === 'completed') return sendError(res, 'This attempt has already been submitted', 400);

      const assessment = await findAssessmentById(attempt.assessment_id);
      if (!assessment) return sendError(res, 'Assessment not found', 404);

      const questions = await findQuestionsByAssessment(attempt.assessment_id, true);
      if (!questions.length) return sendError(res, 'Assessment has no questions', 400);

      let score = 0;
      let correctCount = 0;
      const questionMap = {};
      for (const q of questions) {
        questionMap[q.id] = q;
      }

      const answersToSave = [];
      const submittedIds = new Set();

      for (const ans of answers) {
        const { question_id, selected_option } = ans;
        const q = questionMap[question_id];
        if (!q) return sendError(res, `Question ${question_id} does not belong to this assessment`, 400);
        if (submittedIds.has(question_id)) return sendError(res, `Duplicate answer for question ${question_id}`, 400);
        submittedIds.add(question_id);

        const chosenOption = selected_option ? selected_option.toLowerCase() : null;
        if (chosenOption && !['a', 'b', 'c', 'd'].includes(chosenOption)) {
          return sendError(res, `Invalid option '${selected_option}' for question ${question_id}`, 400);
        }

        const isCorrect = chosenOption && chosenOption === q.correct_option;
        const marksAwarded = isCorrect ? q.marks : 0;
        if (isCorrect) { score += marksAwarded; correctCount++; }
        answersToSave.push({ attempt_id: attempt.id, question_id, selected_option: chosenOption, is_correct: isCorrect, marks_awarded: marksAwarded });
      }

      for (const q of questions) {
        if (!submittedIds.has(q.id)) {
          answersToSave.push({ attempt_id: attempt.id, question_id: q.id, selected_option: null, is_correct: false, marks_awarded: 0 });
        }
      }

      for (const a of answersToSave) {
        await saveAnswer(a);
      }

      const totalPossibleMarks = questions.reduce((sum, q) => sum + q.marks, 0);
      const percentage = totalPossibleMarks > 0 ? parseFloat(((score / totalPossibleMarks) * 100).toFixed(2)) : 0;

      const completedAttempt = await completeAttempt(attempt.id, {
        score,
        percentage,
        total_questions: questions.length,
        correct_answers: correctCount
      });

      return sendSuccess(res, 'Assessment submitted successfully', {
        attempt_id: attempt.id,
        assessment_title: assessment.title,
        score,
        total_marks: totalPossibleMarks,
        percentage,
        total_questions: questions.length,
        correct_answers: correctCount,
        passed: score >= assessment.pass_marks
      });
    }
  } catch (error) {
    next(error);
  }
};

// ─── Student: Get Own Result ──────────────────────────────────────────────────

export const getMyResult = async (req, res, next) => {
  try {
    const attempt = await findAttemptById(req.params.attemptId);
    if (!attempt) return sendError(res, 'Attempt not found', 404);

    if (attempt.user_id !== req.user.id) return sendError(res, 'Unauthorized', 403);
    if (attempt.status !== 'completed') return sendError(res, 'Attempt not yet completed', 400);

    const answers = await findAnswersByAttempt(attempt.id);
    const assessment = await findAssessmentById(attempt.assessment_id);

    return sendSuccess(res, 'Result retrieved successfully', {
      attempt,
      assessment: { id: assessment.id, title: assessment.title, total_marks: assessment.total_marks, pass_marks: assessment.pass_marks },
      answers
    });
  } catch (error) {
    next(error);
  }
};

// ─── Student: Get All My Attempts ─────────────────────────────────────────────

export const getMyAttempts = async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    // Try service first, fall back to direct model
    try {
      const attempts = await getStudentAttemptsService(userId);
      return sendSuccess(res, 'Your assessment attempts retrieved successfully', attempts);
    } catch (_) {
      const attempts = await findAttemptsByUser(userId);
      return sendSuccess(res, 'Attempts retrieved successfully', attempts);
    }
  } catch (error) {
    next(error);
  }
};

// ─── Get Attempt Result (Staff can see any, Student sees own) ─────────────────

export const getAttemptResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role;

    if (!attemptId || isNaN(parseInt(attemptId, 10))) {
      return sendError(res, 'Invalid attempt ID', 400);
    }

    try {
      const result = await getAttemptResultService(attemptId, userId, userRole);
      return sendSuccess(res, 'Assessment result retrieved successfully', result);
    } catch (serviceError) {
      if (serviceError.statusCode) {
        return sendError(res, serviceError.message, serviceError.statusCode);
      }
      // Fall back
      const attempt = await findAttemptById(attemptId);
      if (!attempt) return sendError(res, 'Attempt not found', 404);
      if (attempt.user_id !== userId) return sendError(res, 'Unauthorized', 403);
      const answers = await findAnswersByAttempt(attempt.id);
      const assessment = await findAssessmentById(attempt.assessment_id);
      return sendSuccess(res, 'Assessment result retrieved successfully', { attempt, assessment, answers });
    }
  } catch (error) {
    next(error);
  }
};

// ─── Admin: Submit attempt (legacy) ──────────────────────────────────────────

/**
 * @deprecated  Use submitAssessment (POST /attempts/:attemptId/submit) instead.
 * Kept for backward compatibility with old route POST /:id/attempts.
 */
export const submitAssessmentAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return sendError(res, 'Submitted answers must be provided as an array', 400);
    }

    const userId = req.user.userId || req.user.id;
    const collegeId = req.user.collegeId || 1;

    const evaluationResult = await submitAssessmentAttemptService({
      assessmentId: id,
      userId,
      collegeId,
      submittedAnswers: answers,
    });

    return sendSuccess(res, 'Assessment evaluated and recorded successfully', evaluationResult, 201);
  } catch (error) {
    next(error);
  }
};

// ─── Admin: View All Results for an Assessment ────────────────────────────────

export const getAssessmentResults = async (req, res, next) => {
  try {
    const assessment = await findAssessmentById(req.params.id);
    if (!assessment) return sendError(res, 'Assessment not found', 404);

    const results = await query(`
      SELECT aa.*, u.name AS student_name, u.email AS student_email
      FROM assessment_attempts aa
      JOIN users u ON aa.user_id = u.id
      WHERE aa.assessment_id = ? AND aa.status = 'completed'
      ORDER BY aa.score DESC
    `, [req.params.id]);

    return sendSuccess(res, 'Assessment results retrieved successfully', { assessment, results });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentData = getAssessments;
