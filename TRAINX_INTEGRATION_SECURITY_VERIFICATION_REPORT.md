# TrainX–Career Gateway Integration: Final Security and Contract Verification Report

**Document Version:** 1.0.0  
**Audit Date:** November 6, 2026  
**Auditor:** Principal Software Architect & Independent Application Security Auditor  
**Audit Scope:** `campus-training-portal` (TrainX) Integration Subsystem  
**Integration Partner:** Career Gateway  
**Audit Mode:** Read-Only Source Code, Architectural, & Cryptographic Verification  

---

## Executive Summary & Verdict

### Final Audit Verdict: **CONDITIONAL PASS** ⚠️

The TrainX integration architecture for Career Gateway has been thoroughly implemented and adheres closely to modern distributed systems standards. Direct database coupling has been eliminated in favor of an authenticated REST interface with symmetric HMAC-SHA256 (HS256) signed JWT tokens using dedicated, isolated inbound and outbound secrets, MySQL advisory locking for scheduled synchronization, idempotent student provisioning, and granular audit event logging.

However, deployment to **Staging** is approved **conditionally** upon addressing one **HIGH** severity security vulnerability and two **MEDIUM** operational edge cases:
1. **[HIGH] Stateless JWT Token Survival Upon Revocation:** When Career Gateway revokes a student's eligibility (`is_active` set to `0`), previously issued TrainX HTTP access tokens remain valid and accepted across all TrainX endpoints until their 7-day expiration because `auth.middleware.js` performs purely stateless cryptographic signature verification without checking `users.is_active` in the database or a Redis denylist.
2. **[MEDIUM] Unintentional Overwrite of Existing Institutional `roll_number`:** During repeated student updates (`studentProvisioning.service.js` line 162), if `clg_id` is passed, it overwrites the student's existing institutional `roll_number` in `students.roll_number`.
3. **[MEDIUM] Lack of Database Transaction Atomicity:** Student provisioning executes multiple decoupled `await query(...)` operations instead of an atomic transaction (`START TRANSACTION` / `COMMIT`), risking partial database state under concurrent requests or unexpected database disconnects.

---

## 1. Findings Summary by Severity

| ID | Severity | Category | File & Location | Summary of Finding | Remediation Required |
|---|---|---|---|---|---|
| **SEC-01** | **HIGH** | Authentication / Access Control | `Backend/src/middleware/auth.middleware.js`<br>Lines 16–29 | **Stateless JWT Acceptance of Revoked Users:** `authenticateToken` validates the cryptographic signature of the JWT token and extracts `userId`, but does not verify whether `users.is_active === 1`. Revoked students retain full API access until token expiration (up to 7 days). | Add `is_active` check in `authenticateToken` or maintain an in-memory/Redis token revocation denylist. |
| **DATA-01** | **MEDIUM** | Data Integrity | `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js`<br>Lines 92, 160–171 | **`roll_number` Overwritten by `clg_id` on Update:** `rollNumber` defaults to `clgId`. On updating an existing mapped student, `students.roll_number` is overwritten with `clgId`, destroying pre-existing college roll numbers. | Change `roll_number = ?` to `roll_number = COALESCE(roll_number, ?)` or decouple `roll_number` from `clg_id`. |
| **DATA-02** | **MEDIUM** | Concurrency / Race Conditions | `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js`<br>Lines 85–320 | **Non-Transactional Provisioning Sequence:** Database inserts across `users`, `students`, `career_gateway_student_mappings`, and `student_batches` are executed as isolated queries without an enclosing MySQL transaction block. | Wrap the provisioning sequence inside `connection.beginTransaction()` and `commit()`. |
| **ARCH-01** | **LOW** | Code Hygiene & Dead Code | `Backend/src/controllers/admin.controller.js`<br>Lines 2–5, 878–920 | **Residual Legacy Bridge Imports:** While `scripts/sync_career_gateway.js` was refactored to use REST, `admin.controller.js` still imports and references dead functions from `careerGatewayBridge.service.js`. | Remove obsolete imports from `admin.controller.js` and delete `careerGatewayBridge.service.js`. |
| **TENANT-01** | **LOW** | Multi-Tenancy | `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js`<br>Line 25 | **Fallback to Default College ID:** When `college` name or code is missing or unresolvable, the system silently assigns students to `process.env.DEFAULT_COLLEGE_ID || 1`. | Reject the request with HTTP 422 if college tenant resolution fails instead of silently defaulting. |

---

## 2. In-Depth Architectural & Cryptographic Audit

### Section 1: Student Identity & Database Integrity

