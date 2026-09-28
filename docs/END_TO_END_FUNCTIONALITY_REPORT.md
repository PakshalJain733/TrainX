# END-TO-END FUNCTIONALITY REPORT

**Date:** 24 Sep 2026
**Environment:** Local — Backend `localhost:5000`, MySQL `training_portal_db`, PowerShell + Node v24.16.0
**Branch:** `PAKSHAL&GANESH` (work uncommitted, per instruction — no commits/pushes made)

## Summary
Runtime end-to-end testing of the five role portals against the live backend + database.
Root cause of the priority bug (Admin Practice Problem → Student) was **not persistence** — the
backend chain worked. Instead the front-end create UI only writes to the shared store and the
student "Solve" click could not resolve non-batch tasks. Two real backend breaks were found and fixed:
(1) three role routers (`mentor`, `coordinator`, `superadmin`) plus `coding-submissions` were **never
mounted in `app.js`** → every Mentor/Coordinator/SuperAdmin API returned `404 Route not found`;
(2) student practice-problem list was **not college-scoped** → cross-college leak. The leave
application was also mocked (never persisted), breaking the approve workflow.

## Test Totals (runtime)
| Suite | Result |
|---|---|
| E2E Core (`tests/e2e.core.test.js`, `npm run test:e2e`) | **16 PASSED, 0 FAILED** |
| Socket AI Interview (`test:socket`) | **4 PASSED, 0 FAILED** |
| Isolation (`isolation.test.js`) | 12 PASSED |
| AI Skill Gap (`skill_gap.test.js`) | **4 PASSED, 0 FAILED** |
| Frontend production build (`npm run build`) | PASS (1.6s, chunk-size warning only) |
| Backend `node --check` on all changed files | PASS |
| **Total (this run)** | **36 PASSED, 0 FAILED** |

Attendance suite: previously completed (10/10 logic) but is **environment-limited** — test-created users
violate the `attendance_summary.user_id` FK. Not re-run (unrelated to changes made here).

## Role Portal Matrix (runtime verified)
| Role | Verified Flows | Result |
|---|---|---|
| Super Admin | `/superadmin/overview`, `/superadmin/students` | ✅ PASS (was 404 before fix) |
| College Admin | create practice problem, broadcast create+list, shared coding task | ✅ PASS |
| Coordinator | `/coordinator/students`, `/coordinator/notifications` | ✅ PASS (was 404 before fix) |
| Mentor | `/mentor/materials`, `/mentor/students/performance` | ✅ PASS (was 404 before fix) |
| Student | practice list + solve deep-link, attendance, leave apply, materials, coding-submissions list | ✅ PASS |

## Cross-role Flows (runtime verified)
- ✅ **Admin Practice Problem → Student visible** (priority item) — create → `GET /student/practice-problems`
  contains title; `GET /student/practice-problems/:id` resolves the Solve deep-link.
- ✅ **Collegiate isolation** — problem for college 2 is hidden from college-1 student (was leaking).
- ✅ **RBAC** — student blocked on `/admin/*` (403); mentor blocked on `/superadmin/*` (403).
- ✅ **Shared coding task** created by Admin → student sees it (cross-role via `shared_content`).
- ✅ **Broadcast** created by Admin → visible in Admin list (fix: real admin token had correct user id).
- ✅ **Leave application** → persisted to `leave_requests`, status `Pending`, visible in student attendance.
- ⚠️ **Coding sandbox** — `/code/run` reachable and graceful, but runtime sandbox requires Docker
  (`503 Compiler service unavailable. Please ensure Docker is running.`) — environment-blocked, not a code error.

## Blocked / Manual (honest status)
- **Gemini AI interview questions** — configured `AI_API_KEY` in `Backend/.env` is invalid/unreachable;
  runtime fails gracefully. Needs a valid Gemini API key (create in Google AI Studio, update `.env`,
  never commit). No fake questions are injected.
- **Docker coding sandbox** — start Docker for live code execution output.
- **Browser-only UX** — camera preview, Web Speech API (voice-to-text), speechSynthesis (question TTS):
  require a real browser session (not verifiable from CLI).
- **Production deploy** — backend must set `FRONTEND_URL` to the real frontend origin for CORS + socket.
- Attendance suite FK limitation (pre-existing test-data issue, not from these changes).

## Root Causes Fixed
1. **`Backend/src/app.js`** — `mentor`, `coordinator`, `superadmin`, `coding-submissions` routers were
   defined but never mounted → three role portals fully 404. Mounted at `/api/v1/{mentor,coordinator,superadmin,coding-submissions}`.
2. **`student.controller.js` `getStudentPracticeProblems`** — called `getPracticeProblemsModel()` with no
   college scope → cross-college leak. Now passes `collegeId: req.user.collegeId`.
3. **`applyStudentLeave`** — returned a fake local object; no DB write → leave never reached coordinators.
   Now INSERTs into `leave_requests` (same response shape, `LV-<dbId>`).
4. **Frontend `ST_PracticeProblems.jsx`** — Solve/Link now pass the problem via navigation `state`; items
   carry `description`.
5. **Frontend `ST_CodingPlatform.jsx`** — verifies the fetched batch task actually matches the requested id;
   falls back to `GET /student/practice-problems/:id`; shows "Problem not found" instead of silently
   opening an arbitrary latest batch task.

## Files Changed (this task)
- `Backend/src/app.js`
- `Backend/src/controllers/student.controller.js`
- `Backend/src/routes/student.routes.js`
- `Backend/tests/e2e.core.test.js` (new runtime E2E harness, 16 tests, self-cleans DB)
- `Backend/package.json` (added `test:e2e`)
- `Frontend/src/pages/Student/Components/ST_PracticeProblems.jsx`
- `Frontend/src/pages/Student/Components/ST_CodingPlatform.jsx`

## Reproduce
```
cd Backend
npm run test:e2e        # requires backend running (npm run dev) + MySQL
npm run test:socket     # 4/4
node tests/skill_gap.test.js
```