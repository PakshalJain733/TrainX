import {
  executeOnDemandSync,
  getSyncExecutions,
  getSyncExecutionById,
  retrySyncExecution,
} from '../services/onDemandSync.service.js';
import { fetchStudentTrainingSyncData } from '../services/onDemandStudentSync.service.js';
import { sendSuccess, sendError } from '../../../../utils/response.js';
import { ROLES } from '../../../../utils/constants.js';

/**
 * Career Gateway Synchronization Controller
 * Orchestrates Mode A (Career Gateway-triggered S2S sync) and Mode B (TrainX Admin manual sync)
 */

/**
 * POST /api/v1/integrations/career-gateway/sync
 * Mode A: Career Gateway-triggered S2S synchronization for an individual student
 * Authenticated via Bearer S2S JWT
 */
export async function handleInboundSyncRequest(req, res, next) {
  try {
    const {
      sync_type = 'manual_student',
      career_gateway_student_id,
      student_id,
      career_gateway_college_id,
      college_id,
      request_id,
    } = req.body || {};

    const cleanSyncType = String(sync_type).trim();
    if (cleanSyncType !== 'manual_student' && cleanSyncType !== 'manual_college') {
      return sendError(
        res,
        "Invalid sync_type. Expected 'manual_student' or 'manual_college'.",
        400
      );
    }

    if (!request_id || !String(request_id).trim()) {
      return sendError(
        res,
        'request_id is mandatory for inbound synchronization requests to guarantee idempotency.',
        400
      );
    }

    const targetStudentId = career_gateway_student_id || student_id;
    if (cleanSyncType === 'manual_student' && !targetStudentId) {
      return sendError(
        res,
        'career_gateway_student_id or student_id is required for individual student synchronization.',
        400
      );
    }

    const requestedBy = req.serviceAuth?.sub || 'career_gateway_service';

    const result = await executeOnDemandSync({
      syncType: cleanSyncType,
      triggerSource: 'career_gateway',
      requestedBy,
      careerGatewayStudentId: targetStudentId ? Number(targetStudentId) : null,
      collegeId: college_id || null,
      careerGatewayCollegeId: career_gateway_college_id || null,
      requestId: request_id ? String(request_id).trim() : null,
      isAsync: false,
    });

    if (result.status === 'completed') {
      return sendSuccess(res, result.message || 'Synchronization completed successfully', result, 200);
    }

    if (result.status === 'partial') {
      return sendSuccess(res, result.message || 'Synchronization partially completed', result, 207);
    }

    if (result.status === 'failed') {
      return sendError(res, result.error || result.message || 'Synchronization failed', 502, result);
    }

    return sendSuccess(res, result.message || 'Synchronization request received', result, 200);
  } catch (err) {
    const statusCode = err.statusCode || (err.message?.includes('not found') ? 404 : (err.message?.includes('mismatch') || err.message?.includes('Tenant') ? 422 : 500));
    return sendError(res, err.message, statusCode);
  }
}

/**
 * POST /api/v1/integrations/career-gateway/sync/student
 * Mode A (Synchronous RPC Contract): Career Gateway requests 6 training categories for a student.
 * TrainX queries the categories and returns them directly in the HTTP 200 response body.
 */
export async function handleInboundStudentSync(req, res, next) {
  try {
    const {
      student_id,
      career_gateway_student_id,
      clg_id,
      career_gateway_college_id,
      college_id,
      requested_by,
      request_id,
    } = req.body || {};

    const targetStudentId = career_gateway_student_id || student_id;
    const targetClgId = clg_id ? String(clg_id).trim() : null;

    if (!targetStudentId && !targetClgId) {
      return sendError(
        res,
        'student_id, career_gateway_student_id, or clg_id is required.',
        400
      );
    }

    const callerRequestedBy = requested_by || req.serviceAuth?.sub || 'career_gateway';

    const data = await fetchStudentTrainingSyncData({
      student_id: targetStudentId ? Number(targetStudentId) : null,
      career_gateway_student_id: targetStudentId ? Number(targetStudentId) : null,
      clg_id: targetClgId,
      college_id,
      career_gateway_college_id,
      requested_by: callerRequestedBy,
      request_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Student training records retrieved successfully',
      data,
    });
  } catch (err) {
    const statusCode = err.statusCode || (err.message?.includes('not found') ? 404 : (err.message?.includes('mismatch') ? 422 : 500));
    return sendError(res, err.message, statusCode);
  }
}

/**
 * POST /api/v1/integrations/career-gateway/sync/on-demand
 * Mode B: TrainX Administrator-triggered manual synchronization (College-wide or individual student)
 * Protected by Admin JWT session authentication
 */
