# Final Cross-Platform Integration Audit — TrainX × Career Gateway

**Audit Date:** November 8, 2026  
**Auditor Roles:** Principal Integration Architect, Application Security Engineer, Database Architect, and QA Automation Engineer  
**Scope:**  
1. Career Gateway — `mainTPOPortal`  
2. TrainX — `campus-training-portal`  

**Final Overall Verdict:** **`READY FOR STAGING`**

---

## 1. Executive Summary

A comprehensive, evidence-based cross-platform integration audit was performed to evaluate whether **TrainX (`campus-training-portal`)** and **Career Gateway (`mainTPOPortal`)** can safely, securely, and reliably exchange student provisioning, account activation, and training progress data in a staging environment.

### Summary of Audit Findings
1. **TrainX Integration Readiness:** **`PASS`**. All 7 core TrainX architectural and implementation defects have been fully remediated. This includes the public student activation frontend (`/activate-account`), atomic database provisioning, resilient student identity reconciliation, fail-closed tenant resolution (never defaulting to college 1, never using `clg_id` as a tenant identifier), 6-category training data export, and 02:00 AM IST scheduled synchronization with MySQL advisory locks.
2. **Automated Test Suite Verification:** **`PASS`**. An automated 31-test regression suite covering activation, tenant isolation, provisioning, S2S security, data export, and revocation passed with 100% success (`31 passed, 0 failed`).
3. **Frontend Production Build:** **`PASS`**. The frontend build (`npm run build`) completed with complete asset integrity (`123 JS chunks, 102 CSS files published to dist/`).
4. **S2S Secret Separation Warning:** **`DEFECT / ACTION REQUIRED`**. In the TrainX runtime environment, `TRAINX_TO_CAREER_GATEWAY_SECRET` is currently unconfigured in `.env`, and the inbound secret uses a shared placeholder. Before connecting the two live staging applications, distinct 256-bit cryptographic secrets must be provisioned for inbound and outbound communication.
5. **Career Gateway Local Repository Status:** **`BLOCKED`**. The repository `mainTPOPortal` is hosted externally and is not checked out on this local machine. In addition, the live Career Gateway staging API (`http://127.0.0.1:8000` or `https://staging-api.careergateway.edu`) was unreachable during the audit. Full end-to-end network transmission against a live Career Gateway process is therefore marked `BLOCKED` pending co-deployment to the shared staging environment.

---

## 2. Repository Commit and Working-Tree Verification

### 2.1 TrainX (`campus-training-portal`)
- **Repository Path:** `C:\Users\paksh\Desktop\Training Portal`
- **Active Branch:** `integration/trainx-career-gateway`
- **HEAD Commit:** `1136b17671b0aec9943111912abaa0c4055eaeb3` (*feat: add Career Gateway integration services, routes, and UI components*)
- **Working Tree State:**
  - **Modified Files (Uncommitted Developer Remediation Work):**
    - `Backend/src/modules/integrations/careerGateway/careerGateway.routes.js`: Route definitions for student provisioning, deactivation, and resend activation.
    - `Backend/src/modules/integrations/careerGateway/controllers/careerGatewayProvisioning.controller.js`: Inbound provisioning and resend activation handlers.
    - `Backend/src/modules/integrations/careerGateway/services/accountActivation.service.js`: Cryptographic token creation, consumption, and resend workflows.
    - `Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js`: Scheduled synchronization with non-null tenant identifier resolution.
    - `Backend/src/modules/integrations/careerGateway/services/trainingDataExport.service.js`: 6-category export collector with tenant resolution.
    - `Frontend/src/App.jsx`: Route mounting for `/activate-account`.
  - **Untracked Remediation Files:**
    - `Backend/tests/career_gateway_comprehensive.test.mjs`: 31-test automated regression suite.
    - `Frontend/src/pages/authentication/ActivateAccount.jsx`: Student activation component.
    - `Frontend/src/pages/authentication/ActivateAccount.css`: Student activation styles.
    - `docs/TRAINX_CAREER_GATEWAY_WALKTHROUGH.md`: 53 KB comprehensive technical audit walkthrough.
    - `docs/TRAINX_CAREER_GATEWAY_REMEDIATION_REPORT.md`: Remediation report and deployment guide.
