# TRAINX ↔ CAREER GATEWAY INTEGRATION: FINAL SECURITY AND ARCHITECTURE AUDIT REPORT

**Audit Date:** November 7, 2026  
**Auditor:** Principal Software Architect, Senior Application Security Engineer & Independent Security Auditor  
**Repository:** `campus-training-portal` (TrainX)  
**Branch:** `ganeshpakshal` | **Commit:** `da02a5d`  
**Integration Partner:** Career Gateway  
**Audit Scope:** End-to-end integration subsystem, service-to-service authentication, user authentication & token revocation, multi-tenant isolation, data integrity, transactional atomicity, student account lifecycle, training records export, distributed scheduler & locking, legacy bridge decommissioning, and general application security attack surface.

---

## 1. Executive Summary

An independent, code-level, read-only architectural and security verification of the TrainX application (`campus-training-portal`) and its integration interfaces with Career Gateway was conducted. 

### Final Overall Verdict: **CONDITIONAL PASS — REMEDIATION REQUIRED** ⚠️

#### Justification:
The core architectural remediations requested in previous audits have been implemented and verified with 25 passing automated tests:
1. **SEC-01 (JWT Revocation):** Authenticated endpoints and Socket.IO handshakes strictly check `users.is_active === 1` with a fail-closed database query, in-memory caching with immediate invalidation hooks, and forced disconnection of active socket sessions.
2. **DATA-01 (Roll Number Preservation):** `students.roll_number` and `students.clg_id` are decoupled. Institutional roll numbers are preserved on updates unless explicitly overridden.
3. **DATA-02 (Transactional Atomicity):** Inbound provisioning is executed inside an atomic MySQL transaction (`START TRANSACTION` / `COMMIT` / `ROLLBACK`) on a single dedicated connection, with activation emails dispatched only post-commit.
4. **TENANT-01 (Dedicated College Resolution):** Tenant resolution strictly inspects dedicated college identifiers (`college_id`, `career_gateway_college_id`, `college_code`, `college` name) and returns HTTP 422 on unresolved or ambiguous colleges, removing silent production defaults.
5. **ARCH-01 (Legacy Bridge Removal):** Direct cross-database SQL queries have been removed from `sync_career_gateway.js`, `admin.controller.js`, and `careerGatewayBridge.service.js`.

However, staging deployment is approved **conditionally** upon resolving four newly identified security, configuration, and contract findings:
- **[CRITICAL / HIGH] Hardcoded Outbound Fallback Secret (`careerGatewayClient.js` Line 12):** If `TRAINX_TO_CAREER_GATEWAY_SECRET` is unset, the client silently falls back to a hardcoded string `'cg_trainx_outbound_secret_2026'`, violating production secret policy.
- **[HIGH] Subject Claim Verification Bypass (`careerGatewayAuth.middleware.js` Line 63):** Inbound JWT verification uses `if (decoded.sub && decoded.sub !== ...)`. If the incoming token omits the `sub` claim entirely, the check evaluates to `false` and allows the request through.
- **[MEDIUM] Alternative Raw Secret Bypass (`careerGatewayAuth.middleware.js` Line 33):** The middleware allows an undocumented `X-Service-Key` header that bypasses the mandatory HS256 JWT validation contract.
- **[MEDIUM / CONTRACT] Envelope Discrepancies & Unverified Receiver:** The outbound export payload omits `since` and `college_id` envelope fields specified in the integration contract. Furthermore, because Career Gateway's receiver code is external to this repository, end-to-end receiver contract compatibility is **NOT VERIFIED**.

---

## 2. Architecture Verification

The integration architecture establishes a clean, decoupled boundary between TrainX and Career Gateway:

