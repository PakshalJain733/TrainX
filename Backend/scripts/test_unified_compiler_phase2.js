import { validateAndSanitizePracticeProblem } from '../src/ai/roadmap.ai.js';
import { evaluateCodeInSandbox } from '../src/services/codingSubmission.service.js';

async function runPhase2Tests() {
  console.log('================================================================');
  console.log('🧪 Starting Phase 2: AI Roadmap Practice Integration Tests');
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

  // ── Test 1: Practice Problem Generation Metadata ──
  console.log('Test 1: LeetCode Metadata Generation for String Reversal');
  const rawProb = {
    title: 'Hands-on Challenge: String Reversal in JavaScript',
    prompt: 'Implement a function reverseString that takes a string s and returns the reversed string.',
    sampleInput: 'hello',
    sampleOutput: 'olleh',
    starterCode: 'function reverseString(s) {\n  return "";\n}',
    language: 'node'
  };

  const sanitized = validateAndSanitizePracticeProblem(rawProb);

  assert(sanitized.function_name === 'reverseString', `Function name correctly assigned: ${sanitized.function_name}`);
  assert(sanitized.starter_templates && typeof sanitized.starter_templates.python === 'string', `Python starter template generated`);
  assert(sanitized.starter_templates && typeof sanitized.starter_templates.node === 'string', `Node starter template generated`);
  assert(Array.isArray(sanitized.testCases) && sanitized.testCases.length >= 4, `At least 4 test cases generated (found ${sanitized.testCases?.length})`);

  const visibleCases = sanitized.testCases.filter(t => !t.is_hidden);
  const hiddenCases = sanitized.testCases.filter(t => t.is_hidden);
  assert(visibleCases.length >= 2, `At least 2 visible test cases present (${visibleCases.length})`);
  assert(hiddenCases.length >= 2, `At least 2 hidden test cases present (${hiddenCases.length})`);

  // ── Test 2: Execution of Generated Test Cases in Unified Sandbox ──
  console.log('\nTest 2: Real Execution of Correct Function via evaluateCodeInSandbox');
  const studentCorrectSolution = `
function reverseString(s) {
  return s.split('').reverse().join('');
}
`;

  const evalResult = await evaluateCodeInSandbox({
    submittedCode: studentCorrectSolution,
    language: 'node',
    testCases: sanitized.testCases,
    function_name: sanitized.function_name
  });

  console.log('Eval 2 results:', JSON.stringify(evalResult.results, null, 2));
  assert(evalResult.passed_test_cases === sanitized.testCases.length, `All ${sanitized.testCases.length} test cases passed (100% score)`);
  assert(evalResult.results[2].is_hidden === true, `Test case 3 marked as hidden`);
  assert(evalResult.results[2].input === undefined, `Hidden test case 3 input is masked from student payload`);
  assert(evalResult.results[2].expected_output === undefined, `Hidden test case 3 expected output is masked from student payload`);

  // ── Test 3: Partial / Incorrect Solution Rejection ──
  console.log('\nTest 3: Incorrect Solution Rejection');
  const studentBuggySolution = `
function reverseString(s) {
  if (s === "hello") return "olleh";
  return s; // Fails on all other cases
}
`;

  const buggyEval = await evaluateCodeInSandbox({
    submittedCode: studentBuggySolution,
    language: 'node',
    testCases: sanitized.testCases,
    function_name: sanitized.function_name
  });

  assert(buggyEval.passed_test_cases === 1, `Buggy solution only passed 1 test case (got ${buggyEval.passed_test_cases})`);
  assert(buggyEval.passed_test_cases < sanitized.testCases.length, `Buggy solution failed overall acceptance`);

  // ── Test 4: Palindrome Function Validation ──
  console.log('\nTest 4: Palindrome LeetCode Function Validation');
  const rawPalProb = {
    title: 'Palindrome Checker',
    prompt: 'Check whether a phrase is a palindrome, returning true or false.',
    sampleInput: 'racecar',
    sampleOutput: 'true',
    starterCode: 'def isPalindrome(s):\n    pass\n',
    language: 'python'
  };

  const sanitizedPal = validateAndSanitizePracticeProblem(rawPalProb);
  assert(sanitizedPal.function_name === 'isPalindrome', `Palindrome function name: ${sanitizedPal.function_name}`);
  assert(sanitizedPal.testCases.length >= 4, `Palindrome test cases: ${sanitizedPal.testCases.length}`);

  const studentPythonPalindrome = `
def isPalindrome(s):
    clean = ''.join(c.lower() for c in s if c.isalnum())
    return clean == clean[::-1]
`;

  const palEval = await evaluateCodeInSandbox({
    submittedCode: studentPythonPalindrome,
    language: 'python',
    testCases: sanitizedPal.testCases,
    function_name: sanitizedPal.function_name
  });

  console.log('Pal results:', JSON.stringify(palEval.results, null, 2));
  assert(palEval.passed_test_cases === sanitizedPal.testCases.length, `All ${sanitizedPal.testCases.length} palindrome test cases passed`);

  console.log('\n================================================================');
  console.log(`🎉 PHASE 2 RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');
}

runPhase2Tests().catch(err => {
  console.error('Phase 2 test execution failed:', err);
  process.exit(1);
});
