import { runCodeInSandbox } from '../src/services/code.executor.service.js';
import { evaluateCodeInSandbox } from '../src/services/codingSubmission.service.js';

const languagesToTest = [
  // 1. Python (Function)
  {
    lang: 'python',
    mode: 'function',
    code: `class Solution:
    def solve(self, n: int) -> int:
        return n * 2`,
    fn: 'solve',
    testCases: [
      { input: '5', expected_output: '10' },
      { input: '12', expected_output: '24' }
    ]
  },
  // 2. JavaScript (Function)
  {
    lang: 'javascript',
    mode: 'function',
    code: `function solve(n) {
    return n * 2;
}`,
    fn: 'solve',
    testCases: [
      { input: '5', expected_output: '10' },
      { input: '12', expected_output: '24' }
    ]
  },
  // 3. TypeScript (Function)
  {
    lang: 'typescript',
    mode: 'function',
    code: `function solve(n: number): number {
    return n * 2;
}`,
    fn: 'solve',
    testCases: [
      { input: '5', expected_output: '10' },
      { input: '12', expected_output: '24' }
    ]
  },
  // 4. Java (Function)
  {
    lang: 'java',
    mode: 'function',
    code: `class Solution {
    public int solve(int n) {
        return n * 2;
    }
}`,
    fn: 'solve',
    testCases: [
      { input: '5', expected_output: '10' },
      { input: '12', expected_output: '24' }
    ]
  },
  // 5. C++ (Function)
  {
    lang: 'cpp',
    mode: 'function',
    code: `#include <iostream>
using namespace std;
class Solution {
public:
    int solve(int n) {
        return n * 2;
    }
};`,
    fn: 'solve',
    testCases: [
      { input: '5', expected_output: '10' },
      { input: '12', expected_output: '24' }
    ]
  },
  // 6. C (Legacy)
  {
    lang: 'c',
    mode: 'legacy',
    code: `#include <stdio.h>
int main() {
    int n;
    if (scanf("%d", &n) == 1) printf("%d\\n", n * 2);
    return 0;
}`,
    fn: null,
    testCases: [
      { input: '5', expected_output: '10' }
    ]
  },
  // 7. Go (Legacy)
  {
    lang: 'go',
    mode: 'legacy',
    code: `package main
import "fmt"
func main() {
    var n int
    fmt.Scan(&n)
    fmt.Println(n * 2)
}`,
    fn: null,
    testCases: [
      { input: '5', expected_output: '10' }
    ]
  },
  // 8. SQL (Legacy)
  {
    lang: 'sql',
    mode: 'legacy',
    code: `SELECT 10;`,
    fn: null,
    testCases: [
      { input: '', expected_output: '10' }
    ]
  }
];

async function run() {
  console.log('================================================================');
  console.log('AUDIT: Testing Execution & Evaluation Across All 8 Languages');
  console.log('================================================================');

  const summary = [];

  for (const item of languagesToTest) {
    console.log(`\n--- [${item.lang.toUpperCase()}] Mode: ${item.mode} ---`);
    const start = Date.now();
    try {
      // 1. Direct runner test
      const runRes = await runCodeInSandbox({
        language: item.lang,
        code: item.code,
        stdin: item.testCases[0].input,
        timeoutMs: 4000,
        function_name: item.fn
      });

      // 2. Full evaluation test
      const evalRes = await evaluateCodeInSandbox({
        submittedCode: item.code,
        language: item.lang,
        testCases: item.testCases,
        function_name: item.fn
      });

      const duration = Date.now() - start;
      const resultObj = {
        language: item.lang,
        mode: item.mode,
        run_sandbox: runRes.sandbox,
        run_exitCode: runRes.exitCode,
        run_stdout: (runRes.stdout || '').trim().slice(0, 50),
        run_stderr: (runRes.stderr || '').trim().slice(0, 100),
        compilationError: runRes.compilationError,
        timedOut: runRes.timedOut,
        eval_status: evalRes.status,
        passedTests: `${evalRes.passedTests}/${evalRes.totalTests}`,
        score: evalRes.score,
        duration: `${duration}ms`
      };

      summary.push(resultObj);
      console.log('Result:', JSON.stringify(resultObj, null, 2));
    } catch (err) {
      console.error(`ERROR for ${item.lang}:`, err.message);
      summary.push({
        language: item.lang,
        mode: item.mode,
        error: err.message,
        eval_status: 'EXCEPTION'
      });
    }
  }

  console.log('\n======================== SUMMARY TABLE ========================');
  console.table(summary);
}

run().catch(console.error);
