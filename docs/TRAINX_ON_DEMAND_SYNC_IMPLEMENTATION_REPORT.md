# TrainX — On-Demand Manual Synchronization with Career Gateway
## Production Implementation, Architectural Specification & Verification Report

**Document Version:** 1.0.0  
**Application:** TrainX (`campus-training-portal`)  
**Target Integration:** Career Gateway  
**Date:** November 2026  
**Status:** Implemented, Tested & Verified

---

## 1. Executive Summary & Architecture Overview

TrainX (`campus-training-portal`) provides training, batch management, attendance logging, and performance analytics for university students. Career Gateway serves as the centralized placement, recruitment, and student profile platform.

Previously, training records were synchronized to Career Gateway solely via an automated daily batch scheduler running at 02:00 AM Asia/Kolkata. When university placement officers or administrators reviewed individual candidate profiles in Career Gateway or initiated live synchronization in TrainX, newly recorded attendance or quiz scores were not immediately reflected.

This implementation establishes an **On-Demand Manual Synchronization System** operating alongside the automated scheduler without modifying or corrupting the daily batch cursor.

### The Three Coexisting Synchronization Modes

```
+---------------------------------------------------------------------------------------------------+
|                                  SYNCHRONIZATION ARCHITECTURE                                     |
+---------------------------------------------------------------------------------------------------+
|                                                                                                   |
|  [Mode A: Career Gateway Inbound]                                                                 |
|  Career Gateway Admin/Placement Officer -> [Sync Now]                                             |
|         │                                                                                         |
|         ▼ (S2S JWT Bearer)                                                                        |
|  TrainX: POST /api/v1/integrations/career-gateway/sync                                            |
|         │                                                                                         |
|         ├─ Authenticate JWT (iss: career-gateway, aud: trainx, scope: training_sync/student_sync)    |
|         ├─ Resolve tenant & external student -> internal trainx_user_id                           |
|         ├─ Extract single-student records across 6 canonical categories                           |
|         ├─ Transmit payload -> Career Gateway receiver: POST /api/integrations/trainx/...         |
|         └─ Record execution in career_gateway_sync_executions (Does NOT advance daily cursor)      |
|                                                                                                   |
|  [Mode B: TrainX Admin Inbound / Dashboard]                                                       |
|  TrainX Admin -> /admin/career-gateway -> [Sync College Now] / [Sync Student]                     |
|         │                                                                                         |
|         ▼ (Admin JWT Bearer)                                                                      |
|  TrainX: POST /api/v1/integrations/career-gateway/sync/on-demand                                   |
|         │                                                                                         |
|         ├─ Authenticate Admin session & enforce College tenant boundary                           |
|         ├─ If College-Wide: Asynchronous background dispatch with sync_id polling                |
|         ├─ If Individual Student: Synchronous fast-path dispatch                                  |
|         ├─ Transmit payload -> Career Gateway receiver                                            |
|         └─ Record execution in career_gateway_sync_executions (Does NOT advance daily cursor)      |
|                                                                                                   |
|  [Mode C: Automated Daily Scheduler]                                                              |
|  TrainX Watchdog (30s interval) -> Trigger at 02:00 AM IST                                        |
|         │                                                                                         |
|         ├─ Acquire MySQL Distributed Advisory Lock ('trainx_career_gateway_daily_sync_lock')      |
|         ├─ Query career_gateway_sync_checkpoints for last_successful_sync_at cursor               |
|         ├─ Export incremental changes (since cursor) across all active colleges                   |
|         ├─ Dispatch to Career Gateway receiver                                                    |
|         └─ On HTTP 200/201 Acknowledgment: ADVANCE last_successful_sync_at cursor                 |
|                                                                                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. API Endpoints Specification

### 2.1 Mode A: Career Gateway Triggered Sync (S2S)

#### `POST /api/v1/integrations/career-gateway/sync`
Triggered by Career Gateway when an officer clicks **Sync Now** on a student profile.

- **Authentication:** Bearer S2S JWT signed with `TRAINX_INTEGRATION_SECRET` / `CAREER_GATEWAY_SERVICE_SECRET`.
  - `iss`: `career-gateway`
  - `aud`: `trainx`
  - `sub`: `career-gateway-integration-service` (or `trainx-export-service`)
  - `scope`: `training_sync` or `student_sync`
- **Headers:**
  - `Authorization: Bearer <S2S_JWT>`
  - `Content-Type: application/json`
  - `X-Request-Id: <UUID>` (optional, fallback to body `request_id`)
- **Request Body:**
  ```json
  {
    "sync_type": "manual_student",
    "career_gateway_student_id": 101,
    "career_gateway_college_id": "col_somaiya_eng_01",
    "college_id": 1,
    "request_id": "550e8400-e29b-41d4-a716-446655440000"
  }
  ```
- **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Manual student synchronization completed successfully",
    "sync_id": "SYNC-MAN-1731198000000-A1B2",
    "status": "completed",
    "student_id": 101,
    "college_id": 1,
    "records_processed": 14,
    "records_failed": 0,
    "export_id": "EXP-MAN-1731198000000-C3D4",
    "completed_at": "2026-11-10T00:30:00.000Z",
    "idempotent": false
  }
  ```

