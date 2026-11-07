import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { query } from '../../../../config/db.js';
import { sendGenericEmail } from '../../../../services/email.service.js';
import { invalidateUserAuthCache } from '../../../../middleware/auth.middleware.js';

const ACTIVATION_TOKEN_EXPIRY_HOURS = 72; // 3 days

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
 */
export async function consumeAccountActivation(rawToken, newPassword) {
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Activation token is required.');
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  const [record] = await query(
    `SELECT a.id, a.user_id, a.expires_at, a.consumed_at, u.email, u.name
     FROM account_activations a
     JOIN users u ON u.id = a.user_id
     WHERE a.token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );

  if (!record) {
    throw new Error('Invalid or unknown activation token.');
  }

  if (record.consumed_at) {
    throw new Error('This activation token has already been used. Please log in with your password.');
  }

  if (new Date(record.expires_at) < new Date()) {
    throw new Error('This activation token has expired. Please contact support or your administrator.');
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
