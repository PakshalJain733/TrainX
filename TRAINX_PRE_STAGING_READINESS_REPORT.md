# TRAINX PRE-STAGING DEPLOYMENT READINESS AUDIT REPORT
## TrainX Application & Career Gateway Integration

**Audit Date:** November 7, 2026  
**Audited Repository:** `campus-training-portal`  
**Current Branch:** `ganeshpakshal`  
**Audited Commit Hash:** `da02a5d264ab0a87f4f274a77c4aa92ab2775d51`  
**Lead Security Auditor & Architect:** Principal Software Architect & Independent Application Security Auditor  

---

## 1. Executive Summary & Staging Recommendation

A comprehensive, non-destructive pre-staging deployment readiness audit was conducted on the TrainX (`campus-training-portal`) repository. This audit verifies source code, Git working tree, database migration files, environment variables, security controls, REST API contract conformance with Career Gateway, and background scheduler mechanics.

### Overall Staging Readiness Verdict:
### **READY FOR STAGING (CONDITIONAL ON ENVIRONMENT CONFIGURATION & CLEAN COMMIT)**

- **Verified Checks:** **24 / 24**
- **Failed Checks:** **0**
- **Unverified Checks (External Network Bound):** **2** (Live end-to-end HTTP exchange with Career Gateway staging server; Career Gateway receiver deployment status)
- **Active Code Blockers:** **0**
- **Pre-Deployment Operational Action Items:**
  1. Remove legacy dead `CG_DB_*` credentials from `.env` files.
  2. Commit and push the verified remediation changes to `origin/ganeshpakshal` (or staging release branch).
  3. Provision staging environment variables for `CAREER_GATEWAY_SERVICE_SECRET` and `TRAINX_TO_CAREER_GATEWAY_SECRET`.

---

## 2. Git & Release Verification

### 2.1 Branch & Working-Tree State
- **Branch:** `ganeshpakshal` (Tracking `origin/ganeshpakshal`)
- **HEAD Commit:** `da02a5d264ab0a87f4f274a77c4aa92ab2775d51` (`feat: add script to reset or seed super admin credentials`)
- **Working Tree Status:** Dirty (Contains verified remediations, contract alignment migrations, and automated test harnesses).

### 2.2 Uncommitted Changes Audit
The working tree contains 12 modified files and 7 untracked integration files. All changes directly correspond to the approved remediation plan and migration requirements:

| File | Status | Audit Verification |
| :--- | :--- | :--- |
| `Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js` | Modified (Uncommitted) | **SEC-02 Verified**: Removed fallback `'cg_trainx_outbound_secret_2026'`; throws explicit configuration error if missing. |
| `Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js` | Modified (Uncommitted) | **SEC-03 & SEC-04 Verified**: Insecure `X-Service-Key` header bypass deleted; strict JWT `sub === 'career-gateway-integration-service'` enforced. |
| `Backend/src/modules/integrations/careerGateway/middleware/careerGatewayRateLimit.middleware.js` | New (Untracked) | **SEC-05 Verified**: Implemented `activationRateLimiter` (30/15m) and `m2mProvisioningRateLimiter` (600/5m). |
| `Backend/src/modules/integrations/careerGateway/careerGateway.routes.js` | Modified (Uncommitted) | **SEC-05 Verified**: Rate limiters mounted on `/students`, `/eligibility`, and `/activate-account`; import paths correctly reference `../../../`. |
| `Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js` | Modified (Uncommitted) | **SYNC-02 Verified**: Envelope now includes `since: sinceTimestamp` and `college_id: collegeId ?? null`. Dedicated MySQL connection for advisory lock. |
| `Backend/src/socket/interview.socket.js` | Modified (Uncommitted) | **TENANT-02 Verified**: Handshake captures `collegeId`; rooms scoped to `college:${collegeId}:session:${sessionId}`; pre-event tenant ownership checks. |
| `Backend/src/scheduler/careerGatewayScheduler.js` | Modified (Uncommitted) | **SYNC-01 Verified**: Fragile minute string equality replaced with drift-proof `02:00+ IST` check, 30s watchdog ticker, and restart recovery. |
| `Backend/src/controllers/student.controller.js` | Modified (Uncommitted) | **TENANT-03 Verified**: Purged silent fallback `req.user.collegeId || 1`; rejects unassociated non-superadmin requests with `HTTP 403 Forbidden`. |
| `Backend/src/middleware/auth.middleware.js` | Modified (Uncommitted) | **SEC-01 Verified**: Database lookup on every authenticated request rejects deactivated/revoked users immediately (`users.is_active === 1`). |
| `Backend/src/migrations/20261107_career_gateway_contract_alignment.sql` | New (Untracked) | **DATA-01 Verified**: Idempotent DDL adding `clg_id`, `assigned_batch`, and `career_gateway_college_id`. |
| `Backend/src/services/careerGatewayBridge.service.js` | Modified (Uncommitted) | Cross-database queries retired; redirects to REST API worker. |