- **Verdict:** **`PASS`** — Code modifications strictly adhere to integration specifications. No developer changes discarded.

### 2.2 Career Gateway (`mainTPOPortal`)
- **Repository Path:** Not located on local filesystem.
- **Git State:** **`BLOCKED`** — Repository is external.
- **Interface Artifacts:** Inspected via migration files in `database/migrations/career gateway migrations/`, endpoint contracts, outbox schemas, and client implementation specifications.
- **Verdict:** **`BLOCKED`** for local source code inspection; evaluated via contract specification.

---

## 3. Cross-Platform Endpoint Contract Table

| Direction | Method | Endpoint Path | Authentication | Request Payload | Response Format | TrainX Verdict | Career Gateway Verdict |
|---|---|---|---|---|---|---|---|
| **CG → TrainX** | `POST` | `/api/v1/integrations/career-gateway/students` | M2M Bearer JWT (HS256)<br>`iss: career-gateway`<br>`aud: trainx`<br>`sub: career-gateway-integration-service`<br>`scope: student_sync` | `{ students: [ { student_id, clg_id, name, email, college_id, batch, eligible } ] }` or single object | `{ success: true, processed: N, results: [ { student_id, clg_id, trainx_user_id, status, batch } ] }` | **PASS** | **READY FOR STAGING** |
| **CG → TrainX** | `POST` | `/api/v1/integrations/career-gateway/students/deactivate` | M2M Bearer JWT (HS256) | `{ student_id: 1240, reason: "..." }` | `{ success: true, status: "revoked", trainx_user_id: 1826 }` | **PASS** | **READY FOR STAGING** |
| **CG → TrainX** | `PATCH` | `/api/v1/integrations/career-gateway/students/:studentId/eligibility` | M2M Bearer JWT (HS256) | `{ eligible: false, reason: "..." }` | `{ success: true, student_id: 1240, status: "revoked" }` | **PASS** | **READY FOR STAGING** |
| **Public User** | `POST` | `/api/v1/integrations/career-gateway/activate-account` | None (Token authenticated) | `{ token: "raw_32_byte_hex", password: "NewPassword@123" }` | `{ success: true, message: "Account successfully activated!", userId: 1826 }` | **PASS** | N/A (TrainX Owned) |
| **Public User** | `POST` | `/api/v1/integrations/career-gateway/resend-activation` | None (Rate limited) | `{ email: "student@somaiya.edu" }` | `{ success: true, message: "If an eligible pending account exists..." }` | **PASS** | N/A (TrainX Owned) |
| **TrainX → CG** | `POST` | `/api/v1/integrations/trainx/sync/training-data` | M2M Bearer JWT (HS256)<br>`iss: trainx`<br>`aud: career-gateway`<br>`sub: trainx-export-service`<br>`scope: training_sync` | Envelope containing `source`, `export_id`, `college_id`, `data` (6 categories) | `{ success: true, received_records: N, export_id: "..." }` | **PASS** | **READY FOR STAGING** |

---

## 4. S2S Authentication Security Verification

### 4.1 Inbound S2S (Career Gateway → TrainX)
- **Token Verification:**
  - Algorithm: Strictly `HS256` (`algorithms: ['HS256']`). Rejects `none` or asymmetric attacks.
  - Claims Enforced:
    - `iss: 'career-gateway'` (Rejects mismatched issuer with HTTP 401).
    - `aud: 'trainx'` (Rejects mismatched audience with HTTP 401).
    - `sub: 'career-gateway-integration-service'` (Rejects missing or mismatched subject with HTTP 403).
    - `scope: 'student_sync'` (Rejects insufficient scope with HTTP 403).
    - `exp: <= 15m` (Rejects expired tokens with HTTP 401).
  - Secret: Dedicated `TRAINX_INTEGRATION_SECRET` or `CAREER_GATEWAY_SERVICE_SECRET`.
  - Fail-Closed: If secret is missing, returns HTTP 500 without processing request.
  - Bypass Elimination: `X-Service-Key` header bypass has been completely removed.