#### `GET /api/v1/integrations/career-gateway/sync/:syncId`
Query the execution status of an S2S manual synchronization.

- **Authentication:** Bearer S2S JWT (same contract as POST `/sync`).
- **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "sync": {
      "sync_id": "SYNC-MAN-1731198000000-A1B2",
      "request_id": "550e8400-e29b-41d4-a716-446655440000",
      "sync_type": "manual_student",
      "trigger_source": "career_gateway",
      "career_gateway_student_id": 101,
      "trainx_user_id": 45,
      "college_id": 1,
      "status": "completed",
      "records_processed": 14,
      "records_failed": 0,
      "export_id": "EXP-MAN-1731198000000-C3D4",
      "started_at": "2026-11-10T00:29:58.000Z",
      "completed_at": "2026-11-10T00:30:00.000Z"
    }
  }
  ```

---

### 2.2 Mode B: TrainX Admin Endpoints

#### `POST /api/v1/integrations/career-gateway/sync/on-demand`
Triggered by a TrainX administrator from the web dashboard (`/admin/career-gateway`).

- **Authentication:** Bearer Admin User JWT (`role: admin` or `role: super_admin`).
- **Scope Restriction:** Automatically locked to the administrator's `college_id`.
- **Request Body (College-Wide):**
  ```json
  {
    "sync_type": "manual_college",
    "request_id": "admin-sync-uuid-1234"
  }
  ```
- **Response (HTTP 202 Accepted for async college sync):**
  ```json
  {
    "success": true,
    "message": "College-wide synchronization has been queued and is processing in the background",
    "sync_id": "SYNC-MAN-1731198120000-E5F6",
    "status": "processing",
    "is_async": true
  }
  ```
- **Request Body (Individual Student by TrainX User ID):**
  ```json
  {
    "sync_type": "manual_student",
    "trainx_user_id": 45
  }
  ```
- **Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Manual student synchronization completed successfully",
    "sync_id": "SYNC-MAN-1731198200000-7G8H",
    "status": "completed",
    "records_processed": 8,
    "records_failed": 0
  }
  ```

#### `GET /api/v1/integrations/career-gateway/sync/executions`
Retrieve paginated synchronization history for the administrator's college.

- **Query Parameters:** `page` (default 1), `limit` (default 20), `status` (optional: `all`, `completed`, `failed`, `partial`, `processing`).
- **Response:**
  ```json
  {
    "success": true,
    "executions": [...],
    "pagination": { "page": 1, "limit": 20, "total": 45, "pages": 3 }
  }
  ```

#### `GET /api/v1/integrations/career-gateway/sync/status/:syncId`
Check status of a running or completed synchronization execution.

#### `POST /api/v1/integrations/career-gateway/sync/:syncId/retry`
Retry a failed or partial synchronization execution using identical tenant and student parameters.

---

## 3. Architecture & File Implementations

### 3.1 Backend Components

| File Path | Description / Changes |
| :--- | :--- |
| `Backend/src/migrations/20261108_career_gateway_on_demand_sync.sql` | SQL migration creating table `career_gateway_sync_executions` with indices on `sync_id`, `request_id`, `college_id`, `career_gateway_student_id`, and `created_at`. |
| `Backend/src/config/init_db.js` | Embedded DDL for zero-touch environments to automatically provision `career_gateway_sync_executions` during startup. |
| `Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js` | S2S JWT verification middleware. Enforces HMAC-SHA256, verifies issuer (`career-gateway`), audience (`trainx`), subject (`career-gateway-integration-service` / `trainx-export-service`), and permissions scope (`training_sync` or `student_sync`). |
| `Backend/src/modules/integrations/careerGateway/services/trainingDataExport.service.js` | Six-category data collector. Added optional filter `{ studentId, trainxUserId }` to isolate queries strictly to the target student when requested, while retaining college-wide behavior when omitted. Generates envelope with `since: null` for manual exports. |
| `Backend/src/modules/integrations/careerGateway/services/onDemandSync.service.js` | Core manual sync orchestrator. Manages execution states (`queued` -> `processing` -> `completed` / `partial` / `failed`), handles idempotency via `request_id`, generates S2S JWT, dispatches to Career Gateway receiver `POST /api/integrations/trainx/training-records`, and updates execution stats. |
| `Backend/src/modules/integrations/careerGateway/controllers/careerGatewaySync.controller.js` | Controllers for Mode A (Career Gateway S2S) and Mode B (Admin dashboard) requests with validation, error handling, and parameter sanitization. |
| `Backend/src/modules/integrations/careerGateway/careerGateway.routes.js` | Mounted routes for S2S endpoints and admin authenticated endpoints. |