#### External Identity Mapping
- **Canonical External Identity:** The canonical Career Gateway identifier is stored in `career_gateway_student_mappings.career_gateway_student_id` (INT) and mirrored in `users.career_gateway_student_id` and `students.career_gateway_student_id`.
- **College Registration ID (`clg_id`):** `clg_id` is stored in `students.clg_id` and `career_gateway_student_mappings.clg_id`.
- **Mapping Uniqueness:**
  ```sql
  UNIQUE KEY unique_cg_student (career_gateway_student_id),
  UNIQUE KEY unique_tx_user (trainx_user_id)
  ```
  This schema constraint strictly guarantees a 1:1 bi-directional mapping between Career Gateway students and TrainX users.

#### Exact SQL Statements for `clg_id` and `roll_number`
From `studentProvisioning.service.js`:

1. **Mapping and Roll Number Derivation (Lines 88–92):**
   ```javascript
   const clgId = studentData.clg_id ? String(studentData.clg_id).trim() : null;
   const rollNumber = clgId || studentData.roll_number || studentData.roll_no || `CG-${externalStudentId}`;
   ```

2. **Existing Mapped Student Update (Lines 160–171):**
   ```sql
   UPDATE students
   SET clg_id = COALESCE(?, clg_id), department = ?, department_id = COALESCE(?, department_id),
       roll_number = ?, division = ?, year = ?, semester = ?, cgpa = ?, live_kt = ?, dead_kt = ?,
       placement_status = ?, placed_company = ?, linkedin_url = ?, portfolio_link = ?,
       last_synced_at = NOW()
   WHERE user_id = ?
   ```
   *Analysis:* Here, `roll_number` is unconditionally overwritten with `rollNumber`. If a student already has an existing institutional roll number in TrainX, sending `clg_id` will unintentionally overwrite `roll_number`.

3. **Reconciling Existing User by Email (Lines 217–233):**
   ```sql
   INSERT INTO students (
     user_id, career_gateway_student_id, source_system, college_id, department_id,
     clg_id, roll_number, mobile_number, department, year, division, semester, cgpa,
     live_kt, dead_kt, placement_status, placed_company, linkedin_url, portfolio_link, last_synced_at
   )
   VALUES (?, ?, 'career_gateway', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
   ON DUPLICATE KEY UPDATE
     career_gateway_student_id = VALUES(career_gateway_student_id),
     clg_id = COALESCE(VALUES(clg_id), clg_id),
     department = VALUES(department),
     department_id = COALESCE(VALUES(department_id), department_id),
     year = VALUES(year),
     division = VALUES(division),
     semester = VALUES(semester),
     cgpa = VALUES(cgpa),
     last_synced_at = NOW()
   ```
   *Analysis:* In the email reconciliation path, `roll_number` is correctly preserved because it is omitted from the `ON DUPLICATE KEY UPDATE` clause.

4. **Brand New Student Creation (Lines 273–283):**
   ```sql
   INSERT INTO students (
     user_id, career_gateway_student_id, source_system, college_id, department_id, batch_id,
     clg_id, roll_number, mobile_number, department, year, division, semester, cgpa,
     live_kt, dead_kt, placement_status, placed_company, linkedin_url, portfolio_link, last_synced_at
   )
   VALUES (?, ?, 'career_gateway', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
   ```

---

### Section 2: Existing Account Reconciliation

1. **Email Matching Scope:**
   - In `studentProvisioning.service.js` line 184:
     ```javascript
     const [existingUserByEmail] = await query(
       'SELECT id, career_gateway_student_id, role, password_hash, is_active FROM users WHERE email = ? LIMIT 1',
       [email]
     );
     ```
   - *Tenant Evaluation:* In TrainX, `users.email` is universally unique across the platform (`UNIQUE KEY email (email)`). Therefore, resolving by `email` globally is safe from duplicate collisions within the database schema.
2. **Credential & Role Preservation:**
   - The reconciliation path updates `career_gateway_student_id`, `source_system`, and profile metadata.
   - **Crucially:** `password_hash` and `role` are never touched or modified during reconciliation (Lines 193–199). Existing TrainX student passwords, roles, and course history remain completely unaltered.
3. **Identity Conflict Prevention:**
   - If an existing user in TrainX is already mapped to a *different* Career Gateway student ID, `existingUserByEmail.career_gateway_student_id` will conflict with the incoming `externalStudentId`. The schema's `UNIQUE KEY unique_cg_student` and `UNIQUE KEY unique_tx_user` will throw an ER_DUP_ENTRY error, preventing one TrainX account from being linked to multiple Career Gateway records.

---

### Section 3: Eligibility Revocation & Token Lifecycle Analysis

