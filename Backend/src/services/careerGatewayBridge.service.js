/**
 * DEPRECATED: Career Gateway Direct Database Bridge
 * 
 * Direct cross-database SQL queries against Career Gateway have been retired.
 * All integration is now handled via authenticated REST APIs:
 * - Inbound: /api/integrations/career-gateway/students (studentProvisioning.service.js)
 * - Outbound: /api/integrations/trainx/training-records (dailyTrainingSync.worker.js)
 */

import { executeDailyTrainingSync } from '../modules/integrations/careerGateway/services/dailyTrainingSync.worker.js';

export async function syncStudentsFromCareerGateway() {
  return {
    status: 'deprecated',
    message: 'Direct cross-database sync is retired. Student provisioning is managed via REST webhooks.'
  };
}

export async function pushReadinessMetricsToCareerGateway(options = {}) {
  return executeDailyTrainingSync(options);
}

export async function getCareerGatewaySyncStatus() {
  return {
    status: 'active',
    mode: 'rest_api'
  };
}
