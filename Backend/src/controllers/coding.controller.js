import { sendSuccess, sendError } from '../utils/response.js';
import { runCodeInSandbox, isLanguageSupported } from '../services/code.executor.service.js';
import { submitCodeAndSaveService, getStudentSubmissionsService, evaluateCodeInSandbox } from '../services/codingSubmission.service.js';

/**
 * POST /api/v1/code/run
 * Execute supplied code against user-provided stdin in an isolated container.
 */
export const runCodeController = async (req, res, next) => {
  try {
    const { language, code, stdin = '', function_name, functionName } = req.body || {};

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
      function_name: function_name || functionName,
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
    const { problem_id, language, code, source, task_id, function_name, functionName } = req.body || {};

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
      source,
      task_id,
      function_name: function_name || functionName,
    });

    return sendSuccess(res, 'Submission evaluated and saved successfully', result, 201);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * GET /api/v1/code/submissions/my
 * Return all coding submissions for the authenticated student.
 */
export const mySubmissionsController = async (req, res, next) => {
  try {
    const studentId = req.user?.userId || req.user?.id;
    if (!studentId) {
      return sendError(res, 'Authenticated user not found', 401);
    }

    const result = await getStudentSubmissionsService(studentId);
    return sendSuccess(res, 'Submissions retrieved successfully', result);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};

/**
 * POST /api/v1/code/evaluate
 * Unified evaluation endpoint for arbitrary/generated test cases (e.g. AI Roadmap Practice).
 * Runs test cases in the shared sandbox, masks hidden cases, and returns structured verdict.
 */
export const evaluateCodeController = async (req, res, next) => {
  try {
    const { language, code, test_cases, testCases, function_name, functionName } = req.body || {};

    if (!language || !isLanguageSupported(language)) {
      return sendError(res, 'Unsupported or missing language', 400);
    }
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return sendError(res, 'code is required', 400);
    }

    const rawCases = Array.isArray(test_cases) ? test_cases : (Array.isArray(testCases) ? testCases : []);
    if (rawCases.length === 0) {
      return sendError(res, 'At least one testcase is required for evaluation', 400);
    }

    const normalizedCases = rawCases.map((tc, idx) => ({
      id: tc.id || idx + 1,
      input: tc.input || '',
      expected_output: tc.expected_output || tc.output || '',
      is_hidden: Boolean(tc.is_hidden || tc.isHidden),
    }));

    const result = await evaluateCodeInSandbox({
      submittedCode: code,
      language,
      testCases: normalizedCases,
      function_name: function_name || functionName || null,
    });

    const passed = result.passed_test_cases || 0;
    const total = result.total_test_cases || normalizedCases.length;
    const percentage = total > 0 ? Number(((passed / total) * 100).toFixed(2)) : 0.0;
    const status = passed === total
      ? 'accepted'
      : (result.compilation_error
          ? 'compilation_error'
          : (result.timed_out
              ? 'time_limit_exceeded'
              : (result.runtime_error ? 'runtime_error' : 'wrong_answer')));

    return sendSuccess(res, 'Evaluation completed', {
      passed_test_cases: passed,
      total_test_cases: total,
      percentage,
      status,
      compilation_error: Boolean(result.compilation_error),
      timed_out: Boolean(result.timed_out),
      runtime_error: Boolean(result.runtime_error),
      execution_time_ms: result.execution_time_ms || 0,
      results: result.results,
    });
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    next(error);
  }
};