```
+---------------------------------------------------------------------------------------------------------+
|                                           CAREER GATEWAY                                                |
|                            (Master of Student Identity & Eligibility)                                   |
+---------------------------------------------------------------------------------------------------------+
        |                                                                 ^
        | Inbound Provisioning / Revocation                              | Outbound Training Export
        | POST  /api/integrations/career-gateway/students                 | POST /api/integrations/
        | PATCH /api/integrations/career-gateway/students/:id/eligibility |      trainx/training-records
        | S2S Auth: HS256 JWT (iss: career-gateway, aud: trainx)         | S2S Auth: HS256 JWT
        v                                                                 | (iss: trainx, aud: career-gateway)
+---------------------------------------------------------------------------------------------------------+
|                                                TRAINX                                                   |
|                        (Master of Training Activities, Assessments & Attendance)                         |
|                                                                                                         |
|  +----------------------------------+        +-------------------------------------------------------+  |
|  |   careerGatewayAuth.middleware   |        |              dailyTrainingSync.worker.js              |  |
|  +----------------------------------+        +-------------------------------------------------------+  |
|                   |                                                     ^                               |
|                   v                                                     | (02:00 AM IST Cron)           |
|  +----------------------------------+        +-------------------------------------------------------+  |
|  | studentProvisioning.service.js   |        |            careerGatewayScheduler.js                  |  |
|  | - Transactional DB Connection    |        +-------------------------------------------------------+  |
|  | - Independent clg_id & roll_no   |                                   |                               |
|  | - Strict Tenant Resolution (422) |        +-------------------------------------------------------+  |
|  +----------------------------------+        |  MySQL Distributed Advisory Lock (GET_LOCK)           |  |
|                   |                          +-------------------------------------------------------+  |
|                   v                                                                                     |
|  +---------------------------------------------------------------------------------------------------+  |
|  | MySQL Tables: users | students | career_gateway_student_mappings | trainx_training_export_batches |  |
|  +---------------------------------------------------------------------------------------------------+  |
+---------------------------------------------------------------------------------------------------------+
```

### Key Architectural Pillars:
- **Zero Shared Database Access:** No cross-database links (`CG_DB_*`) or database grants exist between the applications.
- **Distinct Credential Lifecycles:** Career Gateway never sends or synchronizes passwords. Newly provisioned students receive single-use activation tokens (72-hour expiry, hashed via SHA-256) to establish private credentials on TrainX.
- **Asymmetric S2S Signing Secret Isolation:** Inbound secret (`CAREER_GATEWAY_SERVICE_SECRET`), outbound secret (`TRAINX_TO_CAREER_GATEWAY_SECRET`), and internal user token secret (`JWT_SECRET`) are distinct and non-interchangeable.

---

## 3. Findings Summary

