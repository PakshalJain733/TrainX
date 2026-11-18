import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, pool } from '../src/config/db.js';
import {
  provisionStudentFromCareerGateway,
  revokeStudentEligibility,
  resolveCollegeTenant,
} from '../src/modules/integrations/careerGateway/services/studentProvisioning.service.js';
import {
  createAccountActivation,
  consumeAccountActivation,
  resendAccountActivation,
} from '../src/modules/integrations/careerGateway/services/accountActivation.service.js';
import { collectTrainingExportRecords } from '../src/modules/integrations/careerGateway/services/trainingDataExport.service.js';
import { CareerGatewayClient } from '../src/modules/integrations/careerGateway/client/careerGatewayClient.js';
import { authenticateCareerGatewayService } from '../src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js';

const S2S_SECRET = process.env.TRAINX_INTEGRATION_SECRET || process.env.CAREER_GATEWAY_SERVICE_SECRET || 'career_gateway_trainx_s2s_secret_key_2026';

// ============================================================================
// TEST GROUP 1: ACCOUNT ACTIVATION WORKFLOW & SECURITY
// ============================================================================
test('Group 1: Account Activation Tests', async (t) => {
  const externalStudentId = Math.floor(100000 + Math.random() * 899999);
  const studentEmail = `act_test_${externalStudentId}@somaiya.edu`;

  // Provision student
  const provisionResult = await provisionStudentFromCareerGateway({
    student_id: externalStudentId,
    clg_id: `SOM-${externalStudentId}`,
    name: 'Activation Tester',
    email: studentEmail,
    college_id: 9,
    eligible: true,
  }, { triggerEmail: false });

  const userId = provisionResult.trainx_user_id;

  await t.test('1.1: Token generation generates 32-byte cryptographic token and SHA-256 hash', async () => {
    const { rawToken, expiresAt } = await createAccountActivation(userId);
    assert.equal(typeof rawToken, 'string');
    assert.equal(rawToken.length, 64, '32 bytes hex encoded should be 64 characters');
    assert.ok(new Date(expiresAt) > new Date());

    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const [row] = await query('SELECT * FROM account_activations WHERE token_hash = ?', [expectedHash]);
    assert.ok(row, 'Hashed token must exist in database');
    assert.equal(row.user_id, userId);
    assert.equal(row.consumed_at, null);
  });

  await t.test('1.2: Password validation rejects weak passwords (< 6 chars)', async () => {
    const { rawToken } = await createAccountActivation(userId);
    await assert.rejects(
      async () => {
        await consumeAccountActivation(rawToken, '12345');
      },
      /at least 6 characters/i
    );
  });

  await t.test('1.3: Valid token consumption activates user and sets password', async () => {
    const { rawToken } = await createAccountActivation(userId);
    const result = await consumeAccountActivation(rawToken, 'SecureStudentPass@2026');

    assert.equal(result.userId, userId);
    assert.equal(result.email, studentEmail);

    const [user] = await query('SELECT is_active, is_verified, password_hash FROM users WHERE id = ?', [userId]);
    assert.equal(user.is_active, 1);
    assert.equal(user.is_verified, 1);
    assert.ok(user.password_hash);
    const valid = await bcrypt.compare('SecureStudentPass@2026', user.password_hash);
    assert.equal(valid, true, 'User should be able to authenticate with new password');

    // Token must be marked consumed
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const [tokenRow] = await query('SELECT consumed_at FROM account_activations WHERE token_hash = ?', [expectedHash]);
    assert.ok(tokenRow.consumed_at, 'Token must be marked consumed');
  });

  await t.test('1.4: Reused/consumed token is rejected', async () => {
    const { rawToken } = await createAccountActivation(userId);
    await consumeAccountActivation(rawToken, 'FirstPassword@2026');

    await assert.rejects(
      async () => {
        await consumeAccountActivation(rawToken, 'SecondPassword@2026');
      },
      /already been used/i
    );
  });

  await t.test('1.5: Expired token is rejected', async () => {
    const { rawToken } = await createAccountActivation(userId);
    const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    // Artificially expire the token
    await query('UPDATE account_activations SET expires_at = DATE_SUB(NOW(), INTERVAL 1 HOUR) WHERE token_hash = ?', [expectedHash]);

    await assert.rejects(
      async () => {
        await consumeAccountActivation(rawToken, 'ExpiredPassword@2026');
      },
      /has expired/i
    );
  });

  await t.test('1.6: Invalid or unknown token is rejected', async () => {
    await assert.rejects(
      async () => {
        await consumeAccountActivation('nonexistenttoken00000000000000000000000000000000000000000000000000', 'Password@2026');
      },
      /invalid or unknown/i
    );
  });

  await t.test('1.7: Resend activation email invalidates older tokens and safely handles non-existent users', async () => {
    // Reset user to unactivated
    await query('UPDATE users SET password_hash = NULL, is_active = 0 WHERE id = ?', [userId]);

    const resendRes = await resendAccountActivation(studentEmail);
    assert.equal(resendRes.success, true);

    // Verify older tokens for this user are marked consumed
    const [activeTokens] = await query(
      'SELECT COUNT(*) as count FROM account_activations WHERE user_id = ? AND consumed_at IS NULL',
      [userId]
    );
    assert.equal(activeTokens.count, 1, 'Should have exactly 1 active activation token after resend');

    // Unknown email returns generic success (prevents user enumeration)
    const unknownRes = await resendAccountActivation('unknown_user_99999@test.edu');
    assert.equal(unknownRes.success, true);
    assert.ok(unknownRes.message.includes('If an eligible pending account exists'));
  });

  // Cleanup
  await query('DELETE FROM account_activations WHERE user_id = ?', [userId]);
  await query('DELETE FROM students WHERE user_id = ?', [userId]);
  await query('DELETE FROM users WHERE id = ?', [userId]);
});

