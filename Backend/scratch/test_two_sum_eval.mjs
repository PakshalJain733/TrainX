import { query } from '../src/config/db.js';
import { normalizeOutput, deriveSubmissionStatus } from '../src/services/code.executor.service.js';
import { spawnSync, spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

async function runLocalSandbox({ language, code, stdin = '', timeoutSeconds = 5 }) {
  const hostDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trainx-eval-'));
  const startedAt = Date.now();

  try {
    const isWindows = process.platform === 'win32';
    const pyCmd = isWindows ? 'python' : 'python3';

    if (language === 'node' || language === 'javascript') {
      const filename = 'main.js';
      await fs.writeFile(path.join(hostDir, filename), code, 'utf8');

      const check = spawnSync('node', ['--check', filename], { cwd: hostDir, encoding: 'utf8', timeout: 5000 });
      if (check.status !== 0) {
        return {
          stdout: '',
          stderr: check.stderr || check.stdout || 'Syntax check failed',
          exitCode: 1,
          executionTime: Date.now() - startedAt,
          timedOut: false,
          compilationError: true,
          sandbox: 'local-sandbox',
        };
      }

      return await executeProcess('node', [filename], hostDir, stdin, timeoutSeconds, startedAt);
    }

    if (language === 'python') {
      const filename = 'main.py';
      await fs.writeFile(path.join(hostDir, filename), code, 'utf8');

      const check = spawnSync(pyCmd, ['-m', 'py_compile', filename], { cwd: hostDir, encoding: 'utf8', timeout: 5000 });
      if (check.status !== 0) {
        return {
          stdout: '',
          stderr: check.stderr || check.stdout || 'Python syntax error',
          exitCode: 1,
          executionTime: Date.now() - startedAt,
          timedOut: false,
          compilationError: true,
          sandbox: 'local-sandbox',
        };
      }

      return await executeProcess(pyCmd, ['-u', filename], hostDir, stdin, timeoutSeconds, startedAt);
    }

    return {
      stdout: '',
      stderr: `Language ${language} not supported in fallback.`,
      exitCode: 1,
      executionTime: 0,
      timedOut: false,
      compilationError: true,
      sandbox: 'local-sandbox',
    };
  } finally {
    await fs.rm(hostDir, { recursive: true, force: true }).catch(() => {});
  }
}

function executeProcess(cmd, args, cwd, stdin, timeoutSeconds, startedAt) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const child = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      resolve({
        stdout,
        stderr: 'Time Limit Exceeded',
        exitCode: 124,
        executionTime: Date.now() - startedAt,
        timedOut: true,
        compilationError: false,
        sandbox: 'local-sandbox',
      });
    }, timeoutSeconds * 1000);

    child.stdout.on('data', (d) => { if (stdout.length < 1000000) stdout += d.toString(); });
    child.stderr.on('data', (d) => { if (stderr.length < 1000000) stderr += d.toString(); });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        executionTime: Date.now() - startedAt,
        timedOut: false,
        compilationError: false,
        sandbox: 'local-sandbox',
      });
    });

    child.on('close', (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        stdout,
        stderr,
        exitCode: exitCode ?? 0,
        executionTime: Date.now() - startedAt,
        timedOut: false,
        compilationError: false,
        sandbox: 'local-sandbox',
      });
    });

    if (stdin) child.stdin.write(stdin);
    child.stdin.end();
  });
}

// Fetch Problem 1 test cases from DB
const testCases = await query('SELECT * FROM coding_test_cases WHERE problem_id = 1 ORDER BY id ASC');
console.log(`Loaded ${testCases.length} test cases for Problem 1 (Two Sum).`);

// 1. Correct JavaScript Solution
const correctJS = `
const fs = require('fs');
const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (tokens.length >= 2) {
  const n = parseInt(tokens[0]);
  const target = parseInt(tokens[1]);
  const nums = tokens.slice(2).map(Number);
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      console.log(map.get(diff) + ' ' + i);
      break;
    }
    map.set(nums[i], i);
  }
}
`;

let passed = 0;
let compilationError = false;
let timedOut = false;
let runtimeError = false;

for (const tc of testCases) {
  const res = await runLocalSandbox({ language: 'node', code: correctJS, stdin: tc.input });
  if (res.compilationError) compilationError = true;
  if (res.timedOut) timedOut = true;
  if (res.exitCode !== 0) runtimeError = true;
  const actual = normalizeOutput(res.stdout);
  const expected = normalizeOutput(tc.expected_output);
  if (actual === expected) passed++;
}

const status = deriveSubmissionStatus({
  timedOut,
  compilationError,
  runtimeError,
  passedTests: passed,
  totalTests: testCases.length,
});

console.log('Result for correct Two Sum solution:');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Status: ${status} (expected: accepted)`);

// 2. Incorrect Solution (prints wrong indices)
const wrongJS = `console.log("99 99");`;
let passedWrong = 0;
for (const tc of testCases) {
  const res = await runLocalSandbox({ language: 'node', code: wrongJS, stdin: tc.input });
  if (normalizeOutput(res.stdout) === normalizeOutput(tc.expected_output)) passedWrong++;
}
const wrongStatus = deriveSubmissionStatus({
  timedOut: false,
  compilationError: false,
  runtimeError: false,
  passedTests: passedWrong,
  totalTests: testCases.length,
});
console.log(`\nResult for wrong solution: ${passedWrong}/${testCases.length}, Status: ${wrongStatus} (expected: wrong_answer)`);

process.exit(0);
