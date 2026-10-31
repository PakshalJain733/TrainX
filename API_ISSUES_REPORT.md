# TrainX Training Portal – API Issues, Vulnerabilities & Remediation Report

**Date of Report:** November 1, 2026  
**Status:** Audit & Remediation Complete  

This report documents every architectural issue, security vulnerability, data leakage flaw, and integration mismatch discovered during the audit of the TrainX Training Portal.

---

## Summary of Discovered Issues

| Issue ID | Category | Severity | Problem Summary | Remediation Status |
|---|---|---|---|---|
| **ISSUE-01** | Data Isolation / Privacy | **CRITICAL** | Cross-Batch Task Leakage (Empty batches displayed tasks from all other batches) | **FIXED & VERIFIED** |
| **ISSUE-02** | Security / Authorization | **HIGH** | Missing Student Batch Enrollment Check on Task Submissions & Detail View | **FIXED & VERIFIED** |
| **ISSUE-03** | Integration / 404 Error | **MEDIUM** | Frontend missing `/api/v1` prefix in `SystemMaintenanceContext.jsx` | **Documented & Ready** |
| **ISSUE-04** | Security / Multi-Tenancy | **MEDIUM** | Multi-College Data Isolation on Batch Task Modification / Deletion | **FIXED & VERIFIED** |
| **ISSUE-05** | Security / DoS Prevention | **LOW** | Missing Rate Limiting on Code Execution (`/api/v1/code/submit`) | **Recommendation Provided** |

---

## Detailed Issue Breakdown

### ISSUE-01: Cross-Batch Task Data Leakage (CRITICAL)

- **Endpoint:** `GET /api/v1/batches/:id/tasks`, `GET /api/v1/mentor/batches/:id`
- **HTTP Method:** `GET`
- **Severity:** **CRITICAL**
- **Status:** **FIXED & VERIFIED (24/24 Tests Passed)**

#### Problem Description:
When a user created a new batch or opened any batch without assigned tasks, the portal displayed tasks that belonged to completely different batches. A newly created batch with zero tasks would inherit and display all tasks created across the entire database.

#### Root Cause:
In `Backend/src/controllers/batch.controller.js` (lines 538–543), the controller implemented a fallback query:
```javascript
let dbTasks = await query(
  "SELECT * FROM batch_tasks WHERE batch_id = ? OR batch_id = ? OR batch_id = '0' ORDER BY id DESC",
  [id, cleanId]
);

// Fallback: If no batch-specific tasks found, return all assigned batch_tasks in DB so none are lost
if (!dbTasks || dbTasks.length === 0) {
  dbTasks = await query("SELECT * FROM batch_tasks ORDER BY id DESC");
}
```
A similar fallback existed in `Backend/src/controllers/mentor.controller.js` (lines 2300–2310). This fallback deliberately overwrote an empty result set by fetching every task in the database.

#### Remediation Applied:
1. Removed the fallback query completely in both `batch.controller.js` and `mentor.controller.js`.
2. Sanitized batch IDs to strictly integers (`cleanBatchId = parseInt(..., 10)`).
3. Enforced `WHERE batch_id = ?` without allowing `batch_id = '0'`.
4. If a batch has 0 tasks, the API returns an empty array `[]` with `200 OK`.
5. Updated frontend empty states in `ST_Batches.jsx`, `AD_Batches.jsx`, and `MN_Batches.jsx` to display *"No tasks assigned to this batch yet"*.
6. Database migration: Executed alignment on `task_submissions` to ensure `ts.batch_id = bt.batch_id` for all historical records.

---

### ISSUE-02: Missing Student Batch Enrollment Check on Task Submissions (HIGH)

- **Endpoints:**
  - `POST /api/v1/code/submit`
  - `GET /api/v1/batches/tasks/detail/:taskId`
- **HTTP Methods:** `POST`, `GET`
- **Severity:** **HIGH**
- **Status:** **FIXED & VERIFIED**

#### Problem Description:
Students could access task details and submit code solutions to batch tasks belonging to batches they were not enrolled in, bypassing cohort boundaries.

#### Root Cause:
- `getTaskById` only looked up `WHERE id = ?` without verifying whether `req.user.id` was enrolled in `batch_tasks.batch_id`.
- `submitCodeAndSaveService` in `codingSubmission.service.js` recorded submissions without verifying whether the student belonged to the task's assigned cohort.

#### Remediation Applied:
Added student enrollment verification in `getTaskById` and `submitCodeAndSaveService`:
```javascript
const enrollment = await query(
  "SELECT 1 FROM student_batches WHERE user_id = ? AND batch_id = ? UNION SELECT 1 FROM students WHERE user_id = ? AND batch_id = ? LIMIT 1",
  [studentId, task.batch_id, studentId, task.batch_id]
);
if (!enrollment || enrollment.length === 0) {
  return sendError(res, "Access denied. You are not enrolled in the batch this task belongs to.", 403);
}
```
Unauthorized attempts now return `403 Forbidden`.

---

### ISSUE-03: Frontend URL Missing `/api/v1` Base Prefix (MEDIUM)

- **Affected Components:**
  - `Frontend/src/context/SystemMaintenanceContext.jsx` (lines 88, 420)
  - `Frontend/src/components/common/MeetingReminderBanner.jsx` (line 45)
- **Severity:** **MEDIUM**
- **Status:** **DOCUMENTED (Remediation Ready)**

#### Problem Description:
Several frontend fetch calls concatenate `${getApiBaseUrl()}/feature-switches` directly. When `getApiBaseUrl()` returns the server host (e.g. `http://localhost:5000`), the resulting request is sent to `http://localhost:5000/feature-switches`, which returns `404 Route Not Found` because the Express backend mounts all routes under `/api/v1`.