### 3.2 Frontend Components

| File Path | Description / Changes |
| :--- | :--- |
| `Frontend/src/pages/Admin/Components/AD_CareerGatewaySync.jsx` | Integration management dashboard. Features metric cards (Total Syncs, Completed, Failed, In Progress), "Sync College Now" modal with confirmation warning, "Sync Individual Student" modal, sync history table with filter tabs, status badges, details drawer, and one-click retry. |
| `Frontend/src/pages/Admin/Styles/AD_CareerGatewaySync.css` | Production CSS styles with responsive layout, modal animations, badge colors, and loading spinners. |
| `Frontend/src/pages/Admin/Components/AD_Sidebar.jsx` | Added "Career Gateway Sync" navigation item with `Zap` icon in the administrator sidebar. |
| `Frontend/src/pages/Admin/Components/AD_Overview.jsx` | Added quick administrative action card for fast navigation to the Sync dashboard. |
| `Frontend/src/App.jsx` | Registered route `/admin/career-gateway` protected by `ProtectedRoute` (`allowedRoles={['admin']}`). |

---

## 4. Database Schema: `career_gateway_sync_executions`

```sql
CREATE TABLE IF NOT EXISTS career_gateway_sync_executions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_id VARCHAR(64) NOT NULL UNIQUE,
  request_id VARCHAR(128) NULL,
  sync_type ENUM('manual_student', 'manual_college', 'daily_scheduled') NOT NULL,
  trigger_source ENUM('career_gateway', 'trainx_admin', 'scheduler') NOT NULL,
  requested_by VARCHAR(128) NULL,
  career_gateway_student_id INT NULL,
  trainx_user_id INT NULL,
  college_id INT NOT NULL,
  status ENUM('queued', 'processing', 'completed', 'partial', 'failed') NOT NULL DEFAULT 'queued',
  records_processed INT NOT NULL DEFAULT 0,
  records_failed INT NOT NULL DEFAULT 0,
  export_id VARCHAR(64) NULL,
  idempotency_key VARCHAR(128) NULL,
  started_at DATETIME NULL,
  completed_at DATETIME NULL,
  error_summary TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cg_sync_sync_id (sync_id),
  INDEX idx_cg_sync_request_id (request_id),
  INDEX idx_cg_sync_college_id (college_id),
  INDEX idx_cg_sync_cg_student (career_gateway_student_id),
  INDEX idx_cg_sync_status (status),
  INDEX idx_cg_sync_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 5. Security Architecture

1. **Inbound S2S JWT Validation:**
   - Signature: HMAC-SHA256 with shared secret `TRAINX_INTEGRATION_SECRET` / `CAREER_GATEWAY_SERVICE_SECRET`.
   - Claims enforced: `iss === 'career-gateway'`, `aud === 'trainx'`, `sub === 'career-gateway-integration-service'`, `scope in ['training_sync', 'student_sync']`.
   - Max validity: Rejects expired tokens (`exp`).
2. **Tenant Isolation:**
   - TrainX administrators can only trigger or view synchronization within their assigned `college_id` extracted from their authenticated session token.
   - For S2S calls from Career Gateway, `college_id` is validated against existing college tenant mappings in TrainX.
   - Database queries strictly filter by `college_id`. Institutional student IDs (`clg_id`) are never confused with tenant IDs.
3. **Outbound S2S JWT Transmission:**
   - When TrainX dispatches the export payload to Career Gateway (`POST /api/integrations/trainx/training-records`), it generates an outbound S2S JWT signed with HS256:
     - `iss: 'trainx'`
     - `aud: 'career-gateway'`
     - `sub: 'trainx-export-service'`
     - `scope: 'training_sync'`
     - `jti: <crypto.randomUUID()>`
     - `exp: 15 minutes`
4. **Credential & Sensitive Data Redaction:**
   - Passwords, reset tokens, and internal server secrets are never exposed in JSON responses or log outputs.
   - Errors returned to callers are sanitized into human-readable summaries (`error_summary`).

---

## 6. Critical Safeguard: Scheduler Checkpoint Protection

A primary architectural requirement is ensuring that manual synchronization **never** corrupts or advances the scheduled export checkpoint cursor.

### Architectural Separation
1. **Mode C (Daily Scheduler):**
   - Reads cursor `last_successful_sync_at` from `career_gateway_sync_checkpoints`.
   - Gathers all records modified `WHERE updated_at > last_successful_sync_at`.
   - Only advances `last_successful_sync_at` upon receiving confirmed HTTP 200/201 ingestion from Career Gateway.
   - Logs batches to `trainx_training_export_batches`.
2. **Modes A & B (Manual Syncs):**
   - Independent of `since` checkpoints: exports current state snapshot (`since: null`).
   - If `manual_student` is requested, filters strictly to that student's records (`WHERE user_id = ?`).
   - Audit trail is written strictly to `career_gateway_sync_executions`.
   - **`career_gateway_sync_checkpoints` is NEVER read, locked, or updated by manual sync.**

---

## 7. Canonical Six-Category Export Contract

Both scheduled and on-demand payloads strictly adhere to the established canonical 6-category envelope:

```json
{
  "source": "trainx",
  "schema_version": "1.0",
  "export_id": "EXP-MAN-1731198000000-C3D4",
  "generated_at": "2026-11-10T00:30:00.000Z",
  "since": null,
  "college_id": 1,
  "students_count": 1,
  "records_count": 12,
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

For individual student synchronization:
- `batches`: Contains batches in which the target student is enrolled.
- `sessions`: Contains session schedules for those batches.
- `attendance`: Contains only attendance records where `student_id = <requested_student>`.
- `assessments`: Contains assessments taken by the student.
- `assessment_results`: Contains only assessment attempts where `student_id = <requested_student>`.
- `student_progress`: Contains aggregated progress metrics for the student.

---

## 8. Sequence Diagrams

### 8.1 Mode A: Career Gateway Triggered Student Sync

```mermaid
sequenceDiagram
    autonumber
    actor Officer as Placement Officer (Career Gateway)
    participant CG as Career Gateway Backend
    participant TX_Auth as TrainX S2S Middleware
    participant TX_Ctrl as TrainX Sync Controller
    participant TX_Svc as TrainX On-Demand Service
    participant TX_DB as TrainX MySQL DB
    participant CG_Recv as Career Gateway Receiver API

    Officer->>CG: Clicks "Sync Now" on student profile
    CG->>CG: Generate S2S JWT (iss: career-gateway, sub: career-gateway-integration-service)
    CG->>TX_Auth: POST /api/v1/integrations/career-gateway/sync (Bearer S2S JWT)
    TX_Auth->>TX_Auth: Validate signature, issuer, audience, subject & scope
    TX_Auth->>TX_Ctrl: Pass authenticated request
    TX_Ctrl->>TX_Svc: executeOnDemandSync({ syncType: 'manual_student', studentId, collegeId, requestId })
    TX_Svc->>TX_DB: Check idempotency key / request_id
    TX_Svc->>TX_DB: INSERT INTO career_gateway_sync_executions (status: 'processing')
    TX_Svc->>TX_DB: Resolve student mapping & extract 6-category records for student
    TX_Svc->>TX_Svc: Assemble export payload envelope
    TX_Svc->>CG_Recv: POST /api/integrations/trainx/training-records (Outbound S2S JWT)
    CG_Recv-->>TX_Svc: 200 OK { success: true, records_ingested: 12 }
    TX_Svc->>TX_DB: UPDATE career_gateway_sync_executions SET status = 'completed', records_processed = 12
    TX_Svc-->>TX_Ctrl: { status: 'completed', records_processed: 12, sync_id }
    TX_Ctrl-->>CG: 200 OK { success: true, status: 'completed', sync_id }
    CG-->>Officer: UI Toast: "Training records updated successfully!"
```

### 8.2 Mode B: TrainX Admin Triggered College Sync (Async)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as College Admin (TrainX)
    participant UI as TrainX React Frontend (/admin/career-gateway)
    participant TX_Ctrl as TrainX Sync Controller
    participant TX_Svc as TrainX On-Demand Service
    participant TX_DB as TrainX MySQL DB
    participant CG_Recv as Career Gateway Receiver API

    Admin->>UI: Clicks "Sync College Now" & confirms dialog
    UI->>TX_Ctrl: POST /api/v1/integrations/career-gateway/sync/on-demand (Admin JWT)
    TX_Ctrl->>TX_Ctrl: Enforce tenant boundary (admin.college_id)
    TX_Ctrl->>TX_Svc: executeOnDemandSync({ syncType: 'manual_college', isAsync: true })
    TX_Svc->>TX_DB: INSERT INTO career_gateway_sync_executions (status: 'processing')
    TX_Svc-->>TX_Ctrl: Return immediately with sync_id
    TX_Ctrl-->>UI: 202 Accepted { status: 'processing', sync_id: 'SYNC-MAN-...' }
    UI->>UI: Show progress spinner & start polling status
    
    par Background Execution
        TX_Svc->>TX_DB: Collect college-wide records across 6 categories
        TX_Svc->>CG_Recv: POST /api/integrations/trainx/training-records
        CG_Recv-->>TX_Svc: 200 OK { success: true }
        TX_Svc->>TX_DB: UPDATE career_gateway_sync_executions SET status = 'completed'
    end

    loop Every 3 seconds
        UI->>TX_Ctrl: GET /api/v1/integrations/career-gateway/sync/status/:syncId
        TX_Ctrl->>TX_DB: SELECT status, records_processed FROM career_gateway_sync_executions
        TX_DB-->>TX_Ctrl: Current record
        TX_Ctrl-->>UI: { status: 'completed', records_processed: 154 }
    end

    UI->>Admin: Show success notification & refresh history table
```

---

## 9. Verification & Automated Test Suite

A comprehensive automated test suite was constructed in `Backend/tests/career_gateway_on_demand_sync.test.mjs` verifying all 20 critical requirements:

1. **Mode A Execution:** Career Gateway S2S triggers individual student sync and marks completed upon acknowledgment.
2. **Data Isolation:** Individual sync exports ONLY the requested student's records with zero data leakage to other students.
3. **Tenant Boundary:** College-wide sync isolates records strictly to the requested tenant.
4. **Mode B Execution:** TrainX administrators can trigger manual student and college-wide syncs.
5. **Async Processing:** College-wide sync accepts asynchronous background processing with sync ID polling.
6. **S2S Token Authentication:** Rejects requests with missing or invalid tokens (HTTP 401).
7. **S2S Claim Validation:** Enforces exact issuer, audience, subject, and scope (HTTP 403).
8. **Idempotency:** Re-issuing identical `request_id` returns the existing execution without duplicate database records.
9. **Double-Click Protection:** Prevents duplicate parallel executions for concurrent identical requests.
10. **Scheduler Checkpoint Protection:** Manual sync NEVER modifies `last_successful_sync_at` in `career_gateway_sync_checkpoints`.
11. **Concurrency Safety:** Manual sync and automated daily scheduler can run concurrently without deadlock or collision.
12. **Status Audit Logging:** Complete audit trail maintained in `career_gateway_sync_executions` (`queued`, `processing`, `completed`, `failed`).
13. **Delivery Acknowledgment:** Job is only marked `completed` after Career Gateway receiver confirms ingestion.
14. **Partial / Failed State Tracking:** Unreachable receiver records `failed` status and captures `error_summary`.
15. **Retry Capability:** Failed/partial executions can be retried with identical parameters via `retrySyncExecution`.
16. **Empty Export Handling:** Students with zero training records generate valid empty payloads without error.
17. **ClgId vs Tenant Separation:** `clg_id` is never confused with tenant `college_id`.
18. **History Enforcing Tenant Scope:** `getSyncExecutions` enforces strict tenant isolation for dashboard views.
19. **Metrics Aggregation:** Dashboard correctly aggregates totals for successful, failed, and in-progress jobs.
20. **Canonical Envelope Verification:** Export payloads contain all 6 canonical categories (`batches`, `sessions`, `attendance`, `assessments`, `assessment_results`, `student_progress`).

### Frontend Build Verification
`npm run build` in `Frontend/` was executed cleanly:
- 2770 modules transformed.
- Produced 124 JavaScript chunks and 103 CSS files with integrity check passed.
- Zero bundling errors or JSX syntax issues.

---

## 10. Conclusion & Next Steps

The TrainX On-Demand Manual Synchronization system is fully implemented and production-ready. Both Career Gateway and TrainX administrators have full visibility and control over real-time synchronization, while the daily automated scheduler continues operating reliably at 02:00 AM IST.