| ID | Severity | Category | File and Line | Finding | Evidence | Status |
|---|---|---|---|---|---|---|
| **SEC-01** | **HIGH** | Authentication / Revocation | `Backend/src/middleware/auth.middleware.js`<br>Lines 85–140 | **Immediate JWT Revocation Verified:** Stateless token survival has been remediated. `authenticateToken` queries `users.is_active` on each request (optimized with a bounded 30s in-memory cache and immediate purge hook). Revoked users receive HTTP 401. | Verified by automated test in `verify_security_remediation.mjs` Section 1. | **PASS** |
| **SEC-02** | **HIGH** | S2S Authentication | `Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js`<br>Line 12 | **Hardcoded Fallback Outbound Secret:** If `TRAINX_TO_CAREER_GATEWAY_SECRET` is unset in the environment, the client falls back to `'cg_trainx_outbound_secret_2026'`. | `this.serviceSecret = ... \|\| 'cg_trainx_outbound_secret_2026'` | **FAIL** |
| **SEC-03** | **HIGH** | S2S Authentication | `Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js`<br>Lines 63–65 | **Subject Validation Bypass on Missing Claim:** The check `if (decoded.sub && decoded.sub !== ...)` allows tokens that omit the `sub` claim entirely. | `if (decoded.sub && decoded.sub !== 'career-gateway-integration-service')` | **FAIL** |
| **SEC-04** | **MEDIUM** | S2S Authentication | `Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js`<br>Lines 32–42 | **Undocumented Raw Header Authentication Bypass:** Requests presenting `X-Service-Key` matching `CAREER_GATEWAY_SERVICE_SECRET` bypass mandatory HS256 JWT validation. | `if (serviceKey && serviceKey === serviceSecret) return next();` | **FAIL** |
| **SEC-05** | **MEDIUM** | Rate Limiting / DoS | `Backend/src/app.js`<br>Lines 55–58 | **Missing Rate Limiting on Integration Routes:** `/api/integrations/career-gateway` routes lack rate limiting middleware, exposing activation and provisioning endpoints to resource exhaustion. | `app.use('/api/integrations/career-gateway', careerGatewayRoutes)` mounted without `rateLimit` | **FAIL** |
| **DATA-01** | **MEDIUM** | Data Integrity | `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js`<br>Lines 200–205, 260–272 | **Independent Roll Number Storage Verified:** `clg_id` is stored in `students.clg_id` and does not overwrite `students.roll_number`. Existing roll numbers are preserved on update. | Verified by automated test in `verify_security_remediation.mjs` Section 2. | **PASS** |
| **DATA-02** | **HIGH** | Database Atomicity | `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js`<br>Lines 184–195, 529, 550 | **Transactional Provisioning Verified:** All provisioning operations execute on a single connection inside `beginTransaction() / commit() / rollback()`. Emails are queued for post-commit execution. | Verified by automated test in `verify_security_remediation.mjs` Section 3. | **PASS** |
| **TENANT-01** | **HIGH** | Multi-Tenancy | `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js`<br>Lines 12–116 | **Dedicated College Tenant Resolution Verified:** `clg_id` is never used as a college ID. Unresolved, missing, or ambiguous college identifiers return HTTP 422. Silent fallback to `DEFAULT_COLLEGE_ID` removed. | Verified by automated test in `verify_security_remediation.mjs` Section 4. | **PASS** |
| **TENANT-02** | **LOW** | Multi-Tenancy | `Backend/src/socket/interview.socket.js`<br>Line 292 | **Socket Rooms Not Tenant-Qualified:** Sockets join rooms using un-namespaced `sessionId` (`socket.join(sessionId)`) rather than tenant-qualified room identifiers. | `socket.join(sessionId)` | **FAIL** |
| **SYNC-01** | **MEDIUM** | Job Reliability | `Backend/src/scheduler/careerGatewayScheduler.js`<br>Lines 20–44 | **Scheduler Minute-Check Event-Loop Drift Risk:** `setInterval(..., 60000)` checks `kolkataTimeStr === '02:00'`. If event loop lag delays a tick past 02:00:59, the job is omitted for that calendar day. | `if (kolkataTimeStr === '02:00' && lastRunDate !== kolkataDateStr)` | **FAIL** |
| **SYNC-02** | **MEDIUM** | Contract Compatibility | `Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js`<br>Lines 124–139 | **Missing Envelope Fields in Outbound Payload:** Payload omits `since` and `college_id` fields required by the Career Gateway contract envelope. | `payload = { source, schema_version, export_id, generated_at, students_count, records_count, data }` | **FAIL** |
| **SYNC-03** | **INFORMATIONAL** | Contract Verification | External / Out of Scope | **Receiver Contract End-to-End Compatibility Unverified:** Career Gateway receiver source code is not present in this repository. | Receiver endpoint `POST /api/integrations/trainx/training-records` is hosted externally. | **NOT VERIFIED** |
| **ARCH-01** | **LOW** | Code Hygiene | `Backend/src/services/careerGatewayBridge.service.js` | **Legacy Direct SQL Bridge Decommissioned:** Bridge file replaced with deprecated stubs; `admin.controller.js` and `sync_career_gateway.js` refactored to REST worker. | Direct queries to `CG_DB` eliminated. | **PASS** |

---

## 4. Previous Audit Findings — Closure Verification

