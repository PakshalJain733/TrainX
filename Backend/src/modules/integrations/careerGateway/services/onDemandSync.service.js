import crypto from 'crypto';
import { query } from '../../../../config/db.js';
import { collectTrainingExportRecords } from './trainingDataExport.service.js';
import { resolveCollegeTenant } from './studentProvisioning.service.js';
import { CareerGatewayClient } from '../client/careerGatewayClient.js';

/**
 * On-Demand Manual Synchronization Service
 * Handles:
 * - Mode A: Career Gateway-triggered individual student sync
 * - Mode B: TrainX administrator-triggered manual sync (individual or college-wide)
 * - Safe background asynchronous execution for large jobs
 * - Zero modification of global daily scheduler checkpoint (Mode C protection)
 */

/**
 * Helper to get college external slug for payload envelope
 */
async function getCollegeExternalSlug(collegeId) {
  if (!collegeId) return process.env.CAREER_GATEWAY_COLLEGE_ID || process.env.TRAINX_COLLEGE_ID || null;
  const colRows = await query(
    'SELECT id, code, career_gateway_college_id FROM colleges WHERE id = ? OR career_gateway_college_id = ? OR code = ? LIMIT 1',
    [isNaN(Number(collegeId)) ? -1 : Number(collegeId), String(collegeId), String(collegeId)]
  );
  if (colRows && colRows.length > 0) {
    return colRows[0].career_gateway_college_id || process.env.CAREER_GATEWAY_COLLEGE_ID || process.env.TRAINX_COLLEGE_ID || colRows[0].code || String(colRows[0].id);
  }
  return process.env.CAREER_GATEWAY_COLLEGE_ID || process.env.TRAINX_COLLEGE_ID || String(collegeId);
}

/**
 * Executes or queues on-demand synchronization.
 */
