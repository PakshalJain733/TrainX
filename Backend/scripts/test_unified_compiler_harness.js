import { runCodeInSandbox } from '../src/services/code.executor.service.js';
import { evaluateCodeInSandbox } from '../src/services/codingSubmission.service.js';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 Starting Phase 1: Unified Compiler Harness & Dual-Mode Tests');
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

  // ── Test 1: JavaScript Function-Based Execution (LeetCode Style) ──
  console.log('Test 1: Node.js Function Mode (twoSum without main/stdin)');
  const jsFunctionCode = `
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`;
  const jsRun = await runCodeInSandbox({
    language: 'node',
    code: jsFunctionCode,
    stdin: '[[2, 7, 11, 15], 9]',
    function_name: 'twoSum',
  });

  assert(jsRun.exitCode === 0, `JS execution exited cleanly (code 0)`);
  assert(jsRun.stdout.trim() === '[0,1]' || jsRun.stdout.trim() === '[0, 1]', `JS returned correct serialized indices: got "${jsRun.stdout.trim()}"`);

  // ── Test 2: Python Function-Based Execution (LeetCode Style) ──
  console.log('\nTest 2: Python Function Mode (reverse_string without main/sys.stdin)');
  const pyFunctionCode = `
def reverse_string(s):
    return s[::-1]
`;
  const pyRun = await runCodeInSandbox({
    language: 'python',
    code: pyFunctionCode,
    stdin: '"hello"',
    function_name: 'reverse_string',
  });

  assert(pyRun.exitCode === 0, `Python execution exited cleanly (code 0)`);
  assert(pyRun.stdout.trim() === 'olleh', `Python returned reversed string: got "${pyRun.stdout.trim()}"`);

  // ── Test 3: Python Class Solution Method Execution (LeetCode Style) ──
  console.log('\nTest 3: Python Class Solution.isPalindrome Method');
  const pyClassCode = `
class Solution:
    def isPalindrome(self, s: str) -> bool:
        clean = ''.join(c.lower() for c in s if c.isalnum())
        return clean == clean[::-1]
`;
  const pyClassRun = await runCodeInSandbox({
    language: 'python',
    code: pyClassCode,
    stdin: '"racecar"',
    function_name: 'isPalindrome',
  });
  assert(pyClassRun.exitCode === 0, `Python Solution.isPalindrome exited cleanly`);
  assert(pyClassRun.stdout.trim() === 'true', `Python Solution.isPalindrome output "true" for palindrome`);

  // ── Test 4: Legacy Stdin/Stdout Mode (Zero Regression) ──
  console.log('\nTest 4: Legacy Script Mode (Preserve Stdin/Stdout Execution)');
  const pyLegacyScript = `
import sys
data = sys.stdin.read().strip()
print(data.upper())
`;
  const pyLegacyRun = await runCodeInSandbox({
    language: 'python',
    code: pyLegacyScript,
    stdin: 'trainx legacy test',
    // No function_name provided -> runs raw script
  });
  assert(pyLegacyRun.exitCode === 0, `Legacy Python script ran with code 0`);
  assert(pyLegacyRun.stdout.trim() === 'TRAINX LEGACY TEST', `Legacy Python output matched stdin processing: got "${pyLegacyRun.stdout.trim()}"`);

  const jsLegacyScript = `
const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
console.log('PROCESSED: ' + input);
`;
  const jsLegacyRun = await runCodeInSandbox({
    language: 'node',
    code: jsLegacyScript,
    stdin: 'sample stdin input',
  });
  assert(jsLegacyRun.exitCode === 0, `Legacy JS script ran with code 0`);
  assert(jsLegacyRun.stdout.trim() === 'PROCESSED: sample stdin input', `Legacy JS output matched stdin processing: got "${jsLegacyRun.stdout.trim()}"`);

  // ── Test 5: Test Case Evaluation with Visible & Hidden Cases in Function Mode ──
  console.log('\nTest 5: Full Evaluation (Visible + Hidden Test Cases)');
  const testCases = [
    { id: 101, input: '"racecar"', expected_output: 'true', is_hidden: false },
    { id: 102, input: '"hello"', expected_output: 'false', is_hidden: false },
    { id: 103, input: '"A man, a plan, a canal: Panama"', expected_output: 'true', is_hidden: true },
    { id: 104, input: '"TrainX"', expected_output: 'false', is_hidden: true },
  ];

  const evalResult = await evaluateCodeInSandbox({
    submittedCode: pyClassCode,
    language: 'python',
    testCases,
    function_name: 'isPalindrome',
  });

  assert(evalResult.total_test_cases === 4, `Total test cases: 4`);
  assert(evalResult.passed_test_cases === 4, `All 4 test cases passed (100% score)`);
  assert(evalResult.results[2].is_hidden === true, `Test case 3 marked hidden`);
  assert(evalResult.results[2].input === undefined, `Hidden test case 3 input is properly masked`);
  assert(evalResult.results[2].expected_output === undefined, `Hidden test case 3 expected output is properly masked`);

  // ── Test 6: Incorrect Solution Rejection & Error Handling ──
  console.log('\nTest 6: Error Handling & Rejection');
  const wrongCode = `
def reverse_string(s):
    return s  # Wrong: not reversing!
`;
  const wrongEval = await evaluateCodeInSandbox({
    submittedCode: wrongCode,
    language: 'python',
    testCases: [
      { id: 201, input: '"hello"', expected_output: 'olleh', is_hidden: false },
    ],
    function_name: 'reverse_string',
  });
  assert(wrongEval.passed_test_cases === 0, `Wrong function rejected (0 passed test cases)`);

  const syntaxErrorCode = `
def broken_syntax(s
    return
`;
  const syntaxRun = await runCodeInSandbox({
    language: 'python',
    code: syntaxErrorCode,
    stdin: 'test',
    function_name: 'broken_syntax',
  });
  assert(syntaxRun.compilationError === true || syntaxRun.exitCode !== 0, `Compilation/syntax error correctly flagged`);

  console.log('\n================================================================');
  console.log(`🎉 PHASE 1 RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

