/**
 * Automated Verification for Socket.IO Immediate Revocation (SEC-01)
 */

import 'dotenv/config';
import http from 'http';
import jwt from 'jsonwebtoken';
import { io as Client } from 'socket.io-client';
import { pool, query } from '../src/config/db.js';
import { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } from '../src/config/jwt.js';
import { initInterviewSocket, disconnectUserSockets } from '../src/socket/interview.socket.js';
import { invalidateUserAuthCache, clearAllUserAuthCache } from '../src/middleware/auth.middleware.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${message}`);
  } else {
    failed++;
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${message}`);
  }
}

async function runSocketTests() {
  console.log('========================================================================');
  console.log(' TrainX Socket.IO Real-Time Revocation Test Suite (SEC-01)');
  console.log('========================================================================\n');

  clearAllUserAuthCache();

  // Find existing college
  const cols = await query('SELECT id FROM colleges ORDER BY id ASC LIMIT 1');
  const collegeId = cols[0]?.id || null;

  // Create an active test user
  const email = `socket.test.${Date.now()}@college.edu`;
  const res = await query(
    "INSERT INTO users (name, email, role, college_id, is_active, is_verified, is_approved) VALUES ('Socket Tester', ?, 'student', ?, 1, 1, 1)",
    [email, collegeId]
  );
  const userId = res.insertId;

  const validToken = jwt.sign(
    { userId, role: 'student', collegeId, iss: JWT_ISSUER, aud: JWT_AUDIENCE },
    getJwtSecret(),
    { algorithm: 'HS256', expiresIn: '7d' }
  );

  // Setup test HTTP server and Socket.IO
  const server = http.createServer();
  initInterviewSocket(server);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const socketUrl = `http://localhost:${port}/interviews`;

  // Test 1: Active user connects successfully
  const clientSocket = Client(socketUrl, {
    auth: { token: validToken },
    transports: ['websocket'],
  });

  await new Promise((resolve, reject) => {
    clientSocket.on('interview:connected', (data) => {
      assert(data.userId === userId, 'Active student connects to Socket.IO successfully');
      resolve();
    });
    clientSocket.on('connect_error', (err) => reject(err));
  });

  // Test 2: Immediate disconnection via disconnectUserSockets(userId)
  let receivedRevokedEvent = false;
  let disconnectedEvent = false;

  clientSocket.on('auth:revoked', (data) => {
    receivedRevokedEvent = true;
  });

  clientSocket.on('disconnect', () => {
    disconnectedEvent = true;
  });

  // Revoke user in DB and trigger immediate socket teardown
  await query('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);
  invalidateUserAuthCache(userId);
  disconnectUserSockets(userId, 'Eligibility Revoked Test');

  // Wait 300ms for network dispatch
  await new Promise((resolve) => setTimeout(resolve, 300));

  assert(receivedRevokedEvent, "Existing live socket received 'auth:revoked' event immediately");
  assert(disconnectedEvent, 'Existing live socket was forcefully disconnected from server');

  // Test 3: Revoked student cannot reconnect to Socket.IO
  let reconnectRejected = false;
  let rejectMessage = '';

  const reconnectSocket = Client(socketUrl, {
    auth: { token: validToken },
    transports: ['websocket'],
    reconnection: false,
  });

  await new Promise((resolve) => {
    reconnectSocket.on('connect_error', (err) => {
      reconnectRejected = true;
      rejectMessage = err.message;
      resolve();
    });
    reconnectSocket.on('interview:connected', () => {
      resolve();
    });
    setTimeout(resolve, 1500);
  });

  assert(reconnectRejected, `Revoked student reconnection rejected at handshake (${rejectMessage})`);

  // Cleanup
  clientSocket.close();
  reconnectSocket.close();
  server.close();

  console.log('\n========================================================================');
  console.log(` SOCKET TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

runSocketTests().catch((err) => {
  console.error('Socket test error:', err);
  process.exit(1);
});