export async function executeOnDemandSync(options = {}) {
  const {
    syncType = 'manual_student', // 'manual_student' | 'manual_college'
    triggerSource = 'career_gateway', // 'career_gateway' | 'trainx_admin'
    requestedBy = 'unknown',
    careerGatewayStudentId = null,
    trainxUserId = null,
    collegeId = null,
    careerGatewayCollegeId = null,
    requestId = null,
    isAsync = false,
    client = null,
  } = options;

  // 1. Idempotency check: if requestId provided, check for existing execution
  if (requestId && String(requestId).trim()) {
    const cleanRequestId = String(requestId).trim();
    const [existing] = await query(
      'SELECT * FROM career_gateway_sync_executions WHERE request_id = ? LIMIT 1',
      [cleanRequestId]
    );

    if (existing) {
      // If completed or currently running, return existing state
      if (['completed', 'processing', 'queued'].includes(existing.status)) {
        return {
          idempotent: true,
          sync_id: existing.sync_id,
          request_id: existing.request_id,
          status: existing.status,
          sync_type: existing.sync_type,
          records_processed: existing.records_processed,
          records_failed: existing.records_failed,
          message: `Request ${cleanRequestId} already recorded with status ${existing.status}`,
          created_at: existing.started_at,
          completed_at: existing.completed_at,
        };
      }
    }
  }

  // 2. Resolve college tenant (Tenant Isolation)
  let resolvedCollegeId = null;
  const tenantCandidate = {
    college_id: collegeId,
    career_gateway_college_id: careerGatewayCollegeId,
  };

  try {
    resolvedCollegeId = await resolveCollegeTenant(tenantCandidate);
  } catch (err) {
    // If college not passed but student is passed, infer from student mapping
    if (careerGatewayStudentId || trainxUserId) {
      const [mapping] = await query(
        `SELECT u.college_id 
         FROM career_gateway_student_mappings m
         JOIN users u ON u.id = m.trainx_user_id
         WHERE m.career_gateway_student_id = ? OR m.trainx_user_id = ?
         LIMIT 1`,
        [careerGatewayStudentId, trainxUserId]
      );
      if (mapping && mapping.college_id) {
        resolvedCollegeId = mapping.college_id;
      }
    }

    if (!resolvedCollegeId) {
      const tenantErr = new Error('Tenant resolution failed: Valid college_id or career_gateway_college_id is required.');
      tenantErr.statusCode = 422;
      throw tenantErr;
    }
  }

  const externalCollegeSlug = await getCollegeExternalSlug(resolvedCollegeId);

  // 3. For individual student sync, validate student mapping
  let targetCgStudentId = careerGatewayStudentId ? Number(careerGatewayStudentId) : null;
  let targetTrainxUserId = trainxUserId ? Number(trainxUserId) : null;

  if (syncType === 'manual_student') {
    if (!targetCgStudentId && !targetTrainxUserId) {
      const err = new Error('Student identifier is required for individual student synchronization (career_gateway_student_id or trainx_user_id).');
      err.statusCode = 400;
      throw err;
    }

    const [mappedStudent] = await query(
      `SELECT m.trainx_user_id, m.career_gateway_student_id, u.college_id, u.email, u.name
       FROM career_gateway_student_mappings m
       JOIN users u ON u.id = m.trainx_user_id
       WHERE (m.career_gateway_student_id = ? OR m.trainx_user_id = ?)
       LIMIT 1`,
      [targetCgStudentId, targetTrainxUserId]
    );

    if (!mappedStudent) {
      const notFoundErr = new Error(`Student ${targetCgStudentId || targetTrainxUserId} is not mapped or does not exist in TrainX.`);
      notFoundErr.statusCode = 404;
      throw notFoundErr;
    }

    // Verify tenant match
    if (resolvedCollegeId && mappedStudent.college_id !== resolvedCollegeId) {
      const mismatchErr = new Error(`Tenant mismatch: Student ${targetCgStudentId} belongs to college ${mappedStudent.college_id}, not requested college ${resolvedCollegeId}.`);
      mismatchErr.statusCode = 422;
      throw mismatchErr;
    }

    targetCgStudentId = mappedStudent.career_gateway_student_id;
    targetTrainxUserId = mappedStudent.trainx_user_id;
    resolvedCollegeId = mappedStudent.college_id;
  }

  // 4. Create sync execution tracking record with race-condition handling
  const syncId = `SYNC-MAN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const cleanRequestId = requestId ? String(requestId).trim() : null;
  const initialStatus = isAsync ? 'queued' : 'processing';

  try {
    await query(
      `INSERT INTO career_gateway_sync_executions
       (sync_id, request_id, sync_type, trigger_source, requested_by, college_id, career_gateway_college_id,
        career_gateway_student_id, trainx_user_id, status, started_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        syncId,
        cleanRequestId,
        syncType,
        triggerSource,
        requestedBy,
        resolvedCollegeId,
        externalCollegeSlug,
        targetCgStudentId,
        targetTrainxUserId,
        initialStatus,
      ]
    );
  } catch (insertErr) {
    if (insertErr.code === 'ER_DUP_ENTRY' && cleanRequestId) {
      // Race condition handled: another request inserted this request_id concurrently
      const [existingAfterRace] = await query(
        'SELECT * FROM career_gateway_sync_executions WHERE request_id = ? LIMIT 1',
        [cleanRequestId]
      );
      if (existingAfterRace) {
        return {
          idempotent: true,
          sync_id: existingAfterRace.sync_id,
          request_id: existingAfterRace.request_id,
          status: existingAfterRace.status,
          sync_type: existingAfterRace.sync_type,
          records_processed: existingAfterRace.records_processed,
          records_failed: existingAfterRace.records_failed,
          message: `Concurrent duplicate request detected: Request ${cleanRequestId} already recorded with status ${existingAfterRace.status}`,
          created_at: existingAfterRace.started_at,
          completed_at: existingAfterRace.completed_at,
        };
      }
    }
    throw insertErr;
  }

  // 5. If asynchronous requested (e.g. for large college-wide jobs), fire background runner
  if (isAsync) {
    setImmediate(async () => {
      try {
        await processSyncExecutionTask({
          syncId,
          syncType,
          resolvedCollegeId,
          externalCollegeSlug,
          targetCgStudentId,
          targetTrainxUserId,
          triggerSource,
          requestedBy,
          client,
        });
      } catch (bgErr) {
        console.error(`[OnDemandSync Background Error] ${syncId}:`, bgErr.message);
      }
    });

    return {
      sync_id: syncId,
      request_id: cleanRequestId,
      sync_type: syncType,
      status: 'queued',
      message: 'Synchronization request queued for background processing.',
      college_id: externalCollegeSlug,
      student_id: targetCgStudentId,
    };
  }

  // 6. Synchronous immediate execution
  return await processSyncExecutionTask({
    syncId,
    syncType,
    resolvedCollegeId,
    externalCollegeSlug,
    targetCgStudentId,
    targetTrainxUserId,
    triggerSource,
    requestedBy,
    client,
  });
}

/**
 * Internal execution task: collects data, builds payload, dispatches to Career Gateway receiver
 */