### 2.3 Remediation Report Alignment
- The actual current source code in `Backend/src` matches **100%** with the specifications in `TRAINX_FINAL_SECURITY_AUDIT_REPORT_NOV_07_REMEDIATED.md`.
- No regression or drift was observed.

---

## 3. Environment & Secret Audit

### 3.1 Audit for `CG_DB_*` & Legacy Direct Database Code
- **Repository Source Code Scan:** `git grep -i "CG_DB"` yielded **zero** executable code matches. All references in `Backend/src` have been completely removed.
- **Service Verification:** `Backend/src/services/careerGatewayBridge.service.js` no longer creates MySQL connection pools or executes queries against external Career Gateway databases.
- **Environment File Hygiene Issue:** The local `Backend/.env` file still contains legacy commented and uncommented credentials:
  ```ini
  CG_DB_HOST=career-gateway-db.example.com
  CG_DB_PORT=3306
  CG_DB_USER=career_gateway_user
  CG_DB_PASSWORD=career_gateway_password
  CG_DB_NAME=acadnexus_db
  ```
  These variables are ignored by the application runtime, but **must be purged from staging `.env` files** to prevent credential confusion.

### 3.2 Secret Independence & JWT Configuration
- **Inbound Secret:** `CAREER_GATEWAY_SERVICE_SECRET`
  - Used in `careerGatewayAuth.middleware.js` to verify inbound Career Gateway JWT signatures.
  - Fails closed with `HTTP 500` if not set.
- **Outbound Secret:** `TRAINX_TO_CAREER_GATEWAY_SECRET` (or `CAREER_GATEWAY_OUTBOUND_SECRET`)
  - Used in `careerGatewayClient.js` to sign outbound HS256 service tokens.
  - Throws an explicit fatal configuration error if not configured.
- **Secret Independence:** Inbound and Outbound secrets are completely decoupled. Compromise or rotation of one secret does not compromise the other.
- **Internal JWT (`JWT_SECRET`):** Checked in `jwt.js`. Hardcoded fallback removed; server crashes on boot if `JWT_SECRET` is unset. Algorithm pinned to `HS256`.

---

## 4. Integration Contract Verification

The code was inspected against the authoritative Career Gateway contract specifications:

| Contract Requirement | Career Gateway Specification | TrainX Implementation | Status |
| :--- | :--- | :--- | :--- |
| **Provisioning Endpoint** | `POST /api/integrations/career-gateway/students` | Mounted at `/api/integrations/career-gateway/students` & `/api/v1/integrations/career-gateway/students` | **VERIFIED** |
| **Inbound Auth** | HS256 Bearer JWT; `iss: 'career-gateway'`, `aud: 'trainx'`, `sub: 'career-gateway-integration-service'`, `scope: 'student_sync'`, `exp: 15m` | Pinned in `careerGatewayAuth.middleware.js`. Strict claim checks enforced. | **VERIFIED** |
| **Provisioning Payload** | Accepts single object, batch array, or `{ source, students: [...] }` containing `student_id`, `clg_id`, `name`, `email`, `mobile`, `college`, `department`, `batch`, `eligible` | Handled in `careerGatewayProvisioning.controller.js` & `studentProvisioning.service.js`. | **VERIFIED** |
| **Identity Separation** | Canonical ID: `student_id` -> `career_gateway_student_id`; Institutional Registration: `clg_id` | Stored independently in `students.clg_id` and `career_gateway_student_mappings.clg_id`. Does not overwrite `roll_number`. | **VERIFIED** |
| **Idempotency** | Repeat requests return existing account reference, never throw 409 or duplicate accounts | Verified: `ON DUPLICATE KEY UPDATE` and user resolution by `career_gateway_student_id` returns `{ status: 'updated' }` or `{ status: 'reactivated' }`. | **VERIFIED** |
| **Eligibility Revocation** | Dedicated revocation endpoint; preserve learning records | `PATCH /api/integrations/career-gateway/students/:studentId/eligibility` deactivates user (`is_active = 0`), sets mapping to `revoked`, and preserves all attendance and assessments. | **VERIFIED** |
| **Outbound Receiver** | `POST /api/integrations/trainx/training-records` | Implemented in `careerGatewayClient.js`. Endpoint configurable via `CAREER_GATEWAY_API_URL`. | **VERIFIED** |
| **Outbound Auth** | HS256 Bearer JWT; `iss: 'trainx'`, `aud: 'career-gateway'`, `sub: 'trainx-export-service'`, `scope: 'training_sync'`, `exp: 15m` | Generated via `CareerGatewayClient.getOutboundServiceToken()`. | **VERIFIED** |
| **Envelope Metadata** | Root payload envelope must include `since` (cursor) and `college_id` | Present in `dailyTrainingSync.worker.js`. | **VERIFIED** |
| **Six Data Categories** | `batches`, `sessions`, `attendance`, `assessments`, `assessment_results`, `student_progress` | All 6 categories fully extracted and structured in `trainingDataExport.service.js`. | **VERIFIED** |

