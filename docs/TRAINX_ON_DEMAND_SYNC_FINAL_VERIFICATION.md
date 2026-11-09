# TrainX — Final On-Demand Sync Contract & Production Readiness Verification Report

**Document ID:** `docs/TRAINX_ON_DEMAND_SYNC_FINAL_VERIFICATION.md`  
**Application:** TrainX (`campus-training-portal`)  
**Target Integration:** Career Gateway (`AcadNexus`)  
**Auditor / Roles:** Senior Backend Architect, Integration Security Engineer, Database Architect  
**Audit Date:** November 10, 2026  
**Status:** Verification Completed — Conditionally Production-Ready (Pending Live Staging HTTP Handshake)  

---

## Executive Summary

TrainX has recently introduced an **On-Demand Manual Synchronization Subsystem** alongside its established Daily 02:00 AM Asia/Kolkata Automated Scheduler. This audit evaluates the contract fidelity, directional Machine-to-Machine (M2M) authentication, database idempotency, background worker reliability, multi-tenant RBAC boundaries, and staging HTTP test readiness across the six core areas.

### Overall Production Readiness Verdict

> [!WARNING]
> **Status: CONCURRENT & SECURITY VERIFIED — PENDING FINAL LIVE STAGING HANDSHAKE**  
> All internal contracts, token claim cryptographic controls, separate directional shared secrets, database-level uniqueness constraints, worker crash recovery mechanisms, and multi-tenant authorization boundaries have been audited, remediated, and verified. However, because the Career Gateway staging receiver on port `5011` was offline in the local environment during this audit, **live cross-platform HTTP transmission remains unverified**. Production deployment must not proceed until the single remaining staging handshake has been verified.

---

## Detailed Forensic Audit & Verification Across 6 Areas

---

### Area 1: Tenant Contract

#### 1. Scope & Objective
Verify that `college_id` and `career_gateway_college_id` transmitted in reverse-sync envelopes strictly conform to Career Gateway's receiver validation, verify that internal numeric IDs (e.g., `1`) are never silently transmitted in place of external college slugs (e.g., `col_somaiya_eng_01`), and verify both individual and college-wide sync contracts.

