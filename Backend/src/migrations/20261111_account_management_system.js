import { pool, query } from '../config/db.js';

/**
 * Migration: 20261111_account_management_system.js
 * Description: Enhances secure_codes and users tables for cryptographic code activation,
 *              delivery tracking, two-stage approval, and forced password changes.
 * Fully idempotent across all MySQL and MariaDB versions.
 */
export async function up() {
  console.log('[Migration] Applying account management system schema extensions...');

  // 1. Extend `secure_codes` table
  try {
    const [scCols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'secure_codes'`
    );
    const existingScCols = new Set((scCols || []).map(c => c.COLUMN_NAME.toLowerCase()));

    if (!existingScCols.has('email')) {
      await query('ALTER TABLE secure_codes ADD COLUMN email VARCHAR(255) NULL');
      console.log('[Migration] Added column `email` to secure_codes.');
    }
    if (!existingScCols.has('email_delivery_status')) {
      await query("ALTER TABLE secure_codes ADD COLUMN email_delivery_status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending'");
      console.log('[Migration] Added column `email_delivery_status` to secure_codes.');
    }
    if (!existingScCols.has('invitation_id')) {
      await query('ALTER TABLE secure_codes ADD COLUMN invitation_id VARCHAR(100) NULL');
      console.log('[Migration] Added column `invitation_id` to secure_codes.');
    }
  } catch (err) {
    console.error('[Migration Error] Failed extending secure_codes table:', err.message);
    throw err;
  }

  // 2. Extend `users` table
  try {
    const [userCols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );
    const existingUserCols = new Set((userCols || []).map(c => c.COLUMN_NAME.toLowerCase()));

    if (!existingUserCols.has('force_password_change')) {
      await query('ALTER TABLE users ADD COLUMN force_password_change TINYINT(1) DEFAULT 0');
      console.log('[Migration] Added column `force_password_change` to users.');
    }
    if (!existingUserCols.has('email_delivery_status')) {
      await query("ALTER TABLE users ADD COLUMN email_delivery_status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending'");
      console.log('[Migration] Added column `email_delivery_status` to users.');
    }
    if (!existingUserCols.has('activation_status')) {
      await query("ALTER TABLE users ADD COLUMN activation_status ENUM('pending', 'completed') DEFAULT 'pending'");
      console.log('[Migration] Added column `activation_status` to users.');
    }
    if (!existingUserCols.has('approval_status')) {
      await query("ALTER TABLE users ADD COLUMN approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
      console.log('[Migration] Added column `approval_status` to users.');
    }
  } catch (err) {
    console.error('[Migration Error] Failed extending users table:', err.message);
    throw err;
  }

  // 3. Ensure indexes exist safely
  try {
    const [scIndexes] = await pool.query(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'secure_codes'`
    );
    const existingScIndexes = new Set((scIndexes || []).map(i => i.INDEX_NAME.toLowerCase()));

    if (!existingScIndexes.has('idx_secure_codes_email')) {
      await query('CREATE INDEX idx_secure_codes_email ON secure_codes (email)');
      console.log('[Migration] Created index `idx_secure_codes_email` on secure_codes.');
    }
  } catch (err) {
    console.warn('[Migration Warning] Index on secure_codes creation note:', err.message);
  }

  try {
    const [userIndexes] = await pool.query(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );
    const existingUserIndexes = new Set((userIndexes || []).map(i => i.INDEX_NAME.toLowerCase()));

    if (!existingUserIndexes.has('idx_users_approval_status')) {
      await query('CREATE INDEX idx_users_approval_status ON users (approval_status)');
      console.log('[Migration] Created index `idx_users_approval_status` on users.');
    }
    if (!existingUserIndexes.has('idx_users_force_pwd')) {
      await query('CREATE INDEX idx_users_force_pwd ON users (force_password_change)');
      console.log('[Migration] Created index `idx_users_force_pwd` on users.');
    }
  } catch (err) {
    console.warn('[Migration Warning] Index on users creation note:', err.message);
  }

  // 4. Backfill existing active accounts so their approval and activation statuses are accurate
  try {
    await query(`
      UPDATE users 
      SET activation_status = 'completed',
          approval_status = CASE 
            WHEN is_approved = 1 THEN 'approved' 
            ELSE 'pending' 
          END
      WHERE is_active = 1 AND password_hash IS NOT NULL AND TRIM(password_hash) != ''
    `);
    console.log('[Migration] Backfilled activation and approval statuses for existing active users.');
  } catch (err) {
    console.warn('[Migration Warning] Status backfill note:', err.message);
  }

  console.log('[Migration] ✅ Account management system migration completed successfully.');
}

export async function down() {
  console.log('[Migration Rollback] Rolling back account management system schema extensions...');
  try {
    await query('ALTER TABLE users DROP COLUMN force_password_change, DROP COLUMN email_delivery_status, DROP COLUMN activation_status, DROP COLUMN approval_status');
    await query('ALTER TABLE secure_codes DROP COLUMN email, DROP COLUMN email_delivery_status, DROP COLUMN invitation_id');
  } catch (err) {
    console.warn('[Migration Rollback Warning]:', err.message);
  }
}