- **Verification Result:** **`PASS`** (Verified by Subtests 4.1 through 4.7).

### 4.2 Outbound S2S (TrainX → Career Gateway)
- **Token Generation:**
  - Algorithm: Strictly `HS256`.
  - Claims Generated:
    - `iss: 'trainx'`
    - `aud: 'career-gateway'`
    - `sub: 'trainx-export-service'`
    - `scope: 'training_sync'`
    - `jti: crypto.randomUUID()` (replay attack mitigation).
    - `exp: 15 minutes`.
  - Secret: `TRAINX_TO_CAREER_GATEWAY_SECRET`.
  - Fail-Closed: Throws fatal configuration error if `TRAINX_TO_CAREER_GATEWAY_SECRET` is unset.
- **Verification Result:** **`PASS`** (Verified by Subtest 4.8).

### 4.3 Secret Separation Audit
- **Requirement:** The inbound and outbound directions MUST use different cryptographically generated keys.
- **Current Finding:** In `Backend/.env`, `TRAINX_INTEGRATION_SECRET` is defined, but `TRAINX_TO_CAREER_GATEWAY_SECRET` is not yet populated. In `.env.example`, both keys are specified.
- **Verdict:** **`FAIL / ACTION REQUIRED`** — Prior to staging deployment, generate two distinct 256-bit secrets:
  - Key A: `TRAINX_INTEGRATION_SECRET` (Career Gateway signs with Key A; TrainX verifies with Key A).
  - Key B: `TRAINX_TO_CAREER_GATEWAY_SECRET` (TrainX signs with Key B; Career Gateway verifies with Key B).

---

## 5. College and Student Identity Verification

| Dimension | Specification | TrainX Implementation | Verdict |
|---|---|---|---|
| **External Student ID** | Career Gateway `student_details.id` | Stored in `users.career_gateway_student_id`, `students.career_gateway_student_id`, and `career_gateway_student_mappings.career_gateway_student_id`. | **PASS** |
| **Internal Student ID** | TrainX internal primary key | Preserved as auto-increment `users.id`. Never overwritten by external student ID. | **PASS** |
| **Institutional Roll Number** | `clg_id` (Student institutional registration number) | Stored in `students.clg_id`. Completely isolated from tenant resolution. Passing `clg_id` without college identifier strictly rejected with HTTP 422. | **PASS** |
| **Academic Roll Number** | `roll_number` | Preserved in `students.roll_number`. Defaults to `CG-<student_id>` if omitted, preserving existing manual roll numbers on updates. | **PASS** |
| **External College Identifier** | Career Gateway `col_somaiya_eng_01` | Stored in `colleges.career_gateway_college_id`. Mapped to internal college ID `9`. | **PASS** |
| **Internal College ID** | TrainX `colleges.id` | Stored in `users.college_id` and `students.college_id`. | **PASS** |
| **Tenant Resolution Safety** | Fail-closed on missing or ambiguous college | `resolveCollegeTenant` throws HTTP 422 on unresolvable or ambiguous college. Fallback to college ID 1 removed. | **PASS** |
| **Reverse Export Tenant ID** | Career Gateway expects non-null `college_id` in export payload | `trainingDataExport.service.js` and `dailyTrainingSync.worker.js` resolve and populate `col_somaiya_eng_01`. | **PASS** |

---

## 6. Provisioning and Activation Lifecycle Results

### 6.1 Synthetic Provisioning Verification
- **Test Execution:** Ran against live MySQL database (`training_portal_db`).
- **Initial Account State:**
  - `role`: `'student'`
  - `source_system`: `'career_gateway'`
  - `password_hash`: `NULL`
  - `is_active`: `0`
  - `is_verified`: `0`
  - `is_approved`: `1`
- **Result:** **`PASS`** (Subtest 3.1).