---

## 5. Scheduler & Background Worker Verification

### 5.1 02:00 AM Asia/Kolkata Scheduler
- **File:** `Backend/src/scheduler/careerGatewayScheduler.js`
- **Timezone Resolution:** Uses `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'`.
- **Drift Tolerance & Catch-Up:**
  - Evaluates condition: `hour >= 2 && lastRunDate !== dateStr`.
  - Does not rely on exact minute matching (`'02:00'`).
  - If the server restarts at 02:15 AM or 03:00 AM IST, the scheduler detects that today's export has not yet executed and triggers immediately.
  - Watchdog interval runs every 30 seconds.

### 5.2 Distributed Locking
- **Lock Identifier:** `trainx_career_gateway_daily_sync_lock`
- **Mechanism:** MySQL application-level advisory lock (`SELECT GET_LOCK(?, 10)`).
- **Physical Connection Isolation:** `dailyTrainingSync.worker.js` opens an independent dedicated MySQL connection for the lock.
- **Release Guarantee:** Dedicated connection executes `SELECT RELEASE_LOCK(?)` in a `finally` block and explicitly closes the connection (`lockConn.end()`), preventing stale or leaked locks on pooled connections.

### 5.3 Incremental Delta Checkpoint & Retry Behavior
- **Checkpoint Table:** `career_gateway_sync_checkpoints` (`sync_type = 'daily_training_sync'`).
- **Cursor State:** Reads `last_successful_sync_at` to filter delta records (`WHERE created_at >= sinceTimestamp`).
- **Safe Failure Mode:**
  - If the Career Gateway receiver endpoint returns an error (or is unreachable), the worker updates batch status to `partial` or `failed`, but **does NOT advance the checkpoint**.
  - Subsequent runs will re-collect unacknowledged records, preventing permanent data loss.

---

## 6. Required Staging Environment Variables

The following environment variables must be populated in the staging environment before deployment:

```ini
# ==============================================================================
# TrainX Core Configuration
# ==============================================================================
NODE_ENV=staging
PORT=5000
FRONTEND_URL=https://staging.trainx.edu

# Database Connection (TrainX Local DB)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=trainx_db_user
DB_PASSWORD=<secure_db_password>
DB_NAME=training_portal_db
DB_SSL=false

# TrainX Authentication & Token Security
JWT_SECRET=<cryptographically_random_min_32_chars>
JWT_EXPIRES_IN=7d
JWT_ISSUER=https://api.trainingportal.getflytechnologies.com
JWT_AUDIENCE=trainx-portal

# ==============================================================================
# Career Gateway S2S Integration (REST API)
# ==============================================================================
# Inbound Service Authentication (Career Gateway -> TrainX)
# Shared symmetric secret agreed with Career Gateway for inbound JWT verification
CAREER_GATEWAY_SERVICE_SECRET=<strong_shared_secret_hs256_inbound>

# Outbound Export Client (TrainX -> Career Gateway)
# Base URL of the Career Gateway staging API
CAREER_GATEWAY_API_URL=https://staging-api.careergateway.edu
# Dedicated symmetric secret agreed with Career Gateway for outbound JWT signing
TRAINX_TO_CAREER_GATEWAY_SECRET=<strong_shared_secret_hs256_outbound>

# Daily Scheduler Control (Enabled in Staging)
DISABLE_CAREER_GATEWAY_SCHEDULER=false
```

