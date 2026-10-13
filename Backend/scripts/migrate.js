#!/usr/bin/env node
/**
 * Database Migration Runner for TrainX
 * Executable directly on self-hosted VPS, Docker, or CI/CD pipelines.
 * Usage: npm run db:migrate  OR  node scripts/migrate.js
 */

import 'dotenv/config';
import { initializeDatabase } from '../src/config/init_db.js';

async function run() {
  console.log('========================================================');
  console.log('⚡ [TrainX Database Migration Runner]');
  console.log('   Target Host:  ', process.env.DB_HOST || 'localhost');
  console.log('   Target Port:  ', process.env.DB_PORT || '3306');
  console.log('   Database Name:', process.env.DB_NAME || 'training_portal_db');
  console.log('   User:         ', process.env.DB_USER || 'root');
  console.log('========================================================');

  const start = Date.now();
  try {
    const success = await initializeDatabase();
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    if (success) {
      console.log('========================================================');
      console.log(`✅ [Migration Complete] All tables & seeds verified in ${elapsed}s.`);
      console.log('========================================================');
      process.exit(0);
    } else {
      console.error('========================================================');
      console.error(`❌ [Migration Failed] initializeDatabase returned false.`);
      console.error('========================================================');
      process.exit(1);
    }
  } catch (err) {
    console.error('========================================================');
    console.error('❌ [Fatal Migration Error]:', err.message);
    console.error('========================================================');
    process.exit(1);
  }
}

run();
