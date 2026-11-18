#!/usr/bin/env node
/**
 * Database Migration Runner for TrainX
 * Executable directly on self-hosted VPS, Docker, or CI/CD pipelines.
 * Usage: npm run db:migrate  OR  node scripts/migrate.js
 */

import 'dotenv/config';
import { initializeDatabase } from '../src/config/init_db.js';
import { runMigrations } from '../src/config/migrator.js';

async function run() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbName = process.env.DB_NAME || 'training_portal_db';
  const dbUser = process.env.DB_USER || 'root';

  console.log('========================================================');
  console.log('⚡ [TrainX Database Migration Runner]');
  console.log('   Target Host:  ', dbHost);
  console.log('   Target Port:  ', dbPort);
  console.log('   Database Name:', dbName);
  console.log('   User:         ', dbUser);
  console.log('========================================================');

  const start = Date.now();
  try {
    // 1. Initialize core baseline schema & tables
    const initSuccess = await initializeDatabase();
    if (!initSuccess) {
      console.error('❌ [Migration Failed] initializeDatabase returned false.');
      process.exit(1);
    }

    // 2. Run pending migrations via AutoMigrator
    const migrationResult = await runMigrations();
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log('========================================================');
    console.log(`✅ [Migration Complete] Verified in ${elapsed}s (Applied: ${migrationResult.appliedCount}, Total: ${migrationResult.total}).`);
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('========================================================');
    console.error('❌ [Fatal Migration Error]:', err.message);
    console.error('========================================================');
    process.exit(1);
  }
}

run();
