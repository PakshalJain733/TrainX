import { pool, query } from '../config/db.js';

export async function up() {
  console.log('[Migration] Removing 2FA/TOTP columns from users table...');
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );
    const existingCols = new Set((cols || []).map(c => c.COLUMN_NAME.toLowerCase()));

    if (existingCols.has('two_factor_secret')) {
      await query('ALTER TABLE users DROP COLUMN two_factor_secret');
      console.log('[Migration] Dropped column two_factor_secret from users.');
    }
    if (existingCols.has('two_factor_enabled')) {
      await query('ALTER TABLE users DROP COLUMN two_factor_enabled');
      console.log('[Migration] Dropped column two_factor_enabled from users.');
    }
    if (existingCols.has('two_factor_reset')) {
      await query('ALTER TABLE users DROP COLUMN two_factor_reset');
      console.log('[Migration] Dropped column two_factor_reset from users.');
    }
    console.log('[Migration] 2FA/TOTP columns removal complete.');
  } catch (err) {
    console.error('[Migration Error] Failed to drop 2FA columns:', err);
    throw err;
  }
}

export async function down() {
  console.log('[Migration Rollback] Re-adding 2FA/TOTP columns to users table...');
  try {
    await query('ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) NULL');
    await query('ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE');
    await query('ALTER TABLE users ADD COLUMN two_factor_reset BOOLEAN DEFAULT FALSE');
    console.log('[Migration Rollback] 2FA columns restored.');
  } catch (err) {
    console.error('[Migration Rollback Error] Failed to re-add 2FA columns:', err);
    throw err;
  }
}

if (process.argv[1]?.endsWith('remove_2fa_columns.js')) {
  const isDown = process.argv.includes('--down');
  (isDown ? down() : up())
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