// ============================================================================
// TEST GROUP 2: COLLEGE TENANT RESOLUTION & ISOLATION
// ============================================================================
test('Group 2: Tenant Isolation & Normalization Tests', async (t) => {
  await t.test('2.1: Resolves via dedicated career_gateway_college_id slug', async () => {
    const collegeId = await resolveCollegeTenant({ career_gateway_college_id: 'col_somaiya_eng_01' });
    assert.equal(collegeId, 9);
  });

  await t.test('2.2: Resolves via dedicated numeric college_id', async () => {
    const collegeId = await resolveCollegeTenant({ college_id: 9 });
    assert.equal(collegeId, 9);
  });

  await t.test('2.3: Rejects unknown college with HTTP 422', async () => {
    await assert.rejects(
      async () => {
        await resolveCollegeTenant({ college_id: 'non_existent_college_slug_999' });
      },
      (err) => {
        assert.equal(err.statusCode, 422);
        assert.ok(/unresolved college tenant/i.test(err.message));
        return true;
      }
    );
  });

  await t.test('2.4: Rejects missing college with HTTP 422', async () => {
    await assert.rejects(
      async () => {
        await resolveCollegeTenant({});
      },
      (err) => {
        assert.equal(err.statusCode, 422);
        return true;
      }
    );
  });

  await t.test('2.5: Rejects clg_id used as college identifier with HTTP 422', async () => {
    // clg_id is the student registration number, NEVER the college tenant ID!
    await assert.rejects(
      async () => {
        await resolveCollegeTenant({ clg_id: 'SOMAIYA-12345' });
      },
      (err) => {
        assert.equal(err.statusCode, 422);
        return true;
      }
    );
  });
});

