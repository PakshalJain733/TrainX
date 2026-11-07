import assert from 'assert';
import jwt from 'jsonwebtoken';
import { CareerGatewayClient } from '../src/modules/integrations/careerGateway/client/careerGatewayClient.js';
import { authenticateCareerGatewayService } from '../src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js';
import {
  activationRateLimiter,
  m2mProvisioningRateLimiter,
} from '../src/modules/integrations/careerGateway/middleware/careerGatewayRateLimit.middleware.js';
import { getInterviewRoom } from '../src/socket/interview.socket.js';
import {
  getKolkataTimeInfo,
  checkAndRunDailySync,
  getLastRunDate,
  setLastRunDate,
} from '../src/scheduler/careerGatewayScheduler.js';
import { getStudentDashboard } from '../src/controllers/student.controller.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${err.message}`);
    failed++;
  }
}

function mockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    setHeader(key, val) {
      this.headers[key.toLowerCase()] = val;
    },
    getHeader(key) {
      return this.headers[key.toLowerCase()];
    },
  };
  return res;
}

console.log('--- STARTING VERIFICATION: TRAINX AUDIT REMEDIATION (NOV 7, 2026) ---');

// ============================================================================
// 1. SEC-02: Hardcoded Secret Removed & Explicit Throw on Missing Secret
// ============================================================================
test('SEC-02: Outbound client throws explicit Error when outbound secret is unset', () => {
  const originalEnv1 = process.env.TRAINX_TO_CAREER_GATEWAY_SECRET;
  const originalEnv2 = process.env.CAREER_GATEWAY_OUTBOUND_SECRET;
  const originalEnv3 = process.env.TRAINX_INTEGRATION_SERVICE_KEY;
  delete process.env.TRAINX_TO_CAREER_GATEWAY_SECRET;
  delete process.env.CAREER_GATEWAY_OUTBOUND_SECRET;
  delete process.env.TRAINX_INTEGRATION_SERVICE_KEY;

  try {
    const client = new CareerGatewayClient({ serviceSecret: null });
    assert.rejects(
      async () => await client.getOutboundServiceToken(),
      /TRAINX_TO_CAREER_GATEWAY_SECRET is required but not configured/
    );
  } finally {
    if (originalEnv1) process.env.TRAINX_TO_CAREER_GATEWAY_SECRET = originalEnv1;
    if (originalEnv2) process.env.CAREER_GATEWAY_OUTBOUND_SECRET = originalEnv2;
    if (originalEnv3) process.env.TRAINX_INTEGRATION_SERVICE_KEY = originalEnv3;
  }
});

await asyncTest('SEC-02: Outbound client generates valid HS256 JWT when configured', async () => {
  const client = new CareerGatewayClient({ serviceSecret: 'test_super_secret_key_12345' });
  const token = await client.getOutboundServiceToken();
  const decoded = jwt.verify(token, 'test_super_secret_key_12345', { algorithms: ['HS256'] });
  assert.strictEqual(decoded.iss, 'trainx');
  assert.strictEqual(decoded.aud, 'career-gateway');
  assert.strictEqual(decoded.sub, 'trainx-export-service');
  assert.strictEqual(decoded.scope, 'training_sync');
});

// ============================================================================
// 2. SEC-04: X-Service-Key Header Bypass Removed
// ============================================================================
test('SEC-04: Inbound middleware rejects X-Service-Key header without Bearer JWT', () => {
  process.env.CAREER_GATEWAY_SERVICE_SECRET = 'inbound_secret_key_67890';
  const req = {
    headers: {
      'x-service-key': 'inbound_secret_key_67890',
    },
  };
  const res = mockResponse();
  let nextCalled = false;
  authenticateCareerGatewayService(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false, 'Middleware must not allow X-Service-Key bypass');
  assert.strictEqual(res.statusCode, 401, 'Should return HTTP 401 Unauthorized');
  assert.match(res.body.message, /Missing Career Gateway service authorization Bearer token/);
});

// ============================================================================
// 3. SEC-03: Mandatory & Strict JWT Subject Validation
// ============================================================================
test('SEC-03: Inbound middleware rejects JWT missing "sub" claim', () => {
  const secret = 'inbound_secret_key_67890';
  process.env.CAREER_GATEWAY_SERVICE_SECRET = secret;

  // Sign token without sub claim
  const tokenWithoutSub = jwt.sign(
    {
      iss: 'career-gateway',
      aud: 'trainx',
      scope: 'student_sync',
    },
    secret,
    { algorithm: 'HS256' }
  );

  const req = {
    headers: {
      authorization: `Bearer ${tokenWithoutSub}`,
    },
  };
  const res = mockResponse();
  let nextCalled = false;
  authenticateCareerGatewayService(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 403);
  assert.match(res.body.message, /Invalid or missing service token subject/);
});