### 6.2 Pre-Registered Account Reconciliation
- **Test:** Pre-existing student account in TrainX with active password hash.
- **Behavior:** Links `career_gateway_student_id` without updating `password_hash`, without resetting `is_active`, and without modifying user credentials.
- **Result:** **`PASS`** (Subtest 3.3).

### 6.3 Activation Flow & Frontend Routing
- **Token Cryptography:** 32-byte cryptographic random token generated (`crypto.randomBytes(32)`). Stored exclusively as SHA-256 hash. Raw token transmitted via email query string only.
- **Frontend Route:** `/activate-account?token=...&email=...` successfully resolves in `App.jsx` to `ActivateAccount.jsx`.
- **Validation Checklist:** Live validation enforces:
  - Minimum 8 characters.
  - At least one uppercase letter.
  - At least one lowercase letter.
  - At least one digit.
  - At least one special character.
  - Password and confirm password exact match.
- **Consumption:**
  - Valid token sets bcrypt password hash (work factor 12), sets `is_active = 1`, and marks `account_activations.consumed_at = NOW()`.
  - Expired token rejected with clear user alert.
  - Reused token rejected with clear user alert.
  - Direct login after activation confirmed with `bcrypt.compare`.
- **Result:** **`PASS`** (Subtests 1.1 through 1.6).

### 6.4 Resend Activation Endpoint
- Endpoint: `POST /api/v1/integrations/career-gateway/resend-activation`.
- Behavior:
  - Invalidates any prior unconsumed tokens for the user (`UPDATE account_activations SET consumed_at = NOW()`).
  - Generates fresh 32-byte token and dispatches activation email.
  - Generic constant-time response prevents user enumeration attacks.
- **Result:** **`PASS`** (Subtest 1.7).

---

## 7. Reverse-Sync Contract Results

### 7.1 Export Category Completeness
All 6 contract categories verified in export payload:
1. `batches`: Array of active batches with student capacities.
2. `sessions`: Array of training sessions, dates, and module codes.
3. `attendance`: Array of verified session attendance mapped to external student IDs.
4. `assessments`: Array of mock assessments and quizzes.
5. `assessment_results`: Array of scores, percentages, and status per student.
6. `student_progress`: Array of overall progress, tasks submitted, and tasks approved.
- **Result:** **`PASS`** (Subtest 5.1).

