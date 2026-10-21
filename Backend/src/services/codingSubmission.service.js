import {
  findStudentById,
  findCodingProblemById,
  findCodingTestCasesByProblemId,
  createSubmissionModel,
  getSubmissionByIdModel,
  getStudentSubmissionsModel,
} from '../models/codingSubmission.model.js';
import {
  runCodeInSandbox,
  normalizeOutput,
  deriveSubmissionStatus,
} from './code.executor.service.js';
import { query } from '../config/db.js';

/**
 * Safe Evaluation Sandbox Layer:
 * Untrusted code is NEVER executed inside the Node.js process. Every test case
 * is executed inside an isolated `trainx-code-runner` Docker container via
 * `runCodeInSandbox` (network disabled, memory/CPU/PID limits, timeout,
 * read-only root, non-root user). Hidden expected outputs are never included
 * in the returned results.
 */
export const evaluateCodeInSandbox = async ({ submittedCode: code, language, testCases = [] }) => {
  if (testCases.length === 0) {
    return {
      sandbox: 'docker',
      total_test_cases: 0,
      passed_test_cases: 0,
      compilation_error: false,
      timed_out: false,
      runtime_error: false,
      execution_time_ms: 0,
      results: [],
    };
  }

  const results = [];
  let passed = 0;
  let compilationError = false;
  let timedOut = false;
  let runtimeError = false;
  let totalExecutionMs = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    if (compilationError || timedOut) break;

    let runResult;
    try {
      runResult = await runCodeInSandbox({
        language,
        code,
        stdin: tc.input || '',
        timeoutSeconds: 5,
      });
    } catch (error) {
      if (error.statusCode) throw error;
      throw error;
    }

    totalExecutionMs += runResult.executionTime;

    if (runResult.compilationError) {
      compilationError = true;
      results.push({
        test_case_id: tc.id,
        test_case_number: i + 1,
        is_hidden: Boolean(tc.is_hidden),
        passed: false,
        execution_time_ms: runResult.executionTime,
      });
      break;
    }
    if (runResult.timedOut) {
      timedOut = true;
      results.push({
        test_case_id: tc.id,
        test_case_number: i + 1,
        is_hidden: Boolean(tc.is_hidden),
        passed: false,
        timed_out: true,
        execution_time_ms: runResult.executionTime,
      });
      break;
    }
    if (runResult.exitCode !== 0) runtimeError = true;

    const actual = normalizeOutput(runResult.stdout);
    const expected = normalizeOutput(tc.expected_output);
    const casePassed = actual === expected;
    if (casePassed) passed += 1;

    const base = {
      test_case_id: tc.id,
      test_case_number: i + 1,
      is_hidden: Boolean(tc.is_hidden),
      passed: casePassed,
      execution_time_ms: runResult.executionTime,
    };
    if (Boolean(tc.is_hidden)) {
      results.push(base);
    } else {
      results.push({
        ...base,
        input: tc.input,
        expected_output: tc.expected_output,
        actual_output: runResult.stdout,
        stderr: runResult.stderr,
      });
    }
  }

  for (let i = results.length; i < testCases.length; i++) {
    const tc = testCases[i];
    const base = { test_case_id: tc.id, test_case_number: i + 1, is_hidden: Boolean(tc.is_hidden), passed: false, not_evaluated: true };
    results.push(Boolean(tc.is_hidden) ? base : { ...base, input: tc.input, expected_output: tc.expected_output, actual_output: null });
  }

  return {
    sandbox: 'docker',
    total_test_cases: testCases.length,
    passed_test_cases: passed,
    compilation_error: compilationError,
    timed_out: timedOut,
    runtime_error: runtimeError,
    execution_time_ms: totalExecutionMs,
    results,
  };
};

/**
 * Evaluate a student's code against the stored test cases for a problem using
 * the real Docker sandbox, then persist the result in MySQL.
 * Hidden expected outputs are never included in the payload returned to the
 * client.
 */