#### 2. Source Code References
- [`Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js#L19-L29)
- [`Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js#L273-L285)
- [`Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js#L40-L75)

#### 3. Evidence & Forensic Finding
- **Initial Finding (Severity: HIGH):** In `onDemandSync.service.js`, the slug resolver `getCollegeExternalSlug` queried `SELECT id, code, career_gateway_college_id FROM colleges`. If `career_gateway_college_id` was `NULL` (common in fresh deployments or default seeds), the function fell back to `String(colRows[0].id)`, sending an internal numeric ID (`"1"`) in `payload.college_id`. When Career Gateway's receiver validated `req.body.college_id` against its external slug registry, it rejected the synchronization with `422 Unprocessable Entity`.
- Furthermore, the envelope only supplied `college_id`. If Career Gateway's receiver parsed `career_gateway_college_id`, it encountered an undefined field.

#### 4. Remediation
1. Upgraded `getCollegeExternalSlug` to enforce an explicit fallback hierarchy prioritizing external slug definitions before any numeric identifier:
   ```javascript
   colRows[0].career_gateway_college_id ||
   process.env.CAREER_GATEWAY_COLLEGE_ID ||
   process.env.TRAINX_COLLEGE_ID ||
   colRows[0].code ||
   String(colRows[0].id)
   ```
2. Configured `CAREER_GATEWAY_COLLEGE_ID=col_somaiya_eng_01` in `Backend/.env` and `Backend/.env.example`.
3. Updated the export envelope in `processSyncExecutionTask` to provide both canonical fields:
   ```javascript
   const payload = {
     source: 'trainx',
     schema_version: '1.0',
     export_id: exportId,
     generated_at: new Date().toISOString(),
     since: null, // Critical: preserves Mode C scheduled sync cursor
     college_id: externalCollegeSlug,
     career_gateway_college_id: externalCollegeSlug, // Dual compatibility
     students_count: studentsCount,
     records_count: total,
     data: { ... }
   };
   ```

#### 5. Verification & Test Result
- Evaluated both Mode A (`manual_student`) and Mode B (`manual_college`).
- Verified that individual sync resolves `targetCgStudentId` and verifies `mappedStudent.college_id === resolvedCollegeId`, rejecting cross-tenant student exports with `422 Tenant mismatch`.
- Verified the generated payload envelope strictly outputs `"college_id": "col_somaiya_eng_01"` and `"career_gateway_college_id": "col_somaiya_eng_01"`. **PASSED**.

---

### Area 2: Directional S2S Authentication

#### 1. Scope & Objective
Ensure strict separation of Machine-to-Machine JWT cryptography between the two communication directions:
- **Inbound (Career Gateway → TrainX):** Enforce `iss: 'career-gateway'`, `aud: 'trainx'`, `sub: 'career-gateway-integration-service'`, and `scope: 'student_sync' | 'training_sync'`.
- **Outbound (TrainX → Career Gateway):** Enforce `iss: 'trainx'`, `aud: 'career-gateway'`, `sub: 'trainx-export-service'`, and `scope: 'training_sync'`.
- Enforce distinct cryptographic secrets for each direction and reject inverted or spoofed claims.

#### 2. Source Code References
- [`Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js#L15-L72)
- [`Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js#L25-L43)
- [`Backend/.env`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/.env)

#### 3. Evidence & Forensic Finding
- **Initial Finding (Severity: CRITICAL):** In `Backend/.env`, both directions were previously referencing a single shared string `career_gateway_trainx_s2s_secret_key_2026`. If an attacker compromised an outbound export token, they could replay it against TrainX's inbound provisioning endpoint unless directional claims and distinct secrets were cryptographically isolated.
- In addition, earlier code allowed an `X-Service-Key` bypass header without Bearer JWT verification.

#### 4. Remediation
1. Eliminated all header bypasses; Bearer JWT is mandatory for all inbound requests.
2. Partitioned the environment configuration into distinct directional keys:
   - Inbound Secret: `TRAINX_INTEGRATION_SECRET=career_gateway_to_trainx_inbound_secret_2026` (verified by `careerGatewayAuth.middleware.js`).
   - Outbound Secret: `TRAINX_TO_CAREER_GATEWAY_SECRET=trainx_to_career_gateway_outbound_secret_2026` (signed by `careerGatewayClient.js`).
3. Inbound middleware verifies exact issuer (`career-gateway`), audience (`trainx`), and subject (`career-gateway-integration-service`). Tokens with `sub: 'trainx-export-service'` (outbound token replayed inbound) are immediately rejected with `403 Forbidden`.
4. Outbound token generator signs tokens with `iss: 'trainx'`, `aud: 'career-gateway'`, `sub: 'trainx-export-service'`, and `scope: 'training_sync'`.

#### 5. Verification & Test Result
- Verified that forged tokens signed with wrong secrets fail with `401 Unauthorized`.
- Verified that tokens with inverted `iss`/`aud` claims fail verification.
- Verified that tokens with missing or wrong `sub` fail with `403 Forbidden: Invalid or missing service token subject`.
- Verified that tokens signed with the outbound secret fail against the inbound middleware. **PASSED**.

---

### Area 3: Database-Level Idempotency

#### 1. Scope & Objective
Audit the migration and schema for `career_gateway_sync_executions`. Verify that `request_id` is mandatory for manual sync requests, enforce database-level uniqueness across tenant and request source, guarantee that concurrent duplicate requests cannot produce duplicate execution records, and verify safe retry semantics.

#### 2. Source Code References
- [`Backend/src/migrations/20261108_career_gateway_on_demand_sync.sql`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/migrations/20261108_career_gateway_on_demand_sync.sql#L4-L29)
- [`Backend/src/config/init_db.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/config/init_db.js#L1024-L1050)
- [`Backend/src/modules/integrations/careerGateway/controllers/careerGatewaySync.controller.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/controllers/careerGatewaySync.controller.js#L39-L47)
- [`Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js#L48-L73)

#### 3. Evidence & Forensic Finding
- **Initial Finding (Severity: HIGH):** `career_gateway_sync_executions` originally had only a non-unique `INDEX idx_cg_sync_request_id (request_id)`. If two identical requests were transmitted simultaneously (e.g., rapid double-clicks on the UI or concurrent webhook retries), both requests passed the preliminary `SELECT` idempotency check before either inserted a record, resulting in race conditions, duplicate execution rows, and dual payload dispatches.
- Furthermore, `request_id` was optional in the controller, allowing callers to submit un-tracked manual sync requests without deduplication keys.

#### 4. Remediation
1. **Schema Uniqueness Constraint:** Added `UNIQUE KEY uq_sync_tenant_req (college_id, trigger_source, request_id)` to both `20261108_career_gateway_on_demand_sync.sql` and `init_db.js` (with idempotent `ALTER TABLE` execution).
2. **Mandatory `request_id` Validation:**
   - In `handleInboundSyncRequest`: Rejects requests lacking `request_id` with `400 Bad Request`.
   - In `handleAdminTriggerSync`: Rejects manual sync requests lacking `request_id` with `400 Bad Request`.
   - In `AD_CareerGatewaySync.jsx`: Frontend generates unique timestamped request IDs (`CG-COL-${Date.now()}` and `CG-STU-${Date.now()}`).
3. **Database Race-Condition Handling:** Wrapped the `INSERT INTO career_gateway_sync_executions` query in a `try...catch` block in `onDemandSync.service.js`. If MySQL emits `ER_DUP_ENTRY`, the service intercepts the error, queries the existing row, and returns the active execution state with `idempotent: true`, eliminating 500 crashes and duplicate processing.
4. **Safe Retry Semantics:** Retrying via `/sync/:syncId/retry` executes with `requestId: 'RETRY-' + existing.sync_id + '-' + Date.now()`, ensuring the retry is auditable without violating the original request's unique constraint.

#### 5. Verification & Test Result
- Verified database rejects duplicate `(college_id, trigger_source, request_id)` combinations.
- Verified that concurrent calls with identical `request_id` return the existing execution state with status `200` or `202` without inserting duplicate rows. **PASSED**.

---

### Area 4: Background Job Reliability

#### 1. Scope & Objective
Verify that asynchronous college-wide synchronizations survive application restarts and background worker failures, prevent records from becoming permanently stuck in `processing` or `queued`, ensure retry behavior never duplicates exports, and confirm complete isolation between manual on-demand syncs and the daily automated scheduler.

#### 2. Source Code References
- [`Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js#L391-L415)
- [`Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js)
- [`Backend/src/modules/integrations/careerGateway/services/trainingDataExport.service.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/services/trainingDataExport.service.js)

#### 3. Evidence & Forensic Finding
- **Initial Finding (Severity: MEDIUM):** If the Node.js server was restarted, terminated, or experienced an unhandled worker panic during an ongoing college-wide export, execution rows in `career_gateway_sync_executions` remained permanently in `processing` or `queued`. Subsequent status inquiries reported the job as active indefinitely.
- In addition, there was a risk that manual exports might overwrite the scheduled sync cursor stored in `career_gateway_sync_checkpoints`.

#### 4. Remediation
1. **Abandoned Job Recovery Engine:** Implemented `recoverAbandonedSyncExecutions(timeoutMinutes = 15)` in `onDemandSync.service.js`:
   ```sql
   UPDATE career_gateway_sync_executions
   SET status = 'failed',
       error_summary = CONCAT('Execution timed out or worker process terminated after ', ?, ' minutes in pending state'),
       completed_at = NOW()
   WHERE status IN ('processing', 'queued')
     AND started_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)
   ```
   This recovery routine executes proactively whenever sync executions or specific execution details are queried.
2. **Scheduler Cursor Isolation:** Confirmed that `executeOnDemandSync` calls `collectTrainingExportRecords` with `sinceTimestamp: null` and never updates `career_gateway_sync_checkpoints`. The 02:00 AM daily scheduler continues to advance its incremental watermark independently.
3. **Async Decoupling:** College-wide exports return `202 Accepted` immediately with status `queued` and execute on `setImmediate()`, preventing HTTP gateway timeouts while recording real-time progress.

#### 5. Verification & Test Result
- Verified that executions in `processing` older than 15 minutes are cleanly transitioned to `failed` with descriptive diagnostic error messages.
- Verified that daily scheduled checkpoint remains unchanged following on-demand executions. **PASSED**.

---

### Area 5: Multi-Tenant Authorization & RBAC

#### 1. Scope & Objective
Verify that `admin` (College Administrator) and `super_admin` access controls are strictly and consistently enforced across frontend and backend, preventing college administrators from viewing or triggering exports for any tenant other than their own.

#### 2. Source Code References
- [`Backend/src/modules/integrations/careerGateway/careerGateway.routes.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/careerGateway.routes.js#L20-L45)
- [`Backend/src/modules/integrations/careerGateway/controllers/careerGatewaySync.controller.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/controllers/careerGatewaySync.controller.js#L86-L98)
- [`Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js`](file:///d:/GANESH%20SHINDE/PROJECT/TRAINING%20PORTAL/Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js#L443-L450)

#### 3. Evidence & Forensic Finding
- **Audit Assessment (Severity: LOW — Design Compliant):**
  - All admin sync endpoints in `careerGateway.routes.js` are protected by `authenticateToken` and `authorizeRoles(ROLES.SUPER_ADMIN, ROLES.COLLEGE_ADMIN)`.
  - Non-superadmin callers (`college_admin`) have their tenant ID bound strictly to `req.user.collegeId`. If an admin passes a different `college_id` in the request body, the controller ignores it and uses `callerCollegeId`.
  - In `getSyncExecutions`, tenant filtering `AND e.college_id = ?` is automatically applied for college administrators.
  - In `getSyncExecutionById`, if a college administrator attempts to view an execution belonging to another college, the service throws `403 Forbidden: Access denied: You are not authorized to view synchronization records for this tenant`.

#### 4. Verification & Test Result
- Verified college admin cannot query foreign tenant executions.
- Verified super admin can query across all colleges or filter by tenant. **PASSED**.

---

### Area 6: Real Integration Test Status & Findings

#### 1. Scope & Objective
Probe local and staging network ports to test live cross-application HTTP transmission between TrainX and Career Gateway.

#### 2. Forensic Probe Execution
A network socket check was performed for port `5011` (the default staging receiver port configured in `CAREER_GATEWAY_API_URL`):
```powershell
Get-NetTCPConnection -LocalPort 5011
```
**Probe Output:**
No TCP socket was active or listening on port `5011` in the local execution environment.

#### 3. Formal Declaration of Staging Integration Status

> [!IMPORTANT]
> **TRANSPARENT DISCLOSURE ON STAGING E2E TESTING:**
> Because the external Career Gateway application service was offline and not listening locally during this audit, **live HTTP transmission across applications could not be executed**.
> 
> As mandated by engineering audit guidelines:
> - **We DO NOT simulate or fabricate a successful HTTP handshake to label it an E2E test.**
> - TrainX's outbound client (`CareerGatewayClient`) handles receiver timeouts and unreachable sockets by marking the sync execution as `partial` or `failed`, logging the exact network error, and allowing one-click retry.
> - The mock-client integration test suite (`tests/career_gateway_on_demand_sync.test.mjs`) confirms that all internal payload assembly, 6-category aggregation, token headers, and acknowledgment parsing work as designed.
> - **Final production readiness requires a live HTTP handshake once the Career Gateway staging receiver is online.**

---

## Summary Findings Matrix

| Finding ID | Area | Description | Severity | Remediated Status | Test Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **FIN-01** | Tenant Contract | Internal numeric `college_id` risked leaking into export payload envelope | **HIGH** | **RESOLVED** | `getCollegeExternalSlug` now prioritizes slug hierarchy + dual fields (`college_id`, `career_gateway_college_id`). |
| **FIN-02** | S2S Auth | Shared symmetric secret in `.env` created reverse replay exposure | **CRITICAL** | **RESOLVED** | Distinct `TRAINX_INTEGRATION_SECRET` and `TRAINX_TO_CAREER_GATEWAY_SECRET` configured; subject validation strictly enforced. |
| **FIN-03** | Idempotency | Missing DB unique constraint on `request_id` allowed race conditions on double-click | **HIGH** | **RESOLVED** | `UNIQUE KEY uq_sync_tenant_req` added to migration and `init_db.js`; `ER_DUP_ENTRY` handled gracefully. |
| **FIN-04** | Idempotency | `request_id` was optional in manual sync controllers | **MEDIUM** | **RESOLVED** | `request_id` is now strictly validated and required (400 Bad Request on omission). |
| **FIN-05** | Reliability | Worker crash or server restart left jobs permanently stuck in `processing` | **MEDIUM** | **RESOLVED** | `recoverAbandonedSyncExecutions(15)` automatically sweeps stale jobs upon query. |
| **FIN-06** | Staging Test | Career Gateway staging receiver offline on local port 5011 | **LOW (Env)** | **DOCUMENTED** | Declared as unverified live integration pending Career Gateway staging service startup. |

---

## Action Items for Deployment

1. **Database Migration:** Ensure `20261108_career_gateway_on_demand_sync.sql` is executed against production or verify table creation via `init_db.js`.
2. **Environment Variables:** Verify production environment possesses:
   - `TRAINX_INTEGRATION_SECRET` (matches Career Gateway outbound service)
   - `TRAINX_TO_CAREER_GATEWAY_SECRET` (matches Career Gateway inbound receiver)
   - `CAREER_GATEWAY_COLLEGE_ID=col_somaiya_eng_01`
   - `CAREER_GATEWAY_API_URL=https://<career-gateway-domain>`
3. **Staging Smoke Test:** Once Career Gateway staging is booted, initiate an individual student sync from Career Gateway and verify HTTP 200 acknowledgment in TrainX execution logs.

