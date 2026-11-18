# TrainX — Complete Career Gateway Integration, Student Activation & Training Lifecycle Walkthrough

## Executive Summary

TrainX is a multi-tenant enterprise training, assessment, and placement readiness platform designed for engineering and degree colleges. The platform operates in close synchronization with **Career Gateway**, an external institutional placement portal. 

In this architectural topology:
1. **Career Gateway** acts as the authoritative source for student placement eligibility and provisions eligible student profiles into TrainX via Server-to-Server (S2S) Machine-to-Machine (M2M) APIs.
2. **TrainX** manages tenant-isolated accounts, credentials, activation workflows, technical curricula, coding labs, AI mock interviews, assessments, and attendance.
3. **TrainX Outbound Engine** aggregates daily student engagement and assessment analytics and pushes verified delta synchronization batches back to Career Gateway at 02:00 AM IST.

This document provides a forensic walkthrough and technical audit of the actual codebase, database schemas, frontend architecture, and background workers as of November 2026.

---

## A. Architecture Overview

### 1. System Interaction Model

```
+--------------------------------------------------------------------------------------------------+
|                                    CAREER GATEWAY PLATFORM                                       |
|  [Student Eligibility Directory]        [Outbox Queue]          [Training Analytics Store]       |
+--------------------------------------------------------------------------------------------------+
       |                                                                  ^
       | 1. POST /api/v1/integrations/career-gateway/students             | 4. POST /api/integrations/trainx/training-records
       |    (Bearer S2S JWT, HS256, Secret A)                             |    (Bearer S2S JWT, HS256, Secret B)
       v                                                                  |
+--------------------------------------------------------------------------------------------------+
|                                        TRAINX BACKEND                                            |
|                                                                                                  |
|   +-------------------------------------+      +---------------------------------------------+   |
|   |   Inbound S2S Middleware            |      |   Outbound Daily Sync Scheduler             |   |
|   |   - Bearer HS256 JWT Verification   |      |   - 02:00 AM Asia/Kolkata Watchdog          |   |
|   |   - Claims: iss, aud, sub, scope    |      |   - MySQL GET_LOCK Distributed Mutex        |   |
|   |   - Burst Rate Limiter (600/5m)     |      |   - Delta queries with Checkpoint Cursors   |   |
|   +-------------------------------------+      +---------------------------------------------+   |
|                      |                                                ^                          |
|                      v                                                |                          |
|   +-------------------------------------+      +---------------------------------------------+   |
|   |   Transactional Provisioning        |      |   Training & Assessment Analytics Engines   |   |
|   |   - Strict Tenant Resolution        |      |   - Attendance, Batches, Sessions           |   |
|   |   - users (password_hash=NULL)      |      |   - Academic Quizzes & Attempts             |   |
|   |   - students & mapping upsert       |      |   - Roadmaps & Task Submissions             |   |
|   +-------------------------------------+      +---------------------------------------------+   |
|                      |                                                ^                          |
|                      v                                                |                          |
|   +-------------------------------------+                             |                          |
|   |   Activation Token & Email Dispatch |                             |                          |
|   |   - 32-byte crypto token (SHA-256)  |                             |                          |
|   |   - 72-hour TTL                     |                             |                          |
|   |   - SMTP / Brevo Mailer Gateway     |                             |                          |
|   +-------------------------------------+                             |                          |
+-----------------------------------------------------------------------|--------------------------+
       |                                                                |
       | 2. Activation Email Link                                       | 3. Authenticated Student
       |    https://trainx.com/activate-account?token=...&email=...     |    Learning & Evaluation
       v                                                                |
+--------------------------------------------------------------------------------------------------+
|                                        TRAINX FRONTEND                                           |
|   [Activation Setup Page] (CRITICAL GAP)   --->   [Student Portal] (Monaco, Quizzes, Interviews)  |
+--------------------------------------------------------------------------------------------------+
```

### 2. Trust Boundaries & Cryptographic Segregation

TrainX strictly enforces cryptographic segregation between **Service-to-Service (M2M)** integration tokens and **End-User Session** authentication tokens:

| Token Type | Purpose | Issuer (`iss`) | Audience (`aud`) | Subject (`sub`) | Signing Secret |
|---|---|---|---|---|---|
| **Career Gateway Inbound S2S** | Authenticates Career Gateway provisioning requests to TrainX | `career-gateway` | `trainx` | `career-gateway-integration-service` | `TRAINX_INTEGRATION_SECRET` |
| **TrainX Outbound S2S** | Authenticates TrainX pushing training records to Career Gateway | `trainx` | `career-gateway` | `trainx-export-service` | `TRAINX_TO_CAREER_GATEWAY_SECRET` |
| **TrainX User Session JWT** | Authenticates logged-in students, admins, and mentors | `trainx-auth-system` | `trainx-client` | TrainX User ID (`user.id`) | `JWT_SECRET` |

*Under no circumstances are user session credentials or user JWT secrets shared with or accessible to Career Gateway.*

---

## B. Inbound Provisioning Sequence

### 1. Inbound Endpoint Routing

TrainX mounts the inbound student provisioning service under both canonical and versioned URLs in [`Backend/src/app.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/app.js) and [`Backend/src/modules/integrations/careerGateway/careerGateway.routes.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/careerGateway.routes.js):

- `POST /api/v1/integrations/career-gateway/students` (Primary Production Endpoint)
- `POST /api/integrations/career-gateway/students` (Backward-Compatibility Alias)

### 2. Request Authentication & Claim Verification

The request enters [`authenticateCareerGatewayService`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js):

```javascript
// Validates Authorization: Bearer <token>
const decoded = jwt.verify(token, serviceSecret, {
  algorithms: ['HS256'],
  issuer: 'career-gateway',
  audience: 'trainx',
});
```

**Validated Claims:**
1. **Algorithm:** Strictly `HS256`. Asymmetric or `none` algorithms are rejected.
2. **Issuer (`iss`):** Must exactly equal `'career-gateway'`.
3. **Audience (`aud`):** Must exactly equal `'trainx'`.
4. **Subject (`sub`):** Must exactly equal `'career-gateway-integration-service'`. Missing or alternate subjects return `403 Forbidden`.
5. **Scope (`scope`):** Must equal `'student_sync'`.
6. **Expiration (`exp`):** Token must be unexpired (typically 15-minute validity window).