#### Recommended Solution:
In `Frontend/src/context/SystemMaintenanceContext.jsx`, update URLs to include `/api/v1`:
```javascript
// Replace:
fetch(`${getApiBaseUrl()}/feature-switches`)
// With:
fetch(`${getApiBaseUrl()}/api/v1/feature-switches`)
```

---

### ISSUE-04: Multi-College Cross-Tenant Task Deletion / Manipulation (MEDIUM)

- **Endpoints:**
  - `PUT /api/v1/batches/:id/tasks/:taskId`
  - `DELETE /api/v1/batches/tasks/:taskId`
- **HTTP Methods:** `PUT`, `DELETE`
- **Severity:** **MEDIUM**
- **Status:** **FIXED & VERIFIED**

#### Problem Description:
Previously, `deleteBatchTask` only queried `DELETE FROM batch_tasks WHERE id = ?` without verifying whether the user was authorized or whether the batch belonged to the user's assigned college.

#### Remediation Applied:
1. Restricted task creation, editing, and deletion to roles `['super_admin', 'college_admin', 'coordinator', 'mentor']`. Students attempting these operations receive `403 Forbidden`.
2. Enforced college isolation: College Admins and Mentors cannot edit or delete tasks belonging to another college's batch.
3. Implemented cascading cleanup: Deleting a batch task now deletes its associated `task_submissions` records to prevent orphaned submission records.

---

### ISSUE-05: Missing Rate Limiting on Docker Code Execution (LOW)

- **Endpoint:** `POST /api/v1/code/submit`
- **HTTP Method:** `POST`
- **Severity:** **LOW**
- **Status:** **RECOMMENDED**

#### Problem Description:
While single-submission lock is enforced for batch coursework tasks (preventing reattempts), practice problem execution allows rapid repeated requests. Under high traffic, rapid compiler invocations can exhaust local Docker container resources.

#### Recommended Solution:
Attach `express-rate-limit` to `/api/v1/code/submit` limiting students to at most 10 compiler executions per minute.

---

## Verification & Test Results Summary

A 24-point end-to-end integration test suite was executed against the live application and database (`test_batch_isolation.mjs`):

```text
[SCENARIO 1]: Create Batch A and add two tasks
✅ PASS: Scenario 1.1 - Create Batch A - Batch A ID: 10
✅ PASS: Scenario 1.2 - Add Task A1 to Batch A - Task A1 ID: 9
✅ PASS: Scenario 1.3 - Add Task A2 to Batch A - Task A2 ID: 10

[SCENARIO 2]: Create Batch B without adding any tasks
✅ PASS: Scenario 2.1 - Create Batch B (0 tasks initially) - Batch B ID: 11

[SCENARIO 3]: Open Batch A and verify only its two tasks appear
✅ PASS: Scenario 3 - Batch A contains exactly its 2 assigned tasks - Found 2 tasks: [10, 9]

[SCENARIO 4]: Open Batch B and verify NO tasks appear (Strict Empty State)
✅ PASS: Scenario 4 - Batch B returns 0 tasks (Empty State verified, no task leakage) - Found 0 tasks in Batch B

[SCENARIO 5]: Add task to Batch B and verify strict cross-batch isolation
✅ PASS: Scenario 5.1 - Add Task B1 to Batch B - Task B1 ID: 11
✅ PASS: Scenario 5.2 - Batch B has only Task B1 - Batch B task count: 1
✅ PASS: Scenario 5.3 - Batch A remains isolated (Task B1 does not appear in Batch A) - Batch A task count: 2
✅ PASS: Scenario 5.4 - Editing Task in Batch A succeeds - Updated title: Task A1 (Edited): AVL Trees & Red-Black Balancing

[SCENARIO 6]: Student role task visibility verification
✅ PASS: Scenario 6.1 - Student A can view enrolled Batch A tasks - Student A sees 2 tasks in Batch A
✅ PASS: Scenario 6.2 - Student B can view enrolled Batch B tasks - Student B sees 1 tasks in Batch B
✅ PASS: Scenario 6.3 - Student A dashboard deadlines strictly isolated to Batch A - Batch IDs seen: [10, 10]
✅ PASS: Scenario 6.4 - Unenrolled Student C sees 0 batch tasks - Batch tasks seen by unenrolled student: 0

[SCENARIO 7]: Cross-Batch & Multi-College Unauthorized Access Blocking
✅ PASS: Scenario 7.1 - Student A accessing Batch B blocked (403 Forbidden)
✅ PASS: Scenario 7.2 - Student B accessing Batch A blocked (403 Forbidden)
✅ PASS: Scenario 7.3 - Student A accessing Task B1 detail blocked (403 Forbidden)
✅ PASS: Scenario 7.4 - Student A submitting code for Task B1 blocked (403 Forbidden)
✅ PASS: Scenario 7.5 - Foreign College Admin accessing Batch A blocked (403 Forbidden)
✅ PASS: Scenario 7.6 - Student attempting task creation blocked (403 Forbidden)
✅ PASS: Scenario 7.7 - Student attempting task deletion blocked (403 Forbidden)
✅ PASS: Scenario 7.8 - Admin deletes Task A1 from Batch A
✅ PASS: Scenario 7.9 - Batch A now has only Task A2
✅ PASS: Scenario 7.10 - Batch B remains completely unaffected

FINAL RESULT: ALL TESTS PASSED ✅ (24 / 24 Passed, 0 Failed)
```
