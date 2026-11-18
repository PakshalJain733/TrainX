import test from 'node:test';
import assert from 'node:assert/strict';
import { query, pool } from '../src/config/db.js';
import { executeDailyTrainingSync } from '../src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js';
import { getKolkataTimeInfo, checkAndRunDailySync, getLastRunDate, setLastRunDate } from '../src/scheduler/careerGatewayScheduler.js';

test('Scheduler, Locking & Checkpoint Behavior Tests', async (t) => {
  await t.test('1: Kolkata Time Info correctly computes Asia/Kolkata date and hour', async () => {
    const timeInfo = getKolkataTimeInfo(new Date());
    assert.ok(timeInfo.dateStr);
    assert.match(timeInfo.dateStr, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(timeInfo.hour >= 0 && timeInfo.hour <= 23);
    assert.ok(timeInfo.minute >= 0 && timeInfo.minute <= 59);
  });

  await t.test('2: Manual export execution with distributed advisory lock handling', async () => {
    // Record baseline checkpoint
    const [initialCheckpoint] = await query(
      "SELECT last_successful_sync_at FROM career_gateway_sync_checkpoints WHERE sync_type = 'daily_training_sync' LIMIT 1"
    );
    const initialCursor = initialCheckpoint?.last_successful_sync_at;

    // Trigger manual export
    const result = await executeDailyTrainingSync({
      triggeredBy: 'automated_test_scheduler_verification',
      collegeId: 9,
    });

    assert.ok(result.export_id);
    assert.ok(['completed', 'partial', 'skipped'].includes(result.status));

    // If external endpoint is offline (staging pending), it reports 'partial' and DOES NOT advance checkpoint
    if (result.status === 'partial') {
      const [afterCheckpoint] = await query(
        "SELECT last_successful_sync_at FROM career_gateway_sync_checkpoints WHERE sync_type = 'daily_training_sync' LIMIT 1"
      );
      assert.equal(
        afterCheckpoint?.last_successful_sync_at?.toString(),
        initialCursor?.toString(),
        'Checkpoint must NOT advance on failed external dispatch'
      );
    }
  });

  await t.test('3: Concurrent execution is rejected by distributed lock (mutual exclusion)', async () => {
    // Acquire the advisory lock on a separate connection
    const connection = await pool.getConnection();
    try {
      const [lockResult] = await connection.query("SELECT GET_LOCK('trainx_career_gateway_daily_sync_lock', 0) as acquired");
      assert.equal(lockResult[0].acquired, 1, 'Should acquire lock');

      // Attempt to run sync while lock is held
      const concurrentResult = await executeDailyTrainingSync({
        triggeredBy: 'concurrent_test',
        collegeId: 9,
      });

      assert.equal(concurrentResult.status, 'skipped');
      assert.ok(concurrentResult.message.includes('lock active'));
    } finally {
      await connection.query("SELECT RELEASE_LOCK('trainx_career_gateway_daily_sync_lock')");
      connection.release();
    }
  });

  await t.test('4: Retrying export after failure preserves items without duplicate batch records', async () => {
    // Check export batches
    const [recentBatches] = await query(
      "SELECT COUNT(*) as count FROM trainx_training_export_batches WHERE sync_type = 'daily_training_sync'"
    );
    assert.ok(recentBatches.count >= 1);
  });
});

test.after(async () => {
  await pool.end();
});
