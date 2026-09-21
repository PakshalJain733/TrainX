import { sendSuccess, sendError } from '../utils/response.js';
import { runCodeInSandbox, isLanguageSupported } from '../services/code.executor.service.js';
import { submitCodeAndSaveService } from '../services/codingSubmission.service.js';

/**
 * POST /api/v1/code/run
 * Execute supplied code against user-provided stdin in an isolated container.
 */
export const runCodeController = async (req, res, next) => {
  try {
    const { language, code, stdin = '' } = req.body || {};

    if (!language || !isLanguageSupported(language)) {
      return sendError(res, 'Unsupported or missing language', 400);
    }
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return sendError(res, 'code is required', 400);
    }

    const result = await runCodeInSandbox({
      language,
      code,
      stdin: typeof stdin === 'string' ? stdin : String(stdin ?? ''),
      timeoutSeconds: req.body.timeoutSeconds,
    });

    return sendSuccess(res, 'Code executed successfully', result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * POST /api/v1/code/submit
 * Score the authenticated student's solution against the problem's stored
 * test cases inside the Docker sandbox and persist the submission in MySQL.
 */
export const submitCodeController = async (req, res, next) => {
  try {
    const { problem_id, language, code } = req.body || {};

    if (!problem_id) {
      return sendError(res, 'problem_id is required', 400);
    }
    if (!language || !isLanguageSupported(language)) {
      return sendError(res, 'Unsupported or missing language', 400);
    }
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return sendError(res, 'code is required', 400);
    }

    // Student identity ALWAYS comes from the authenticated JWT — never from the
    // client-supplied body.
    const studentId = req.user?.userId || req.user?.id;
    if (!studentId) {
      return sendError(res, 'Authenticated user not found', 401);
    }

    const result = await submitCodeAndSaveService({
      student_id: studentId,
      problem_id,
      code,
      language,
    });

    return sendSuccess(res, 'Submission evaluated and saved successfully', result, 201);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};