// @ts-nocheck
/**
 * Coding Compiler test suite.
 *
 * - "Static checks" always run (pure functions, no Docker/DB required).
 * - "Docker e2e checks" run ONLY when a Docker daemon is reachable AND the
 *   trainx-code-runner image is present. If Docker is not available they are
 *   reported as SKIPPED (not failures) — the build command is printed instead.
 * - "DB save check" runs only when MySQL is reachable.
 */
import assert from 'node:assert';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';
import {
  runCodeInSandbox,
  isLanguageSupported,
  javaClassName,
  normalizeOutput,
  deriveSubmissionStatus,
} from '../src/services/code.executor.service.js';
import { query } from '../src/config/db.js';

const generateToken = (payload) => jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });

let passed = 0;
let failed = 0;
let skipped = 0;

const ok = (msg) => {
  passed++;
  console.log(`  [PASS] ${msg}`);
};
const fail = (msg, err) => {
  failed++;
  console.error(`  [FAIL] ${msg}${err ? ` — ${err.message}` : ''}`);
};
const skip = (msg) => {
  skipped++;
  console.log(`  [SKIP] ${msg}`);
};
const section = (title) => console.log(`\n${'='.repeat(64)}\n${title}\n${'='.repeat(64)}`);

async function check(label, fn) {
  try {
    await fn();
    ok(label);
  } catch (err) {
    fail(label, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────
section('STATIC CHECKS (always run)');
// ─────────────────────────────────────────────────────────────────────────
await check('language allow-list accepts all supported languages', () => {
  ['c', 'cpp', 'java', 'python', 'node', 'javascript', 'Python', 'NODE'].forEach((l) =>
    assert.strictEqual(isLanguageSupported(l), true, `${l} should be allowed`)
  );
});
await check('language allow-list rejects unknown languages', () => {
  ['ruby', 'go', 'rust', '', null, undefined, 42].forEach((l) =>
    assert.strictEqual(isLanguageSupported(l), false, `should reject ${l}`)
  );
});
await check('java class name detected from source', () => {
  assert.strictEqual(javaClassName('public class Solution { }'), 'Solution');
  assert.strictEqual(javaClassName('public class Main { }'), 'Main');
  assert.strictEqual(javaClassName('random text'), 'Main');
});
await check('normalizeOutput trims whitespace and trailing blank lines', () => {
  assert.strictEqual(normalizeOutput('  a  \nb \n\n'), 'a\nb');
  assert.strictEqual(normalizeOutput('a\r\nb\r\n'), 'a\nb');
  assert.strictEqual(normalizeOutput('  hello \n world  '), 'hello\nworld');
  assert.strictEqual(normalizeOutput('   '), '');
  assert.strictEqual(normalizeOutput(''), '');
});
await check('normalizeOutput equality == trimmed equality for typical outputs', () => {
  assert.strictEqual(normalizeOutput('0 1\n'), '0 1');
});
await check('deriveSubmissionStatus maps verdicts', () => {
  assert.strictEqual(deriveSubmissionStatus({ passedTests: 4, totalTests: 4 }), 'accepted');
  assert.strictEqual(deriveSubmissionStatus({ passedTests: 2, totalTests: 4 }), 'wrong_answer');
  assert.strictEqual(deriveSubmissionStatus({ compilationError: true }), 'compilation_error');
  assert.strictEqual(deriveSubmissionStatus({ timedOut: true }), 'time_limit_exceeded');
  assert.strictEqual(deriveSubmissionStatus({ runtimeError: true, passedTests: 0, totalTests: 4 }), 'runtime_error');
});

// ─────────────────────────────────────────────────────────────────────────
section('REST API checks');
// ─────────────────────────────────────────────────────────────────────────
import app from '../src/app.js';
import http from 'node:http';

let server;
let baseUrl;

const startServer = () =>
  new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}/api/v1`;
      resolve();
    });
  });

const stopServer = () =>
  new Promise((resolve) => {
    if (server) {
      server.closeAllConnections?.();
      server.close(resolve);
    } else resolve();
  });

const request = async (path, { method = 'GET', token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

await startServer();
const studentToken = generateToken({ userId: 2, name: 'Student Tester', email: 'student@test.com', role: 'student', college_id: 1 });

await check('POST /code/run requires authentication (401)', async () => {
  const res = await request('/code/run', { method: 'POST', body: { language: 'python', code: 'print(1)' } });
  assert.strictEqual(res.status, 401);
});
await check('POST /code/run rejects missing code (400)', async () => {
  const res = await request('/code/run', { method: 'POST', token: studentToken, body: { language: 'python' } });
  assert.strictEqual(res.status, 400);
});
await check('POST /code/run rejects unsupported language (400)', async () => {
  const res = await request('/code/run', { method: 'POST', token: studentToken, body: { language: 'ruby', code: 'puts 1' } });
  assert.strictEqual(res.status, 400);
});
await check('POST /code/submit requires authentication (401)', async () => {
  const res = await request('/code/submit', { method: 'POST', body: { problem_id: 1, language: 'python', code: 'print(1)' } });
  assert.strictEqual(res.status, 401);
});
await check('POST /code/submit rejects missing problem_id (400)', async () => {
  const res = await request('/code/submit', { method: 'POST', token: studentToken, body: { language: 'python', code: 'print(1)' } });
  assert.strictEqual(res.status, 400);
});

// ─────────────────────────────────────────────────────────────────────────
section('DB SUBMISSION SAVE (requires MySQL)');
// ─────────────────────────────────────────────────────────────────────────
let dbAvailable = true;
try {
  await query('SELECT 1');
} catch {
  dbAvailable = false;
}
let createdSubmissionId = null;

if (!dbAvailable) {
  skip('MySQL unreachable — DB save check skipped');
} else {
  await check('submission row can be written and read back', async () => {
    const { createSubmissionModel, getSubmissionByIdModel } = await import('../src/models/codingSubmission.model.js');
    const saved = await createSubmissionModel({
      student_id: 2,
      problem_id: 1,
      submitted_code: 'print("ok")',
      language: 'python',
      passed_test_cases: 4,
      total_test_cases: 4,
      score: 100,
      marks: 100,
      percentage: 100,
      status: 'accepted',
      execution_details: { sandbox: 'docker', passed_test_cases: 4, total_test_cases: 4 },
    });
    createdSubmissionId = saved && saved.id;
    assert.ok(createdSubmissionId, 'expected a saved submission id');
    const fetched = await getSubmissionByIdModel(createdSubmissionId);
    assert.strictEqual(fetched.status, 'accepted');
    assert.strictEqual(fetched.passed_test_cases, 4);
  });
}

// ─────────────────────────────────────────────────────────────────────────
section('DOCKER e2e (runs only when Docker + image are available)');
// ─────────────────────────────────────────────────────────────────────────
const { execFile } = await import('node:child_process');

const hasDocker = await new Promise((resolve) => {
  execFile('docker', ['version', '--format', '{{.Server.Version}}'], { timeout: 5000 }, (err, stdout) => {
    resolve(!err && stdout && stdout.trim());
  });
});

let hasImage = false;
if (hasDocker) {
  hasImage = await new Promise((resolve) => {
    execFile('docker', ['image', 'inspect', config.compiler.image], { timeout: 5000 }, (err) => resolve(!err));
  });
}

const DOCKER_BUILD_CMD = `docker build -t ${config.compiler.image} ./Backend/docker/compiler`;
const DOCKER_TEST_CMD = 'npm run test:code';

if (!hasDocker) {
  skip('Docker daemon not reachable — full execution loop SKIPPED (this is expected while Docker Desktop is installing).');
} else if (!hasImage) {
  skip(`Runner image '${config.compiler.image}' not built — execution loop SKIPPED.`);
}

if (hasDocker && hasImage) {
  const runOnce = async ({ language, code, stdin = '', timeoutSeconds }) => {
    try {
      const result = await runCodeInSandbox({ language, code, stdin, timeoutSeconds });
      return { error: null, result };
    } catch (err) {
      return { error: err, result: null };
    }
  };

  const hello = {
    c: '#include <stdio.h>\nint main() { printf("Hello from C\\n"); return 0; }',
    cpp: '#include <iostream>\nint main() { std::cout << "Hello from C++\\n"; return 0; }',
    java: 'public class Main { public static void main(String[] args) { System.out.println("Hello from Java"); } }',
    python: 'print("Hello from Python")',
    node: 'console.log("Hello from Node")',
  };

  for (const lang of ['c', 'cpp', 'java', 'python', 'node']) {
    await check(`executes ${lang.toUpperCase()} hello world`, async () => {
      const { error, result } = await runOnce({ language: lang, code: hello[lang] });
      if (error) throw error;
      assert.ok(result.stdout.includes('Hello from'), `stdout was: ${result.stdout}`);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.timedOut, false);
      assert.strictEqual(result.compilationError, false);
    });
  }

  await check('executes JAVA with a non-Main public class name', async () => {
    const code = 'public class MyProgram { public static void main(String[] args) { System.out.println("JavaCustomClassOK"); } }';
    const { error, result } = await runOnce({ language: 'java', code });
    if (error) throw error;
    assert.strictEqual(result.compilationError, false, `unexpected compile error: ${result.stderr}`);
    assert.ok(result.stdout.includes('JavaCustomClassOK'), `stdout was: ${result.stdout}`);
    assert.strictEqual(result.exitCode, 0);
    assert.strictEqual(result.timedOut, false);
  });

  await check('executes JAVA with an underscore class name', async () => {
    const code = 'public class Main_2 { public static void main(String[] args) { System.out.println("JavaUnderscoreOK"); } }';
    const { error, result } = await runOnce({ language: 'java', code });
    if (error) throw error;
    assert.strictEqual(result.compilationError, false, `unexpected compile error: ${result.stderr}`);
    assert.ok(result.stdout.includes('JavaUnderscoreOK'), `stdout was: ${result.stdout}`);
    assert.strictEqual(result.exitCode, 0);
  });

  await check('supports stdin (python sums stdin lines)', async () => {
    const code = 'import sys\nprint(sum(int(x) for x in sys.stdin.read().split()))';
    const { error, result } = await runOnce({ language: 'python', code, stdin: '1 2 3 4\n' });
    if (error) throw error;
    assert.strictEqual(result.stdout.trim(), '10');
    assert.strictEqual(result.exitCode, 0);
  });

  await check('reports python syntax error as compilationError', async () => {
    const { error, result } = await runOnce({ language: 'python', code: 'def broken(\n' });
    if (error) throw error;
    assert.strictEqual(result.compilationError, true);
    assert.ok(result.stderr.length > 0);
  });

  await check('reports C runtime error (segfault) with non-zero exit', async () => {
    const code = '#include <stdio.h>\nint main() { int *p = 0; *p = 1; return 0; }';
    const { error, result } = await runOnce({ language: 'c', code });
    if (error) throw error;
    assert.notStrictEqual(result.exitCode, 0);
    assert.strictEqual(result.timedOut, false);
  });

  await check('kills an infinite loop and flags timeout', async () => {
    const { error, result } = await runOnce({ language: 'python', code: 'while True: pass', timeoutSeconds: 2 });
    if (error) throw error;
    assert.strictEqual(result.timedOut, true);
  });

  await check('failed test case -> WRONG_ANSWER on submit flow', async () => {
    const { submitCodeAndSaveService } = await import('../src/services/codingSubmission.service.js');
    const res = await submitCodeAndSaveService({
      student_id: 2,
      problem_id: 1,
      code: 'print("WRONG")',
      language: 'python',
    });
    assert.strictEqual(res.status, 'wrong_answer');
    assert.ok(res.passed_tests < res.total_tests);
    assert.ok(res.submission && res.submission.id);
    createdSubmissionId = res.submission.id;
  });

  await check('successful submission -> ACCEPTED (two sum, python)', async () => {
    const { submitCodeAndSaveService } = await import('../src/services/codingSubmission.service.js');
    const code = [
      'import sys',
      'def main():',
      '    data = sys.stdin.read().split()',
      '    n, target = int(data[0]), int(data[1])',
      '    nums = list(map(int, data[2:2 + n]))',
      '    seen = {}',
      '    for i, v in enumerate(nums):',
      '        if target - v in seen:',
      '            print(seen[target - v], i)',
      '            return',
      '        seen[v] = i',
      'if __name__ == "__main__":',
      '    main()',
    ].join('\n');
    const res = await submitCodeAndSaveService({ student_id: 2, problem_id: 1, code, language: 'python' });
    assert.strictEqual(res.status, 'accepted');
    assert.strictEqual(res.passed_tests, res.total_tests);
    createdSubmissionId = res.submission.id;
  });
}

// ─────────────────────────────────────────────────────────────────────────
// Cleanup
// ─────────────────────────────────────────────────────────────────────────
if (createdSubmissionId && dbAvailable) {
  try {
    await query('DELETE FROM coding_submissions WHERE id = ?', [createdSubmissionId]);
    console.log('\n[INFO] Cleaned up test submission row.');
  } catch {
    /* ignore */
  }
}

await stopServer();

// ─────────────────────────────────────────────────────────────────────────
// EXECUTOR CHECKS (require docker) are skipped without failing
// ─────────────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`CODE TEST RESULTS: ${passed} PASSED, ${failed} FAILED, ${skipped} SKIPPED`);
if (!hasDocker || !hasImage) {
  console.log('\n-----------------------------------------------------');
  console.log('DOCKER NOT READY — commands to run once Docker is up:');
  console.log(`  1) ${DOCKER_BUILD_CMD}`);
  console.log(`  2) ${DOCKER_TEST_CMD}`);
  console.log('-----------------------------------------------------');
}
console.log('========================================');
process.exit(failed > 0 ? 1 : 0);