export const submitCodeAndSaveService = async ({ student_id, problem_id, code, language, source = null, task_id = null }) => {
  if (!problem_id) {
    const error = new Error('problem_id is required');
    error.statusCode = 400;
    throw error;
  }
  if (code === undefined || code === null || String(code).trim() === '') {
    const error = new Error('source_code is required');
    error.statusCode = 400;
    throw error;
  }
  if (!language || String(language).trim() === '') {
    const error = new Error('language is required');
    error.statusCode = 400;
    throw error;
  }
  if (!student_id) {
    const error = new Error('Authenticated student id is required');
    error.statusCode = 400;
    throw error;
  }

  const student = await findStudentById(student_id);
  if (!student) {
    const error = new Error(`Student with ID ${student_id} not found`);
    error.statusCode = 404;
    throw error;
  }

  let problem = null;
  let testCases = [];
  let isBatchTask = false;
  let batchTaskRecord = null;

  const numericProblemId = parseInt(problem_id, 10);
  const cleanTaskId = task_id ? String(task_id).replace(/[^0-9]/g, '') : null;
  const numericTaskId = cleanTaskId ? parseInt(cleanTaskId, 10) : null;

  // 1. Check if this is a coursework batch task from batch_tasks table
  if (source === 'batch_task' || numericTaskId || !isNaN(numericProblemId)) {
    try {
      const candidates = [numericTaskId, numericProblemId].filter((v) => v && !isNaN(v));
      if (candidates.length > 0) {
        const placeholders = candidates.map(() => '?').join(',');
        const bRows = await query(`SELECT * FROM batch_tasks WHERE id IN (${placeholders}) LIMIT 1`, candidates);
        if (bRows && bRows.length > 0 && (source === 'batch_task' || numericTaskId || bRows[0].id === numericProblemId)) {
          batchTaskRecord = bRows[0];
          isBatchTask = true;
          problem = {
            id: batchTaskRecord.id,
            title: batchTaskRecord.title,
            description: batchTaskRecord.description || '',
            total_marks: batchTaskRecord.points || 100,
            time_limit_ms: 3000,
          };
          let rawCases = [];
          if (batchTaskRecord.test_cases) {
            try {
              rawCases = typeof batchTaskRecord.test_cases === 'string' ? JSON.parse(batchTaskRecord.test_cases) : batchTaskRecord.test_cases;
            } catch (_) {
              rawCases = [];
            }
          }
          if (Array.isArray(rawCases) && rawCases.length > 0) {
            testCases = rawCases.map((tc, idx) => ({
              id: tc.id || idx + 1,
              problem_id: batchTaskRecord.id,
              input: tc.input || '',
              expected_output: tc.expectedOutput || tc.expected_output || tc.output || '',
              is_hidden: Boolean(tc.isHidden || tc.is_hidden),
              weightage: tc.weightage || Math.round(100 / rawCases.length),
            }));
          }
        }
      }
    } catch (e) {
      console.warn('[submitCodeAndSaveService] batch_tasks lookup fallback:', e.message);
    }
  }

  // 2. If not a batch task, check practice_problems
  if (!problem && (source === 'practice_problem' || !isNaN(numericProblemId))) {
    try {
      const pRows = await query('SELECT * FROM practice_problems WHERE id = ? LIMIT 1', [numericProblemId]);
      if (pRows && pRows.length > 0) {
        problem = {
          id: pRows[0].id,
          title: pRows[0].title,
          description: pRows[0].description,
          total_marks: pRows[0].points || 100,
          time_limit_ms: 3000,
        };
        const tcRows = await query('SELECT * FROM coding_test_cases WHERE problem_id = ? ORDER BY id ASC', [numericProblemId]);
        if (tcRows && tcRows.length > 0) {
          testCases = tcRows;
        }
      }
    } catch (e) {
      console.warn('[submitCodeAndSaveService] practice_problems lookup fallback:', e.message);
    }
  }

  // 3. Fallback to standard coding_problems table
  if (!problem) {
    problem = await findCodingProblemById(problem_id);
    if (!problem) {
      const error = new Error(`Coding problem with ID ${problem_id} not found`);
      error.statusCode = 404;
      throw error;
    }
    testCases = await findCodingTestCasesByProblemId(problem_id);
  }

  // If a batch task has no test cases configured at all, synthesize 1 basic test case
  if (!testCases || testCases.length === 0) {
    if (isBatchTask) {
      testCases = [{ id: 1, problem_id: problem.id, input: '', expected_output: '', is_hidden: false, weightage: 100 }];
    } else {
      const error = new Error(`No test cases configured for problem ID ${problem_id}`);
      error.statusCode = 409;
      throw error;
    }
  }

  // Enforce single-submission rule: Reattempts are strictly not allowed once submitted
  if (isBatchTask && batchTaskRecord) {
    try {
      const existing = await query(
        `SELECT id, status, submitted_at FROM task_submissions WHERE task_id = ? AND user_id = ? LIMIT 1`,
        [batchTaskRecord.id, student.id || student_id]
      );
      if (existing && existing.length > 0) {
        const error = new Error('You have already submitted this task. Reattempts are not allowed.');
        error.statusCode = 403;
        throw error;
      }
    } catch (e) {
      if (e.statusCode) throw e;
      console.warn('[submitCodeAndSaveService] check existing task_submission fallback:', e.message);
    }
  }

  const problemTimeLimitMs = parseInt(problem.time_limit_ms, 10) || 5000;
  const timeoutSeconds = Math.min(Math.max(Math.round(problemTimeLimitMs / 1000), 5), 10);

  const totalTests = testCases.length;
  let passedTests = 0;
  let overallTimedOut = false;
  let overallCompilationError = false;
  let overallRuntimeError = false;
  let totalExecutionMs = 0;

  const executed = [];

  for (let tcIdx = 0; tcIdx < testCases.length; tcIdx++) {
    const tc = testCases[tcIdx];
    const tcNumber = tcIdx + 1;
    if (overallCompilationError || overallTimedOut) break;

    let runResult;
    try {
      runResult = await runCodeInSandbox({ language, code, stdin: tc.input || '', timeoutSeconds });
    } catch (error) {
      // Propagate controlled compiler service errors (503) so the controller
      // can surface a clean message without crashing the backend.
      if (error.statusCode) throw error;
      throw error;
    }

    totalExecutionMs += runResult.executionTime;

    if (runResult.compilationError) {
      overallCompilationError = true;
      executed.push({
        test_case_id: tc.id,
        test_case_number: tcNumber,
        is_hidden: Boolean(tc.is_hidden),
        passed: false,
        execution_time_ms: runResult.executionTime,
      });
      break;
    }

    if (runResult.timedOut) {
      overallTimedOut = true;
      executed.push({
        test_case_id: tc.id,
        test_case_number: tcNumber,
        is_hidden: Boolean(tc.is_hidden),
        passed: false,
        timed_out: true,
        execution_time_ms: runResult.executionTime,
      });
      break;
    }

    const runtimeError = runResult.exitCode !== 0;
    if (runtimeError) overallRuntimeError = true;

    const actual = normalizeOutput(runResult.stdout);
    const expected = normalizeOutput(tc.expected_output);
    const passed = actual === expected;

    if (passed) passedTests += 1;

    if (Boolean(tc.is_hidden)) {
      executed.push({
        test_case_id: tc.id,
        test_case_number: tcNumber,
        is_hidden: true,
        passed,
        execution_time_ms: runResult.executionTime,
      });
    } else {
      executed.push({
        test_case_id: tc.id,
        test_case_number: tcNumber,
        is_hidden: false,
        passed,
        execution_time_ms: runResult.executionTime,
        input: tc.input,
        expected_output: tc.expected_output,
        actual_output: runResult.stdout,
        stderr: runResult.stderr,
      });
    }
  }

  // If evaluation stopped early (compilation error / time limit exceeded),
  // still report every stored test case so the UI can render a complete list.
  for (let i = executed.length; i < testCases.length; i++) {
    const tc = testCases[i];
    if (Boolean(tc.is_hidden)) {
      executed.push({
        test_case_id: tc.id,
        test_case_number: i + 1,
        is_hidden: true,
        passed: false,
        not_evaluated: true,
      });
    } else {
      executed.push({
        test_case_id: tc.id,
        test_case_number: i + 1,
        is_hidden: false,
        passed: false,
        not_evaluated: true,
        input: tc.input,
        expected_output: tc.expected_output,
        actual_output: null,
      });
    }
  }

  const status = deriveSubmissionStatus({
    timedOut: overallTimedOut,
    compilationError: overallCompilationError,
    runtimeError: overallRuntimeError,
    passedTests,
    totalTests,
  });

  const problemTotalMarks = parseInt(problem.total_marks || problem.points, 10) || 100;

  // Calculate marks based on test case weights if configured, or equal distribution
  const totalWeight = testCases.reduce(
    (acc, tc) => acc + (Number(tc.weightage) > 0 ? Number(tc.weightage) : 1),
    0
  );
  let passedWeight = 0;
  testCases.forEach((tc, idx) => {
    if (executed[idx] && executed[idx].passed) {
      passedWeight += (Number(tc.weightage) > 0 ? Number(tc.weightage) : 1);
    }
  });

  let marks = 0;
  let score = 0;
  let percentage = 0;

  if (totalTests > 0 && !overallCompilationError) {
    if (passedTests === totalTests) {
      marks = problemTotalMarks;
      score = problemTotalMarks;
      percentage = 100.0;
    } else if (passedTests === 0) {
      marks = 0;
      score = 0;
      percentage = 0.0;
    } else {
      const ratio = totalWeight > 0 ? (passedWeight / totalWeight) : (passedTests / totalTests);
      percentage = Number((ratio * 100).toFixed(2));
      marks = Math.round(ratio * problemTotalMarks);
      score = marks;
    }
  }

  // Ensure coding_problems table has an entry for this problem ID so foreign key constraint never fails
  try {
    await query(
      `INSERT INTO coding_problems (id, title, description, difficulty, category, total_marks)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         title = COALESCE(VALUES(title), title), 
         total_marks = COALESCE(VALUES(total_marks), total_marks)`,
      [
        problem.id,
        problem.title || `Problem ${problem.id}`,
        problem.description || '',
        problem.difficulty || 'Medium',
        problem.category || 'Practice',
        problemTotalMarks,
      ]
    );
  } catch (e) {
    console.warn('[submitCodeAndSaveService] coding_problems sync notice:', e.message);
  }

  const submissionRecord = await createSubmissionModel({
    student_id: student.id || student_id,
    problem_id: problem.id,
    submitted_code: code,
    language,
    passed_test_cases: passedTests,
    total_test_cases: totalTests,
    score,
    marks,
    percentage,
    status,
    execution_details: {
      sandbox: 'docker',
      status,
      score,
      marks,
      total_marks: problemTotalMarks,
      percentage,
      passed_test_cases: passedTests,
      total_test_cases: totalTests,
      execution_time_ms: totalExecutionMs,
      results: executed,
    },
  });

  if (isBatchTask && batchTaskRecord) {
    const taskStatus = (status === 'accepted' || status === 'passed')
      ? 'Passed'
      : (passedTests > 0 ? 'Partial' : (overallCompilationError ? 'Compilation Error' : (overallTimedOut ? 'Time Limit Exceeded' : 'Wrong Answer')));
    const feedbackText = `Passed ${passedTests}/${totalTests} test cases (${percentage}%) - Score: ${score}/${problemTotalMarks} pts`;

    try {
      const existingSub = await query(
        `SELECT id FROM task_submissions WHERE task_id = ? AND user_id = ? LIMIT 1`,
        [batchTaskRecord.id, student.id || student_id]
      );

      if (existingSub && existingSub.length > 0) {
        await query(
          `UPDATE task_submissions 
           SET status = ?, 
               score = ?, 
               marks_obtained = ?, 
               submitted_code = ?, 
               code_submission = ?, 
               batch_id = COALESCE(?, batch_id), 
               feedback = ?, 
               submitted_at = NOW()
           WHERE id = ?`,
          [
            taskStatus,
            score,
            score,
            code,
            code,
            batchTaskRecord.batch_id || null,
            feedbackText,
            existingSub[0].id,
          ]
        );
      } else {
        await query(
          `INSERT INTO task_submissions 
            (task_id, user_id, batch_id, status, score, marks_obtained, submitted_code, code_submission, feedback, submitted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            batchTaskRecord.id,
            student.id || student_id,
            batchTaskRecord.batch_id || null,
            taskStatus,
            score,
            score,
            code,
            code,
            feedbackText,
          ]
        );
      }
    } catch (e) {
      console.warn('[task_submissions save error]', e.message);
      try {
        await query(
          `INSERT INTO task_submissions (task_id, user_id, status, score, submitted_code, submitted_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [batchTaskRecord.id, student.id || student_id, taskStatus, score, code]
        );
      } catch (innerErr) {
        console.warn('[task_submissions fallback error]', innerErr.message);
      }
    }
  }

  // Also record in practice_problem_submissions for practice problems
  if (!isBatchTask && problem) {
    try {
      const practiceStatus = (status === 'accepted' || status === 'passed') ? 'Solved' : (passedTests > 0 ? 'Partially Solved' : 'Attempted');
      const exist = await query(
        'SELECT id FROM practice_problem_submissions WHERE problem_id = ? AND user_id = ? LIMIT 1',
        [problem.id, student.id || student_id]
      );
      if (exist && exist.length > 0) {
        await query(
          `UPDATE practice_problem_submissions 
           SET code_submitted = ?, language = ?, status = ?, points_earned = ?, submitted_at = NOW() 
           WHERE id = ?`,
          [code, language, practiceStatus, score, exist[0].id]
        );
      } else {
        await query(
          `INSERT INTO practice_problem_submissions (problem_id, user_id, code_submitted, language, status, points_earned, submitted_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [problem.id, student.id || student_id, code, language, practiceStatus, score]
        );
      }
    } catch (e) {
      console.warn('[practice_problem_submissions save error]', e.message);
    }
  }

  const { execution_details, submitted_code, ...safeSubmission } =
    submissionRecord && typeof submissionRecord === 'object' ? submissionRecord : {};

  return {
    problem_id: problem.id,
    language,
    status,
    passed_tests: passedTests,
    total_tests: totalTests,
    marks,
    total_marks: problemTotalMarks,
    score,
    percentage,
    execution_time_ms: totalExecutionMs,
    compilation_error: overallCompilationError,
    timed_out: overallTimedOut,
    test_results: executed,
    submission: safeSubmission || null,
  };
};

/**
 * Save student coding attempt and calculate marks (backwards-compatible path).
 */
export const saveCodingSubmissionService = async ({
  student_id,
  problem_id,
  submitted_code,
  language,
  passed_test_cases,
  total_test_cases,
  score,
  marks,
  percentage,
  status,
  execution_details,
}) => {
  // 1. Validate mandatory fields
  if (!problem_id) {
    const error = new Error('problem_id is required');
    error.statusCode = 400;
    throw error;
  }

  if (submitted_code === undefined || submitted_code === null || submitted_code.trim() === '') {
    const error = new Error('submitted_code is required');
    error.statusCode = 400;
    throw error;
  }

  if (!language || language.trim() === '') {
    const error = new Error('language is required');
    error.statusCode = 400;
    throw error;
  }

  if (!student_id) {
    const error = new Error('student_id is required');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate Student Existence
  const student = await findStudentById(student_id);
  if (!student) {
    const error = new Error(`Student with ID ${student_id} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 3. Validate Problem Existence
  const problem = await findCodingProblemById(problem_id);
  if (!problem) {
    const error = new Error(`Coding problem with ID ${problem_id} not found`);
    error.statusCode = 404;
    throw error;
  }

  // 4. Fetch test cases if total test cases are not explicitly provided
  const testCases = await findCodingTestCasesByProblemId(problem_id);
  const resolvedTotalTestCases =
    total_test_cases !== undefined && total_test_cases !== null
      ? parseInt(total_test_cases, 10)
      : testCases.length > 0
      ? testCases.length
      : 5;

  let resolvedPassedTestCases;
  let resolvedExecutionDetails = execution_details || null;

  if (passed_test_cases !== undefined && passed_test_cases !== null) {
    resolvedPassedTestCases = parseInt(passed_test_cases, 10);
  } else {
    // If passed_test_cases is not provided, evaluate using the structured sandbox adapter
    const evalResult = await evaluateCodeInSandbox({
      submittedCode: submitted_code,
      language,
      testCases,
    });
    resolvedPassedTestCases = evalResult.passed_test_cases;
    resolvedExecutionDetails = evalResult;
  }

  // Ensure passed test cases cannot exceed total test cases or be negative
  resolvedPassedTestCases = Math.max(0, Math.min(resolvedPassedTestCases, resolvedTotalTestCases));

  // 5. Calculate Marks and Percentage
  const problemTotalMarks = problem.total_marks || 100;

  const calculatedPercentage =
    resolvedTotalTestCases > 0
      ? Number(((resolvedPassedTestCases / resolvedTotalTestCases) * 100).toFixed(2))
      : 0.00;

  const calculatedScore =
    resolvedTotalTestCases > 0
      ? Number(((resolvedPassedTestCases / resolvedTotalTestCases) * problemTotalMarks).toFixed(2))
      : 0.00;

  const finalPercentage = percentage !== undefined && percentage !== null ? parseFloat(percentage) : calculatedPercentage;
  const finalScore = score !== undefined && score !== null ? parseFloat(score) : (marks !== undefined && marks !== null ? parseFloat(marks) : calculatedScore);
  const finalMarks = marks !== undefined && marks !== null ? parseFloat(marks) : finalScore;

  // Determine status if not explicitly provided
  let finalStatus = status;
  if (!finalStatus) {
    if (resolvedTotalTestCases > 0 && resolvedPassedTestCases === resolvedTotalTestCases) {
      finalStatus = 'passed';
    } else if (resolvedPassedTestCases > 0) {
      finalStatus = 'partial';
    } else {
      finalStatus = 'failed';
    }
  }

  // 6. Save attempt and calculated marks in MySQL
  const submissionRecord = await createSubmissionModel({
    student_id: student.id || student_id,
    problem_id: problem.id,
    submitted_code,
    language,
    passed_test_cases: resolvedPassedTestCases,
    total_test_cases: resolvedTotalTestCases,
    score: finalScore,
    marks: finalMarks,
    percentage: finalPercentage,
    status: finalStatus,
    execution_details: resolvedExecutionDetails,
  });

  return submissionRecord;
};

/**
 * Fetch a single submission by its ID
 */
export const getSubmissionByIdService = async (submissionId) => {
  if (!submissionId) {
    const error = new Error('Submission ID is required');
    error.statusCode = 400;
    throw error;
  }

  const submission = await getSubmissionByIdModel(submissionId);
  if (!submission) {
    const error = new Error(`Coding submission with ID ${submissionId} not found`);
    error.statusCode = 404;
    throw error;
  }

  return submission;
};

/**
 * Fetch all submissions and summary statistics for a student
 */
export const getStudentSubmissionsService = async (studentId) => {
  if (!studentId) {
    const error = new Error('Student ID is required');
    error.statusCode = 400;
    throw error;
  }

  const student = await findStudentById(studentId);
  if (!student) {
    const error = new Error(`Student with ID ${studentId} not found`);
    error.statusCode = 404;
    throw error;
  }

  const submissions = await getStudentSubmissionsModel(studentId);

  // Compute summary stats
  const totalSubmissions = submissions.length;
  const passedCount = submissions.filter((s) => s.status === 'passed' || s.status === 'accepted').length;
  const totalScoreEarned = submissions.reduce((sum, s) => sum + (parseFloat(s.score) || 0), 0);
  const averagePercentage =
    totalSubmissions > 0
      ? Number((submissions.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0) / totalSubmissions).toFixed(2))
      : 0.00;

  return {
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
    },
    summary: {
      totalSubmissions,
      passedSubmissions: passedCount,
      totalScoreEarned,
      averagePercentage,
    },
    submissions,
  };
};

/**
 * Fetch all coding submissions with student and problem details for Admin / Instructors
 */
export const getAllCodingSubmissionsService = async (filters = {}) => {
  const { problem_id, student_id, status, limit = 100, page = 1 } = filters;

  let sql = `
    SELECT 
      cs.id,
      cs.student_id,
      COALESCE(u.name, 'Student') AS student_name,
      u.email AS student_email,
      s.roll_number,
      COALESCE(d.name, s.department, 'General') AS department_name,
      cs.problem_id,
      COALESCE(cp.title, CONCAT('Problem #', cs.problem_id)) AS problem_title,
      cp.category AS problem_category,
      cp.difficulty AS problem_difficulty,
      cs.language,
      cs.passed_test_cases,
      cs.total_test_cases,
      cs.score,
      cs.marks,
      cs.percentage,
      cs.status,
      cs.execution_details,
      cs.submitted_code,
      cs.submitted_at,
      cs.created_at
    FROM coding_submissions cs
    LEFT JOIN users u ON cs.student_id = u.id
    LEFT JOIN students s ON u.id = s.user_id
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN coding_problems cp ON cs.problem_id = cp.id
    WHERE 1=1
  `;

  const params = [];

  if (problem_id) {
    sql += ' AND cs.problem_id = ?';
    params.push(parseInt(problem_id, 10));
  }

  if (student_id) {
    sql += ' AND cs.student_id = ?';
    params.push(parseInt(student_id, 10));
  }

  if (status) {
    sql += ' AND LOWER(cs.status) = LOWER(?)';
    params.push(String(status).trim());
  }

  sql += ' ORDER BY cs.submitted_at DESC, cs.id DESC';

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  sql += ' LIMIT ? OFFSET ?';
  params.push(safeLimit, offset);

  const rows = await query(sql, params);

  return rows.map((r) => {
    let execDetails = r.execution_details;
    if (typeof execDetails === 'string') {
      try {
        execDetails = JSON.parse(execDetails);
      } catch (e) {
        execDetails = null;
      }
    }

    const execTimeMs = execDetails?.execution_time_ms || 0;
    const formattedExecutionTime = execTimeMs > 0
      ? (execTimeMs >= 1000 ? `${(execTimeMs / 1000).toFixed(2)}s` : `${execTimeMs}ms`)
      : '0.12s';

    const memoryUsage = execDetails?.memory_kb
      ? `${(execDetails.memory_kb / 1024).toFixed(1)} MB`
      : '256 KB';

    let displayStatus = 'Accepted';
    const rawStatus = (r.status || '').toLowerCase();
    if (rawStatus === 'accepted' || rawStatus === 'passed' || (r.passed_test_cases === r.total_test_cases && r.total_test_cases > 0)) {
      displayStatus = 'Accepted';
    } else if (rawStatus.includes('wrong') || rawStatus === 'wrong_answer') {
      displayStatus = 'Wrong Answer';
    } else if (rawStatus.includes('runtime')) {
      displayStatus = 'Runtime Error';
    } else if (rawStatus.includes('time') || rawStatus === 'tle') {
      displayStatus = 'Time Limit Exceeded';
    } else if (rawStatus.includes('compil')) {
      displayStatus = 'Compilation Error';
    } else {
      displayStatus = r.status || 'Failed';
    }

    const submittedDate = r.submitted_at ? new Date(r.submitted_at) : new Date(r.created_at || Date.now());
    const formattedTime = submittedDate.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      id: r.id,
      studentId: r.student_id,
      studentName: r.student_name,
      studentEmail: r.student_email,
      rollNo: r.roll_number || 'Roll N/A',
      department: r.department_name,
      problemId: r.problem_id,
      problemTitle: r.problem_title,
      problemDifficulty: r.problem_difficulty || 'Medium',
      language: r.language || 'code',
      passedTestCases: r.passed_test_cases || 0,
      totalTestCases: r.total_test_cases || 0,
      score: Math.round(Number(r.score || r.marks) || 0),
      rawStatus: r.status,
      status: displayStatus,
      executionTime: formattedExecutionTime,
      memory: memoryUsage,
      submittedAt: formattedTime,
      submittedDate: r.submitted_at,
      submittedCode: r.submitted_code,
    };
  });
};

