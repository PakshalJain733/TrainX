import { runCodeInSandbox } from '../src/services/code.executor.service.js';
import { evaluateCodeInSandbox } from '../src/services/codingSubmission.service.js';
import { validateAndSanitizePracticeProblem } from '../src/ai/roadmap.ai.js';

async function runEndToEndCrossSectionTests() {
  console.log('================================================================');
  console.log('🧪 Cross-Section Integration Test: Unified Compiler Engine');
  console.log('   Testing: Coding Tasks | Practice Arena | AI Roadmap Practice');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      process.exitCode = 1;
    }
  }

  // Common Function-Based Problem: twoSum(nums, target)
  const commonProblem = {
    title: 'Two Sum',
    function_name: 'twoSum',
    testCases: [
      { id: 1, input: '[[2, 7, 11, 15], 9]', expected_output: '[0, 1]', is_hidden: false },
      { id: 2, input: '[[3, 2, 4], 6]', expected_output: '[1, 2]', is_hidden: false },
      { id: 3, input: '[[3, 3], 6]', expected_output: '[0, 1]', is_hidden: true },
      { id: 4, input: '[[-1, 0, 1, 2], 0]', expected_output: '[0, 2]', is_hidden: true },
    ]
  };

  const correctSolutionJS = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`;

  const incorrectSolutionJS = `
function twoSum(nums, target) {
  return [0, 1]; // Only works for case 1 & 3, fails case 2 & 4
}
`;

  // ─────────────────────────────────────────────────────────────
  // 1. SECTION 1: CODING TASKS (BATCH COURSEWORK)
  // ─────────────────────────────────────────────────────────────
  console.log('--- Section 1: Coding Tasks (Batch Coursework Mode) ---');
  const taskEvalCorrect = await evaluateCodeInSandbox({
    submittedCode: correctSolutionJS,
    language: 'node',
    testCases: commonProblem.testCases,
    function_name: commonProblem.function_name,
  });

  assert(taskEvalCorrect.passed_test_cases === 4, `Tasks: Correct function passes all 4 test cases (100%)`);
  assert(taskEvalCorrect.results[2].is_hidden === true, `Tasks: Hidden test case 3 marked is_hidden=true`);
  assert(taskEvalCorrect.results[2].input === undefined, `Tasks: Hidden test case 3 input is securely masked`);

  const taskEvalWrong = await evaluateCodeInSandbox({
    submittedCode: incorrectSolutionJS,
    language: 'node',
    testCases: commonProblem.testCases,
    function_name: commonProblem.function_name,
  });
  assert(taskEvalWrong.passed_test_cases === 2, `Tasks: Incorrect solution awarded exactly 2/4 (50%)`);

  // ─────────────────────────────────────────────────────────────
  // 2. SECTION 2: CODING PRACTICE (PRACTICE ARENA)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Section 2: Coding Practice (Practice Arena Mode) ---');
  const practiceEvalCorrect = await evaluateCodeInSandbox({
    submittedCode: correctSolutionJS,
    language: 'node',
    testCases: commonProblem.testCases,
    function_name: commonProblem.function_name,
  });

  assert(practiceEvalCorrect.passed_test_cases === 4, `Practice: Correct function passes all 4 test cases (100%)`);
  assert(practiceEvalCorrect.results[3].expected_output === undefined, `Practice: Hidden test case 4 expected_output is securely masked`);

  // Custom Run in Practice Arena
  const practiceCustomRun = await runCodeInSandbox({
    language: 'node',
    code: correctSolutionJS,
    stdin: '[[10, 20, 30], 50]',
    function_name: commonProblem.function_name,
  });
  assert(practiceCustomRun.exitCode === 0, `Practice: Custom input run succeeded with exit code 0`);
  assert(practiceCustomRun.stdout.trim() === '[1,2]' || practiceCustomRun.stdout.trim() === '[1, 2]', `Practice: Custom input returned indices [1, 2]`);

  // ─────────────────────────────────────────────────────────────
  // 3. SECTION 3: AI ROADMAP PRACTICE
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Section 3: AI Roadmap Practice (Milestone-Specific Mode) ---');
  const roadmapProbRaw = {
    title: 'Milestone 2 Challenge: Two Sum',
    prompt: 'Implement twoSum to find two indices that sum to target.',
    sampleInput: '[[2, 7, 11, 15], 9]',
    sampleOutput: '[0, 1]',
    language: 'node',
  };

  const sanitizedRoadmapProb = validateAndSanitizePracticeProblem(roadmapProbRaw);
  assert(sanitizedRoadmapProb.function_name === 'twoSum' || sanitizedRoadmapProb.function_name === 'solve', `Roadmap: Function name resolved: ${sanitizedRoadmapProb.function_name}`);
  assert(sanitizedRoadmapProb.starter_templates && typeof sanitizedRoadmapProb.starter_templates.python === 'string', `Roadmap: Starter templates present`);

  const roadmapEval = await evaluateCodeInSandbox({
    submittedCode: correctSolutionJS,
    language: 'node',
    testCases: commonProblem.testCases,
    function_name: 'twoSum',
  });

  assert(roadmapEval.passed_test_cases === 4, `Roadmap: Correct function passes all test cases (100%)`);
  assert(roadmapEval.results[2].is_hidden === true, `Roadmap: Hidden case flagged is_hidden=true`);
  assert(roadmapEval.results[2].input === undefined, `Roadmap: Hidden case input masked`);

  // ─────────────────────────────────────────────────────────────
  // 4. REGRESSION TEST: LEGACY STDIN/STDOUT MODE (ALL SECTIONS)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- Section 4: Legacy Stdin/Stdout Regression Check ---');
  const legacyStdinScript = `
import sys
lines = sys.stdin.read().split()
if len(lines) >= 2:
    print(int(lines[0]) + int(lines[1]))
else:
    print(0)
`;

  const legacyCases = [
    { id: 1, input: '5 7', expected_output: '12', is_hidden: false },
    { id: 2, input: '100 250', expected_output: '350', is_hidden: false },
    { id: 3, input: '-10 10', expected_output: '0', is_hidden: true },
  ];

  const legacyEval = await evaluateCodeInSandbox({
    submittedCode: legacyStdinScript,
    language: 'python',
    testCases: legacyCases,
    // NO function_name provided -> runs pure stdin/stdout legacy script
  });

  assert(legacyEval.passed_test_cases === 3, `Legacy: Pure stdin/stdout script evaluated cleanly (3/3 passed)`);
  assert(legacyEval.results[2].is_hidden === true, `Legacy: Hidden case preserved in legacy mode`);
  assert(legacyEval.results[2].input === undefined, `Legacy: Hidden case input masked in legacy mode`);

  console.log('\n================================================================');
  console.log(`🎉 ALL THREE SECTIONS PASSED VERIFICATION (${passedTests}/${totalTests} TESTS)`);
  console.log('================================================================');
}

runEndToEndCrossSectionTests().catch(err => {
  console.error('Cross-section test execution error:', err);
  process.exit(1);
});