async function processSyncExecutionTask({
  syncId,
  syncType,
  resolvedCollegeId,
  externalCollegeSlug,
  targetCgStudentId,
  targetTrainxUserId,
  triggerSource,
  requestedBy,
  client = null,
}) {
  const exportId = `EXP-MAN-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  try {
    await query(
      'UPDATE career_gateway_sync_executions SET status = \'processing\', export_id = ? WHERE sync_id = ?',
      [exportId, syncId]
    );

    // Collect export data using existing collector with individual or college scope
    // CRITICAL: sinceTimestamp is strictly NULL so full current status is synchronized,
    // and global daily scheduler checkpoint is NOT modified!
    const { data, total, studentsCount } = await collectTrainingExportRecords({
      collegeId: resolvedCollegeId,
      studentId: syncType === 'manual_student' ? targetCgStudentId : null,
      userId: syncType === 'manual_student' ? targetTrainxUserId : null,
      limit: 1000,
    });

    const payload = {
      source: 'trainx',
      schema_version: '1.0',
      export_id: exportId,
      generated_at: new Date().toISOString(),
      since: null, // Zero effect on daily scheduled sync cursor
      college_id: externalCollegeSlug,
      career_gateway_college_id: externalCollegeSlug,
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

    const summary = {
      batches: data.batches.length,
      sessions: data.sessions.length,
      attendance: data.attendance.length,
      assessments: data.assessments.length,
      assessment_results: data.assessment_results.length,
      student_progress: data.student_progress.length,
      total_records: total,
    };

    // Dispatch to Career Gateway receiver using established client (or injected mock)
    const cgClient = client || new CareerGatewayClient();
    let cgResponse = null;
    let dispatchError = null;

    try {
      cgResponse = await cgClient.sendTrainingRecords(payload);
    } catch (err) {
      dispatchError = err;
      console.warn(`[OnDemandSync] Receiver call warning for ${syncId}:`, err.message);
    }

    if (cgResponse) {
      // Ingestion successfully acknowledged by Career Gateway
      await query(
        `UPDATE career_gateway_sync_executions
         SET status = 'completed', records_processed = ?, records_failed = 0,
             payload_summary = ?, completed_at = NOW()
         WHERE sync_id = ?`,
        [total, JSON.stringify(summary), syncId]
      );

      // Audit log entry
      await query(
        `INSERT INTO career_gateway_sync_log
         (sync_direction, entity_type, total_records, success_count, failure_count, status, details, triggered_by)
         VALUES ('outbound_to_cg', 'manual_sync', ?, ?, 0, 'success', ?, ?)`,
        [total, total, JSON.stringify({ sync_id: syncId, export_id: exportId, summary }), `${triggerSource}:${requestedBy}`]
      );

      return {
        sync_id: syncId,
        export_id: exportId,
        status: 'completed',
        sync_type: syncType,
        college_id: externalCollegeSlug,
        student_id: targetCgStudentId,
        records_processed: total,
        records_failed: 0,
        summary,
        message: 'Synchronization completed and verified with Career Gateway.',
      };
    } else {
      // External dispatch failed or timed out (receiver offline / pending)
      const errorMsg = dispatchError?.message || 'External receiver dispatch pending or failed';
      const executionStatus = dispatchError ? 'failed' : 'partial';

      await query(
        `UPDATE career_gateway_sync_executions
         SET status = ?, records_processed = 0, records_failed = ?,
             error_summary = ?, payload_summary = ?, completed_at = NOW()
         WHERE sync_id = ?`,
        [executionStatus, total, errorMsg, JSON.stringify(summary), syncId]
      );

      await query(
        `INSERT INTO career_gateway_sync_log
         (sync_direction, entity_type, total_records, success_count, failure_count, status, details, triggered_by)
         VALUES ('outbound_to_cg', 'manual_sync', ?, 0, ?, ?, ?, ?)`,
        [total, total, executionStatus, JSON.stringify({ sync_id: syncId, export_id: exportId, error: errorMsg, summary }), `${triggerSource}:${requestedBy}`]
      );

      return {
        sync_id: syncId,
        export_id: exportId,
        status: executionStatus,
        sync_type: syncType,
        college_id: externalCollegeSlug,
        student_id: targetCgStudentId,
        records_processed: 0,
        records_failed: total,
        error: errorMsg,
        summary,
        message: `Synchronization generated locally (${total} records), but dispatch to Career Gateway receiver reported: ${errorMsg}`,
      };
    }
  } catch (err) {
    await query(
      `UPDATE career_gateway_sync_executions
       SET status = 'failed', error_summary = ?, completed_at = NOW()
       WHERE sync_id = ?`,
      [err.message, syncId]
    ).catch(() => {});

    throw err;
  }
}

/**
 * Background Job Reliability: Recovers abandoned or stuck synchronization executions.
 * If a background worker crashed or restarted while a job was in 'processing' or 'queued' state
 * for longer than timeoutMinutes, mark it as 'failed' with an explanatory error summary.
 */
export async function recoverAbandonedSyncExecutions(timeoutMinutes = 15) {
  try {
    const [result] = await query(
      `UPDATE career_gateway_sync_executions
       SET status = 'failed',
           error_summary = CONCAT('Execution timed out or worker process terminated after ', ?, ' minutes in pending state'),
           completed_at = NOW()
       WHERE status IN ('processing', 'queued')
         AND started_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
      [timeoutMinutes, timeoutMinutes]
    );
    if (result && result.affectedRows > 0) {
      console.warn(`[OnDemandSync] Recovered ${result.affectedRows} abandoned sync execution(s) older than ${timeoutMinutes}m.`);
    }
    return result?.affectedRows || 0;
  } catch (err) {
    console.error('[OnDemandSync] Error recovering abandoned executions:', err.message);
    return 0;
  }
}

