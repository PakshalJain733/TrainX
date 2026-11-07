# TrainX Architecture & Career Gateway Integration Specification
## Version 1.0 — Production Integration Contract

---

## 1. Architecture Assessment & Executive Summary

TrainX (`campus-training-portal`) is an independent campus recruitment training, AI interview, and LMS platform. Career Gateway operates as the institutional source of truth for student identity, eligibility, and company applications.

### Architecture Decoupling Principle
- **No Shared Databases**: TrainX and Career Gateway operate completely independent databases. The legacy cross-database querying in `Backend/src/services/careerGatewayBridge.service.js` has been eliminated.
- **No Cross-Application JWT Reuse**: Career Gateway browser JWTs and TrainX browser JWTs are never exchanged.
- **Asynchronous, Independent Provisioning**: Provisioning occurs via authenticated REST APIs from Career Gateway when students are approved. Training metrics flow asynchronously from TrainX back to Career Gateway via daily incremental export.

---

## 2. Security Hardening Summary

| Area | Former Vulnerability | Hardened Implementation |
|---|---|---|
| **Master OTP Bypass** | Unauthenticated master OTPs (`123456`, `999999`) allowed instant login | Purged all master OTP conditionals from [auth.service.js](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/services/auth.service.js). Strict single-use database OTP verification enforced. |
| **Hardcoded Passwords** | Hardcoded passwords (`Student@123`, `12345678`) in admin provisioning | Replaced with cryptographically random per-user initial passwords in [admin.controller.js](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/controllers/admin.controller.js). |
| **JWT Dev Secret Fallback** | Fallback to hardcoded string when `JWT_SECRET` was unset | Server startup immediately aborts if `JWT_SECRET` is missing in [jwt.js](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/config/jwt.js). |
| **Algorithm Whitelisting** | Implicit signing algorithm allowed potential algorithm confusion | Pinned to `HS256` in [generateToken.js](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/utils/generateToken.js) and [auth.middleware.js](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/middleware/auth.middleware.js). |
| **Standardized JWT Claims** | Inconsistent payloads across OTP and password paths | Standardized payload with `sub: String(user.id)`, `jti: UUID`, `iss`, `aud`, and `tokenType: 'access'`. |
| **WebSocket Security** | Non-production fallback to unverified `jwt.decode` | Removed unverified fallback in [interview.socket.js](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/socket/interview.socket.js); signature verification strictly required. |

---

## 3. Database Schema Changes & Migration

Migration file: [`Backend/src/migrations/20261106_career_gateway_integration.sql`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/migrations/20261106_career_gateway_integration.sql)

### 3.1 Extended Tables:
- **`users`**:
  - `career_gateway_student_id INT NULL UNIQUE`: Unique external student identity.
  - `source_system VARCHAR(50) DEFAULT 'trainx'`: Identity provider source.
  - `provisioned_at TIMESTAMP NULL`: Audit timestamp when account was created via CG.
- **`students`**:
  - `career_gateway_student_id INT NULL UNIQUE`.
  - `source_system VARCHAR(50) DEFAULT 'trainx'`.
  - `last_synced_at TIMESTAMP NULL`: Checkpoint for training progress sync.

### 3.2 New Integration Tables:
- **`career_gateway_student_mappings`**: Permanent mapping between `trainx_user_id` and `career_gateway_student_id`, tracking `eligibility_status` (`eligible`, `revoked`).
- **`account_activations`**: Secure single-use activation tokens (hashed via SHA-256) with 72-hour expiration for newly provisioned students.
- **`trainx_training_export_batches`**: Audit log of daily training data exports.
- **`trainx_training_export_items`**: Granular tracking per exported attendance and assessment record.
- **`career_gateway_sync_checkpoints`**: Cursor table maintaining `last_successful_sync_at` for incremental delta syncs.
- **`career_gateway_integration_events`**: Outbox event log for auditing and reconciliation.

---

## 4. Inbound Flow: Student Provisioning API

### 4.1 Authentication: Machine-to-Machine JWT
- **Endpoint**: `POST /api/v1/integrations/career-gateway/students`
- **Headers**:
  - `Authorization: Bearer <service_jwt>` (or `X-Service-Key: <secret>`)
- **Expected Token Claims**:
  ```json
  {
    "iss": "career-gateway",
    "aud": "trainx",
    "sub": "career-gateway-integration-service",
    "scope": "student_sync",
    "exp": 1730910000
  }
  ```

### 4.2 Provisioning Request Payload:
```json
{
  "source": "career_gateway",
  "students": [
    {
      "student_id": 1042,
      "name": "Rahul Sharma",
      "email": "rahul.sharma@college.edu",
      "mobile": "9876543210",
      "department": "Information Technology",
      "year": "TE",
      "division": "A",
      "semester": "Semester 5",
      "cgpa": 8.75,
      "eligible": true
    }
  ]
}
```

### 4.3 Provisioning Response:
```json
{
  "success": true,
  "message": "Provisioned 1 student(s) (0 failed)",
  "total": 1,
  "success_count": 1,
  "failure_count": 0,
  "data": [
    {
      "student_id": 1042,
      "trainx_user_id": 84,
      "email": "rahul.sharma@college.edu",
      "status": "created"
    }
  ]
}
```

---

## 5. Student Activation Architecture (Zero Password Sync)

1. Provisioned students are inserted with `password_hash = NULL` and `is_active = 0`.
2. A cryptographically random activation token (`crypto.randomBytes(32)`) is generated and hashed via SHA-256 into `account_activations`.
3. An invitation email is dispatched to the student with an activation link:
   `https://trainingportal.getflytechnologies.com/activate-account?token=<rawToken>&email=...`