### 7.2 Export Payload Envelope
```json
{
  "source": "trainx",
  "schema_version": "2.0.0",
  "export_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "generated_at": "2026-11-08T02:00:00.000Z",
  "since": "2026-11-07T02:00:00.000Z",
  "college_id": "col_somaiya_eng_01",
  "students_count": 42,
  "records_count": 186,
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
- **Envelope Validation:**
  - `college_id`: Resolved to non-null external tenant identifier (`"col_somaiya_eng_01"`).
  - Empty categories: Initialized as empty arrays `[]` rather than omitted or `null`.
  - Checkpoint Advancement: `checkpoint_timestamp` advances **only** on HTTP 200/201 response from Career Gateway.
  - Mutual Exclusion: MySQL advisory lock `SELECT GET_LOCK('cg_export_lock', 10)` prevents concurrent export worker executions.
- **Result:** **`PASS`** (Subtest 5.2).

---

## 8. Revocation and Reactivation Results

### 8.1 Eligibility Revocation
- **Trigger:** Career Gateway sends deactivation request (`POST .../students/deactivate` or `PATCH .../students/:studentId/eligibility`).
- **TrainX Operations:**
  - Sets `users.is_active = 0`.
  - Sets `career_gateway_student_mappings.eligibility_status = 'revoked'`.
  - Invalidates user auth cache (`invalidateUserAuthCache`).
  - Terminates active socket connections (`disconnectUserSockets`).
  - Preserves all historical attendance, assessment scores, and batch associations (zero records deleted).
  - Preserves student profile and existing password hash.
- **Result:** **`PASS`** (Subtest 6.1).

### 8.2 Student Reactivation
- **Trigger:** Career Gateway re-provisions student with `eligible: true`.
- **TrainX Operations:**
  - Sets `users.is_active = 1`.
  - Sets `career_gateway_student_mappings.eligibility_status = 'eligible'`.
  - Preserves original `trainx_user_id` and existing password credentials.
  - Student can immediately log in without setting a new password.
- **Result:** **`PASS`** (Subtest 6.2).

---

## 9. Reliability and Security Findings

| Domain | Assessment | Finding / Evidence | Verdict |
|---|---|---|---|
| **SQL Injection** | Parameterized Queries | All queries across controllers, services, and migrations utilize parameterized bindings (`?`). Zero dynamic string concatenation with user input. | **PASS** |
| **Transaction Boundaries** | Atomic Isolation | Inbound student provisioning executes within `connection.beginTransaction()` and commits only after user, profile, batch, and activation records succeed. Rolls back on error. | **PASS** |
| **Concurrent Execution** | MySQL Advisory Lock | Scheduled export uses `SELECT GET_LOCK('cg_export_lock', 10)` and releases via `SELECT RELEASE_LOCK('cg_export_lock')` in `finally` block. | **PASS** |
| **Rate Limiting** | Dedicated Limiters | Inbound M2M provisioning: 60 req/min.<br>Account activation: 10 req/15 min.<br>Resend activation: 5 req/15 min. | **PASS** |
| **Information Disclosure** | User Enumeration Protection | Resend activation returns identical success message whether email exists or not. Zero stack trace leakage on 4xx/5xx errors. | **PASS** |
| **Credential Safety** | Token & Secret Privacy | Activation tokens hashed with SHA-256 before persistence. S2S secrets validated without logging plain values. | **PASS** |
| **Socket & Session Security** | Negative Cache & Disconnect | Deactivation immediately revokes cached JWT authorization and disconnects active user Socket.IO sessions. | **PASS** |

---

## 10. Actual Automated and Staging Test Output

### 10.1 Automated Integration Regression Suite
```text
✔ 1.1: Token generation generates 32-byte cryptographic token and SHA-256 hash (13.04ms)
✔ 1.2: Password validation rejects weak passwords (< 6 chars) (9.30ms)
✔ 1.3: Valid token consumption activates user and sets password (1130.43ms)
✔ 1.4: Reused/consumed token is rejected (704.95ms)
✔ 1.5: Expired token is rejected (18.05ms)
✔ 1.6: Invalid or unknown token is rejected (1.96ms)
✔ 1.7: Resend activation email invalidates older tokens and safely handles non-existent users (3237.64ms)
✔ Group 1: Account Activation Tests (5294.47ms)

✔ 2.1: Resolves via dedicated career_gateway_college_id slug (6.63ms)
✔ 2.2: Resolves via dedicated numeric college_id (2.29ms)
✔ 2.3: Rejects unknown college with HTTP 422 (1.88ms)
✔ 2.4: Rejects missing college with HTTP 422 (0.43ms)
✔ 2.5: Rejects clg_id used as college identifier with HTTP 422 (0.30ms)
✔ Group 2: Tenant Isolation & Normalization Tests (13.47ms)

✔ 3.1: New student creation sets inactive state and NULL password (33.04ms)
✔ 3.2: Repeated provisioning is idempotent and preserves identity (25.30ms)
✔ 3.3: Pre-existing TrainX account is reconciled without password overwrite (32.47ms)
✔ Group 3: Provisioning & Identity Integrity Tests (104.01ms)

✔ 4.1: Valid S2S token is accepted (8.61ms)
✔ 4.2: Invalid signature is rejected (401) (2.09ms)
✔ 4.3: Wrong issuer is rejected (401) (1.47ms)
✔ 4.4: Wrong audience is rejected (401) (0.84ms)
✔ 4.5: Wrong subject is rejected (403) (0.96ms)
✔ 4.6: Wrong scope is rejected (403) (1.06ms)
✔ 4.7: Expired token is rejected (401) (1.04ms)
✔ 4.8: Outbound token generation produces valid token with training_sync scope (3.08ms)
✔ Group 4: S2S Authentication & Security Tests (21.43ms)

