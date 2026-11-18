import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query, pool } from '../src/config/db.js';
import { getJwtSecret, JWT_ISSUER, JWT_AUDIENCE } from '../src/config/jwt.js';
import {
  authenticateToken,
  invalidateUserAuthCache,
  revokeUserAuthInCache,
  clearAllUserAuthCache,
} from '../src/middleware/auth.middleware.js';
import {
  createAccountActivation,
  consumeAccountActivation,
  resendAccountActivation,
} from '../src/modules/integrations/careerGateway/services/accountActivation.service.js';
import { provisionStudentFromCareerGateway } from '../src/modules/integrations/careerGateway/services/studentProvisioning.service.js';

test('Forensic Authentication & Activation Failure Verification Suite', async (t) => {
  // Setup test tenant and batch
  const batchRows = await query('SELECT id, college_id FROM batches LIMIT 1');
  const validBatchId = batchRows?.[0]?.id || 1;
  const testCollegeId = batchRows?.[0]?.college_id || 1;

  const testExternalCgId = Math.floor(800000 + Math.random() * 100000);
  const testEmail = `forensic_test_${testExternalCgId}@pvppcoe.ac.in`;

  let createdUserId = null;

  t.after(async () => {
    // Cleanup fixture
    if (createdUserId) {
      await query('DELETE FROM account_activations WHERE user_id = ?', [createdUserId]).catch(() => {});
      await query('DELETE FROM career_gateway_student_mappings WHERE trainx_user_id = ?', [createdUserId]).catch(() => {});
      await query('DELETE FROM students WHERE user_id = ?', [createdUserId]).catch(() => {});
      await query('DELETE FROM users WHERE id = ?', [createdUserId]).catch(() => {});
    }
    clearAllUserAuthCache();
    await pool.end();
  });

  // --------------------------------------------------------------------------
  // Scenario A Regression: Invalidate cache must NOT poison memory cache
  // --------------------------------------------------------------------------
  await t.test('Scenario A Regression: invalidateUserAuthCache deletes cache entry rather than poisoning with isActive: false', async () => {
    const dummyUserId = 999999;
    clearAllUserAuthCache();

    // Call invalidateUserAuthCache
    invalidateUserAuthCache(dummyUserId);

    // Call authenticateToken with mock req/res for dummyUserId
    let statusCode = null;
    let errorResponse = null;
    let nextCalled = false;

    const dummyToken = jwt.sign(
      { userId: dummyUserId, role: 'student', iss: JWT_ISSUER, aud: JWT_AUDIENCE },
      getJwtSecret(),
      { expiresIn: '1h' }
    );

    const mockReq = {
      headers: { authorization: `Bearer ${dummyToken}` },
    };
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        errorResponse = data;
        return this;
      },
    };
    const mockNext = () => {
      nextCalled = true;
    };

    await authenticateToken(mockReq, mockRes, mockNext);

    // Because dummyUserId does not exist in DB, it should report user does not exist, NOT "account deactivated or revoked"
    assert.equal(nextCalled, false);
    assert.equal(statusCode, 401);
    assert.match(errorResponse.message, /user account no longer exists/i);
    assert.doesNotMatch(errorResponse.message, /deactivated or revoked/i);
  });

  // --------------------------------------------------------------------------
  // Scenario A Regression: Account activation -> Immediate Login -> Protected Request succeeds
  // --------------------------------------------------------------------------
  await t.test('Scenario A Regression: Newly activated student can access protected endpoints without 2-second ejection', async () => {
    // 1. Provision student via Career Gateway
    const provisionResult = await provisionStudentFromCareerGateway({
      student_id: testExternalCgId,
      name: 'Forensic Audit Student',
      email: testEmail,
      college_id: testCollegeId,
      clg_id: `PVPP-${testExternalCgId}`,
    }, { triggerEmail: false });

    createdUserId = provisionResult.trainx_user_id;
    assert.ok(createdUserId);

    // 2. Fetch raw activation token directly from database
    const [actRow] = await query(
      'SELECT token_hash FROM account_activations WHERE user_id = ? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1',
      [createdUserId]
    );
    assert.ok(actRow?.token_hash, 'Activation record must exist in account_activations');

    // Generate a known raw token and hash for consumption test
    const { rawToken } = await createAccountActivation(createdUserId);

    // 3. Consume activation token (sets password, activates account, calls invalidateUserAuthCache)
    const activationResult = await consumeAccountActivation(rawToken, 'SecurePassword@2026');
    assert.equal(activationResult.userId, createdUserId);

    // 4. Verify user in database is now active
    const [userRow] = await query('SELECT is_active, password_hash FROM users WHERE id = ?', [createdUserId]);
    assert.equal(userRow.is_active, 1);
    assert.ok(userRow.password_hash);

    // 5. Generate authenticated student JWT as produced at login
    const studentToken = jwt.sign(
      { userId: createdUserId, role: 'student', collegeId: testCollegeId, iss: JWT_ISSUER, aud: JWT_AUDIENCE },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // 6. Simulate background API query (/student/profile) right after dashboard mounts
    let nextCalled = false;
    let statusCode = null;
    const mockReq = {
      headers: { authorization: `Bearer ${studentToken}` },
    };
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        return this;
      },
    };

    await authenticateToken(mockReq, mockRes, () => {
      nextCalled = true;
    });

    // CRITICAL: Request MUST succeed and call next() without being rejected with 401
    assert.equal(nextCalled, true, 'Student request must pass authentication middleware immediately after activation');
    assert.equal(statusCode, null, 'Must not return 401 or error');
    assert.equal(mockReq.user.id, createdUserId);
    assert.equal(mockReq.user.role, 'student');
  });

  // --------------------------------------------------------------------------
  // Scenario B Regression: Re-provisioning unactivated student issues fresh token
  // --------------------------------------------------------------------------
  await t.test('Scenario B Regression: Re-provisioning an existing unactivated student generates a fresh activation token', async () => {
    // Clear password to simulate unactivated student
    await query('UPDATE users SET password_hash = NULL, is_active = 0 WHERE id = ?', [createdUserId]);

    // Send provisioning request again (Scenario 1 idempotent update)
    const reprovisionResult = await provisionStudentFromCareerGateway({
      student_id: testExternalCgId,
      name: 'Forensic Audit Student (Reprovisioned)',
      email: testEmail,
      college_id: testCollegeId,
      clg_id: `PVPP-${testExternalCgId}`,
    }, { triggerEmail: false });

    assert.equal(reprovisionResult.trainx_user_id, createdUserId);

    // Check that an active, unconsumed token exists in account_activations
    const [latestAct] = await query(
      'SELECT id, consumed_at, expires_at FROM account_activations WHERE user_id = ? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1',
      [createdUserId]
    );
    assert.ok(latestAct, 'A fresh, unconsumed activation token must be generated upon re-provisioning');
    assert.equal(latestAct.consumed_at, null);
    assert.ok(new Date(latestAct.expires_at) > new Date());
  });

  // --------------------------------------------------------------------------
  // Scenario B Regression: Resending activation link works and invalidates old token
  // --------------------------------------------------------------------------
  await t.test('Scenario B Regression: Resend activation generates new token and invalidates old ones', async () => {
    const resendResult = await resendAccountActivation(testEmail);
    assert.equal(resendResult.success, true);

    // Verify older tokens for this user are now marked consumed
    const tokens = await query(
      'SELECT id, consumed_at FROM account_activations WHERE user_id = ? ORDER BY id DESC',
      [createdUserId]
    );
    assert.ok(tokens.length >= 2, 'Should have multiple token records');
    // The latest token must be unconsumed
    assert.equal(tokens[0].consumed_at, null, 'Latest token must be active');
    // Previous tokens must be consumed
    assert.ok(tokens[1].consumed_at !== null, 'Previous token must be invalidated (consumed_at set)');
  });

  // --------------------------------------------------------------------------
  // Token Security: Consumed token cannot be reused
  // --------------------------------------------------------------------------
  await t.test('Token Security: Reusing an already consumed token is rejected with explicit error', async () => {
    const { rawToken } = await createAccountActivation(createdUserId);

    // First consumption succeeds
    await consumeAccountActivation(rawToken, 'NewPassword#9999');

    // Second consumption must fail
    await assert.rejects(
      async () => {
        await consumeAccountActivation(rawToken, 'AnotherPassword#9999');
      },
      /already been used/i
    );
  });

  // --------------------------------------------------------------------------
  // Token Security: Unknown/tampered token is rejected
  // --------------------------------------------------------------------------
  await t.test('Token Security: Unknown or tampered token throws "Invalid or unknown activation token."', async () => {
    await assert.rejects(
      async () => {
        await consumeAccountActivation('completely_invalid_random_token_1234567890abcdef', 'ValidPass@123');
      },
      /Invalid or unknown activation token/i
    );
  });

  // --------------------------------------------------------------------------
  // Revocation Security: revokeUserAuthInCache correctly blocks revoked users
  // --------------------------------------------------------------------------
  await t.test('Revocation Security: revokeUserAuthInCache correctly locks out revoked student', async () => {
    revokeUserAuthInCache(createdUserId);

    const studentToken = jwt.sign(
      { userId: createdUserId, role: 'student', collegeId: testCollegeId, iss: JWT_ISSUER, aud: JWT_AUDIENCE },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    let nextCalled = false;
    let statusCode = null;
    let errorResponse = null;

    const mockReq = {
      headers: { authorization: `Bearer ${studentToken}` },
    };
    const mockRes = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(data) {
        errorResponse = data;
        return this;
      },
    };

    await authenticateToken(mockReq, mockRes, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false, 'Revoked user must be rejected by middleware');
    assert.equal(statusCode, 401);
    assert.match(errorResponse.message, /deactivated or revoked/i);
  });
});