#### Complete Revocation Trace
When Career Gateway calls `PATCH /api/integrations/career-gateway/students/:studentId/eligibility` with `{ eligible: false, reason: "..." }`:
1. `handleUpdateEligibility` receives the request and verifies the inbound JWT.
2. `revokeStudentEligibility` (`studentProvisioning.service.js` Lines 328–378) executes:
   - Sets `users.is_active = 0` for the corresponding `user_id`.
   - Sets `account_activations.consumed_at = NOW()` to invalidate any unused self-activation tokens.
   - Updates `career_gateway_student_mappings.eligibility_status = 'revoked'` and records `revoked_at`.
   - Records an integration audit event `eligibility_revoked`.

#### Security Assessment of Invalidation Mechanisms
| Surface | Status | Verification Detail |
|---|---|---|
| **New HTTP Login Attempts** | **BLOCKED** ✅ | `auth.service.js` calls `assertUserCanAuthenticate` which explicitly verifies `if (user.is_active !== 1) throw new UnauthorizedError(...)`. |
| **Existing HTTP Access Tokens** | **VULNERABLE** ❌ | **CRITICAL:** `auth.middleware.js` only executes `jwt.verify(token, JWT_SECRET)`. It **does not query the database** to check `users.is_active`. An issued token remains valid until its 7-day expiry! |
| **Pending Account Activations** | **PROTECTED** ✅ | `account_activations` rows are marked `consumed_at = NOW()`, preventing delayed self-activation by a revoked student. |
| **Existing Socket.IO Connections** | **PARTIALLY BLOCKED** ⚠️ | `interview.socket.js` validates JWT at handshake time. Ongoing socket sessions are not terminated in real time upon revocation, though socket reconnection after token expiry is prevented. |

---

### Section 4: Legacy Integration Removal & Decoupling

1. **`Backend/scripts/sync_career_gateway.js`:**
   - Fully refactored. Direct database connections (`CG_DB_HOST`, `CG_DB_USER`, etc.) have been completely removed.
   - Now imports and triggers `executeDailyTrainingSync()` via `dailyTrainingSync.worker.js`.
2. **Residual Code Artifacts:**
   - `Backend/src/services/careerGatewayBridge.service.js` remains present in the filesystem.
   - `Backend/src/controllers/admin.controller.js` lines 2–5 still contain imports:
     ```javascript
     import {
       syncStudentsFromCareerGateway,
       pushReadinessMetricsToCareerGateway,
     } from '../services/careerGatewayBridge.service.js';
     ```
   - While the automated daily sync does not call these legacy routines, their presence in `admin.controller.js` poses dead code maintenance risk.

---

### Section 5: Multi-Tenant Isolation

1. **College Tenant Resolution:**
   - Evaluated in `resolveCollegeTenant` (`studentProvisioning.service.js` Lines 13–25):
     ```javascript
     const [college] = await query(
       `SELECT id FROM colleges 
        WHERE career_gateway_college_id = ? OR UPPER(code) = UPPER(?) OR UPPER(name) = UPPER(?)
        LIMIT 1`,
       [studentData.college_id || studentData.clg_id, collegeIdentifier, collegeIdentifier]
     );
     ```
   - If unmatched, line 25 falls back to `process.env.DEFAULT_COLLEGE_ID || 1`.
   - *Risk:* In a multi-tenant deployment, unmatched college strings could assign students into the default institution.
2. **Export Scoping:**
   - In `trainingDataExport.service.js` lines 50–58:
     ```javascript
     let mappingsQuery = `
       SELECT m.trainx_user_id, m.career_gateway_student_id, u.college_id
       FROM career_gateway_student_mappings m
       JOIN users u ON u.id = m.trainx_user_id
       WHERE m.eligibility_status = 'eligible'
     `;
     ```
   - When `college_id` is passed in options, exports are strictly filtered to the specified college tenant.

---

### Section 6: Career Gateway Payload Compatibility

TrainX exports data to Career Gateway via `POST /api/integrations/trainx/training-records`.

```json
{
  "source": "trainx",
  "schema_version": "1.0",
  "export_id": "exp_1730900000000_abc123",
  "generated_at": "2026-11-06T02:00:00.000Z",
  "since": "2026-11-05T02:00:00.000Z",
  "college_id": null,
  "students_count": 142,
  "records_count": 512,
  "data": {
    "batches": [],
    "sessions": [],
    "attendance": [],
    "assessments": [],
    "assessment_results": [],
    "student_progress": []
  }
}
```

#### Contract Alignment Comparison Table
| Career Gateway Expected Category | TrainX Export Source | Field Mapping & Canonical ID Integrity | Status |
|---|---|---|---|
| `batches` | `batches` table | `batch_id`, `name`, `code`, `start_date`, `end_date`, `status` | COMPLIANT ✅ |
| `sessions` | `training_sessions` table | `session_id`, `batch_id`, `title`, `session_date`, `start_time` | COMPLIANT ✅ |
| `attendance` | `attendance` table | Mapped to `career_gateway_student_id` via `userToCgMap` | COMPLIANT ✅ |
| `assessments` | `assessments` table | `assessment_id`, `title`, `type`, `total_marks`, `passing_marks` | COMPLIANT ✅ |
| `assessment_results` | `assessment_submissions` | Mapped to `career_gateway_student_id`, scores & pass/fail status | COMPLIANT ✅ |
| `student_progress` | `roadmaps`, `task_submissions` | Aggregated completion percentages, problems solved, tasks done | COMPLIANT ✅ |

