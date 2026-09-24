// E2E socket test for the AI Interview module.
//
// Boots the real Express app + Socket.IO /interviews namespace from this repo,
// then exercises the exact flow the browser uses:
//   connect with real JWT -> interview:start -> first Gemini question.
//
// Runs WITHOUT a browser and WITHOUT Docker. Requires a reachable backend
// dependency tree only; the interview:start with an invalid/missing Gemini key
// must fail gracefully (AI service unavailable) — never with fake questions.
import assert from 'node:assert';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { io as Client } from 'socket.io-client';
import { config } from '../src/config/env.js';
import app from '../src/app.js';
import { initInterviewSocket } from '../src/socket/interview.socket.js';

let passed = 0;
let failed = 0;

const ok = (label) => {
  passed++;
  console.log(`  [PASS] ${label}`);
};
const fail = (label, err) => {
  failed++;
  console.error(`  [FAIL] ${label}${err ? ` — ${err.message}` : ''}`);
};

const waitFor = (emitter, event, timeoutMs = 15000) =>
  new Promise((resolve) => {
    const t = setTimeout(() => {
      emitter.off(event, handler);
      resolve({ timedOut: true });
    }, timeoutMs);
    const handler = (payload) => {
      clearTimeout(t);
      emitter.off(event, handler);
      resolve({ timedOut: false, payload });
    };
    emitter.once(event, handler);
  });

const connectSocket = ({ token, sessionId }) =>
  new Promise((resolve, reject) => {
    const socket = Client(`${base}/interviews`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: false,
      timeout: 10000,
    });
    const timer = setTimeout(() => reject(new Error('socket connect timeout')), 12000);
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });
    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      reject(new Error(err.message || 'connect_error'));
    });
  });

let server;
let base;

await new Promise((resolve) => {
  server = http.createServer(app);
  initInterviewSocket(server);
  server.listen(0, () => {
    base = `http://localhost:${server.address().port}`;
    resolve();
  });
});

const gen = (payload) => jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
const validToken = gen({ userId: 999001, name: 'E2E Student', email: 'e2e@test.local', role: 'student', collegeId: 1 });
const invalidToken = jwt.sign({ userId: 999001, role: 'student' }, 'definitely-not-the-secret', { expiresIn: '1h' });

const section = (title) => console.log(`\n${'='.repeat(64)}\n${title}\n${'='.repeat(64)}`);

// ── T1: valid JWT connects ────────────────────────────────────────────────
section('T1: Socket.IO connects with a real REST JWT');
try {
  const socket = await connectSocket({ token: validToken });
  assert.ok(socket.connected, 'socket should be connected');
  ok('valid JWT -> connected (auth accepted, identity from JWT)');
  socket.disconnect();
} catch (err) {
  fail('valid JWT connects', err);
}

// ── T2: invalid/expired JWT is rejected cleanly ───────────────────────────
section('T2: invalid JWT rejected without starting an interview');
try {
  await assert.rejects(
    () => connectSocket({ token: invalidToken }),
    (err) => {
      assert.ok(/token|expired|invalid/i.test(err.message), `unexpected msg: ${err.message}`);
      return true;
    }
  );
  ok('invalid token -> clean connect_error, no session started');
} catch (err) {
  fail('invalid token rejected', err);
}

// ── T3: interview:start produces first question (or graceful AI error) ────
section('T3: interview:start flow (real Gemini key or graceful failure)');
const userASocket = await connectSocket({ token: validToken });
const sessA = `e2e-a-${Date.now()}`;
userASocket.emit('interview:start', {
  sessionId: sessA,
  role: 'Full Stack Developer',
  topic: 'JavaScript',
  difficulty: 'Medium',
  totalQuestions: 3,
});
const startedA = await Promise.race([
  waitFor(userASocket, 'interview:question', 20000),
  waitFor(userASocket, 'interview:error', 20000),
]);
assert.ok(!startedA.timedOut, 'expected interview:question OR interview:error within 20s');
if ('question' in (startedA.payload || {})) {
  ok(`first Gemini question received (Q1): "${(startedA.payload.question || '').slice(0, 60)}..."`);
} else if (startedA.payload && /AI service unavailable/i.test(startedA.payload.message || '')) {
  ok('graceful AI-unavailable error when Gemini cannot generate (no fake question injected)');
} else {
  throw new Error(`unexpected start outcome: ${JSON.stringify(startedA.payload)}`);
}
userASocket.disconnect();

// ── T4: two users get isolated sessions ───────────────────────────────────
section('T4: multi-user isolation — separate sockets separate rooms');
const tokenB = gen({ userId: 999002, name: 'E2E Student B', email: 'e2eB@test.local', role: 'student', collegeId: 1 });
const socketA = await connectSocket({ token: validToken });
const socketB = await connectSocket({ token: tokenB });
const sessB = `e2e-b-${Date.now()}`;
let aGot = null;
let bGot = null;
socketA.on('interview:question', (q) => { aGot = { type: 'question', id: q.sessionId }; });
socketA.on('interview:error', (e) => { aGot = { type: 'error', msg: e.message }; });
socketB.on('interview:question', (q) => { bGot = { type: 'question', id: q.sessionId }; });
socketB.on('interview:error', (e) => { bGot = { type: 'error', msg: e.message }; });

socketA.emit('interview:start', { sessionId: sessA, role: 'Backend Developer', topic: 'Node.js', difficulty: 'Medium', totalQuestions: 1 });
await new Promise((r) => setTimeout(r, 300));
socketB.emit('interview:start', { sessionId: sessB, role: 'Data Analyst', topic: 'SQL', difficulty: 'Medium', totalQuestions: 1 });
await new Promise((r) => setTimeout(r, 12000));

assert.ok(aGot, 'user A got an outcome for session A');
assert.ok(bGot, 'user B got an outcome for session B');
if (aGot.type === 'question') assert.strictEqual(aGot.id, sessA, 'A question belongs to A session');
if (bGot.type === 'question') assert.strictEqual(bGot.id, sessB, 'B question belongs to B session');
ok('no cross-user event delivery (each socket only hears its own session)');
socketA.disconnect();
socketB.disconnect();

// ── cleanup ───────────────────────────────────────────────────────────────
await new Promise((resolve) => {
  server.closeAllConnections?.();
  server.close(() => resolve());
});

console.log('\n========================================');
console.log(`SOCKET E2E RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================');
process.exit(failed > 0 ? 1 : 0);