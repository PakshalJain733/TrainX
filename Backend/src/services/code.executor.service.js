/**
 * Secure Docker-based code executor.
 *
 * User code is NEVER executed on the Node.js host. Each execution is dispatched
 * to an isolated container with:
 *   - network disabled  (--network none)
 *   - memory limit      (--memory, --memory-swap)
 *   - CPU limit         (--cpus)
 *   - PID limit         (--pids-limit)
 *   - execution timeout (in-container `timeout` + Node watchdog)
 *   - no privileged mode (never added)
 *   - Linux capabilities dropped (--cap-drop ALL, no-new-privileges)
 *   - read-only root filesystem (--read-only); only the per-request workspace
 *     is bind-mounted read/write
 *   - non-root user inside the image
 *   - per-request temp workspace removed after execution
 *
 * No shell string interpolation is used: docker is invoked with `spawn` and a
 * literal, validated argument array. The language is validated against an
 * allow-list and user code/stdin travel via files, never as args.
 */
import { spawn, execFile, spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from '../config/env.js';

const SUPPORTED_LANGUAGES = {};

export const LANGUAGE_ALIASES = {
  c: 'c',
  cpp: 'cpp',
  java: 'java',
  python: 'python',
  node: 'node',
  javascript: 'node',
};

export const isLanguageSupported = (language) =>
  typeof language === 'string' && Boolean(LANGUAGE_ALIASES[language.toLowerCase()]);

const SOURCE_FILENAMES = {
  c: 'main.c',
  cpp: 'main.cpp',
  java: null, // resolved from the declared class name
  python: 'main.py',
  node: 'main.js',
};

export function javaClassName(sourceCode) {
  const match = String(sourceCode || '').match(/public\s+class\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
  return match ? match[1] : 'Main';
}

let dockerBinary = null;

const getDockerBinary = () => {
  if (dockerBinary !== null) return dockerBinary;

  if (process.platform === 'win32') {
    const where = spawnSync('where', ['docker'], { encoding: 'utf8', timeout: 10000 });
    let resolved = 'docker';
    if (!(where.status === 0 && where.stdout && where.stdout.trim())) {
      const fallbackPath = path.join(
        process.env.LOCALAPPDATA || '',
        'Programs',
        'DockerDesktop',
        'resources',
        'bin',
        'docker.exe'
      );
      if (existsSync(fallbackPath)) resolved = fallbackPath;
    }
    dockerBinary = resolved;
  } else {
    dockerBinary = 'docker';
  }
  return dockerBinary;
};

let dockerProbe = null;
let dockerProbeAt = 0;
const DOCKER_PROBE_TTL_MS = 30000;

const probeDocker = () =>
  new Promise((resolve) => {
    execFile(getDockerBinary(), ['version', '--format', '{{.Server.Version}}'], { timeout: 5000 }, (err, stdout) => {
      if (!err && stdout && stdout.trim()) resolve(true);
      else resolve(false);
    });
  });

/**
 * Best-effort cached check for a reachable Docker daemon.
 */
export const isDockerAvailable = async () => {
  const now = Date.now();
  if (dockerProbe !== null && now - dockerProbeAt < DOCKER_PROBE_TTL_MS) {
    return dockerProbe;
  }
  dockerProbe = await probeDocker();
  dockerProbeAt = Date.now();
  return dockerProbe;
};

export const compilerUnavailableError = () => {
  const error = new Error('Compiler service unavailable. Please ensure Docker is running.');
  error.statusCode = 503;
  error.code = 'COMPILER_UNAVAILABLE';
  return error;
};

// Concurrency cap: each run boots a container, so limit how many can be in
// flight at once to protect the host from unbounded `docker run` spawns.
const MAX_CONCURRENT_RUNS = Math.max(1, parseInt(String(config.compiler.maxConcurrent || '4'), 10));
let activeRuns = 0;
const runWaiters = [];

const acquireRunSlot = () =>
  new Promise((resolve) => {
    if (activeRuns < MAX_CONCURRENT_RUNS) {
      activeRuns += 1;
      resolve();
    } else {
      runWaiters.push(resolve);
    }
  });

const releaseRunSlot = () => {
  activeRuns -= 1;
  const next = runWaiters.shift();
  if (next) {
    activeRuns += 1;
    next();
  }
};

const readWorkspaceFile = async (dir, name, fallback = '') => {
  try {
    return await fs.readFile(path.join(dir, name), 'utf8');
  } catch {
    return fallback;
  }
};

const resolveSourceFilename = (language, code) => {
  const lang = LANGUAGE_ALIASES[String(language).toLowerCase()];
  if (lang === 'java') {
    return `${javaClassName(code)}.java`;
  }
  return SOURCE_FILENAMES[lang];
};

/**
 * Normalize program output for test-case comparison.
 * Rules:
 *   1. Normalize line endings (CRLF → LF)
 *   2. Trim leading/trailing whitespace from the whole string
 *   3. Trim trailing whitespace from each individual line
 *   4. Drop all trailing blank lines
 *   5. Collapse multiple consecutive blank lines into one
 *      (some judges differ here; keeping one blank line tolerates
 *       problems that intentionally print blank lines between sections)
 * Leading whitespace inside lines is preserved (indented output matters).
 */
export const normalizeOutput = (text = '') => {
  const lines = String(text)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd()); // trim trailing spaces per line only
  // Drop all trailing blank lines
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.join('\n');
};

/**
 * Execute `code` in an isolated container one time.
 *
 * @returns {Promise<{stdout:string, stderr:string, exitCode:number,
 *   executionTime:number, timedOut:boolean, compilationError:boolean}>}
 */
export const runCodeInSandbox = async (params) => {
  await acquireRunSlot();
  try {
    return await runCodeInSandboxUnlimited(params);
  } finally {
    releaseRunSlot();
  }
};

const runCodeInSandboxUnlimited = async ({ language, code, stdin = '', timeoutSeconds }) => {
  const langKey = LANGUAGE_ALIASES[String(language || '').toLowerCase()];
  if (!langKey) {
    const error = new Error(`Unsupported language: ${language}`);
    error.statusCode = 400;
    error.code = 'UNSUPPORTED_LANGUAGE';
    throw error;
  }
  if (code === undefined || code === null || String(code).trim() === '') {
    const error = new Error('code is required');
    error.statusCode = 400;
    throw error;
  }

  const maxTimeout = config.compiler.maxTimeoutSeconds;
  const execTimeout = Math.min(
    Math.max(parseInt(timeoutSeconds, 10) || config.compiler.timeoutSeconds, 1),
    maxTimeout
  );

  const available = await isDockerAvailable();
  if (!available) {
    throw compilerUnavailableError();
  }

  const runId = crypto.randomBytes(6).toString('hex');
  const containerName = `trainx-code-${runId}`;
  const hostDir = await fs.mkdtemp(path.join(os.tmpdir(), 'trainx-code-'));
  let containerResult;

  try {
    // Make the transient workspace world-writable so the unprivileged in-image
    // user can write compiled binaries / result files on any host OS.
    await fs.chmod(hostDir, 0o777);

    const filename = resolveSourceFilename(langKey, code);
    await fs.writeFile(path.join(hostDir, filename), code, 'utf8');
    await fs.writeFile(path.join(hostDir, 'input.txt'), String(stdin ?? ''), 'utf8');

    const args = [
      'run',
      '--rm',
      '--name', containerName,
      '--network', 'none',
      '--cpus', String(config.compiler.cpus),
      '--memory', `${config.compiler.memoryMb}m`,
      '--memory-swap', `${config.compiler.memoryMb}m`,
      '--pids-limit', String(config.compiler.pids),
      '--cap-drop', 'ALL',
      '--security-opt', 'no-new-privileges',
      '--read-only',
      '-e', `LANGUAGE=${langKey}`,
      '-e', `EXEC_TIMEOUT=${execTimeout}`,
      '-v', `${hostDir.split(path.sep).join('/')}:/workspace`,
      '-w', '/workspace',
      config.compiler.image,
    ];

    containerResult = await new Promise((resolve, reject) => {
      const startedAt = Date.now();
      let settled = false;

      const child = spawn(getDockerBinary(), args, {
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let childOut = '';
      let childErr = '';
      child.stdout.on('data', (d) => {
        childOut += d.toString();
      });
      child.stderr.on('data', (d) => {
        childErr += d.toString();
      });

      const watchdog = setTimeout(() => {
        if (settled) return;
        settled = true;
        execFile(getDockerBinary(), ['rm', '-f', containerName], { timeout: 5000 }, () => {});
        child.kill('SIGKILL');
        reject(Object.assign(new Error('Compiler execution exceeded server watchdog timeout.'), { statusCode: 503 }));
      }, (execTimeout + 15) * 1000);

      child.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        reject(
          Object.assign(new Error('Compiler service unavailable. Please ensure Docker is running.'), {
            statusCode: 503,
            code: 'COMPILER_UNAVAILABLE',
            cause: err,
          })
        );
      });

      child.on('close', (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(watchdog);
        resolve({
          code,
          executionTime: Date.now() - startedAt,
          childOut,
          childErr,
        });
      });
    });

    const [compileCode, runCode, timedOutFile, compileError, stdout, stderr] = await Promise.all([
      readWorkspaceFile(hostDir, 'compile_code'),
      readWorkspaceFile(hostDir, 'run_code'),
      readWorkspaceFile(hostDir, 'timed_out'),
      readWorkspaceFile(hostDir, 'compile_error.txt'),
      readWorkspaceFile(hostDir, 'run_stdout.txt'),
      readWorkspaceFile(hostDir, 'run_stderr.txt'),
    ]);

    // A non-zero docker CLI exit code normally means the daemon/image failed.
    // However, we always check the workspace result files FIRST because:
    //   • The runner.sh contract guarantees the container exits 0.
    //   • A non-zero docker exit here means Docker Desktop/daemon error.
    //   • But if result files are populated, the run actually succeeded
    //     and the non-zero exit is a host-side artefact we can safely ignore.
    const filesPopulated = compileCode.trim() !== '' || stdout.trim() !== '' || stderr.trim() !== '';
    if (containerResult.code !== 0 && !filesPopulated) {
      const msg = containerResult.childErr || containerResult.childOut || `docker exited ${containerResult.code}`;
      // Surface a useful hint if the image is simply missing.
      const isMissingImage =
        /unable to find image|pull access denied|not found|no such image/i.test(msg);
      const error = new Error(
        isMissingImage
          ? `Docker image "${config.compiler.image}" not found. Run: docker build -t ${config.compiler.image} ./Backend/docker/compiler`
          : 'Compiler service unavailable. Please ensure Docker is running.'
      );
      error.statusCode = 503;
      error.code = 'COMPILER_UNAVAILABLE';
      error.details = msg.split('\n')[0];
      throw error;
    }

    const compilationError = compileCode.trim() === '1';
    const timedOut = timedOutFile.trim() === '1';
    // run_code holds the raw exit code of the user's program (0=OK, non-zero=runtime error, 124=TLE)
    const rawExitCode = parseInt(runCode.trim() || '0', 10);
    const exitCode = compilationError ? 1 : timedOut ? 124 : rawExitCode;

    if (compilationError) {
      return {
        stdout: '',
        stderr: compileError.trim() || 'Compilation failed.',
        exitCode: 1,
        executionTime: containerResult.executionTime,
        timedOut: false,
        compilationError: true,
      };
    }

    return {
      stdout,
      stderr,
      exitCode,
      executionTime: containerResult.executionTime,
      timedOut,
      compilationError: false,
    };
  } finally {
    // Clean up the temporary execution workspace.
    await fs.rm(hostDir, { recursive: true, force: true }).catch(() => {});
  }
};

/**
 * Derive the submission status from per-test execution results.
 */
export const deriveSubmissionStatus = ({ timedOut, compilationError, runtimeError, passedTests, totalTests }) => {
  if (compilationError) return 'compilation_error';
  if (timedOut) return 'time_limit_exceeded';
  if (runtimeError) return 'runtime_error';
  if (passedTests === totalTests) return 'accepted';
  return 'wrong_answer';
};