export async function handleAdminTriggerSync(req, res, next) {
  try {
    const userRole = req.user?.role || 'admin';
    const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;

    // Tenant isolation: College Admin is strictly locked to their own college
    const callerCollegeId = req.user?.collegeId || req.user?.college_id;
    const requestedCollegeId = isSuperAdmin ? (req.body?.college_id || callerCollegeId || 1) : callerCollegeId;

    if (!requestedCollegeId) {
      return sendError(res, 'Access denied: User is not associated with any college tenant', 403);
    }

    const {
      sync_type = 'manual_college',
      student_id,
      career_gateway_student_id,
      trainx_user_id,
      request_id,
    } = req.body || {};

    const cleanSyncType = String(sync_type).trim();
    if (cleanSyncType !== 'manual_student' && cleanSyncType !== 'manual_college') {
      return sendError(
        res,
        "Invalid sync_type. Expected 'manual_student' or 'manual_college'.",
        400
      );
    }

    if (!request_id || !String(request_id).trim()) {
      return sendError(
        res,
        'request_id is mandatory for synchronization requests to guarantee idempotency.',
        400
      );
    }

    const targetCgStudentId = career_gateway_student_id || student_id;
    if (cleanSyncType === 'manual_student' && !targetCgStudentId && !trainx_user_id) {
      return sendError(
        res,
        'student_id or trainx_user_id is required for individual student synchronization.',
        400
      );
    }

    // College-wide syncs run asynchronously in background to prevent HTTP timeouts
    const isAsync = cleanSyncType === 'manual_college';
    const adminUser = req.user?.email || req.user?.name || 'admin';

    const result = await executeOnDemandSync({
      syncType: cleanSyncType,
      triggerSource: 'trainx_admin',
      requestedBy: adminUser,
      careerGatewayStudentId: targetCgStudentId ? Number(targetCgStudentId) : null,
      trainxUserId: trainx_user_id ? Number(trainx_user_id) : null,
      collegeId: requestedCollegeId,
      requestId: request_id ? String(request_id).trim() : null,
      isAsync,
    });

    const statusCode = isAsync ? 202 : (result.status === 'completed' ? 200 : (result.status === 'partial' ? 207 : 502));
    return sendSuccess(res, result.message, result, statusCode);
  } catch (err) {
    const statusCode = err.statusCode || (err.message?.includes('not found') ? 404 : 500);
    return sendError(res, err.message, statusCode);
  }
}

/**
 * GET /api/v1/integrations/career-gateway/sync/executions
 * Retrieves paginated synchronization history, strictly scoped by tenant
 */
export async function handleGetSyncExecutions(req, res, next) {
  try {
    const userRole = req.user?.role || 'admin';
    const isSuperAdmin = userRole === ROLES.SUPER_ADMIN;

    // Strict tenant isolation
    const callerCollegeId = isSuperAdmin
      ? (req.query.college_id ? parseInt(req.query.college_id, 10) : null)
      : (req.user?.collegeId || req.user?.college_id || null);

    const { sync_type, status, page = 1, limit = 20 } = req.query;

    const data = await getSyncExecutions({
      collegeId: callerCollegeId,
      syncType: sync_type || null,
      status: status || null,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || 20,
    });

    return sendSuccess(res, 'Synchronization history retrieved successfully', data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/integrations/career-gateway/sync/:syncId
 * Returns real-time status of a synchronization execution
 */
export async function handleGetSyncExecutionStatus(req, res, next) {
  try {
    const { syncId } = req.params;
    if (!syncId) {
      return sendError(res, 'syncId is required', 400);
    }

    // Determine caller tenant restriction
    let callerCollegeId = null;
    if (req.user) {
      const isSuperAdmin = req.user?.role === ROLES.SUPER_ADMIN;
      callerCollegeId = isSuperAdmin ? null : (req.user?.collegeId || req.user?.college_id || null);
    }

    const execution = await getSyncExecutionById(syncId, callerCollegeId);
    return sendSuccess(res, 'Synchronization status retrieved', execution);
  } catch (err) {
    const statusCode = err.statusCode || (err.message?.includes('not found') ? 404 : (err.message?.includes('denied') ? 403 : 500));
    return sendError(res, err.message, statusCode);
  }
}

/**
 * POST /api/v1/integrations/career-gateway/sync/:syncId/retry
 * Retries an eligible failed or partial sync execution
 */
export async function handleRetrySyncExecution(req, res, next) {
  try {
    const { syncId } = req.params;
    if (!syncId) {
      return sendError(res, 'syncId is required', 400);
    }

    const isSuperAdmin = req.user?.role === ROLES.SUPER_ADMIN;
    const callerCollegeId = isSuperAdmin ? null : (req.user?.collegeId || req.user?.college_id || null);
    const requestedBy = req.user?.email || 'admin_retry';

    const result = await retrySyncExecution(syncId, requestedBy, callerCollegeId);
    return sendSuccess(res, result.message || 'Retry executed successfully', result);
  } catch (err) {
    const statusCode = err.statusCode || (err.message?.includes('not found') ? 404 : (err.message?.includes('denied') ? 403 : 500));
    return sendError(res, err.message, statusCode);
  }
}

