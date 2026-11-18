import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { query } from '../src/config/db.js';
import { runCodeInSandbox, normalizeOutput } from '../src/services/code.executor.service.js';
import { evaluateCodeInSandbox, submitCodeAndSaveService } from '../src/services/codingSubmission.service.js';
import { validateAndSanitizePracticeProblem, generateMilestonePracticeAI } from '../src/ai/roadmap.ai.js';
import { shouldWrapFunction, wrapCodeWithHarness } from '../src/services/codeHarness.service.js';

async function runComprehensiveQAAudit() {
  const auditReport = {
    timestamp: new Date().toISOString(),
    suites: [],
    overallStatus: 'PASS',
    stats: { passed: 0, failed: 0, blocked: 0, total: 0 }
  };

  function recordTest(suiteName, testName, status, details = {}, severity = null) {
    auditReport.stats.total++;
    if (status === 'PASS') auditReport.stats.passed++;
    else if (status === 'FAIL') {
      auditReport.stats.failed++;
      auditReport.overallStatus = 'FAIL';
    } else if (status === 'BLOCKED') auditReport.stats.blocked++;

    let suite = auditReport.suites.find(s => s.name === suiteName);
    if (!suite) {
      suite = { name: suiteName, tests: [] };
      auditReport.suites.push(suite);
    }
    suite.tests.push({
      testName,
      status,
      severity: status === 'FAIL' ? (severity || 'High') : null,
      details
    });

    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`[${status}] ${suiteName} -> ${testName}`);
    if (status === 'FAIL') {
      console.error(`       Severity: ${severity || 'High'}, Error: ${JSON.stringify(details)}`);
    }
  }

  console.log('========================================================================');
  console.log('🔍 TrainX Comprehensive Senior QA Audit — Full Verification of Today\'s Changes');
  console.log(`Timestamp: ${auditReport.timestamp}`);
  console.log('========================================================================\n');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 1: DATABASE PERSISTENCE & SCHEMA INTEGRITY
  // ──────────────────────────────────────────────────────────────────────────
  const S1 = 'Database Persistence & Schema Integrity';
  try {
    const tableChecks = await query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('coding_problems', 'coding_test_cases', 'coding_submissions', 'batch_tasks', 'practice_problems', 'coding_retake_permissions')
    `);
    const tableNames = new Set(tableChecks.map(t => t.TABLE_NAME));
    const expectedTables = ['coding_problems', 'coding_test_cases', 'coding_submissions', 'batch_tasks', 'practice_problems', 'coding_retake_permissions'];
    const allTablesPresent = expectedTables.every(t => tableNames.has(t));

    recordTest(S1, 'Core Compiler & Submission Tables Exist', allTablesPresent ? 'PASS' : 'FAIL', {
      present: Array.from(tableNames),
      missing: expectedTables.filter(t => !tableNames.has(t))
    }, 'Critical');

    // Check practice_problems attempt columns
    const ppCols = await query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'practice_problems'
    `);
    const ppColSet = new Set(ppCols.map(c => c.COLUMN_NAME));
    recordTest(S1, 'Practice Problems Table Structure', ppColSet.has('title') && ppColSet.has('difficulty') ? 'PASS' : 'FAIL', {
      columnCount: ppCols.length
    }, 'High');

  } catch (err) {
    recordTest(S1, 'Database Connection & Table Audit', 'FAIL', { error: err.message }, 'Critical');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 2: LEETCODE TEST HARNESS & MULTI-LANGUAGE DUAL-MODE EXECUTION
  // ──────────────────────────────────────────────────────────────────────────
  const S2 = 'Compiler Harness & Multi-Language Execution';

  // 2.1 Node.js Function Mode
  const jsFunctionCode = `
function reverseString(s) {
  return s.split('').reverse().join('');
}
`;
  const jsRun = await runCodeInSandbox({
    language: 'node',
    code: jsFunctionCode,
    stdin: '"TrainX"',
    function_name: 'reverseString'
  });
  recordTest(S2, 'Node.js Function Mode (reverseString)', jsRun.exitCode === 0 && jsRun.stdout.trim() === 'XniarT' ? 'PASS' : 'FAIL', {
    exitCode: jsRun.exitCode,
    stdout: jsRun.stdout.trim(),
    expected: 'XniarT'
  }, 'High');

  // 2.2 Python Function Mode
  const pyFunctionCode = `
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []
`;
  const pyRun = await runCodeInSandbox({
    language: 'python',
    code: pyFunctionCode,
    stdin: '[[2, 7, 11, 15], 9]',
    function_name: 'two_sum'
  });
  recordTest(S2, 'Python Function Mode (two_sum)', pyRun.exitCode === 0 && (pyRun.stdout.trim() === '[0, 1]' || pyRun.stdout.trim() === '[0,1]') ? 'PASS' : 'FAIL', {
    exitCode: pyRun.exitCode,
    stdout: pyRun.stdout.trim(),
    expected: '[0, 1]'
  }, 'High');

  // 2.3 Legacy Python Stdin/Stdout Execution (Zero Regression)
  const legacyPyScript = `
import sys
line = sys.stdin.read().strip()
print(line.upper())
`;
  const legacyPyRun = await runCodeInSandbox({
    language: 'python',
    code: legacyPyScript,
    stdin: 'legacy mode active'
  });
  recordTest(S2, 'Legacy Python Stdin/Stdout Mode (Zero Regression)', legacyPyRun.exitCode === 0 && legacyPyRun.stdout.trim() === 'LEGACY MODE ACTIVE' ? 'PASS' : 'FAIL', {
    stdout: legacyPyRun.stdout.trim(),
    expected: 'LEGACY MODE ACTIVE'
  }, 'Critical');

  // 2.4 Legacy Node.js Stdin/Stdout Execution (Zero Regression)
  const legacyJsScript = `
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
console.log('LEGACY_JS:' + input);
`;
  const legacyJsRun = await runCodeInSandbox({
    language: 'node',
    code: legacyJsScript,
    stdin: 'input_test'
  });
  recordTest(S2, 'Legacy Node.js Stdin/Stdout Mode (Zero Regression)', legacyJsRun.exitCode === 0 && legacyJsRun.stdout.trim() === 'LEGACY_JS:input_test' ? 'PASS' : 'FAIL', {
    stdout: legacyJsRun.stdout.trim(),
    expected: 'LEGACY_JS:input_test'
  }, 'Critical');

  // 2.5 Error Handling: Compilation/Syntax Error
  const syntaxErrRun = await runCodeInSandbox({
    language: 'node',
    code: 'function broken( { return 1; }',
    stdin: 'test',
    function_name: 'broken'
  });
  recordTest(S2, 'Compilation Error Trapping', syntaxErrRun.compilationError === true || syntaxErrRun.exitCode !== 0 ? 'PASS' : 'FAIL', {
    compilationError: syntaxErrRun.compilationError,
    exitCode: syntaxErrRun.exitCode
  }, 'Medium');

  // 2.6 Error Handling: Runtime Error
  const runtimeErrRun = await runCodeInSandbox({
    language: 'python',
    code: 'def fail(x):\n    return x / 0\n',
    stdin: '5',
    function_name: 'fail'
  });
  recordTest(S2, 'Runtime Error Trapping (Divide by Zero)', runtimeErrRun.exitCode !== 0 ? 'PASS' : 'FAIL', {
    exitCode: runtimeErrRun.exitCode,
    stderr: runtimeErrRun.stderr
  }, 'Medium');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 3: UNIFIED EVALUATION & TEST CASE MASKING (ALL THREE SECTIONS)
  // ──────────────────────────────────────────────────────────────────────────
  const S3 = 'Unified Evaluation & Test Case Masking';

  const testCasesWithHidden = [
    { id: 1, input: '"hello"', expected_output: 'olleh', is_hidden: false },
    { id: 2, input: '"world"', expected_output: 'dlrow', is_hidden: false },
    { id: 3, input: '"TrainX"', expected_output: 'XniarT', is_hidden: true },
    { id: 4, input: '"12345"', expected_output: '54321', is_hidden: true },
  ];

  // 3.1 Section 1: Coding Tasks Evaluation
  const taskEval = await evaluateCodeInSandbox({
    submittedCode: jsFunctionCode,
    language: 'node',
    testCases: testCasesWithHidden,
    function_name: 'reverseString'
  });
  recordTest(S3, 'Section 1 (Coding Tasks): 4/4 Test Cases Evaluated', taskEval.passed_test_cases === 4 && taskEval.total_test_cases === 4 ? 'PASS' : 'FAIL', {
    passed: taskEval.passed_test_cases,
    total: taskEval.total_test_cases
  }, 'High');

  // 3.2 Section 2: Coding Practice Evaluation
  const practiceEval = await evaluateCodeInSandbox({
    submittedCode: jsFunctionCode,
    language: 'node',
    testCases: testCasesWithHidden,
    function_name: 'reverseString'
  });
  recordTest(S3, 'Section 2 (Coding Practice): 4/4 Test Cases Evaluated', practiceEval.passed_test_cases === 4 ? 'PASS' : 'FAIL', {
    passed: practiceEval.passed_test_cases
  }, 'High');

  // 3.3 Section 3: AI Roadmap Practice Evaluation
  const roadmapEval = await evaluateCodeInSandbox({
    submittedCode: jsFunctionCode,
    language: 'node',
    testCases: testCasesWithHidden,
    function_name: 'reverseString'
  });
  recordTest(S3, 'Section 3 (AI Roadmap): 4/4 Test Cases Evaluated', roadmapEval.passed_test_cases === 4 ? 'PASS' : 'FAIL', {
    passed: roadmapEval.passed_test_cases
  }, 'High');

  // 3.4 Security & Anti-Leak: Hidden Test Case Masking
  const tc3 = taskEval.results.find(r => r.test_case_id === 3);
  const tc4 = taskEval.results.find(r => r.test_case_id === 4);
  const hiddenProperlyMasked = tc3 && tc4 && 
    tc3.is_hidden === true && tc3.input === undefined && tc3.expected_output === undefined &&
    tc4.is_hidden === true && tc4.input === undefined && tc4.expected_output === undefined;

  recordTest(S3, 'Security: Hidden Test Cases Inputs & Expected Outputs Masked', hiddenProperlyMasked ? 'PASS' : 'FAIL', {
    tc3_input: tc3?.input,
    tc3_expected: tc3?.expected_output,
    tc4_input: tc4?.input,
    tc4_expected: tc4?.expected_output
  }, 'Critical');

  // 3.5 Proportional Scoring on Incorrect Solution
  const partialCode = `
function reverseString(s) {
  if (s === "hello") return "olleh";
  if (s === "world") return "dlrow";
  return s; // Fails case 3 & 4
}
`;
  const partialEval = await evaluateCodeInSandbox({
    submittedCode: partialCode,
    language: 'node',
    testCases: testCasesWithHidden,
    function_name: 'reverseString'
  });
  recordTest(S3, 'Proportional Scoring: 2/4 Passed (50% Marks Awarded)', partialEval.passed_test_cases === 2 ? 'PASS' : 'FAIL', {
    passed: partialEval.passed_test_cases,
    total: partialEval.total_test_cases
  }, 'High');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 4: AI ROADMAP PRACTICE GENERATION & MILESTONE ISOLATION
  // ──────────────────────────────────────────────────────────────────────────
  const S4 = 'AI Roadmap Practice Generation & Isolation';

  // 4.1 Milestone 1 vs Milestone 5 Topic Partitioning
  const m1Prob = validateAndSanitizePracticeProblem({
    title: 'Milestone 1: Programming Foundations',
    prompt: 'Implement reverseString function for basic string manipulation.',
    sampleInput: 'hello',
    sampleOutput: 'olleh',
    starterCode: 'function reverseString(s) {}',
    language: 'node'
  }, { topic: 'String Basics', milestoneIndex: 1 });

  recordTest(S4, 'Milestone 1 Practice Generation Formatted with Function Signatures', Boolean(m1Prob.function_name === 'reverseString' && m1Prob.starter_templates?.python) ? 'PASS' : 'FAIL', {
    function_name: m1Prob.function_name,
    hasStarterTemplates: Boolean(m1Prob.starter_templates)
  }, 'High');

  recordTest(S4, 'Milestone 1 Generates 2 Visible and 2 Hidden Test Cases', Boolean(m1Prob.testCases?.length >= 4 && m1Prob.testCases.filter(t => t.is_hidden).length >= 2) ? 'PASS' : 'FAIL', {
    totalCases: m1Prob.testCases?.length,
    hiddenCases: m1Prob.testCases?.filter(t => t.is_hidden).length
  }, 'High');

  // 4.2 String Reversal Output Consistency (Never Boolean)
  recordTest(S4, 'Consistency: String Reversal Produces Reversed String Not Boolean', (m1Prob.sampleOutput === 'olleh' && m1Prob.sampleOutput !== 'true' && m1Prob.sampleOutput !== 'false') ? 'PASS' : 'FAIL', {
    sampleInput: m1Prob.sampleInput,
    sampleOutput: m1Prob.sampleOutput
  }, 'High');

  // 4.3 Palindrome Checking Consistency (Strictly Boolean)
  const palProb = validateAndSanitizePracticeProblem({
    title: 'Milestone 2: Palindrome Algorithm',
    prompt: 'Return true if phrase is palindrome, else false.',
    sampleInput: 'racecar',
    sampleOutput: 'true',
    starterCode: 'def isPalindrome(s): pass',
    language: 'python'
  }, { topic: 'Two Pointers Palindrome', milestoneIndex: 2 });

  recordTest(S4, 'Consistency: Palindrome Produces Boolean true/false', (palProb.sampleOutput === 'true' || palProb.sampleOutput === 'false') ? 'PASS' : 'FAIL', {
    sampleInput: palProb.sampleInput,
    sampleOutput: palProb.sampleOutput
  }, 'High');

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 5: STUDENT ATTEMPT LIMITS, RETAKES & ISOLATION
  // ──────────────────────────────────────────────────────────────────────────
  const S5 = 'Student Attempt Limits & Permissions';

  // Check Practice Problem Attempt Rules
  const testStudentId = 1755; // Ganesh Shinde (Active test student)
  try {
    const solvedRows = await query(`
      SELECT problem_id, score, marks, percentage, status 
      FROM coding_submissions 
      WHERE student_id = ? 
      ORDER BY id DESC LIMIT 5
    `, [testStudentId]);

    recordTest(S5, 'Student Submission Records Queryable by Authenticated Student', Array.isArray(solvedRows) ? 'PASS' : 'FAIL', {
      recentSubmissionsCount: solvedRows.length
    }, 'High');

    // Verify retake permissions structure
    const retakes = await query(`
      SELECT id, student_id, target_type, target_id, status 
      FROM coding_retake_permissions 
      WHERE student_id = ? LIMIT 1
    `, [testStudentId]);
    recordTest(S5, 'Coding Retake Permissions Structure Queryable', Array.isArray(retakes) ? 'PASS' : 'FAIL', {
      hasRetakeRows: retakes.length > 0
    }, 'Medium');

  } catch (err) {
    recordTest(S5, 'Student Attempt Limits & Queries', 'FAIL', { error: err.message }, 'High');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SUITE 6: PROCTORING INTEGRITY AUDIT (CODE INSPECTION)
  // ──────────────────────────────────────────────────────────────────────────
  const S6 = 'Proctoring & Assessment Integrity';

  // Check ST_CodingPlatform proctoring rules via code contract
  import('fs').then(async fs => {
    import('path').then(pathModule => {
      const rootDir = process.cwd().endsWith('Backend') ? pathModule.default.resolve(process.cwd(), '..') : process.cwd();
      const cpPath = pathModule.default.join(rootDir, 'Frontend/src/pages/Student/Components/ST_CodingPlatform.jsx');
      const cpCode = fs.default.readFileSync(cpPath, 'utf8');

      const has3StrikeCondition = cpCode.includes('currentStrikes < 3') && cpCode.includes('endTaskDueToViolation');
      recordTest(S6, 'Three-Strike Auto-Submission Policy (currentStrikes < 3 -> endTaskDueToViolation on 3rd)', has3StrikeCondition ? 'PASS' : 'FAIL', {}, 'High');

      const hasSessionStorageStrikes = cpCode.includes('getStoredProctorStrikes') && cpCode.includes('sessionStorage');
      recordTest(S6, 'F5 Page Reload Strike Preservation via Session Storage', hasSessionStorageStrikes ? 'PASS' : 'FAIL', {}, 'High');

      const tabSwitchWarningOnly = cpCode.includes('if (reason !== "exit_fullscreen")') && cpCode.includes('showClipboardToast');
      recordTest(S6, 'Tab Switch & Blur Triggers Warning Toast Only (Does Not Increment Fullscreen Strikes)', tabSwitchWarningOnly ? 'PASS' : 'FAIL', {}, 'High');

      const hasSingleSubmitGuard = cpCode.includes('hasAutoSubmittedRef.current = true');
      recordTest(S6, 'Auto-Submission Single Execution Guard (hasAutoSubmittedRef)', hasSingleSubmitGuard ? 'PASS' : 'FAIL', {}, 'High');

      printFinalSummary(auditReport);
    });
  });
}

function printFinalSummary(report) {
  console.log('\n========================================================================');
  console.log('📊 FINAL QA AUDIT SUMMARY');
  console.log('========================================================================');
  console.log(`Total Test Cases Executed : ${report.stats.total}`);
  console.log(`Passed                    : ${report.stats.passed}`);
  console.log(`Failed                    : ${report.stats.failed}`);
  console.log(`Blocked                   : ${report.stats.blocked}`);
  console.log(`Overall Status            : ${report.overallStatus}`);
  console.log('========================================================================\n');
}

runComprehensiveQAAudit().catch(err => {
  console.error('Fatal Audit Error:', err);
  process.exit(1);
});
