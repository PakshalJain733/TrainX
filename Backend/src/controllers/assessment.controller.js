import { sendSuccess, sendError } from '../utils/response.js';
import {
  getAssessmentsService,
  getAssessmentDetailsService,
  startAssessmentService,
  submitAssessmentService,
  submitAssessmentAttemptService,
  getAttemptResultService,
} from '../services/assessment.service.js';
import {
  findAssessments,
  getAssessmentByIdModel,
  createAssessment as createAssessmentModel,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
  getAssessmentQuestionsModel,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getStudentAttemptsModel,
  getAssessmentAttemptsModel,
} from '../models/assessment.model.js';
import { generateQuizQuestionsAI } from '../ai/quiz.ai.js';
import { ROLES } from '../utils/constants.js';

export const getAssessments = async (req, res, next) => {
  try {
    const collegeId = req.user?.role === ROLES.SUPER_ADMIN ? req.query.collegeId : req.user?.collegeId;
    const { batch_id, status } = req.query;

    const assessments = await findAssessments({
      college_id: collegeId,
      batch_id,
      status,
    });

    return sendSuccess(res, 'Assessments retrieved successfully', assessments);
  } catch (error) {
    next(error);
  }
};

export const getPublishedAssessments = async (req, res, next) => {
  try {
    const collegeId = req.user?.collegeId;
    const assessments = await getAssessmentsService(collegeId);
    return sendSuccess(res, 'Published assessments retrieved successfully', assessments);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStaff = [ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN].includes(req.user?.role);
    const assessment = await getAssessmentDetailsService(id, isStaff, req.user?.collegeId);
    return sendSuccess(res, 'Assessment details retrieved successfully', assessment);
  } catch (error) {
    next(error);
  }
};

export const addAssessment = async (req, res, next) => {
  try {
    const { title, description, category, duration_minutes, total_marks, pass_marks, batch_id } = req.body;
    if (!title) {
      return sendError(res, 'Title is required', 400);
    }

    const newAssessment = await createAssessmentModel({
      title,
      description,
      category: category || 'Technical Quiz',
      duration_minutes: duration_minutes || 30,
      total_marks: total_marks || 50,
      pass_marks: pass_marks || 0,
      batch_id: batch_id || null,
      college_id: req.user?.collegeId || 1,
      created_by: req.user?.userId || req.user?.id,
    });

    return sendSuccess(res, 'Assessment created successfully', newAssessment, 201);
  } catch (error) {
    next(error);
  }
};

export const createAssessment = addAssessment;

export const editAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await updateAssessment(id, req.body);
    if (!updated) {
      return sendError(res, 'Assessment not found', 404);
    }
    return sendSuccess(res, 'Assessment updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const removeAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteAssessment(id);
    return sendSuccess(res, 'Assessment deleted successfully');
  } catch (error) {
    next(error);
  }
};

export const publishAssessmentCtrl = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_published = true } = req.body;
    const result = await publishAssessment(id, is_published);
    return sendSuccess(res, 'Assessment published status updated', result);
  } catch (error) {
    next(error);
  }
};

export const getQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isStaff = [ROLES.MENTOR, ROLES.COORDINATOR, ROLES.COLLEGE_ADMIN, ROLES.SUPER_ADMIN].includes(req.user?.role);
    const questions = await getAssessmentQuestionsModel(id, isStaff);
    return sendSuccess(res, 'Questions retrieved successfully', questions);
  } catch (error) {
    next(error);
  }
};

export const addQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question_text, option_a, option_b, option_c, option_d, correct_option, marks, explanation } = req.body;

    if (!question_text || !option_a || !option_b || !correct_option) {
      return sendError(res, 'Question text, option_a, option_b, and correct_option are required', 400);
    }

    const newQ = await createQuestion(id, {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      marks: marks || 10,
      explanation,
    });

    return sendSuccess(res, 'Question added successfully', newQ, 201);
  } catch (error) {
    next(error);
  }
};

export const editQuestion = async (req, res, next) => {
  try {
    const { qid } = req.params;
    const updated = await updateQuestion(qid, req.body);
    return sendSuccess(res, 'Question updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

export const removeQuestion = async (req, res, next) => {
  try {
    const { qid } = req.params;
    await deleteQuestion(qid);
    return sendSuccess(res, 'Question removed successfully');
  } catch (error) {
    next(error);
  }
};

export const startAssessment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const collegeId = req.user?.collegeId || 1;

    const data = await startAssessmentService(id, userId, req.user?.role || 'student', collegeId);
    return sendSuccess(res, 'Assessment attempt started', data);
  } catch (error) {
    next(error);
  }
};

export const submitAssessment = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const userCollegeId = req.user?.collegeId || 1;
    const { answers } = req.body;

    const result = await submitAssessmentService(attemptId, userId, answers || [], req.user?.role || 'student', userCollegeId);

    return sendSuccess(res, 'Assessment submitted successfully', result);
  } catch (error) {
    next(error);
  }
};

export const submitAssessmentAttempt = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const collegeId = req.user?.collegeId || 1;
    const { answers } = req.body;

    const result = await submitAssessmentAttemptService({
      assessmentId: id,
      userId,
      collegeId,
      submittedAnswers: answers || [],
    });

    return sendSuccess(res, 'Assessment evaluated successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getAttemptResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const userRole = req.user?.role;
    const userCollegeId = req.user?.collegeId;

    const result = await getAttemptResultService(attemptId, userId, userRole, userCollegeId);
    return sendSuccess(res, 'Attempt result retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getMyResult = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const userId = req.user?.userId || req.user?.id;

    const result = await getAttemptResultService(attemptId, userId, ROLES.STUDENT);
    return sendSuccess(res, 'My attempt result retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

export const getMyAttempts = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const attempts = await getStudentAttemptsModel(userId);
    return sendSuccess(res, 'My assessment attempts retrieved successfully', attempts);
  } catch (error) {
    next(error);
  }
};

export const getAssessmentResults = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collegeId =
      req.user?.role === ROLES.SUPER_ADMIN
        ? (req.query.collegeId || null)
        : (req.user?.collegeId || req.user?.college_id || null);
    const results = await getAssessmentAttemptsModel(id, collegeId);
    return sendSuccess(res, 'Assessment results retrieved successfully', results);
  } catch (error) {
    next(error);
  }
};

export const generateAIQuestionsCtrl = async (req, res, next) => {
  try {
    const { title, count } = req.body;
    if (!title) {
      return sendError(res, 'Quiz title/topic is required for AI question generation', 400);
    }
    const questions = await generateQuizQuestionsAI(title, count || 10);
    return sendSuccess(res, 'AI questions generated successfully', questions);
  } catch (error) {
    next(error);
  }
};