// ============================================================================
// TEST GROUP 3: PROVISIONING & IDENTITY INTEGRITY
// ============================================================================
test('Group 3: Provisioning & Identity Integrity Tests', async (t) => {
  const externalStudentId = Math.floor(100000 + Math.random() * 899999);
  const studentEmail = `prov_test_${externalStudentId}@somaiya.edu`;
  const clgId = `PRN-${externalStudentId}`;

  let createdUserId = null;

  await t.test('3.1: New student creation sets inactive state and NULL password', async () => {
    const result = await provisionStudentFromCareerGateway({
      student_id: externalStudentId,
      clg_id: clgId,
      name: 'Provision Integrity Test',
      email: studentEmail,
      college_id: 9,
      eligible: true,
    }, { triggerEmail: false });

    assert.equal(result.status, 'created');
    assert.equal(result.student_id, externalStudentId);
    assert.ok(result.trainx_user_id);
    createdUserId = result.trainx_user_id;

    const [user] = await query('SELECT * FROM users WHERE id = ?', [createdUserId]);
    assert.equal(user.role, 'student');
    assert.equal(user.source_system, 'career_gateway');
    assert.equal(user.career_gateway_student_id, externalStudentId);
    assert.equal(user.password_hash, null, 'Must have NULL password before activation');
    assert.equal(user.is_active, 0, 'Must be inactive before activation');
    assert.equal(user.is_verified, 0);

    const [student] = await query('SELECT * FROM students WHERE user_id = ?', [createdUserId]);
    assert.equal(student.clg_id, clgId);
  });

  await t.test('3.2: Repeated provisioning is idempotent and preserves identity', async () => {
    const updateResult = await provisionStudentFromCareerGateway({
      student_id: externalStudentId,
      clg_id: clgId,
      name: 'Provision Integrity Test Updated',
      email: studentEmail,
      college_id: 9,
      eligible: true,
    }, { triggerEmail: false });

    assert.equal(updateResult.status, 'updated');
    assert.equal(updateResult.trainx_user_id, createdUserId, 'Must retain original user ID');

    const [user] = await query('SELECT name FROM users WHERE id = ?', [createdUserId]);
    assert.equal(user.name, 'Provision Integrity Test Updated');
  });

  await t.test('3.3: Pre-existing TrainX account is reconciled without password overwrite', async () => {
    const preExistingExtId = Math.floor(100000 + Math.random() * 899999);
    const preExistingEmail = `pre_existing_${preExistingExtId}@somaiya.edu`;
    const dummyHash = '$2a$12$DummyExistingBcryptHash123456789012345678901234567890';

    const insert = await query(
      `INSERT INTO users (name, email, role, college_id, password_hash, is_active, is_verified)
       VALUES ('Pre-existing User', ?, 'student', 9, ?, 1, 1)`,
      [preExistingEmail, dummyHash]
    );
    const existingUserId = insert.insertId;

    const linkResult = await provisionStudentFromCareerGateway({
      student_id: preExistingExtId,
      name: 'Pre-existing User Linked',
      email: preExistingEmail,
      college_id: 9,
      eligible: true,
    }, { triggerEmail: false });

    assert.equal(linkResult.status, 'linked_existing_account');
    assert.equal(linkResult.trainx_user_id, existingUserId);

    const [linkedUser] = await query('SELECT password_hash, is_active, career_gateway_student_id FROM users WHERE id = ?', [existingUserId]);
    assert.equal(linkedUser.password_hash, dummyHash, 'Existing password must NOT be wiped');
    assert.equal(linkedUser.is_active, 1, 'Active status must be preserved');
    assert.equal(linkedUser.career_gateway_student_id, preExistingExtId);

    // Cleanup
    await query('DELETE FROM students WHERE user_id = ?', [existingUserId]);
    await query('DELETE FROM users WHERE id = ?', [existingUserId]);
  });

  // Cleanup
  if (createdUserId) {
    await query('DELETE FROM students WHERE user_id = ?', [createdUserId]);
    await query('DELETE FROM users WHERE id = ?', [createdUserId]);
  }
});