### 3. Rate Limiting Protection

Inbound requests pass through [`m2mProvisioningRateLimiter`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/middleware/careerGatewayRateLimit.middleware.js):
- **Window:** 5 minutes (300,000 ms).
- **Quota:** 600 requests per 5 minutes per IP.
- **Purpose:** Accommodates high-throughput institutional batch enrollments while protecting against unmetered network floods.

### 4. College Tenant Resolution (`resolveCollegeTenant`)

TrainX is a multi-tenant platform where every user, student, batch, and test belongs to an institutional college tenant (`college_id`). 

In [`studentProvisioning.service.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js#L12-L116), tenant resolution follows a strict priority hierarchy:
1. **Explicit Option:** `options.collegeId` (if explicitly targeted by internal worker).
2. **Dedicated External ID:** `studentData.career_gateway_college_id` (e.g. `'col_somaiya_eng_01'`).
3. **Dedicated Tenant ID:** `studentData.college_id` (e.g. `9`).
4. **Institutional Code:** `studentData.college_code` (e.g. `'KJSIEIT'`).
5. **Validated College Name:** `studentData.college` (exact case-insensitive match, followed by unique substring match).

#### Strict Tenant Isolation Rules:
- **`clg_id` is NEVER used for college resolution.** `clg_id` represents the student's institutional registration code (e.g. `VU3F2425047`) and must never be confused with the institution entity.
- **Fail-Closed on Ambiguity (HTTP 422):** If a name or code matches more than one college in the database, the query fails with `HTTP 422 Unprocessable Entity` (`Ambiguous college: matched multiple colleges`).
- **No Fallback in Production:** Silent fallback to `DEFAULT_COLLEGE_ID` or college ID `1` is strictly forbidden. Unresolvable institutions return `HTTP 422`.

### 5. Accepted Student Payload Fields

| Field Name | Type | Required | Description |
|---|---|---|---|
| `student_id` / `id` | Integer | **Yes** | Career Gateway unique primary key |
| `email` | String | **Yes** | Student official email address |
| `name` | String | No | Full name (defaults to email username if omitted) |
| `mobile` / `mobile_number` | String | No | Contact phone number |
| `career_gateway_college_id` | String | No | Career Gateway college identifier (`col_...`) |
| `college_id` | Integer/String | No | TrainX college ID |
| `college` | String | No | Full name of the college |
| `college_code` | String | No | Abbreviated college code |
| `clg_id` | String | No | Institutional registration number (e.g. `VU3F2425047`) |
| `roll_number` | String | No | Classroom roll number |
| `batch` | String | No | Target training batch name or ID to auto-assign |
| `department` / `branch` | String | No | Academic branch (e.g. `ECS`, `Comps`, `IT`) |
| `division` | String | No | Class division (e.g. `A`, `B`) |
| `year` / `degree_year` | String | No | Academic standing (`FE`, `SE`, `TE`, `BE`) |
| `semester` | String | No | Academic semester (e.g. `Semester 5`) |
| `cgpa` | Float | No | Cumulative GPA (defaults to `8.5`) |
| `live_kt` | Integer | No | Active backlogs |
| `dead_kt` | Integer | No | Cleared backlogs |
| `placement_status` | String | No | `Placed` or `Unplaced` |
| `eligible` | Boolean | No | Eligibility flag (defaults to `true`) |

### 6. Idempotency & Duplicate Handling

The provisioning engine handles incoming records through three distinct execution pathways wrapped in a single database transaction (`connection.beginTransaction()`):

```
                        Incoming Student Payload
                                   |
                +------------------+------------------+
                |                                     |
       Mapping exists for                      No mapping for
   `career_gateway_student_id`            `career_gateway_student_id`
                |                                     |
                v                                     v
         [SCENARIO 1]                       User exists by email?
      Idempotent Update                               |
   - Preserves password_hash                +---------+---------+
   - Preserves roll_number                  |                   |
   - Updates academic data                 YES                  NO
   - Status: updated / reactivated          |                   |
                                            v                   v
                                      [SCENARIO 2]        [SCENARIO 3]
                                   Safe Reconciliation  Brand New User
                                   - Links external ID  - users record created
                                   - Preserves creds    - password_hash = NULL
                                   - Conflict check     - is_active = 0
                                                        - Generates activation token
                                                        - Status: created
```

### 7. Bulk Provisioning & Partial Failure Handling

The controller [`handleProvisionStudents`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/controllers/careerGatewayProvisioning.controller.js#L12-L60) accepts either a single JSON object or an array of student objects (up to 500 records per call):

- **Independent Transaction Isolation:** In batch operations, each student record is processed in its own dedicated transaction. A validation failure on student #14 does not roll back student #13.
- **Response Codes:**
  - `HTTP 200 OK`: All students in the payload provisioned successfully (`failure_count === 0`).
  - `HTTP 207 Multi-Status`: Partial success (`success_count > 0` and `failure_count > 0`).
  - `HTTP 400 / 409 / 422`: Total failure (`success_count === 0`).

**Response Schema:**
```json
{
  "success": true,
  "reference_id": "tx_student_1529",
  "id": 1529,
  "message": "Provisioned 1 student(s) (0 failed)",
  "total": 1,
  "success_count": 1,
  "failure_count": 0,
  "data": [
    {
      "student_id": 101,
      "clg_id": "VU3F2425047",
      "trainx_user_id": 1529,
      "email": "pakshaljain733@gmail.com",
      "batch": { "batchId": 12, "batchName": "ECS-2028-A", "status": "assigned" },
      "status": "created"
    }
  ]
}
```

---

## C. Student Database Creation & Identity Mapping

### 1. Account Attributes Verification

When a new student is provisioned via Scenario 3, TrainX executes:

```sql
INSERT INTO users (
  name, email, mobile_number, role, college_id, career_gateway_student_id,
  source_system, password_hash, is_active, is_verified, is_approved, provisioned_at
)
VALUES (?, ?, ?, 'student', ?, ?, 'career_gateway', NULL, 0, 0, 1, NOW())
ON DUPLICATE KEY UPDATE
  id = LAST_INSERT_ID(id),
  career_gateway_student_id = VALUES(career_gateway_student_id),
  source_system = 'career_gateway',
  updated_at = NOW();
```

| Database Field | Expected Provisioned Value | Code Verification in `studentProvisioning.service.js` |
|---|---|---|
| `role` | `'student'` | Verified line 446: Hardcoded string `'student'` |
| `source_system` | `'career_gateway'` | Verified line 446: Hardcoded string `'career_gateway'` |
| `career_gateway_student_id` | External Integer ID | Verified line 446: Mapped to `externalStudentId` |
| `password_hash` | `NULL` | Verified line 446: Set explicitly to `NULL` |
| `is_active` | `0` | Verified line 446: Set explicitly to `0` (Login disabled) |
| `is_verified` | `0` | Verified line 446: Set explicitly to `0` (Email unconfirmed) |
| `is_approved` | `1` | Verified line 446: Set explicitly to `1` (No manual admin approval gate required) |
| `provisioned_at` | Current Timestamp | Verified line 446: Set explicitly to `NOW()` |

### 2. External Identity Mapping Table (`career_gateway_student_mappings`)

TrainX decouples internal auto-incrementing user IDs from external Career Gateway IDs using a dedicated cross-reference table defined in [`Backend/src/migrations/20261106_career_gateway_integration.sql`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/migrations/20261106_career_gateway_integration.sql#L49-L64):

```sql
CREATE TABLE IF NOT EXISTS career_gateway_student_mappings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trainx_user_id INT NOT NULL,
  career_gateway_student_id INT NOT NULL,
  clg_id VARCHAR(100) NULL,
  assigned_batch VARCHAR(100) NULL,
  source_system VARCHAR(50) NOT NULL DEFAULT 'career_gateway',
  eligibility_status ENUM('eligible', 'revoked', 'pending') NOT NULL DEFAULT 'eligible',
  provisioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP NULL DEFAULT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  metadata JSON NULL,
  UNIQUE KEY unique_cg_student (career_gateway_student_id),
  UNIQUE KEY unique_tx_user (trainx_user_id),
  FOREIGN KEY (trainx_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_mapping_status (eligibility_status),
  INDEX idx_mapping_clg_id (clg_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Key Guarantees:
1. **1-to-1 Bijective Integrity:** `UNIQUE KEY unique_cg_student` and `UNIQUE KEY unique_tx_user` prevent multiple TrainX users from linking to the same external record, or one TrainX student holding multiple external links.
2. **Independent Identifier Storage:**
   - `career_gateway_student_id` stores the external primary key (`student_details.id`).
   - `trainx_user_id` stores the internal `users.id`.
   - `clg_id` stores the university registration string (`VU3F2425047`).
   - `users.college_id` stores the TrainX college tenant ID (`colleges.id = 9`).

---

## D. Student Activation Email & Token Lifecycle

### 1. Token Generation & Storage Architecture

When an account is created in `studentProvisioning.service.js`, the service immediately calls [`createAccountActivation`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/accountActivation.service.js#L14-L42):

```javascript
const rawToken = crypto.randomBytes(32).toString('hex');
const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
```

#### Cryptographic Lifecycle:
1. **Entropy:** 32 cryptographically random bytes generated via Node.js native `crypto.randomBytes` (256 bits of entropy, formatted as a 64-character hexadecimal string).
2. **Storage Security:** **The raw token is NEVER written to the database.** Only its one-way cryptographic digest (`SHA-256`) is stored in the `account_activations` table. If the database is compromised, activation tokens cannot be forged or extracted.
3. **Automatic Single-Use Invalidation:** Before creating a new token, any existing unused tokens for that `user_id` are marked consumed:
   ```sql
   UPDATE account_activations SET consumed_at = NOW() WHERE user_id = ? AND consumed_at IS NULL;
   ```
4. **Time-To-Live (TTL):** Exactly 72 hours from the moment of provisioning.

### 2. Email Delivery Pipeline

Activation emails are dispatched via [`sendActivationEmail`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/accountActivation.service.js#L48-L87):
- **Post-Commit Execution:** To prevent sending emails for database transactions that subsequently abort, the email trigger is pushed to a `pendingPostCommitActions` queue and executed *only after* `connection.commit()` succeeds.
- **Provider Redundancy:** Handled by [`Backend/src/services/email.service.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/services/email.service.js). Primary delivery uses SMTP (e.g. Google Workspace/Hostinger); if SMTP fails or times out, it automatically falls back to the Brevo Transactional Email REST API.
- **Generated Link:**
  ```
  ${FRONTEND_URL}/activate-account?token=${rawToken}&email=${encodeURIComponent(studentEmail)}
  ```

---

## E. Dedicated Password Setup Page — CRITICAL AUDIT

### 1. Forensic Discovery: Why Activation Links Currently Redirect to Login

During our inspection of the frontend router ([`Frontend/src/App.jsx`](file:///c:/Users/paksh/Desktop/Training%20Portal/Frontend/src/App.jsx)), we identified the exact cause of this behavior:

```jsx
// Lines 128-134 of Frontend/src/App.jsx
<Routes>
  {/* Auth & Public Routes */}
  <Route path="/" element={<MaintenanceGuard moduleKey="loginWithPassword"><Login /></MaintenanceGuard>} />
  <Route path="/register" element={<MaintenanceGuard moduleKey="userRegistration"><Register /></MaintenanceGuard>} />
  <Route path="/setup-institution" element={<SetupInstitution />} />
  <Route path="/trainings/register" element={<MaintenanceGuard moduleKey="trainingRegistration"><TrainingRegistrationPage /></MaintenanceGuard>} />

  {/* Student, Mentor, Coordinator, Super Admin routes... */}

  {/* Line 316: Catch-all Fallback */}
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

#### Findings:
1. **Route Missing in React Router:** The route `/activate-account` is **not registered** anywhere in `Frontend/src/App.jsx`.
2. **Catch-All Interception:** When the student clicks `https://trainingportal.com/activate-account?token=...&email=...`, React Router fails to match any explicit route and hits line 316:
   `<Route path="*" element={<Navigate to="/" replace />} />`
3. **Silent Redirection to `/`:** Path `/` renders the `<Login />` component. The query parameters `?token=...` are discarded by the navigation replace.
4. **Missing Frontend Component:** A dedicated `ActivateAccount.jsx` component does not exist in `Frontend/src/pages/authentication/`.
5. **Contrast with Institution Setup:** While College Admins have a dedicated invitation page ([`SetupInstitution.jsx`](file:///c:/Users/paksh/Desktop/Training%20Portal/Frontend/src/pages/authentication/SetupInstitution.jsx)) registered at `/setup-institution`, student account activation has no corresponding component.

### 2. Specification for the Dedicated Password Setup Component

To resolve this issue, a dedicated `ActivateAccount.jsx` component must be created and registered at `/activate-account`.

#### UI/UX State Machine:

```
                          Page Mounted (/activate-account)
                                         |
                       Read `token` and `email` from URL
                                         |
                         +---------------+---------------+
                         |                               |
                   Missing Params                  Params Present
                         |                               |
                         v                               v
                  [ERROR STATE]                   [ACTIVE FORM]
               "Invalid Activation Link"       - TrainX Logo & Branding
                                               - "Activate Your Account"
                                               - Email (Pre-filled & Readonly)
                                               - New Password Input
                                               - Confirm Password Input
                                               - Password Requirements Box
                                               - Submit Button
                                                         |
                                                  User Submits Form
                                                         |
                                                         v
                                                [SUBMITTING STATE]
                                            POST /activate-account API
                                                         |
                         +-------------------------------+-------------------------------+
                         |                               |                               |
                     HTTP 200                        HTTP 400                        HTTP 400
                  [SUCCESS STATE]                 [EXPIRED STATE]                 [ALREADY ACTIVE]
              - "Account Activated!"         - "Activation Link Expired"      - "Already Activated"
              - Green Checkmark Badge        - "Request New Link" button      - "Proceed to Login" button
              - Auto-redirect to / in 3s
```

#### Interface Requirements:
- **Branding:** Official TrainX header (`TrainXLogo`), subtitle *"Career Gateway Verified Student Activation"*.
- **Email Field:** Pre-populated from `?email=...`, readonly, with lock badge.
- **Password Constraints:**
  - Minimum 8 characters (backend requires >= 6; 8 recommended for security).
  - Must include at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
  - Interactive strength meter (Weak / Medium / Strong).
- **Password Confirmation:** Live equality check with red/green visual feedback.
- **Show/Hide Password:** Dual eye icons.
- **Action API:** Dispatches JSON `{ token, password }` to backend endpoint `POST /api/v1/integrations/career-gateway/activate-account`.

---

## F. Password Creation & Activation API

### 1. Inbound Endpoint Details

- **Route:** `POST /api/v1/integrations/career-gateway/activate-account`
- **Controller:** [`handleActivateAccount`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/controllers/careerGatewayProvisioning.controller.js#L95-L110)
- **Service:** [`consumeAccountActivation`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/accountActivation.service.js#L92-L143)
- **Authentication:** Publicly accessible, secured strictly by cryptographic possession of the 32-byte raw activation token.
- **Rate Limiting:** Guarded by [`activationRateLimiter`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/middleware/careerGatewayRateLimit.middleware.js#L10-L27) (maximum 30 activation attempts per 15 minutes per IP/token) to prevent bcrypt brute-force attacks and DoS.

### 2. Execution Step Walkthrough

```javascript
// 1. Compute SHA-256 hash of incoming raw token
const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

// 2. Locate activation record
const [record] = await query(
  `SELECT a.id, a.user_id, a.expires_at, a.consumed_at, u.email, u.name
   FROM account_activations a
   JOIN users u ON u.id = a.user_id
   WHERE a.token_hash = ? LIMIT 1`,
  [tokenHash]
);

// 3. Validation gates
if (!record) throw new Error('Invalid or unknown activation token.');
if (record.consumed_at) throw new Error('This activation token has already been used. Please log in with your password.');
if (new Date(record.expires_at) < new Date()) throw new Error('This activation token has expired. Please contact support.');

// 4. Secure Password Hashing
const passwordHash = await bcrypt.hash(newPassword, 12);

// 5. Atomic Account Activation
await query('UPDATE account_activations SET consumed_at = NOW() WHERE id = ?', [record.id]);
await query(
  `UPDATE users 
   SET password_hash = ?, is_active = 1, is_verified = 1, is_approved = 1, updated_at = NOW() 
   WHERE id = ?`,
  [passwordHash, record.user_id]
);

// 6. Invalidate Negative Auth Cache
invalidateUserAuthCache(record.user_id);
```

#### Security Properties:
1. **Bcrypt Work Factor 12:** Password is encrypted using `bcrypt.hash(..., 12)` (~250-300ms compute cost per hash), providing strong resistance to offline dictionary attacks.
2. **Immediate Cache Eviction:** [`invalidateUserAuthCache(record.user_id)`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/middleware/auth.middleware.js#L15-L26) purges any in-memory negative status cache so the user can immediately log in.
3. **Strict Replay Rejection:** `consumed_at` timestamp prevents token reuse.

---

## G. Alternative Portal Registration Pathway

TrainX provides a direct self-registration interface for institutional students ([`Frontend/src/pages/authentication/register.jsx`](file:///c:/Users/paksh/Desktop/Training%20Portal/Frontend/src/pages/authentication/register.jsx)). When a student who was pre-provisioned via Career Gateway visits `/register` instead of clicking their email link, TrainX executes registration reconciliation in [`Backend/src/services/auth.service.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/services/auth.service.js#L287-L435).

### 1. Reconciliation Logic

1. **Email Lookup:** The system checks `findUserByEmailOrMobile(email)`.
2. **Status Evaluation:**
   - If `hasPassword && isApproved && isCompleted`: The system rejects registration with `HTTP 409 Conflict` (*"You are already registered! Please log in with your email and password."*).
   - If `password_hash === NULL` (Pre-provisioned by Career Gateway): The system allows the student to set their password and complete their profile.
3. **Identity Verification:**
   - **Mandatory 2-Phase Email OTP:** The legacy unauthenticated registration endpoint has been removed. A user *cannot* register or claim an account without first proving ownership of the email via a 6-digit cryptographic OTP sent to that email address ([`auth.routes.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/routes/auth.routes.js#L10-L17)).
   - **Authorized College Email Domain:** `findCollegeByEmailDomain(email)` verifies that the email domain matches the registered college tenant domain (e.g. `@somaiya.edu`).

### 2. Threat Analysis: Can an Attacker Hijack a Pre-Provisioned Record?

| Attack Vector | Vulnerability Assessment | Code Defense |
|---|---|---|
| **Attacker knows victim's Roll Number** | **IMMUNE** | Roll number is an academic attribute and cannot authenticate or claim an account without email OTP validation. |
| **Attacker enters victim's College Email** | **IMMUNE** | TrainX sends a single-use 6-digit OTP to the victim's official email address. Without access to the student's email inbox, the attacker cannot complete registration. |
| **Attacker registers with personal Gmail** | **IMMUNE** | `findCollegeByEmailDomain` rejects unauthorized domains with `HTTP 400` (*"Registration denied: No registered institution matches your email domain"*). |
| **Concurrent duplicate registration** | **IMMUNE** | Governed by database unique constraints on `users.email`. |

---

## H. Normal TrainX Authentication

TrainX maintains its own independent authentication system. Career Gateway passwords are never transmitted, received, or stored by TrainX.

```
Student Enters Credentials (email + password)
                     |
                     v
POST /api/v1/auth/login (passwordLogin in auth.controller.js)
                     |
                     v
Find user by email in `users` table
                     |
                     +---> Not found? -> 401 Unauthorized
                     |
                     +---> password_hash is NULL? -> 401 "Account not activated. Please activate via your email link."
                     |
                     +---> is_active == 0? -> 401 "Your account is inactive or has been revoked."
                     |
                     v
bcrypt.compare(password, user.password_hash)
                     |
                     +---> Mismatch? -> 401 "Invalid email or password"
                     |
                     v
Sign User Session JWT (HS256, JWT_SECRET, 7-day expiry)
                     |
                     v
Return token + user profile to frontend
```

### 1. Runtime Active Status Validation (`verifyUserIsActive`)

To guarantee that revoked students cannot continue making API requests using long-lived JWTs:
- Every authenticated request passes through [`authenticateToken`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/middleware/auth.middleware.js#L88-L135).
- After verifying JWT signature and expiry, the middleware calls `verifyUserIsActive(userId)`.
- It queries the database (with a bounded 30-second in-memory cache) to ensure `users.is_active === 1`.
- If an admin or Career Gateway revokes a student, their cache entry is evicted instantly, and subsequent HTTP requests are rejected with `401 Unauthorized`.

### 2. Real-Time Socket.IO Authentication

TrainX runs real-time WebSocket namespaces (e.g. `/interviews` for AI mock interviews) in [`Backend/src/socket/interview.socket.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/socket/interview.socket.js):
- Handshake validates `auth.token` against `JWT_SECRET`.
- When eligibility is revoked, `disconnectUserSockets(userId)` forcefully terminates all active socket connections belonging to that user.

---

## I. Training Modules & Student Experience

TrainX provides seven functional subsystems. All verified modules, their backend routes, database models, and Career Gateway sync eligibility are detailed below:

| # | Subsystem | Frontend Component | Backend Route / Controller | Database Tables | Sync to Career Gateway? |
|---|---|---|---|---|---|
| 1 | **LMS Batches & Curriculum** | `ST_Batches.jsx` | `GET /api/v1/student/batches` | `batches`, `student_batches`, `departments` | **YES** (Category 1: `batches`) |
| 2 | **Live Class Attendance** | `ST_Attendance.jsx` | `GET /api/v1/attendance/my-attendance` | `attendance`, `attendance_sessions` | **YES** (Category 2 & 3: `sessions`, `attendance`) |
| 3 | **AI Curriculum Roadmaps** | `ST_AiRoadmap.jsx` | `GET /api/v1/roadmaps/my` | `roadmaps`, `roadmap_items` | **YES** (Category 6: `student_progress`) |
| 4 | **Assignments & Tasks** | `ST_Overview.jsx` | `GET /api/v1/tasks/submissions` | `tasks`, `task_submissions` | **YES** (Category 6: `student_progress`) |
| 5 | **Coding Practice Arena** | `ST_CodingPlatform.jsx`<br/>`MonacoCodeEditor.jsx` | `POST /api/v1/coding/execute`<br/>`POST /api/v1/coding/submit` | `coding_problems`, `coding_submissions` | Planned for Phase 2 export |
| 6 | **Academic & Skill Quizzes** | `ST_AcademicQuiz.jsx` | `GET /api/v1/assessments/active`<br/>`POST /api/v1/assessments/:id/submit` | `assessments`, `assessment_attempts`, `questions` | **YES** (Category 4 & 5: `assessments`, `assessment_results`) |
| 7 | **AI Mock Interviewer** | `ST_AiInterview.jsx` | `POST /api/v1/interviews/session`<br/>Socket.IO `/interviews` | `ai_interviews`, `ai_interview_messages` | Planned for Phase 2 export |

---

## J. Outbound Synchronization to Career Gateway

### 1. Scheduler Architecture & Drift Tolerance

The daily export job is governed by [`Backend/src/scheduler/careerGatewayScheduler.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/scheduler/careerGatewayScheduler.js):
- **Schedule Window:** 02:00 AM Asia/Kolkata (`hour >= 2`).
- **Drift-Proof Watchdog Loop:** Runs every 30 seconds. Rather than relying on an exact-minute string match (`02:00`), the scheduler checks if `hour >= 2` and `lastRunDate !== todayDate`. If the server is restarting at 02:01 AM, it catches up immediately upon boot.

### 2. Distributed Advisory Mutex Locking

To prevent race conditions and duplicate exports in multi-instance horizontal deployments:
- Uses MySQL advisory lock:
  ```sql
  SELECT GET_LOCK('trainx_career_gateway_daily_sync_lock', 10) as acquired;
  ```
- Created on an independent dedicated connection in [`dailyTrainingSync.worker.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js#L14-L30).
- If instance A holds the lock, instance B aborts immediately (`Sync already running on another instance`).

### 3. Incremental Delta Checkpoint Management

TrainX tracks synchronization cursors in `career_gateway_sync_checkpoints`:
- Retrieves `last_successful_sync_at`.
- Queries records created or modified since `sinceTimestamp`.
- **The checkpoint cursor advances ONLY if Career Gateway acknowledges receipt with `HTTP 200/201`.**
- If Career Gateway's endpoint times out or returns an error, the batch status is marked `partial`, and the checkpoint timestamp remains un-advanced, guaranteeing automatic retry during the next cycle.

### 4. Six Export Categories & Data Payloads

Implemented in [`trainingDataExport.service.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/trainingDataExport.service.js):

#### Payload Envelope:
```json
{
  "source": "trainx",
  "schema_version": "1.0",
  "export_id": "EXP-1794123456-a1b2c3d4",
  "generated_at": "2026-11-08T02:00:00.000Z",
  "since": "2026-11-07T02:00:00.000Z",
  "college_id": null,
  "students_count": 142,
  "records_count": 876,
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

#### Category Details:
1. **`batches`:** Training cohort definitions (`batch_id`, `batch_name`, `college_id`, `year`, `division`, `schedule`, `student_count`).
2. **`sessions`:** Attendance sessions created by trainers (`session_id`, `batch_id`, `title`, `session_date`, `start_time`, `end_time`, `trainer_id`).
3. **`attendance`:** Individual student attendance records (`attendance_id`, `student_id` [Career Gateway ID], `trainx_user_id`, `batch_id`, `session_id`, `session_date`, `status` [Present/Absent/Late], `remarks`).
4. **`assessments`:** Quiz & test definitions (`assessment_id`, `batch_id`, `title`, `category`, `total_marks`, `pass_marks`, `passing_percentage`).
5. **`assessment_results`:** Student test attempts (`attempt_id`, `student_id` [Career Gateway ID], `trainx_user_id`, `assessment_id`, `score`, `total_questions`, `attempted_questions`, `correct_count`, `attempt_date`).
6. **`student_progress`:** Aggregate student roadmap and assignment progress (`student_id` [Career Gateway ID], `trainx_user_id`, `clg_id`, `email`, `total_modules`, `completed_modules`, `completion_percentage`, `tasks_submitted`, `tasks_approved`, `last_activity_date`).

### 5. Outbound HTTP Client (`CareerGatewayClient`)

Defined in [`careerGatewayClient.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js):
- **Target URL:** `${CAREER_GATEWAY_API_URL}/api/integrations/trainx/training-records`
- **S2S Token Claims:**
  - `iss: 'trainx'`
  - `aud: 'career-gateway'`
  - `sub: 'trainx-export-service'`
  - `scope: 'training_sync'`
  - `jti: crypto.randomUUID()`
  - Signed with `TRAINX_TO_CAREER_GATEWAY_SECRET` (HS256, 15m expiry).
- **Network Resilience:** Uses `AbortController` with a 15,000 ms timeout.

---

## K. Eligibility Revocation

When a student loses eligibility in Career Gateway (e.g. academic disqualification or administrative withdrawal), Career Gateway issues:
```http
PATCH /api/v1/integrations/career-gateway/students/:studentId/eligibility
Authorization: Bearer <S2S_JWT>
Content-Type: application/json

{
  "eligible": false,
  "reason": "Attendance below minimum threshold"
}
```

### Execution Flow in `revokeStudentEligibility`:
1. **Mapping Lookup:** Resolves `career_gateway_student_mappings` by external `studentId`.
2. **Account Deactivation:** Updates `users SET is_active = 0 WHERE id = ?`.
3. **Token Invalidation:** Invalidates any pending activation tokens (`UPDATE account_activations SET consumed_at = NOW()`).
4. **Mapping Update:** Updates mapping status to `'revoked'` and timestamps `revoked_at`.
5. **Audit Logging:** Inserts record into `career_gateway_integration_events`.
6. **Real-Time Token Cache Eviction (SEC-01):** Calls `invalidateUserAuthCache(userId)` so any existing session JWTs are immediately rejected.
7. **WebSocket Termination (SEC-01):** Calls `disconnectUserSockets(userId, reason)` to disconnect live AI interviews or coding sessions.
8. **Data Preservation:** **Historical test attempts, coding submissions, and attendance logs are never deleted.**
9. **Re-Eligibility:** If Career Gateway sends `"eligible": true` at a later date, the account is reactivated (`is_active = 1`), preserving the student's prior password and history.

---

## L. Deployment & Environment Configuration

### Environment Variable Audit Matrix

| Variable Name | Purpose | Where Configured | Secret Level | Required For |
|---|---|---|---|---|
| `TRAINX_INTEGRATION_SECRET`<br/>*(or `CAREER_GATEWAY_SERVICE_SECRET`)* | Verifies inbound JWT requests sent from Career Gateway | Render Backend | **Critical Secret** | Inbound provisioning & deactivation |
| `TRAINX_TO_CAREER_GATEWAY_SECRET` | Signs outbound JWT requests sent from TrainX to Career Gateway | Render Backend | **Critical Secret** | Outbound 02:00 AM training sync |
| `CAREER_GATEWAY_API_URL` | Base URL of Career Gateway API (e.g. `https://staging-api.careergateway.edu`) | Render Backend | Public / Internal URL | Outbound HTTP requests |
| `FRONTEND_URL` | Base URL of TrainX frontend used to generate email activation links | Render Backend | Public URL | Email activation links |
| `JWT_SECRET` | Signs TrainX student/admin user session JWT tokens | Render Backend | **Critical Secret** | TrainX user login & session auth |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection configuration | Render Backend | **Critical Secret** | Core database storage |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Primary email gateway credentials | Render Backend | **Critical Secret** | Activation & OTP emails |
| `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` | Transactional email failover gateway | Render Backend | **Critical Secret** | Backup email delivery |
| `VITE_API_BASE_URL` / `VITE_API_URL` | Base URL of TrainX backend API | Vercel Frontend | Public URL | Frontend API client |

#### Critical Deployment Directives:
1. **Never expose S2S secrets to the frontend:** Neither `TRAINX_INTEGRATION_SECRET` nor `TRAINX_TO_CAREER_GATEWAY_SECRET` should ever be set in Vercel environment variables or prefixed with `VITE_`.
2. **Never share user and S2S secrets:** `JWT_SECRET` must be distinct from both integration secrets.
3. **Frontend URL Configuration:** Ensure `FRONTEND_URL` on Render points to the public frontend domain (e.g. `https://trainingportal.getflytechnologies.com`), not `localhost:5173`.

---

## M. Security & Reliability Audit

| Area | Implementation & Evidence | Audit Status |
|---|---|---|
| **Tenant Isolation** | Evaluated in `resolveCollegeTenant`. Rejects missing/ambiguous colleges with HTTP 422. Prohibits fallback. Prevents `clg_id` confusion. | **SECURE** |
| **S2S Authentication** | Evaluated in `careerGatewayAuth.middleware.js`. HS256 algorithm enforcement, claims validation (`iss`, `aud`, `sub`, `scope`). | **SECURE** |
| **Activation Token Entropy** | Evaluated in `accountActivation.service.js`. 32-byte crypto random generation. Stored exclusively as SHA-256 hash. 72h expiry. | **SECURE** |
| **Password Hashing** | Evaluated in `accountActivation.service.js` line 123. `bcrypt.hash(newPassword, 12)`. | **SECURE** |
| **Idempotency** | Evaluated in `studentProvisioning.service.js`. Safe updates for existing students; `LAST_INSERT_ID` for concurrent inserts. | **SECURE** |
| **SQL Injection** | Parameterized queries used across all endpoints and migrations. Dynamic table names and identifiers sanitized. | **SECURE** |
| **Rate Limiting** | Dual-tier limiter: 30 req/15m on activation; 600 req/5m on M2M provisioning. | **SECURE** |
| **Revocation Invalidation** | In-memory cache invalidated instantly; WebSocket connections terminated immediately. | **SECURE** |
| **Advisory Mutex Locking** | MySQL `GET_LOCK` ensures single-instance execution of scheduled export jobs. | **SECURE** |
| **Frontend Setup Route** | Route `/activate-account` missing in `App.jsx`, causing fallback redirect to `/` (Login). | **ACTION REQUIRED** |

---

## N. Comprehensive Feature Tracking Table

| ID | Feature | Status | Actual Source Files | Evidence | Missing Work | Priority |
|---|---|---|---|---|---|---|
| **FT-01** | Inbound S2S Authentication Middleware | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/middleware/careerGatewayAuth.middleware.js` | Validates HS256, `iss: career-gateway`, `aud: trainx`, `sub: career-gateway-integration-service`, `scope: student_sync`. | None | High |
| **FT-02** | Tenant College Resolution | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js` (lines 12–116) | Resolves `career_gateway_college_id`, `college_id`, `code`, `name`. Fails closed with HTTP 422. Never uses `clg_id`. | None | High |
| **FT-03** | Idempotent Student Provisioning | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/services/studentProvisioning.service.js` (lines 170–550) | Fully transactional. Scenarios 1, 2, 3 implemented. Sets `role=student`, `source_system=career_gateway`, `password_hash=NULL`, `is_active=0`, `is_approved=1`. | None | High |
| **FT-04** | Dual Identity Mapping Table | **IMPLEMENTED** | `Backend/src/migrations/20261106_career_gateway_integration.sql` | `career_gateway_student_mappings` table with `unique_cg_student` and `unique_tx_user`. | None | High |
| **FT-05** | Cryptographic Activation Token Generator | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/services/accountActivation.service.js` (lines 14–42) | 32-byte crypto token, SHA-256 hash storage, 72h TTL, single-use invalidation. | None | High |
| **FT-06** | Student Activation Email Dispatcher | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/services/accountActivation.service.js` (lines 48–87) | Post-commit async trigger, SMTP primary + Brevo failover, formatted HTML email. | None | High |
| **FT-07** | Backend Password Activation API | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/controllers/careerGatewayProvisioning.controller.js` (lines 95–110)<br/>`accountActivation.service.js` (lines 92–143) | `POST /activate-account`, SHA-256 verification, bcrypt cost 12, marks `is_active=1`, `is_verified=1`. | None | High |
| **FT-08** | Dedicated Frontend Activation Page | **MISSING** | `Frontend/src/App.jsx` | Route `/activate-account` is not defined in `App.jsx`, triggering catch-all fallback `<Navigate to="/" replace />` to `/login`. | Create `ActivateAccount.jsx` and register route `/activate-account` in `App.jsx`. | **CRITICAL** |
| **FT-09** | Direct Portal Registration Reconciliation | **IMPLEMENTED** | `Backend/src/services/auth.service.js` (lines 287–435) | Matches pre-provisioned record, enforces two-phase 6-digit email OTP, validates college domain. | None | Medium |
| **FT-10** | Student Login & JWT Authentication | **IMPLEMENTED** | `Backend/src/controllers/auth.controller.js`<br/>`Backend/src/middleware/auth.middleware.js` | Independent bcrypt verification, 7-day session JWT, runtime `verifyUserIsActive` check with 30s cache. | None | High |
| **FT-11** | Real-Time WebSocket Session Revocation | **IMPLEMENTED** | `Backend/src/socket/interview.socket.js`<br/>`Backend/src/middleware/auth.middleware.js` | `disconnectUserSockets` and `invalidateUserAuthCache` terminate active sessions upon deactivation. | None | High |
| **FT-12** | Student Eligibility Revocation API | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/controllers/careerGatewayProvisioning.controller.js`<br/>`studentProvisioning.service.js` | `PATCH /students/:studentId/eligibility` and `POST /students/deactivate`, sets `is_active=0`, preserves historical logs. | None | High |
| **FT-13** | Outbound Daily Sync Scheduler (02:00 IST) | **IMPLEMENTED** | `Backend/src/scheduler/careerGatewayScheduler.js` | 30s drift-proof watchdog loop, evaluates `hour >= 2` Asia/Kolkata, catches up on restart. | None | High |
| **FT-14** | Distributed Advisory Mutex Locking | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js` (lines 14–54) | Dedicated MySQL connection, `GET_LOCK('trainx_career_gateway_daily_sync_lock', 10)`. | None | High |
| **FT-15** | Six-Category Training Data Collector | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/services/trainingDataExport.service.js` | Extracts `batches`, `sessions`, `attendance`, `assessments`, `assessment_results`, `student_progress`. | None | High |
| **FT-16** | Outbound Career Gateway HTTP Client | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/client/careerGatewayClient.js` | S2S JWT signing (`TRAINX_TO_CAREER_GATEWAY_SECRET`), 15s timeout, posts to `/training-records`. | None | High |
| **FT-17** | Delta Checkpoint Cursor Tracker | **IMPLEMENTED** | `Backend/src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js` (lines 58–179) | Table `career_gateway_sync_checkpoints`, advances timestamp only upon HTTP 200 acknowledgement. | None | High |

---

## O. Final Assessment & Audit Conclusions

### 1. What is already working?
- The inbound S2S provisioning API (`POST /api/v1/integrations/career-gateway/students`) is fully operational, authenticated with Bearer HS256 tokens, and rate-limited.
- Strict tenant resolution is enforced (rejecting ambiguous or missing colleges with HTTP 422).
- Student account creation properly initializes `role = student`, `source_system = career_gateway`, `password_hash = NULL`, `is_active = 0`, and `is_approved = 1`.
- Dual identity mapping in `career_gateway_student_mappings` is active and maintains independent `clg_id` values.
- Cryptographic 32-byte activation tokens (SHA-256 hashed, 72h TTL) and automated welcome emails are functioning.
- The outbound export scheduler (02:00 AM IST watchdog) with distributed MySQL advisory locks is fully wired to collect all 6 training export categories.
- Immediate student revocation (`PATCH /students/:studentId/eligibility` and `POST /students/deactivate`) correctly flips `is_active = 0`, evicts auth caches, and terminates active WebSockets.

### 2. Why does the activation link currently redirect to login?
**The route `/activate-account` is not defined in [`Frontend/src/App.jsx`](file:///c:/Users/paksh/Desktop/Training%20Portal/Frontend/src/App.jsx).** When a student clicks the activation link in their email (`https://trainingportal.com/activate-account?token=...&email=...`), React Router evaluates its route table, finds no match, and executes the fallback catch-all route at line 316:
```jsx
<Route path="*" element={<Navigate to="/" replace />} />
```
Because `/` maps to `<Login />`, the user is redirected to the login page, and the query parameters (`?token=...`) are lost.

### 3. What is missing for password setup?
1. An `ActivateAccount.jsx` React component in `Frontend/src/pages/authentication/` that reads `token` and `email` from query parameters, validates password complexity, and posts to `/api/v1/integrations/career-gateway/activate-account`.
2. A route declaration in `Frontend/src/App.jsx`:
   ```jsx
   <Route path="/activate-account" element={<ActivateAccount />} />
   ```

### 4. Is the activation email flow secure?
**Yes.**
- The raw 32-byte token is never stored in plaintext in the database (only its SHA-256 digest is stored).
- Tokens are single-use (`consumed_at` is enforced atomically).
- Tokens expire in 72 hours.
- Prior tokens for the same user are invalidated whenever a new token is issued.
- The activation API is protected by `activationRateLimiter` (30 requests per 15 minutes) to protect against bcrypt resource exhaustion.

### 5. Are the six training export categories implemented?
**Yes.** In [`trainingDataExport.service.js`](file:///c:/Users/paksh/Desktop/Training%20Portal/Backend/src/modules/integrations/careerGateway/services/trainingDataExport.service.js), all six categories are implemented:
1. `batches`
2. `sessions`
3. `attendance`
4. `assessments`
5. `assessment_results`
6. `student_progress`

### 6. Are the integration APIs compatible with Career Gateway?
**Yes.** The schemas, header conventions, Bearer JWT claims (`iss: career-gateway`, `aud: trainx`), HTTP response format (`reference_id: tx_student_<id>`, `id`), and error handling align with Career Gateway's contract.

### 7. What could fail during staging integration?
1. **Frontend Activation Redirection:** Students attempting to activate via email links will land on `/login` instead of the password setup page until the frontend component is created and registered.
2. **Environment Variable Missing on Render:** If `TRAINX_INTEGRATION_SECRET` or `CAREER_GATEWAY_SERVICE_SECRET` is not set on the Render backend dashboard, inbound calls will return `500 Server Error`.
3. **Outbound Receiver Endpoint in Career Gateway:** If Career Gateway has not yet deployed `POST /api/integrations/trainx/training-records`, the daily export will mark batches as `partial` (logged safely without crashing TrainX).

### 8. What should be fixed before student provisioning?
1. **Implement `Frontend/src/pages/authentication/ActivateAccount.jsx`** and mount `<Route path="/activate-account" element={<ActivateAccount />} />` in `Frontend/src/App.jsx`.
2. Verify that `FRONTEND_URL` in backend `.env` matches the public client domain so activation links point to the correct URL.

### 9. What should be improved before production?
1. **Automated Resend Activation Link:** Provide a self-service *"Resend Activation Email"* button on the activation page if a student's token has expired.
2. **Webhooks for Real-Time Sync:** In addition to the 02:00 AM daily sync, consider triggering real-time event webhooks when students complete high-stakes assessments.
3. **Outbound Secret Verification:** Confirm that `TRAINX_TO_CAREER_GATEWAY_SECRET` is shared with Career Gateway so their receiver can verify TrainX's daily export tokens.

