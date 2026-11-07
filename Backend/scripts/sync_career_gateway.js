#!/usr/bin/env node
/**
 * TrainX -> Career Gateway Training Data Export Runner
 * Executes the daily synchronization with distributed locking and checkpoint tracking.
 *
 * Usage: npm run db:sync:cg  OR  node scripts/sync_career_gateway.js
 */

import 'dotenv/config';
import { executeDailyTrainingSync } from '../src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js';

async function run() {
  console.log('========================================================');
  console.log('⚡ [TrainX -> Career Gateway Training Data Export]');
  console.log('   Target API URL: ', process.env.CAREER_GATEWAY_API_URL || 'https://api.careergateway.edu');
  console.log('   Schedule:        Daily at 02:00 AM Asia/Kolkata');
  console.log('   Distributed Lock: MySQL GET_LOCK');
  console.log('========================================================');

  const start = Date.now();

  try {
    const res = await executeDailyTrainingSync({
      triggeredBy: 'cli_sync_tool',
    });

    const totalElapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log('\n========================================================');
    console.log(`✅ [Sync Process Finished] Completed in ${totalElapsed}s.`);
    console.log(`   Export ID: ${res.export_id || 'N/A'}`);
    console.log(`   Status:    ${res.status}`);
    console.log(`   Records:   ${res.total || 0} total (Success: ${res.success_count || 0}, Failed: ${res.failure_count || 0})`);
    if (res.error) {
      console.log(`   Notice:    ${res.error}`);
    }
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [Sync Failed]:', err.message);
    process.exit(1);
  }
}

run();