### SEC-01: Immediate JWT Revocation
- **Previous Finding:** Inbound JWT authentication was completely stateless. Setting `users.is_active = 0` did not invalidate previously issued JWTs, allowing revoked students access for up to 7 days. Socket.IO connections also persisted indefinitely.
- **Current Implementation:** 
  - `auth.middleware.js` (lines 85–140) queries `SELECT id, role, college_id, is_active FROM users WHERE id = ?`. If `is_active !== 1`, requests are rejected with HTTP 401.
  - Fail-closed error handling: If the database lookup throws an error, authentication fails closed with HTTP 401 (`'Authentication verification failed'`).
  - Cache optimization: An in-memory map caches active status for 30 seconds.
  - Instant invalidation: [`invalidateUserAuthCache(userId)`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/middleware/auth.middleware.js#L16-L30) immediately purges the cache and flags the user as inactive for 10 minutes.
  - Socket.IO hardening: `interview.socket.js` verifies active status at handshake, tracks active sockets in `activeUserSockets`, and forces disconnection via [`disconnectUserSockets(userId)`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/socket/interview.socket.js#L26-L42). A packet-level middleware (`socket.use`) terminates in-flight sessions if revoked.
- **Tests Executed:** `verify_security_remediation.mjs` (Section 1 & 5) and `verify_socket_revocation.mjs`.
- **Status:** **PASS** ✅
- **Remaining Risk:** In a multi-instance horizontal cluster, the in-memory cache is node-local (bounded to 30s maximum latency unless Redis Pub/Sub is added).

### DATA-01: Roll Number & `clg_id` Separation
- **Previous Finding:** Incoming `clg_id` was assigned as `rollNumber` and updated into `students.roll_number`, permanently overwriting existing institutional roll numbers.
- **Current Implementation:**
  - `studentProvisioning.service.js` (lines 201–205) extracts `clgId` and `explicitRollNumber` independently.
  - On updating existing mapped students (lines 260–272): `targetRollNumber` preserves `existingStudent?.roll_number` if no explicit roll number is provided in the incoming payload. `clg_id` is updated independently.
  - On reconciling existing users by email (lines 358–365): existing roll numbers are preserved.
- **Tests Executed:** `verify_security_remediation.mjs` (Section 2).
- **Status:** **PASS** ✅
- **Remaining Risk:** None. Fields are completely decoupled.

### DATA-02: Transactional Student Provisioning
- **Previous Finding:** Provisioning executed decoupled `await query(...)` calls without an atomic database transaction, risking orphan user or mapping records upon failure.
- **Current Implementation:**
  - `studentProvisioning.service.js` (lines 184–195) acquires a dedicated connection from `pool.getConnection()` and calls `await connection.beginTransaction()`.
  - All operations (`users`, `students`, `career_gateway_student_mappings`, `student_batches`, `account_activations`, audit events) use `executeQuery` tied to that connection.
  - Helper functions (`resolveCollegeTenant`, `resolveAndAssignBatch`, `createAccountActivation`) accept the connection parameter.
  - `connection.commit()` is executed only after all steps succeed. On any failure, `connection.rollback()` is executed, and `connection.release()` is called in `finally`.
  - Side effects (activation emails) are placed in `pendingPostCommitActions` and dispatched only after commit.
  - Concurrent duplicate provisioning uses `ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)`.
- **Tests Executed:** `verify_security_remediation.mjs` (Section 3).
- **Status:** **PASS** ✅
- **Remaining Risk:** None.

### TENANT-01: Correct College Tenant Resolution
- **Previous Finding:** Resolver inspected `clg_id` as a fallback college ID and silently fell back to `DEFAULT_COLLEGE_ID || 1` in production.
- **Current Implementation:**
  - `studentProvisioning.service.js` (lines 12–116) [`resolveCollegeTenant`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js#L12-L116) resolves exclusively against `career_gateway_college_id`, `college_id`, `college_code`, or validated college name.
  - `clg_id` is never inspected.
  - Unresolved or ambiguous college identifiers throw an error with `err.statusCode = 422`.
  - Silent fallback to `DEFAULT_COLLEGE_ID` has been removed.
- **Tests Executed:** `verify_security_remediation.mjs` (Section 4).
- **Status:** **PASS** ✅
- **Remaining Risk:** None.

### ARCH-01: Legacy Bridge Decommissioning
- **Previous Finding:** `scripts/sync_career_gateway.js` and `admin.controller.js` imported legacy direct database cross-queries against Career Gateway (`acadnexus_db`).
- **Current Implementation:**
  - `sync_career_gateway.js` calls `executeDailyTrainingSync` via REST client.
  - `admin.controller.js` routes admin endpoints to REST worker and monitoring controller.
  - `careerGatewayBridge.service.js` has been replaced with deprecated stubs containing zero SQL queries to `CG_DB`.
- **Tests Executed:** Repository-wide AST/code search.
- **Status:** **PASS** ✅
- **Remaining Risk:** Unused legacy environment variables (`CG_DB_*`) remain in `.env` and should be removed.

---

## 5. Detailed Security Findings & Remediations

### Finding SEC-02: Hardcoded Outbound Fallback Secret
- **Affected File & Line:** [`Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js#L12)
- **Root Cause:** 
  ```javascript
  this.serviceSecret = options.serviceSecret || process.env.TRAINX_TO_CAREER_GATEWAY_SECRET || process.env.TRAINX_INTEGRATION_SERVICE_KEY || 'cg_trainx_outbound_secret_2026';
  ```
- **Exploitation / Failure Scenario:** If the production environment variable `TRAINX_TO_CAREER_GATEWAY_SECRET` is inadvertently omitted, TrainX will sign outbound JWTs with the publicly committed string `'cg_trainx_outbound_secret_2026'`. Any observer with access to the repository could forge outbound tokens or Career Gateway would reject requests if properly configured with a real secret.
- **Impact:** Compromised authenticity of outbound training records; potential rejection of daily export.
- **Recommended Remediation:** Remove the fallback string. Throw an immediate error if `TRAINX_TO_CAREER_GATEWAY_SECRET` is missing:
  ```javascript
  this.serviceSecret = options.serviceSecret || process.env.TRAINX_TO_CAREER_GATEWAY_SECRET || process.env.TRAINX_INTEGRATION_SERVICE_KEY;
  if (!this.serviceSecret) {
    throw new Error('TRAINX_TO_CAREER_GATEWAY_SECRET must be configured in environment');
  }
  ```

### Finding SEC-03: Inbound Subject Validation Bypass
- **Affected File & Line:** [`Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js#L63-L65)
- **Root Cause:**
  ```javascript
  if (decoded.sub && decoded.sub !== 'career-gateway-integration-service') {
    return sendError(res, 'Forbidden: Invalid service token subject', 403);
  }
  ```
- **Exploitation / Failure Scenario:** If an attacker obtains a valid JWT signed by Career Gateway for a different service that omits the `sub` claim or sets it to undefined, `decoded.sub` is falsy, bypassing the subject check entirely.
- **Impact:** Incomplete enforcement of the service-to-service authentication contract.
- **Recommended Remediation:** Enforce subject existence strictly:
  ```javascript
  if (!decoded.sub || decoded.sub !== 'career-gateway-integration-service') {
    return sendError(res, 'Forbidden: Invalid or missing service token subject', 403);
  }
  ```

### Finding SEC-04: Undocumented Raw Secret Header Bypass
- **Affected File & Line:** [`Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js#L32-L42)
- **Root Cause:**
  ```javascript
  if (serviceKey && serviceKey === serviceSecret) {
    req.serviceAuth = { ... };
    return next();
  }
  ```
- **Exploitation / Failure Scenario:** The agreed integration specification stipulates HS256 JWT tokens with expiration and scope verification. Allowing a static `X-Service-Key` header bypasses signature replay protection, token expiration checks, and audience/scope claims.
- **Impact:** Increased attack surface if the static secret is ever leaked in proxy/firewall logs.
- **Recommended Remediation:** Remove the `X-Service-Key` bypass unless explicitly demanded by network infrastructure, in which case it should still be gated behind IP allowlists.

### Finding SEC-05: Unrate-limited Integration & Activation Routes
- **Affected File & Line:** [`Backend/src/app.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/app.js#L55-L58)
- **Root Cause:** `app.use('/api/integrations/career-gateway', careerGatewayRoutes)` is mounted without rate limiting middleware.
- **Exploitation / Failure Scenario:** The public endpoint `POST /api/integrations/career-gateway/activate-account` can be hammered with automated requests. Even though activation tokens have high entropy (256-bit SHA-256), unthrottled requests can cause resource exhaustion (bcrypt hashing is CPU-intensive).
- **Impact:** Denial of Service on backend worker threads.
- **Recommended Remediation:** Mount an integration-specific rate limiter on `careerGatewayRoutes` in `app.js` (e.g., 60 requests per minute).

### Finding SYNC-02: Missing Outbound Envelope Fields
- **Affected File & Line:** [`Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js#L124-L139)
- **Root Cause:** The payload envelope constructed in line 124 omits `since` and `college_id`:
  ```javascript
  const payload = {
    source: 'trainx',
    schema_version: '1.0',
    export_id: exportId,
    generated_at: new Date().toISOString(),
    students_count: studentsCount,
    records_count: total,
    data: { ... }
  };
  ```
- **Impact:** Contract divergence from Career Gateway specification (Section 9 requires `"since"` and `"college_id"` in the envelope).
- **Recommended Remediation:** Include `since: sinceTimestamp` and `college_id: collegeId || null` in the envelope payload.

---

## 6. Multi-Tenant Security Assessment

### Tenant Resolution & Storage
- `resolveCollegeTenant` strictly validates the college against the `colleges` database table.
- Inbound provisioning records the resolved `college_id` in both `users` and `students`.
- Student-batch associations (`resolveAndAssignBatch`) search batches strictly filtered by `WHERE college_id = ?`.

### Query Scoping & IDOR Analysis
- In `student.controller.js` line 197, `getStudentDashboard` contains a fallback: `const collegeId = req.user.collegeId || 1;`. If a student account has a null `collegeId`, it defaults to college ID 1. This fallback should be replaced with an explicit check throwing 403 if `collegeId` is missing.
- In `admin.controller.js`, `getCallerCollegeFilter(req)` strictly binds non-super-admin queries to `req.user.collegeId`.
- Outbound export queries (`trainingDataExport.service.js`) scope `batches`, `sessions`, and `assessments` to the colleges associated with the eligible students (`WHERE b.college_id IN (${collegeInClause})`). When `collegeId` is passed in options, exports are restricted to that single institution.

### Socket.IO Namespace Isolation
- Sockets join candidate session rooms (`socket.join(sessionId)`).
- Session IDs default to `${userId}-${Date.now()}`.
- Because room names are not prefixed by tenant (e.g., `college:${collegeId}:session:${sessionId}`), a theoretical collision in custom session IDs across colleges could map to the same Socket.IO room. 

---

## 7. Data Integrity Assessment

### Identity Mapping & Uniqueness
- Canonical external identity: `career_gateway_student_mappings.career_gateway_student_id` (INT) is unique.
- Database constraints prevent duplicate identities:
  ```sql
  UNIQUE KEY unique_cg_student (career_gateway_student_id),
  UNIQUE KEY unique_tx_user (trainx_user_id)
  ```
- Any attempt to map an existing TrainX user to a different Career Gateway student ID is rejected with HTTP 409 (`studentProvisioning.service.js` lines 340–349).

### Account Reconciliation & Credential Preservation
- Existing TrainX users matched by email during provisioning have their `career_gateway_student_id` linked safely.
- In `studentProvisioning.service.js` line 368, the reconciliation query touches only metadata:
  ```sql
  UPDATE users
  SET career_gateway_student_id = ?, source_system = 'career_gateway',
      provisioned_at = COALESCE(provisioned_at, NOW()), updated_at = NOW()
  WHERE id = ?
  ```
  `password_hash` and `role` are untouched. Existing credentials, role privileges, and learning histories are preserved.

---

## 8. Synchronization Reliability

### Distributed Locking & Concurrency
- `dailyTrainingSync.worker.js` creates a dedicated connection via `createLockConnection()` and requests `SELECT GET_LOCK('trainx_career_gateway_daily_sync_lock', 10)`.
- Concurrent worker invocations on multiple pods are prevented: if `acquired !== 1`, the worker logs a notice and aborts cleanly (`{ status: 'skipped' }`).
- In the `finally` block, `RELEASE_LOCK` is executed on the same physical connection before closing.

### Checkpoint Cursor & Retry Recovery
- Checkpoint advancement occurs **only after** `client.sendTrainingRecords(payload)` completes with an HTTP 2xx response.
- If the Career Gateway endpoint times out, responds with HTTP 5xx, or network drops:
  - `cgResponse` remains null.
  - The export batch is marked `'partial'` / `'failed'`.
  - **`career_gateway_sync_checkpoints` is NOT updated.**
  - On the next scheduled run at 02:00 AM IST, the worker retrieves the previous unadvanced `last_successful_sync_at`, guaranteeing zero data loss.

---

## 9. Test Execution Results

The following automated test suites were executed directly against the local application database:

| Test Command | Total Tests | Passed | Failed | Status |
|---|---|---|---|---|
| `node --test tests/career_gateway_integration.test.mjs` | 1 | 1 | 0 | **EXECUTED AND PASSED** |
| `node scripts/verify_security_remediation.mjs` | 20 | 20 | 0 | **EXECUTED AND PASSED** |
| `node scripts/verify_socket_revocation.mjs` | 4 | 4 | 0 | **EXECUTED AND PASSED** |
| **Combined Verification Total** | **25** | **25** | **0** | **ALL PASSED** |

### Verified Test Matrix:
- [x] **Valid S2S Inbound Token:** Accepted (HTTP 200).
- [x] **Wrong Scope / Issuer:** Rejected.
- [x] **Active User Token:** Accepted (HTTP 200).
- [x] **Revoked User Previously Issued Token:** Rejected immediately (HTTP 401).
- [x] **Deleted / Non-Existent User:** Rejected immediately (HTTP 401).
- [x] **Database Error Fail-Closed:** Handled closed (HTTP 401).
- [x] **Socket.IO Reconnection After Revocation:** Handshake rejected with error.
- [x] **Socket.IO Existing Session:** Received `auth:revoked` event and forcefully disconnected.
- [x] **Roll Number Preservation:** Institutional roll number survives provisioning update containing `clg_id`.
- [x] **Explicit Roll Number Update:** Follows policy.
- [x] **Transactional Rollback on Failure:** Verified; zero orphan user records left on intermediate table error.
- [x] **Concurrent Duplicate Provisioning:** Idempotent; exactly one user and one mapping created.
- [x] **Tenant Resolution:** Dedicated fields resolve; missing/unknown identifiers return HTTP 422; `clg_id` cannot resolve a tenant.
- [x] **End-to-End Revocation Flow:** User `is_active` set to 0, mapping marked revoked, token rejected.

---

## 10. Deployment Readiness Checklist

### Code Security & Authentication
- [x] Internal JWT signing algorithm pinned to `HS256`.
- [x] S2S inbound algorithm pinned to `HS256`.
- [x] Active user validation (`users.is_active === 1`) enforced on every authenticated request.
- [x] Fail-closed error handling implemented on auth database lookups.
- [x] Socket.IO handshake validates active status and enforces immediate disconnect upon revocation.
- [ ] Remove hardcoded fallback secret `'cg_trainx_outbound_secret_2026'` in `careerGatewayClient.js` (**Pending SEC-02 fix**).
- [ ] Enforce strict subject existence check in `careerGatewayAuth.middleware.js` (**Pending SEC-03 fix**).
- [ ] Remove undocumented `X-Service-Key` bypass in `careerGatewayAuth.middleware.js` (**Pending SEC-04 fix**).
- [ ] Add rate limiting to `/api/integrations/career-gateway` routes (**Pending SEC-05 fix**).

### Data Integrity & Multi-Tenancy
- [x] `roll_number` and `clg_id` stored and updated independently.
- [x] Provisioning wrapped in atomic MySQL transaction with post-commit email dispatch.
- [x] Concurrent duplicate provisioning handled idempotently via `LAST_INSERT_ID(id)`.
- [x] Tenant resolution rejects missing/unresolved colleges with HTTP 422 without silent defaults.
- [x] Legacy direct cross-database bridge completely decommissioned.
- [ ] Add `since` and `college_id` to outbound export envelope (**Pending SYNC-02 fix**).

---

## 11. Final Verdict

### **CONDITIONAL PASS — REMEDIATION REQUIRED** ⚠️

TrainX's core integration architecture, data consistency model, and token revocation mechanisms are robust, secure, and thoroughly verified. Deployment to **Staging** is approved once the priority remediations in Section 12 are applied.

*Note: Final production readiness requires mutual end-to-end integration testing against the live Career Gateway staging receiver.*

---

## 12. Next Actions (Prioritized)

1. **[Priority 1 - SEC-02]:** In `Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js`, delete the fallback string `'cg_trainx_outbound_secret_2026'` and throw an explicit error if `TRAINX_TO_CAREER_GATEWAY_SECRET` is unset.
2. **[Priority 2 - SEC-03]:** In `Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js`, change line 63 to require that `decoded.sub` is present and equals `'career-gateway-integration-service'`.
3. **[Priority 3 - SEC-04]:** In `Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js`, remove the raw `x-service-key` header bypass (lines 32–42) to enforce the strict HS256 JWT contract.
4. **[Priority 4 - SEC-05]:** In `Backend/src/app.js`, apply a rate limiter (`express-rate-limit`) to `/api/integrations/career-gateway` routes.
5. **[Priority 5 - SYNC-02]:** In `Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js`, add `since: sinceTimestamp` and `college_id: collegeId || null` to the outer payload envelope.
6. **[Priority 6 - Clean-up]:** Remove obsolete `CG_DB_*` credentials from `Backend/.env`.
7. **[Priority 7 - Staging E2E Testing]:** Execute live end-to-end exchange with the Career Gateway team in the staging environment.