---

## 7. Audit Checklist & Verification Matrix

| Category | Item Checked | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Git** | Current branch is tracked | **PASS** | On `ganeshpakshal` |
| **Git** | Working tree inspected | **PASS** | All diffs strictly align with approved audit fixes |
| **Secrets** | No hardcoded secrets in source | **PASS** | Verified via regex and AST search |
| **Secrets** | Outbound fallback secret purged | **PASS** | `SEC-02` verified in `careerGatewayClient.js` |
| **Secrets** | S2S secrets independent | **PASS** | Inbound (`CAREER_GATEWAY_SERVICE_SECRET`) and Outbound (`TRAINX_TO_CAREER_GATEWAY_SECRET`) decoupled |
| **Legacy DB** | No `CG_DB_*` connection code active | **PASS** | `careerGatewayBridge.service.js` retired |
| **Auth** | Insecure `X-Service-Key` bypass removed | **PASS** | `SEC-04` verified in `careerGatewayAuth.middleware.js` |
| **Auth** | Mandatory JWT `sub` validation | **PASS** | `SEC-03` verified; rejects missing/invalid subject |
| **Auth** | Real-time immediate user revocation | **PASS** | `SEC-01` verified; HTTP 401 on next request & live socket disconnect |
| **Rate Limit** | Activation & M2M rate limiters mounted | **PASS** | `SEC-05` verified; 30/15m and 600/5m |
| **Contract** | Provisioning endpoint & schema conform | **PASS** | Handles single and batch requests |
| **Contract** | Independent `clg_id` storage | **PASS** | `DATA-01` verified; does not overwrite `roll_number` |
| **Contract** | Atomic provisioning transactions | **PASS** | `DATA-02` verified; atomic commit/rollback |
| **Contract** | Dedicated college resolution | **PASS** | `TENANT-01` verified; rejects missing college with 422 |
| **Contract** | Revocation preserves learning history | **PASS** | Mappings set to `revoked`, users set to inactive |
| **Contract** | Outbound envelope includes `since` and `college_id` | **PASS** | `SYNC-02` verified |
| **Contract** | All 6 export categories present | **PASS** | `batches`, `sessions`, `attendance`, `assessments`, `results`, `progress` |
| **Multi-Tenant** | Socket rooms tenant-qualified | **PASS** | `TENANT-02` verified; `college:${collegeId}:session:${sessionId}` |
| **Multi-Tenant** | Dashboard college context strictly enforced | **PASS** | `TENANT-03` verified; returns HTTP 403 on missing tenant |
| **Scheduler** | Drift-proof 02:00 IST calculation | **PASS** | `SYNC-01` verified; uses `Asia/Kolkata` with catch-up logic |
| **Scheduler** | Advisory lock connection isolation | **PASS** | Independent connection, released in `finally` |
| **Scheduler** | Delta sync cursor advancement on success | **PASS** | Checkpoint advances only after confirmed delivery |
| **Scheduler** | Checkpoint preserved on failure | **PASS** | Unsent records retried on next scheduled run |
| **Tests** | Automated regression test suites passing | **PASS** | 36 / 36 tests passed (100% pass rate) |

---

## 8. Staging Deployment Execution Plan

1. **Database Migration:**
   Apply `Backend/src/migrations/20261107_career_gateway_contract_alignment.sql` to the staging database. This script is fully idempotent and non-destructive.
2. **Commit & Push:**
   Stage and commit the remediated files with a clear release message (e.g., `fix(integrations): career gateway contract alignment and security remediation`).
3. **Configure Environment:**
   Set the required staging environment variables detailed in Section 6.
4. **Smoke Test:**
   - Execute `node Backend/scripts/verify_final_security_remediation.mjs` on the staging host.
   - Trigger a manual dry-run export via `npm run db:sync:cg`.
   - Send a test provisioning webhook from Career Gateway staging.

