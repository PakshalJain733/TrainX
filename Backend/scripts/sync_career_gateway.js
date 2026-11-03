#!/usr/bin/env node
/**
 * TrainX <-> Career Gateway Database Synchronization Runner
 * Syncs student master accounts from Career Gateway into TrainX,
 * and pushes training readiness scores from TrainX to Career Gateway.
 *
 * Usage: npm run db:sync:cg  OR  node scripts/sync_career_gateway.js
 */

import 'dotenv/config';
import {
  syncStudentsFromCareerGateway,
  pushReadinessMetricsToCareerGateway,
} from '../src/services/careerGatewayBridge.service.js';

async function run() {
  const cgDb = process.env.CG_DB_NAME || 'acadnexus_db';
  const targetCollegeId = parseInt(process.env.DEFAULT_COLLEGE_ID || '8', 10);

  console.log('========================================================');
  console.log('🔄 [TrainX <-> Career Gateway Data Bridge]');
  console.log('   Target Career Gateway DB: ', cgDb);
  console.log('   Default College ID:       ', targetCollegeId);
  console.log('========================================================');

  const start = Date.now();

  try {
    // 1. Inbound Sync (Career Gateway -> TrainX)
    console.log('\n📥 1. Running Inbound Sync (Student Master -> TrainX)...');
    const inRes = await syncStudentsFromCareerGateway({
      targetCollegeId,
      triggerSource: 'cli_sync_tool',
    });
    console.log(`   ✅ Inbound Result: Total: ${inRes.total}, Synced: ${inRes.successCount}, Failed: ${inRes.failureCount} (${inRes.durationMs}ms)`);

    // 2. Outbound Sync (TrainX -> Career Gateway)
    console.log('\n📤 2. Running Outbound Sync (Readiness Metrics -> Career Gateway)...');
    const outRes = await pushReadinessMetricsToCareerGateway({
      triggerSource: 'cli_sync_tool',
    });
    console.log(`   ✅ Outbound Result: Total: ${outRes.total}, Synced: ${outRes.successCount}, Failed: ${outRes.failureCount} (${outRes.durationMs}ms)`);

    const totalElapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log('\n========================================================');
    console.log(`🎉 [Sync Finished Successfully] Completed in ${totalElapsed}s.`);
    console.log('========================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [Sync Failed]:', err.message);
    process.exit(1);
  }
}

run();