/**
 * Retrieves paginated synchronization history, strictly scoped by tenant.
 */
export async function getSyncExecutions(options = {}) {
  // Proactively sweep any abandoned executions before returning history
  await recoverAbandonedSyncExecutions(15).catch(() => {});

  const { collegeId = null, syncType = null, status = null, page = 1, limit = 20 } = options;
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

  let countSql = 'SELECT COUNT(*) as total FROM career_gateway_sync_executions WHERE 1=1';
  let querySql = `
    SELECT e.id, e.sync_id, e.request_id, e.sync_type, e.trigger_source, e.requested_by,
           e.college_id, e.career_gateway_college_id, e.career_gateway_student_id, e.trainx_user_id,
           e.export_id, e.status, e.records_processed, e.records_failed, e.payload_summary,
           e.error_summary, e.started_at, e.completed_at, u.name as student_name, u.email as student_email
    FROM career_gateway_sync_executions e
    LEFT JOIN users u ON u.id = e.trainx_user_id
    WHERE 1=1
  `;
  const params = [];

  if (collegeId) {
    countSql += ' AND college_id = ?';
    querySql += ' AND e.college_id = ?';
    params.push(collegeId);
  }

  if (syncType) {
    countSql += ' AND sync_type = ?';
    querySql += ' AND e.sync_type = ?';
    params.push(syncType);
  }

  if (status) {
    countSql += ' AND status = ?';
    querySql += ' AND e.status = ?';
    params.push(status);
  }

  const [countRes] = await query(countSql, params);
  const total = countRes?.total || 0;

  querySql += ' ORDER BY e.started_at DESC LIMIT ? OFFSET ?';
  const queryParams = [...params, parseInt(limit, 10), parseInt(offset, 10)];
  const executions = await query(querySql, queryParams);

  return {
    total,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(total / parseInt(limit, 10)),
    executions: executions || [],
  };
}

/**
 * Retrieves status of a single synchronization execution with tenant security check.
 */
export async function getSyncExecutionById(syncId, callerCollegeId = null) {
  if (!syncId) {
    const err = new Error('sync_id is required');
    err.statusCode = 400;
    throw err;
  }

  const [execution] = await query(
    `SELECT e.*, u.name as student_name, u.email as student_email
     FROM career_gateway_sync_executions e
     LEFT JOIN users u ON u.id = e.trainx_user_id
     WHERE e.sync_id = ? OR e.request_id = ?
     LIMIT 1`,
    [syncId, syncId]
  );

  if (!execution) {
    const notFoundErr = new Error(`Synchronization execution '${syncId}' not found.`);
    notFoundErr.statusCode = 404;
    throw notFoundErr;
  }

  // Tenant isolation verification: non-superadmin callers can only view their own college
  if (callerCollegeId && execution.college_id && execution.college_id !== callerCollegeId) {
    const forbiddenErr = new Error('Access denied: You are not authorized to view synchronization records for this tenant.');
    forbiddenErr.statusCode = 403;
    throw forbiddenErr;
  }

  return execution;
}

/**
 * Retries an eligible failed or partial execution idempotently.
 */
export async function retrySyncExecution(syncId, requestedBy = 'admin_retry', callerCollegeId = null) {
  const existing = await getSyncExecutionById(syncId, callerCollegeId);

  if (existing.status === 'processing' || existing.status === 'queued') {
    return {
      status: existing.status,
      message: `Execution ${syncId} is already active.`,
      execution: existing,
    };
  }

  return await executeOnDemandSync({
    syncType: existing.sync_type,
    triggerSource: existing.trigger_source === 'career_gateway' ? 'career_gateway' : 'trainx_admin',
    requestedBy,
    careerGatewayStudentId: existing.career_gateway_student_id,
    trainxUserId: existing.trainx_user_id,
    collegeId: existing.college_id,
    careerGatewayCollegeId: existing.career_gateway_college_id,
    requestId: `RETRY-${existing.sync_id}-${Date.now()}`,
    isAsync: existing.sync_type === 'manual_college',
  });
}