---

### Section 7: Scheduler & Distributed Locking

1. **Schedule Execution:**
   - Implemented in `careerGatewayScheduler.js`:
     ```javascript
     cron.schedule('0 2 * * *', () => executeDailyTrainingSync(), { timezone: 'Asia/Kolkata' });
     ```
   - Fires reliably at 02:00 AM Indian Standard Time.
2. **Distributed Advisory Lock:**
   - Uses native MySQL advisory locking on a dedicated connection:
     ```sql
     SELECT GET_LOCK('trainx_career_gateway_daily_sync_lock', 10) AS lock_acquired
     ```
   - Guarantees that across multiple clustered TrainX Node.js server instances, only one instance runs the export.
   - Released safely in a `finally` block:
     ```sql
     SELECT RELEASE_LOCK('trainx_career_gateway_daily_sync_lock')
     ```
3. **Cursor Checkpointing:**
   - Table `career_gateway_sync_checkpoints` stores `last_successful_sync_at`.
   - Cursor advances **only after** an HTTP 200/201 response is acknowledged by Career Gateway (`dailyTrainingSync.worker.js` Lines 145–158).
   - In case of network drops or HTTP 5xx errors, the cursor remains unadvanced, guaranteeing complete delivery on retry.

---

### Section 8: JWT & Cryptographic Configuration Review

| Configuration Parameter | Inbound (CG ➔ TrainX) | Outbound (TrainX ➔ CG) | User Authentication |
|---|---|---|---|
| **Endpoint** | `POST /api/integrations/career-gateway/students` | `POST /api/integrations/trainx/training-records` | `/api/auth/login` |
| **Algorithm** | `HS256` | `HS256` | `HS256` |
| **Secret Environment Variable** | `CAREER_GATEWAY_SERVICE_SECRET` | `TRAINX_TO_CAREER_GATEWAY_SECRET` | `JWT_SECRET` |
| **Issuer (`iss`)** | `career-gateway` | `trainx` | `trainx-auth` |
| **Audience (`aud`)** | `trainx` | `career-gateway` | Not set |
| **Subject (`sub`)** | `career-gateway-integration-service` | `trainx-export-service` | `userId` |
| **Required Scope (`scope`)** | `student_sync` | `training_sync` | N/A |
| **Token Lifetime** | 15 minutes (Max 1 hour) | 15 minutes | 7 days |
| **Secret Segregation** | **ISOLATED** ✅ | **ISOLATED** ✅ | **ISOLATED** ✅ |

---

## 3. Recommended Remediation & Action Plan

Before promoting this build to production:

### Priority 1: Remediate Stateless JWT Token Invalidation (SEC-01)
Update `Backend/src/middleware/auth.middleware.js` to verify user status:
```javascript
// Add quick database check or Redis lookup
const [user] = await query('SELECT is_active FROM users WHERE id = ? LIMIT 1', [decoded.userId]);
if (!user || user.is_active !== 1) {
  return res.status(401).json({ success: false, message: 'Account is inactive or revoked' });
}
```

### Priority 2: Fix `roll_number` Overwrite (DATA-01)
Update `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js` line 162:
```javascript
// Preserve existing institutional roll_number if already set
roll_number = COALESCE(roll_number, ?)
```

### Priority 3: Add Transaction Wrapper (DATA-02)
Wrap the entire student provisioning logic inside a database transaction (`pool.getConnection()` -> `connection.beginTransaction()` -> `connection.commit()` / `connection.rollback()`).

---

## 4. Staging Readiness Checklist

- [x] Inbound Career Gateway JWT verification conforms to HS256, issuer, audience, and scope.
- [x] Outbound Career Gateway JWT generation uses isolated secrets and correct claims.
- [x] Canonical Career Gateway `student_id` is maintained in database mappings.
- [x] Direct cross-database SQL queries removed from synchronization pipeline.
- [x] Distributed lock prevents concurrent export workers across multiple pods.
- [x] Sync checkpoint cursor updates only upon verified HTTP receipt.
- [ ] Active HTTP tokens invalidated immediately upon eligibility revocation (**Pending SEC-01 fix**).
- [ ] Existing institutional `roll_number` protected during student updates (**Pending DATA-01 fix**).
- [ ] Student provisioning operations wrapped in transactional atomicity (**Pending DATA-02 fix**).

---
*Report certified by Independent Application Security & Architecture Audit.*