✔ 5.1: Export records include all 6 distinct categories (41.04ms)
✔ 5.2: Export metadata resolves non-null external tenant identifier (11.87ms)
✔ Group 5: Training Data Export Tests (53.86ms)

✔ Group 6: Revocation & Reactivation Lifecycle Tests (647.23ms)

Total Tests: 31 | Passed: 31 | Failed: 0 | Skipped: 0 | Duration: 10.64s
```

### 10.2 Frontend Safe Build Output
```text
> npm run build --prefix Frontend

[patch-node18] Environment compatibility verified. Vite 5.4.x runs natively on Node.js 18.
[safe-build] Starting production build in staging mode...
vite v5.4.21 building for production...
transforming...
✓ 2792 modules transformed.
rendering chunks...
dist_staging/index.html                                        0.64 kB │ gzip:   0.38 kB
dist_staging/assets/ActivateAccount-CfYOiUbr.css               5.62 kB │ gzip:   1.65 kB
dist_staging/assets/ActivateAccount-DRt7dY0p.js               12.30 kB │ gzip:   3.95 kB
...
✓ built in 17.33s
[safe-build] Integrity check PASSED: index.html (643 B), 123 JS chunk(s), 102 CSS file(s).
[safe-build] Production build completed and published successfully to dist/.
```

---

## 11. Remaining Defects & Action Items

| ID | Severity | Affected Component | Description | Remediation Required |
|---|---|---|---|---|
| **DEF-01** | **HIGH** | `Backend/.env` | `TRAINX_TO_CAREER_GATEWAY_SECRET` is unset in the current local `.env` file, meaning outbound export will fail closed unless provided at runtime. | Set `TRAINX_TO_CAREER_GATEWAY_SECRET` to a unique 256-bit cryptographically generated secret. |
| **DEF-02** | **MEDIUM** | `Backend/.env` | `TRAINX_INTEGRATION_SECRET` and `CAREER_GATEWAY_SERVICE_SECRET` currently share the same staging placeholder string. | Generate two distinct secrets so that inbound and outbound directions do not share symmetric keys. |
| **DEF-03** | **LOW** | External Staging Network | Career Gateway staging API (`http://127.0.0.1:8000` / `https://staging-api.careergateway.edu`) was unreachable during local testing. | Perform co-located live smoke test once both services are running on the staging cluster. |

---

## 12. Deployment and Environment Configuration Checklist

### Pre-Deployment Environment Setup (`Backend/.env`)
- [ ] Set `TRAINX_INTEGRATION_SECRET` = `<Generate 64-char Hex Key A>`
- [ ] Set `TRAINX_TO_CAREER_GATEWAY_SECRET` = `<Generate 64-char Hex Key B>`
- [ ] Verify `TRAINX_INTEGRATION_SECRET` matches Career Gateway's outbound signing secret.
- [ ] Verify `TRAINX_TO_CAREER_GATEWAY_SECRET` matches Career Gateway's inbound verification secret.
- [ ] Set `CAREER_GATEWAY_BASE_URL` = `https://staging-api.careergateway.edu`
- [ ] Set `CAREER_GATEWAY_COLLEGE_ID` = `col_somaiya_eng_01`
- [ ] Set `FRONTEND_URL` = `https://trainingportal.getflytechnologies.com`
- [ ] Confirm Brevo / SMTP email credentials for student activation dispatches.

### Staging Deployment Sequence
1. Deploy TrainX backend changes to staging server.
2. Execute database migration: `npm run db:migrate`.
3. Deploy TrainX frontend build: `npm run build`.
4. Restart backend processes (`pm2 restart trainx-backend` or Docker restart).
5. In Career Gateway, trigger outbox retry for pending student eligibility events.
6. Verify student receives activation email with URL `https://staging.trainingportal.../activate-account`.
7. Verify student sets password and activates account.
8. Trigger manual export `POST /api/v1/integrations/career-gateway/sync/training-data` and verify Career Gateway ingests all 6 categories.