test('SEC-03: Inbound middleware rejects JWT with incorrect "sub" claim', () => {
  const secret = 'inbound_secret_key_67890';
  process.env.CAREER_GATEWAY_SERVICE_SECRET = secret;

  const tokenWithWrongSub = jwt.sign(
    {
      iss: 'career-gateway',
      aud: 'trainx',
      sub: 'wrong-service-actor',
      scope: 'student_sync',
    },
    secret,
    { algorithm: 'HS256' }
  );

  const req = {
    headers: {
      authorization: `Bearer ${tokenWithWrongSub}`,
    },
  };
  const res = mockResponse();
  let nextCalled = false;
  authenticateCareerGatewayService(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 403);
  assert.match(res.body.message, /Invalid or missing service token subject/);
});

test('SEC-03: Inbound middleware accepts valid Career Gateway service JWT', () => {
  const secret = 'inbound_secret_key_67890';
  process.env.CAREER_GATEWAY_SERVICE_SECRET = secret;

  const validToken = jwt.sign(
    {
      iss: 'career-gateway',
      aud: 'trainx',
      sub: 'career-gateway-integration-service',
      scope: 'student_sync',
    },
    secret,
    { algorithm: 'HS256' }
  );

  const req = {
    headers: {
      authorization: `Bearer ${validToken}`,
    },
  };
  const res = mockResponse();
  let nextCalled = false;
  authenticateCareerGatewayService(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true, 'Valid token should pass authentication');
  assert.strictEqual(req.serviceAuth.sub, 'career-gateway-integration-service');
});

// ============================================================================
// 4. SEC-05: Rate Limiting Middleware Configured
// ============================================================================
test('SEC-05: Rate limiters export valid Express middleware instances', () => {
  assert.strictEqual(typeof activationRateLimiter, 'function');
  assert.strictEqual(typeof m2mProvisioningRateLimiter, 'function');
});

// ============================================================================
// 5. TENANT-02: Tenant-Scoped Socket Rooms
// ============================================================================
test('TENANT-02: Room name includes college prefix and session identifier', () => {
  const roomCollege10 = getInterviewRoom(10, 'sess-12345');
  assert.strictEqual(roomCollege10, 'college:10:session:sess-12345');

  const roomCollege25 = getInterviewRoom(25, 'sess-12345');
  assert.strictEqual(roomCollege25, 'college:25:session:sess-12345');

  assert.notStrictEqual(roomCollege10, roomCollege25, 'Different colleges must have distinct room keys');

  const roomGlobal = getInterviewRoom(null, 'sess-999');
  assert.strictEqual(roomGlobal, 'college:global:session:sess-999');
});

// ============================================================================
// 6. SYNC-01: Drift-Proof Scheduler Info and State Tracking
// ============================================================================
test('SYNC-01: Timezone info accurately formats Asia/Kolkata date and hour', () => {
  const info = getKolkataTimeInfo();
  assert(info.dateStr.match(/^\d{4}-\d{2}-\d{2}$/));
  assert(typeof info.hour === 'number' && info.hour >= 0 && info.hour <= 23);
  assert(typeof info.minute === 'number' && info.minute >= 0 && info.minute <= 59);
});

test('SYNC-01: Scheduler tracks lastRunDate state correctly', () => {
  setLastRunDate('2026-11-07');
  assert.strictEqual(getLastRunDate(), '2026-11-07');
});

// ============================================================================
// 7. TENANT-03: Strict College Context on Student Dashboard
// ============================================================================
await asyncTest('TENANT-03: getStudentDashboard returns HTTP 403 when user lacks collegeId', async () => {
  const req = {
    user: {
      userId: 999,
      role: 'student',
      // collegeId intentionally omitted
    },
    query: {},
  };
  const res = mockResponse();
  let nextCalled = false;

  await getStudentDashboard(req, res, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, false);
  assert.strictEqual(res.statusCode, 403, 'Should reject with HTTP 403 Forbidden');
  assert.match(res.body.message, /Access denied: User is not associated with any college tenant/);
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log('-------------------------------------------------------------');
console.log(`Results: ${passed} Passed, ${failed} Failed`);
console.log('-------------------------------------------------------------');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL REMEDIATION VERIFICATION TESTS PASSED!');
}

