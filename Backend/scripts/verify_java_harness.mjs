import { runCodeInSandbox } from '../src/services/code.executor.service.js';
import { evaluateCodeInSandbox } from '../src/services/codingSubmission.service.js';

async function verifyJava() {
  console.log('================================================================');
  console.log('FOCUSED VERIFICATION: Java LeetCode Harness (All 5 Requirements)');
  console.log('================================================================');

  const javaTests = [
    // 1. Integer return value & multiple parameters & class-based Solution method
    {
      name: '1. Integer Return Value + Multiple Parameters (int a, int b)',
      code: `public class Solution {
    public int add(int a, int b) {
        return a + b;
    }
}`,
      function_name: 'add',
      stdin: '15 27',
      expected: '42'
    },
    // 2. String return value & Class-based Solution method
    {
      name: '2. String Return Value + String Parameter (reverseString)',
      code: `class Solution {
    public String reverseString(String s) {
        return new StringBuilder(s).reverse().toString();
    }
}`,
      function_name: 'reverseString',
      stdin: 'hello world',
      expected: 'dlrow olleh'
    },
    // 3. Array parameters & integer return value
    {
      name: '3. Array Parameter + Integer Return Value (sumArray)',
      code: `class Solution {
    public int sumArray(int[] nums) {
        int sum = 0;
        for (int x : nums) sum += x;
        return sum;
    }
}`,
      function_name: 'sumArray',
      stdin: '[10, 20, 30, 40]',
      expected: '100'
    },
    // 4. Array parameter + Integer parameter + Array return value (Two Sum)
    {
      name: '4. Array Param + Multiple Params + Array Return (twoSum)',
      code: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) {
                    return new int[]{i, j};
                }
            }
        }
        return new int[0];
    }
}`,
      function_name: 'twoSum',
      stdin: "[2, 7, 11, 15]\n9",
      expected: '[0, 1]'
    },
    // 5. Evaluation with visible & hidden test cases
    {
      name: '5. Full Test Case Evaluation (Pass all test cases)',
      code: `class Solution {
    public int multiply(int a, int b) {
        return a * b;
    }
}`,
      function_name: 'multiply',
      testCases: [
        { id: 1, input: '6 7', expected_output: '42', is_hidden: false },
        { id: 2, input: '12 12', expected_output: '144', is_hidden: true }
      ]
    }
  ];

  let passed = 0;
  for (const t of javaTests) {
    console.log(`\n--- Testing: ${t.name} ---`);
    if (t.testCases) {
      const evalRes = await evaluateCodeInSandbox({
        submittedCode: t.code,
        language: 'java',
        testCases: t.testCases,
        function_name: t.function_name
      });
      console.log('Passed Test Cases:', `${evalRes.passed_test_cases}/${evalRes.total_test_cases}`);
      console.log('Results:', JSON.stringify(evalRes.results, null, 2));
      if (evalRes.passed_test_cases === evalRes.total_test_cases && !evalRes.compilation_error) {
        console.log('>>> PASSED <<< All test cases passed!');
        passed++;
      } else {
        console.error('>>> FAILED <<<');
      }
    } else {
      const runRes = await runCodeInSandbox({
        language: 'java',
        code: t.code,
        stdin: t.stdin,
        function_name: t.function_name
      });
      console.log('Exit Code:', runRes.exitCode);
      console.log('Stdout:', runRes.stdout);
      console.log('Stderr:', runRes.stderr);
      console.log('Compilation Error:', runRes.compilationError);

      const isMatch = (runRes.stdout || '').trim() === t.expected;
      if (runRes.exitCode === 0 && !runRes.compilationError && isMatch) {
        console.log('>>> PASSED <<< Output matches expected:', t.expected);
        passed++;
      } else {
        console.error('>>> FAILED <<< Expected:', t.expected, 'Got:', runRes.stdout);
      }
    }
  }

  console.log(`\n================================================================`);
  console.log(`JAVA VERIFICATION SUMMARY: ${passed}/${javaTests.length} PASSED`);
  console.log(`================================================================`);
  if (passed !== javaTests.length) {
    process.exit(1);
  }
}

verifyJava().catch(err => {
  console.error('Java verification exception:', err);
  process.exit(1);
});