// ============================================================================
// TEST GROUP 4: S2S AUTHENTICATION & SECURITY
// ============================================================================
test('Group 4: S2S Authentication & Security Tests', async (t) => {
  const runAuthMiddleware = (authHeader) => {
    return new Promise((resolve) => {
      const req = {
        headers: {
          authorization: authHeader,
        },
      };
      let responseStatusCode = null;
      let responseBody = null;
      const res = {
        status(code) {
          responseStatusCode = code;
          return this;
        },
        json(body) {
          responseBody = body;
          resolve({ status: responseStatusCode, body, req });
        },
      };
      const next = () => {
        resolve({ status: 200, req, success: true });
      };
      authenticateCareerGatewayService(req, res, next);
    });
  };

  await t.test('4.1: Valid S2S token is accepted', async () => {
    const validToken = jwt.sign(
      {
        iss: 'career-gateway',
        aud: 'trainx',
        sub: 'career-gateway-integration-service',
        scope: 'student_sync',
      },
      S2S_SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const result = await runAuthMiddleware(`Bearer ${validToken}`);
    assert.equal(result.status, 200);
    assert.ok(result.success);
    assert.equal(result.req.serviceAuth.scope, 'student_sync');
  });

  await t.test('4.2: Invalid signature is rejected (401)', async () => {
    const badToken = jwt.sign(
      {
        iss: 'career-gateway',
        aud: 'trainx',
        sub: 'career-gateway-integration-service',
        scope: 'student_sync',
      },
      'wrong_tampered_secret_xyz',
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const result = await runAuthMiddleware(`Bearer ${badToken}`);
    assert.equal(result.status, 401);
  });

  await t.test('4.3: Wrong issuer is rejected (401)', async () => {
    const wrongIss = jwt.sign(
      {
        iss: 'malicious-gateway',
        aud: 'trainx',
        sub: 'career-gateway-integration-service',
        scope: 'student_sync',
      },
      S2S_SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const result = await runAuthMiddleware(`Bearer ${wrongIss}`);
    assert.equal(result.status, 401);
  });

  await t.test('4.4: Wrong audience is rejected (401)', async () => {
    const wrongAud = jwt.sign(
      {
        iss: 'career-gateway',
        aud: 'wrong-audience',
        sub: 'career-gateway-integration-service',
        scope: 'student_sync',
      },
      S2S_SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const result = await runAuthMiddleware(`Bearer ${wrongAud}`);
    assert.equal(result.status, 401);
  });

  await t.test('4.5: Wrong subject is rejected (403)', async () => {
    const wrongSub = jwt.sign(
      {
        iss: 'career-gateway',
        aud: 'trainx',
        sub: 'unauthorized-subject',
        scope: 'student_sync',
      },
      S2S_SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const result = await runAuthMiddleware(`Bearer ${wrongSub}`);
    assert.equal(result.status, 403);
  });

  await t.test('4.6: Wrong scope is rejected (403)', async () => {
    const wrongScope = jwt.sign(
      {
        iss: 'career-gateway',
        aud: 'trainx',
        sub: 'career-gateway-integration-service',
        scope: 'read_only',
      },
      S2S_SECRET,
      { algorithm: 'HS256', expiresIn: '15m' }
    );

    const result = await runAuthMiddleware(`Bearer ${wrongScope}`);
    assert.equal(result.status, 403);
  });

  await t.test('4.7: Expired token is rejected (401)', async () => {
    const expiredToken = jwt.sign(
      {
        iss: 'career-gateway',
        aud: 'trainx',
        sub: 'career-gateway-integration-service',
        scope: 'student_sync',
      },
      S2S_SECRET,
      { algorithm: 'HS256', expiresIn: '-1s' }
    );

    const result = await runAuthMiddleware(`Bearer ${expiredToken}`);
    assert.equal(result.status, 401);
    assert.ok(/expired/i.test(result.body.message));
  });

  await t.test('4.8: Outbound token generation produces valid token with training_sync scope', async () => {
    const client = new CareerGatewayClient({
      serviceSecret: S2S_SECRET,
    });
    const token = await client.getOutboundServiceToken();
    assert.ok(token);

    const decoded = jwt.verify(token, S2S_SECRET, {
      algorithms: ['HS256'],
      issuer: 'trainx',
      audience: 'career-gateway',
    });
    assert.equal(decoded.sub, 'trainx-export-service');
    assert.equal(decoded.scope, 'training_sync');
    assert.ok(decoded.jti);
  });
});

// ============================================================================
// TEST GROUP 5: TRAINING DATA EXPORT (6 CATEGORIES & TENANT ENVELOPE)
// ============================================================================
test('Group 5: Training Data Export Tests', async (t) => {
  await t.test('5.1: Export records include all 6 distinct categories', async () => {
    const exportResult = await collectTrainingExportRecords({ limit: 10 });
    assert.ok(exportResult.data);

    const expectedCategories = ['batches', 'sessions', 'attendance', 'assessments', 'assessment_results', 'student_progress'];
    for (const cat of expectedCategories) {
      assert.ok(Array.isArray(exportResult.data[cat]), `Category ${cat} must be an array`);
    }
  });

  await t.test('5.2: Export metadata resolves non-null external tenant identifier', async () => {
    const exportResult = await collectTrainingExportRecords({ collegeId: 9, limit: 10 });
    assert.ok(exportResult.resolvedCollegeId, 'Resolved college ID must not be null');
    assert.equal(exportResult.resolvedCollegeId, 'col_somaiya_eng_01');
  });
});

// ============================================================================
// TEST GROUP 6: REVOCATION & REACTIVATION LIFECYCLE
// ============================================================================
test('Group 6: Revocation & Reactivation Lifecycle Tests', async (t) => {
  const externalStudentId = Math.floor(100000 + Math.random() * 899999);
  const studentEmail = `rev_test_${externalStudentId}@somaiya.edu`;

  // 1. Provision & Activate
  const prov = await provisionStudentFromCareerGateway({
    student_id: externalStudentId,
    clg_id: `REV-${externalStudentId}`,
    name: 'Revocation LifeCycle Student',
    email: studentEmail,
    college_id: 9,
    eligible: true,
  }, { triggerEmail: false });

  const userId = prov.trainx_user_id;
  const { rawToken } = await createAccountActivation(userId);
  await consumeAccountActivation(rawToken, 'LifecyclePassword@2026');

  const [activeUser] = await query('SELECT is_active FROM users WHERE id = ?', [userId]);
  assert.equal(activeUser.is_active, 1);

  // 2. Revoke eligibility (deactivate)
  const revokeRes = await revokeStudentEligibility(externalStudentId, 'Opted out of placement');
  assert.equal(revokeRes.status, 'revoked');

  const [revokedUser] = await query('SELECT is_active, password_hash FROM users WHERE id = ?', [userId]);
  assert.equal(revokedUser.is_active, 0, 'Revoked student must have is_active = 0');
  assert.ok(revokedUser.password_hash, 'Password hash must NOT be deleted upon revocation');

  // Verify historical records intact in students table
  const [studentRow] = await query('SELECT id, user_id FROM students WHERE user_id = ?', [userId]);
  assert.ok(studentRow, 'Student profile record must be preserved for history');

  // 3. Reactivate via provisioning
  const reactivateRes = await provisionStudentFromCareerGateway({
    student_id: externalStudentId,
    clg_id: `REV-${externalStudentId}`,
    name: 'Revocation LifeCycle Student Reactivated',
    email: studentEmail,
    college_id: 9,
    eligible: true,
  }, { triggerEmail: false });

  assert.equal(reactivateRes.status, 'reactivated');
  assert.equal(reactivateRes.trainx_user_id, userId, 'User ID must be preserved on reactivation');

  const [reactivatedUser] = await query('SELECT is_active, password_hash FROM users WHERE id = ?', [userId]);
  assert.equal(reactivatedUser.is_active, 1, 'Reactivated user must be active');
  assert.equal(reactivatedUser.password_hash, revokedUser.password_hash, 'Original password must remain functional');

  // Cleanup
  await query('DELETE FROM account_activations WHERE user_id = ?', [userId]);
  await query('DELETE FROM students WHERE user_id = ?', [userId]);
  await query('DELETE FROM users WHERE id = ?', [userId]);
});

test.after(async () => {
  await pool.end();
});

