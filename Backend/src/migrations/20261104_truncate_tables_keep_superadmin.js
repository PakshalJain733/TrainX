import { truncateAllExceptSuperAdmin } from '../config/migrator.js';
import { pool } from '../config/db.js';

/**
 * One-time migration: Truncates all tables and clears all test/mock data
 * while preserving only Super Admin accounts.
 *
 * Runs automatically on redeploy via migrateOnBoot(), records itself in
 * schema_migrations, and will not run again on future restarts.
 */
export async function up() {
  console.log('[Migration: 20261104_truncate_tables_keep_superadmin] Running database cleanup...');
  await truncateAllExceptSuperAdmin();
  console.log('[Migration: 20261104_truncate_tables_keep_superadmin] Cleanup complete. Super Admin preserved.');
}

export async function down() {
  console.log('[Migration: 20261104_truncate_tables_keep_superadmin] Cannot rollback data truncation.');
}

if (process.argv[1]?.endsWith('20261104_truncate_tables_keep_superadmin.js')) {
  up()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

