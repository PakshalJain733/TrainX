import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../../../../config/db.js';
import { sendGenericEmail, sendStaffActivationEmail } from '../../../../services/email.service.js';
import { invalidateUserAuthCache } from '../../../../middleware/auth.middleware.js';

const ACTIVATION_TOKEN_EXPIRY_HOURS = 72; // 3 days

const isFlagEnabled = (val) => val === 1 || val === true || String(val) === '1';

const isAccountAlreadyActivated = (user) => Boolean(
  user &&
  isFlagEnabled(user.is_active) &&
  isFlagEnabled(user.is_verified) &&
  user.password_hash &&
  String(user.password_hash).trim().length > 0
);

/**
 * Generates a cryptographically random, single-use activation token for a student,
 * hashes it using SHA-256 for secure storage, and records it in `account_activations`.
 * Accepts optional transaction connection `conn` for transactional atomicity (DATA-02).
 */
export async function createAccountActivation(userId, options = {}, conn = null) {
  const executeQuery = conn
    ? async (sql, params) => {
        const safeParams = (params || []).map((p) => (p === undefined ? null : p));
        const [results] = await conn.execute(sql, safeParams);
        return results;
      }
    : query;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + ACTIVATION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // Invalidate any existing unused tokens for this user
  await executeQuery(
    'UPDATE account_activations SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL',
    [userId]
  );

  await executeQuery(
    'INSERT INTO account_activations (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  );

  return {
    rawToken,
    expiresAt,
  };
}

/**
 * Dispatches an account activation email to a provisioned student.
 * Non-blocking: will log errors rather than throwing, to protect API transaction.
 */
export async function sendActivationEmail({ to, name, rawToken }) {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://trainingportal.getflytechnologies.com').split(',')[0].trim();
  const activationLink = `${frontendUrl}/activate-account?token=${rawToken}&email=${encodeURIComponent(to)}`;

  const subject = 'Activate Your TrainX Training Portal Account';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #4f46e5; margin: 0;">Welcome to TrainX</h2>
        <p style="color: #64748b; font-size: 14px;">Campus Training & Placement Readiness Platform</p>
      </div>
      <div style="background-color: #f8fafc; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
        <p style="font-size: 16px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">
          Your training account has been provisioned through <strong>Career Gateway</strong>. 
          To start your technical assessments, interview simulations, and training batches, please activate your account and set your private password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${activationLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Activate My Account
          </a>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
          This link will expire in ${ACTIVATION_TOKEN_EXPIRY_HOURS} hours. If you did not expect this invitation, please contact your college placement coordinator.
        </p>
        <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">
          Or copy this URL into your browser:<br/>
          <a href="${activationLink}" style="color: #6366f1;">${activationLink}</a>
        </p>
      </div>
    </div>
  `;

  try {
    await sendGenericEmail({ to, subject, html });
    console.log(`[Activation] Activation email dispatched to ${to}`);
  } catch (err) {
    console.warn(`[Activation Notice] Email dispatch skipped/failed for ${to}: ${err.message}`);
  }
}

/**
 * Validates a raw activation token and activates the account by setting the password.
 * Accepts optional student email for fallback diagnostic validation and user guidance.
 */
export async function consumeAccountActivation(rawToken, newPassword, email = null) {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Activation token is required.');
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const cleanedToken = rawToken.trim().replace(/[.,;!?#]+$/, '');
  const tokenHash = crypto.createHash('sha256').update(cleanedToken).digest('hex');

  const [record] = await query(
    `SELECT a.id, a.user_id, a.expires_at, a.consumed_at, u.email, u.name, u.is_active, u.is_verified, u.password_hash
     FROM account_activations a
     JOIN users u ON u.id = a.user_id
     WHERE a.token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );

  if (!record) {
    // If student email is provided, check database state to provide specific actionable guidance
    if (email && typeof email === 'string' && email.includes('@')) {
      const cleanEmail = email.trim().toLowerCase();
      const [userRecord] = await query(
        `SELECT id, email, is_active, is_verified, password_hash FROM users WHERE LOWER(email) = ? LIMIT 1`,
        [cleanEmail]
      );

      if (userRecord) {
        if (isAccountAlreadyActivated(userRecord)) {
          throw new Error('Your account is already activated. Please sign in directly with your password.');
        }

        const activations = await query(
          `SELECT id, expires_at, consumed_at, created_at 
           FROM account_activations 
           WHERE user_id = ? 
           ORDER BY id DESC LIMIT 1`,
          [userRecord.id]
        );

        if (activations && activations.length > 0) {
          const latest = activations[0];
          if (latest.consumed_at) {
            throw new Error('This activation token has already been used or superseded. Please request a fresh activation link below.');
          }
          if (new Date(latest.expires_at) < new Date()) {
            throw new Error('This activation token has expired. Please request a fresh activation link below.');
          }
          throw new Error('This activation link is invalid or has been superseded. Please request a fresh activation link below.');
        }
      }
    }
    throw new Error('Invalid or unknown activation token. Please request a fresh activation link below.');
  }

  if (record.consumed_at) {
    throw new Error('This activation token has already been used. Please log in with your password.');
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new Error('This activation token has expired. Please request a fresh activation link below.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  // Mark token consumed and activate user account
  await query('UPDATE account_activations SET consumed_at = NOW() WHERE id = ?', [record.id]);
  await query(
    `UPDATE users 
     SET password_hash = ?, is_active = 1, is_verified = 1, is_approved = 1, updated_at = NOW() 
     WHERE id = ?`,
    [passwordHash, record.user_id]
  );

  // Invalidate any negative auth cache so newly activated user can log in immediately
  invalidateUserAuthCache(record.user_id);

  return {
    userId: record.user_id,
    email: record.email,
    name: record.name,
    message: 'Account successfully activated! You can now log in.',
  };
}

/**
 * Resends an activation email to a provisioned student whose token expired or was lost.
 * Constant-time / generic response prevents user enumeration.
 */
export async function resendAccountActivation(email) {
  const genericMessage = 'If an eligible pending account exists for this email, an activation link has been sent.';
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { success: true, message: genericMessage };
  }

  const cleanEmail = email.trim().toLowerCase();
  const [user] = await query(
    `SELECT u.id, u.name, u.email, u.role, u.source_system, u.password_hash, u.is_active, u.is_verified
     FROM users u
     WHERE LOWER(u.email) = ?
     LIMIT 1`,
    [cleanEmail]
  );

  // If user does not exist or has already activated via email and set their password, return generic message
  if (!user || isAccountAlreadyActivated(user)) {
    return { success: true, message: genericMessage };
  }

  // Create fresh activation token (invalidates older unused tokens)
  const { rawToken } = await createAccountActivation(user.id);

  // Dispatch appropriate activation email based on role
  const isStaff = user.role && user.role !== 'student' && !String(user.role).toLowerCase().includes('student');
  if (isStaff) {
    await sendStaffActivationEmail({ to: user.email, name: user.name, role: user.role, rawToken }).catch((err) => {
      console.warn(`[Activation Notice] Resend staff activation email failed for ${cleanEmail}: ${err.message}`);
    });
  } else {
    await sendActivationEmail({ to: user.email, name: user.name, rawToken }).catch((err) => {
      console.warn(`[Activation Notice] Resend email failed for ${cleanEmail}: ${err.message}`);
    });
  }

  return {
    success: true,
    message: genericMessage,
  };
}