4. The student sets their private TrainX password via:
   - **`POST /api/v1/integrations/career-gateway/activate-account`**
   - Body: `{"token": "<rawToken>", "password": "<chosenPassword>"}`
5. The backend validates token expiration (72h), marks it consumed (`consumed_at = NOW()`), hashes the password using bcrypt, and sets `is_active = 1`.

---

## 6. Eligibility Revocation API

- **Endpoint**: `PATCH /api/v1/integrations/career-gateway/students/:studentId/eligibility`
- **Payload**:
  ```json
  {
    "eligible": false,
    "reason": "Deselected by Placement Administrator"
  }
  ```
- **Behavior**:
  - Finds user via `career_gateway_student_mappings`.
  - Sets `users.is_active = 0` to block immediate login.
  - Invalidates any pending activation tokens.
  - Marks mapping as `revoked`.
  - **Preserves historical training records, attendance, and assessments intact.**

---

## 7. Outbound Flow: Daily Training Data Export

- **Schedule**: Every day at 02:00 AM Asia/Kolkata (`Backend/src/scheduler/careerGatewayScheduler.js`).
- **Distributed Locking**: MySQL application-level advisory lock (`SELECT GET_LOCK('trainx_career_gateway_daily_sync_lock', 10)`). Prevents concurrent runs across multiple backend replicas.
- **Incremental Cursor**: Queries `career_gateway_sync_checkpoints` to only export records created or updated since `last_successful_sync_at`.
- **Target Proposed Career Gateway Endpoint**:
  - `POST /api/integrations/trainx/training-records`
  - Signed with TrainX Service Token (`iss: "trainx"`, `aud: "career-gateway"`, `scope: "training_data_export"`).

### Export Payload Schema:
```json
{
  "source": "trainx",
  "schema_version": "1.0",
  "export_id": "EXP-1793971231004-5fb17250",
  "generated_at": "2026-11-06T02:00:00.000Z",
  "students_count": 45,
  "records_count": 120,
  "records": [
    {
      "record_type": "attendance",
      "source_record_id": "ATT-402",
      "student_id": 1042,
      "trainx_user_id": 84,
      "batch_id": 12,
      "batch_name": "Full Stack Batch A",
      "session_id": 301,
      "session_title": "React Performance & Vite",
      "session_date": "2026-11-05",
      "status": "present"
    },
    {
      "record_type": "assessment",
      "source_record_id": "ASM-88",
      "student_id": 1042,
      "trainx_user_id": 84,
      "assessment_id": 15,
      "assessment_title": "Data Structures Benchmark",
      "score": 45,
      "total_marks": 50,
      "percentage": 90.00,
      "attempted_at": "2026-11-05T14:30:00.000Z"
    }
  ]
}
```

---

## 8. Integration Monitoring & Manual Trigger

Authorized `super_admin` and `college_admin` users can inspect status or trigger manual synchronization:
- **`GET /api/v1/integrations/career-gateway/monitoring/status`**: Returns mapping counts, last batch status, last checkpoint cursor, and recent audit logs.
- **`POST /api/v1/integrations/career-gateway/monitoring/trigger-export`**: Manually executes training export using the same distributed lock and checkpoint advancement.

---

## 9. Required Environment Variables

```env
# TrainX Internal Auth
JWT_SECRET=your_strong_random_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
JWT_ISSUER=https://api.trainingportal.getflytechnologies.com
JWT_AUDIENCE=trainx-portal

# Career Gateway Inbound Service Authentication
CAREER_GATEWAY_SERVICE_KEY=pre_shared_secret_or_key_agreed_with_cg
CAREER_GATEWAY_PUBLIC_KEY=optional_rsa_public_key_pem_for_rs256

# Career Gateway Outbound Export Client
CAREER_GATEWAY_API_URL=https://api.careergateway.edu
TRAINX_INTEGRATION_SERVICE_KEY=dedicated_trainx_service_key_for_cg
TRAINX_SERVICE_PRIVATE_KEY=optional_rsa_private_key_pem_for_rs256

# Scheduler Controls
DISABLE_CAREER_GATEWAY_SCHEDULER=false
DEFAULT_COLLEGE_ID=8
```

---

## 10. Status Classification Matrix

| Feature | Implementation Status | Test Status |
|---|---|---|
| Master OTP Removal | **Implemented** | Verified in automated suite |
| Random Password Generation | **Implemented** | Verified in automated suite |
| Strict JWT Configuration | **Implemented** | Verified in automated suite |
| WebSocket Unverified Fallback Removal | **Implemented** | Verified in automated suite |
| Schema Migration (`20261106_...`) | **Implemented** | Applied & verified in MySQL |
| M2M Auth Middleware | **Implemented** | Verified with HS256 & RS256 |
| Student Provisioning API | **Implemented** | Verified in automated integration test |
| Account Activation Flow | **Implemented** | Verified in automated integration test |
| Eligibility Revocation | **Implemented** | Verified in automated integration test |
| Training Data Extraction Service | **Implemented** | Verified in automated integration test |
| Distributed Locking (MySQL `GET_LOCK`) | **Implemented** | Verified with concurrent lock tests |
| Scheduled 02:00 AM IST Worker | **Implemented** | Configured in `server.js` |
| Admin Monitoring Dashboard Endpoints | **Implemented** | Mounted in `app.js` |
| Career Gateway Outbound Receiver API | **Pending CG Team** | Proposed API contract documented |
| Live End-to-End Staging Sync | **Pending Staging** | Requires staging deployment with CG |

