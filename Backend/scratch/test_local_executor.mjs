import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

function javaClassName(sourceCode) {
  const match = String(sourceCode || '').match(/public\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
  return match ? match[1] : 'Main';
}

async function runLocalSandbox({ language, code, stdin = '', timeoutSeconds = 5 }) {
  const hostDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trainx-test-'));
  const startedAt = Date.now();
  let timedOut = false;
  let compilationError = false;

  try {
    const isWindows = process.platform === 'win32';
    const pyCmd = isWindows ? 'python' : 'python3';

    if (language === 'node' || language === 'javascript') {
      const filename = 'main.js';
      await fs.writeFile(path.join(hostDir, filename), code, 'utf8');

      // Syntax check
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

      // Execute
      return await executeProcess('node', [filename], hostDir, stdin, timeoutSeconds, startedAt);
    }

    if (language === 'python') {
      const filename = 'main.py';
      await fs.writeFile(path.join(hostDir, filename), code, 'utf8');

      // Syntax check
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

      // Execute
      return await executeProcess(pyCmd, ['-u', filename], hostDir, stdin, timeoutSeconds, startedAt);
    }

    if (language === 'java') {
      const className = javaClassName(code);
      const filename = `${className}.java`;
      await fs.writeFile(path.join(hostDir, filename), code, 'utf8');

      // Compile
      const javac = spawnSync('javac', ['-encoding', 'UTF-8', filename], { cwd: hostDir, encoding: 'utf8', timeout: 10000 });
      if (javac.status !== 0) {
        return {
          stdout: '',
          stderr: javac.stderr || javac.stdout || 'Java compilation failed',
          exitCode: 1,
          executionTime: Date.now() - startedAt,
          timedOut: false,
          compilationError: true,
          sandbox: 'local-sandbox',
        };
      }

      // Execute
      return await executeProcess('java', ['-Xss16m', '-Xmx128m', className], hostDir, stdin, timeoutSeconds, startedAt);
    }

    return {
      stdout: '',
      stderr: `Language ${language} not supported in local sandbox fallback.`,
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
    let timedOut = false;
    let settled = false;

    const child = spawn(cmd, args, { cwd, stdio: ['pipe', 'pipe', 'pipe'] });

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      timedOut = true;
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

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}

// RUN TESTS
console.log('--- TEST A: Valid JavaScript Program ---');
const resA = await runLocalSandbox({ language: 'node', code: 'console.log("Result: " + (2+3));' });
console.log('Test A:', resA.stdout.trim() === 'Result: 5' ? 'PASS' : 'FAIL', resA);

console.log('\n--- TEST B: JavaScript Compilation Error ---');
const resB = await runLocalSandbox({ language: 'node', code: 'function broken() { if (true) ' });
console.log('Test B:', resB.compilationError ? 'PASS' : 'FAIL', resB);

console.log('\n--- TEST C: JavaScript Runtime Error ---');
const resC = await runLocalSandbox({ language: 'node', code: 'const x = null; x.foo();' });
console.log('Test C:', resC.exitCode !== 0 && !resC.compilationError ? 'PASS' : 'FAIL', resC);

console.log('\n--- TEST D: Python with stdin ---');
const resD = await runLocalSandbox({ language: 'python', code: 'import sys; val = sys.stdin.read().strip(); print("Input was: " + val)', stdin: '42' });
console.log('Test D:', resD.stdout.trim() === 'Input was: 42' ? 'PASS' : 'FAIL', resD);

console.log('\n--- TEST E: Python Timeout ---');
const resE = await runLocalSandbox({ language: 'python', code: 'import time\nwhile True: time.sleep(0.1)', timeoutSeconds: 2 });
console.log('Test E:', resE.timedOut ? 'PASS' : 'FAIL', resE);

console.log('\n--- TEST F: Java Valid ---');
const resF = await runLocalSandbox({ language: 'java', code: 'public class Solution { public static void main(String[] args) { System.out.println("Java OK"); } }' });
console.log('Test F:', resF.stdout.trim() === 'Java OK' ? 'PASS' : 'FAIL', resF);
