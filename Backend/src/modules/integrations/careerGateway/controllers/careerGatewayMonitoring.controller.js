import { query } from '../../../../config/db.js';
import { executeDailyTrainingSync } from '../services/dailyTrainingSync.worker.js';
import { sendSuccess, sendError } from '../../../../utils/response.js';

/**
 * GET /api/integrations/career-gateway/monitoring/status
 * Returns current health, stats, and historical metrics for Career Gateway integration.
 */
export async function getIntegrationStatus(req, res, next) {
  try {
    // 1. Mapped Students Count
    const [mappingStats] = await query(
      `SELECT 
         COUNT(*) as total_mapped,
         SUM(CASE WHEN eligibility_status = 'eligible' THEN 1 ELSE 0 END) as active_eligible,
         SUM(CASE WHEN eligibility_status = 'revoked' THEN 1 ELSE 0 END) as revoked_students
       FROM career_gateway_student_mappings`
    );

    // 2. Last Training Export Batch
    const [lastBatch] = await query(
      `SELECT export_id, sync_type, started_at, completed_at, total_records, successful_records, failed_records, status, error_summary
       FROM trainx_training_export_batches
       ORDER BY id DESC LIMIT 1`
    );

    // 3. Last Checkpoint
    const [checkpoint] = await query(
      `SELECT last_successful_cursor, last_successful_sync_at, updated_at
       FROM career_gateway_sync_checkpoints
       WHERE sync_type = 'daily_training_sync' LIMIT 1`
    );

    // 4. Recent Sync Logs
    const recentLogs = await query(
      `SELECT id, sync_direction, entity_type, total_records, success_count, failure_count, status, triggered_by, created_at
       FROM career_gateway_sync_log
       ORDER BY id DESC LIMIT 10`
    );

    // 5. Recent Integration Events (Inbound & Outbound audit)
    const recentEvents = await query(
      `SELECT id, event_type, external_student_id, status, created_at
       FROM career_gateway_integration_events
       ORDER BY id DESC LIMIT 10`
    );

    return sendSuccess(res, 'Career Gateway integration monitoring status', {
      student_mappings: {
        total_mapped: mappingStats?.total_mapped || 0,
        active_eligible: mappingStats?.active_eligible || 0,
        revoked: mappingStats?.revoked_students || 0,
      },
      last_export_batch: lastBatch || null,
      last_checkpoint: checkpoint || null,
      scheduler: {
        schedule: 'Daily at 02:00 AM Asia/Kolkata',
        distributed_lock: 'MySQL GET_LOCK(trainx_career_gateway_daily_sync_lock)',
      },
      recent_sync_logs: recentLogs || [],
      recent_events: recentEvents || [],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/integrations/career-gateway/monitoring/trigger-export
 * Allows authorized administrators to manually trigger an immediate training export run.
 */
export async function handleManualExportTrigger(req, res, next) {
  try {
    const adminUser = req.user?.email || 'admin_manual';
    const result = await executeDailyTrainingSync({ triggeredBy: adminUser });
    return sendSuccess(res, 'Manual training data export completed', result);
  } catch (err) {
    next(err);
  }
}
