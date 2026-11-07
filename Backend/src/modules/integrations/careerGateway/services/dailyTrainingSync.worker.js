import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { query } from '../../../../config/db.js';
import { collectTrainingExportRecords } from './trainingDataExport.service.js';
import { CareerGatewayClient } from '../client/careerGatewayClient.js';

const DISTRIBUTED_LOCK_NAME = 'trainx_career_gateway_daily_sync_lock';
const LOCK_TIMEOUT_SECONDS = 10;

/**
 * Creates an independent connection for MySQL advisory locks,
 * guaranteeing the lock is held and released on the same physical connection.
 */
async function createLockConnection() {
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '';
  const dbName = process.env.DB_NAME || 'training_portal_db';
  const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;

  return await mysql.createConnection({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ...(dbSsl ? { ssl: dbSsl } : {}),
  });
}

/**
 * Executes daily export of training data from TrainX to Career Gateway.
 * Protected by distributed lock, with batch chunking, idempotency, and failure tracking.
 */
export async function executeDailyTrainingSync(options = {}) {
  const { triggeredBy = 'scheduled_cron', collegeId = null } = options;
  const lockConn = await createLockConnection();

  try {
    // 1. Acquire distributed advisory lock
    const [lockRows] = await lockConn.query(
      'SELECT GET_LOCK(?, ?) as acquired',
      [DISTRIBUTED_LOCK_NAME, LOCK_TIMEOUT_SECONDS]
    );

    const acquired = lockRows && lockRows[0] && lockRows[0].acquired === 1;
    if (!acquired) {
      console.warn('[Sync Worker] Sync already running on another instance. Aborting concurrent execution.');
      return {
        status: 'skipped',
        message: 'Sync job already running on another instance (distributed lock active).',
      };
    }

    const exportId = `EXP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

    // 2. Read last successful checkpoint cursor
    const [checkpoint] = await query(
      "SELECT last_successful_sync_at FROM career_gateway_sync_checkpoints WHERE sync_type = 'daily_training_sync' LIMIT 1"
    );
    const sinceTimestamp = checkpoint?.last_successful_sync_at || null;

    // 3. Collect categorized training records (6 arrays)
    const { data, total, studentsCount, resolvedCollegeId } = await collectTrainingExportRecords({
      sinceTimestamp,
      collegeId,
      limit: 1000,
    });

    // Resolve explicit non-null tenant identifier for Career Gateway export
    let targetExternalCollegeId = null;

    if (collegeId) {
      const colRows = await query(
        'SELECT career_gateway_college_id, code FROM colleges WHERE id = ? OR career_gateway_college_id = ? OR code = ? LIMIT 1',
        [isNaN(Number(collegeId)) ? -1 : Number(collegeId), String(collegeId), String(collegeId)]
      );
      if (colRows && colRows.length > 0) {
        targetExternalCollegeId = colRows[0].career_gateway_college_id || colRows[0].code || String(collegeId);
      } else {
        targetExternalCollegeId = String(collegeId);
      }
    } else if (process.env.CAREER_GATEWAY_COLLEGE_ID) {
      targetExternalCollegeId = process.env.CAREER_GATEWAY_COLLEGE_ID.trim();
    } else if (resolvedCollegeId) {
      targetExternalCollegeId = resolvedCollegeId;
    } else {
      const defaultCols = await query(
        'SELECT career_gateway_college_id, code FROM colleges WHERE career_gateway_college_id IS NOT NULL LIMIT 2'
      );
      if (defaultCols.length === 1) {
        targetExternalCollegeId = defaultCols[0].career_gateway_college_id;
      }
    }

    if (!targetExternalCollegeId && total > 0) {
      const tenantErr = new Error(
        'Unresolved college tenant for Career Gateway export: external college_id could not be resolved. Configure CAREER_GATEWAY_COLLEGE_ID or provide a tenant-scoped collegeId.'
      );
      console.error(`[Sync Worker Error] ${tenantErr.message}`);
      throw tenantErr;
    }

    // 4. Create batch audit record
    const batchInsert = await query(
      `INSERT INTO trainx_training_export_batches
       (export_id, sync_type, total_records, status)
       VALUES (?, 'daily_training_sync', ?, 'running')`,
      [exportId, total]
    );
    const batchId = batchInsert.insertId;

    if (total === 0) {
      await query(
        `UPDATE trainx_training_export_batches 
         SET status = 'completed', completed_at = NOW(), successful_records = 0, failed_records = 0
         WHERE id = ?`,
        [batchId]
      );

      // Log in unified sync log
      await query(
        `INSERT INTO career_gateway_sync_log
         (sync_direction, entity_type, total_records, success_count, failure_count, status, details, triggered_by)
         VALUES ('outbound_to_cg', 'training_data', 0, 0, 0, 'success', ?, ?)`,
        [JSON.stringify({ message: 'No new training records to export since last checkpoint', sinceTimestamp }), triggeredBy]
      );

      return {
        export_id: exportId,
        status: 'completed',
        total: 0,
        message: 'No new training records required export.',
      };
    }

    // 5. Audit individual categorized records in trainx_training_export_items
    for (const att of data.attendance) {
      await query(
        `INSERT INTO trainx_training_export_items
         (export_batch_id, source_record_type, source_record_id, external_student_id, status)
         VALUES (?, 'attendance', ?, ?, 'pending')`,
        [batchId, `ATT-${att.attendance_id}`, att.student_id]
      );
    }
    for (const asm of data.assessment_results) {
      await query(
        `INSERT INTO trainx_training_export_items
         (export_batch_id, source_record_type, source_record_id, external_student_id, status)
         VALUES (?, 'assessment', ?, ?, 'pending')`,
        [batchId, `ASM-${asm.attempt_id}`, asm.student_id]
      );
    }

    // 6. Build Career Gateway Contract compliant outer payload (SYNC-02: includes since and college_id)
    const client = new CareerGatewayClient();
    const payload = {
      source: 'trainx',
      schema_version: '1.0',
      export_id: exportId,
      generated_at: new Date().toISOString(),
      since: sinceTimestamp ? new Date(sinceTimestamp).toISOString() : null,
      college_id: targetExternalCollegeId || null,
      students_count: studentsCount,
      records_count: total,
      data: {
        batches: data.batches,
        sessions: data.sessions,
        attendance: data.attendance,
        assessments: data.assessments,
        assessment_results: data.assessment_results,
        student_progress: data.student_progress,
      },
    };

    let cgResponse = null;
    let syncError = null;

    try {
      cgResponse = await client.sendTrainingRecords(payload);
    } catch (err) {
      syncError = err;
      console.warn(`[Sync Worker Notice] Career Gateway receiver call returned: ${err.message}`);
    }

    // 7. Update batch status and items
    if (cgResponse) {
      await query(
        `UPDATE trainx_training_export_batches 
         SET status = 'completed', completed_at = NOW(), successful_records = ?, failed_records = 0
         WHERE id = ?`,
        [total, batchId]
      );

      await query(
        `UPDATE trainx_training_export_items
         SET status = 'acknowledged', synced_at = NOW()
         WHERE export_batch_id = ?`,
        [batchId]
      );

      // Advance checkpoint
      await query(
        `INSERT INTO career_gateway_sync_checkpoints (sync_type, last_successful_cursor, last_successful_sync_at)
         VALUES ('daily_training_sync', ?, NOW())
         ON DUPLICATE KEY UPDATE
           last_successful_cursor = VALUES(last_successful_cursor),
           last_successful_sync_at = VALUES(last_successful_sync_at),
           updated_at = NOW()`,
        [exportId]
      );

      await query(
        `INSERT INTO career_gateway_sync_log
         (sync_direction, entity_type, total_records, success_count, failure_count, status, details, triggered_by)
         VALUES ('outbound_to_cg', 'training_data', ?, ?, 0, 'success', ?, ?)`,
        [total, total, JSON.stringify({ export_id: exportId, cg_response: cgResponse }), triggeredBy]
      );

      return {
        export_id: exportId,
        status: 'completed',
        total,
        success_count: total,
        failure_count: 0,
        data_summary: {
          batches: data.batches.length,
          sessions: data.sessions.length,
          attendance: data.attendance.length,
          assessments: data.assessments.length,
          assessment_results: data.assessment_results.length,
          student_progress: data.student_progress.length,
        },
      };
    } else {
      // Career Gateway receiver endpoint awaiting deployment or unreachable
      await query(
        `UPDATE trainx_training_export_batches 
         SET status = 'partial', completed_at = NOW(), failed_records = ?, error_summary = ?
         WHERE id = ?`,
        [total, syncError?.message || 'External API call pending or failed', batchId]
      );

      await query(
        `UPDATE trainx_training_export_items
         SET status = 'failed', last_error = ?
         WHERE export_batch_id = ?`,
        [syncError?.message || 'Failed to dispatch to external API', batchId]
      );

      await query(
        `INSERT INTO career_gateway_sync_log
         (sync_direction, entity_type, total_records, success_count, failure_count, status, details, triggered_by)
         VALUES ('outbound_to_cg', 'training_data', ?, 0, ?, 'partial', ?, ?)`,
        [total, total, JSON.stringify({ export_id: exportId, error: syncError?.message }), triggeredBy]
      );

      return {
        export_id: exportId,
        status: 'partial',
        total,
        success_count: 0,
        failure_count: total,
        error: syncError?.message,
        data_summary: {
          batches: data.batches.length,
          sessions: data.sessions.length,
          attendance: data.attendance.length,
          assessments: data.assessments.length,
          assessment_results: data.assessment_results.length,
          student_progress: data.student_progress.length,
        },
      };
    }
  } finally {
    // 8. Always release lock and close connection
    try {
      await lockConn.query('SELECT RELEASE_LOCK(?)', [DISTRIBUTED_LOCK_NAME]);
    } catch (_) {}
    await lockConn.end().catch(() => {});
  }
}
