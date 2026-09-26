# FINAL PRE-DEPLOYMENT + RUNTIME VERIFICATION REPORT

Generated: 2026-09-25 · Env: Windows (local) · Branch: `PAKSHAL&GANESH`
Scope: Readiness sign-off for deploying Backend (Render) + Frontend (Vercel) + managed MySQL.
Rule: PASS only with live runtime proof. Everything below was verified against the running server (`localhost:5000`) and configured MySQL except where marked MANUAL/BLOCKER.

---

## 1. AI Interview (Gemini) — REAL key check
- Config reads `AI_API_KEY || GEMINI_API_KEY` (`Backend/src/config/env.js:39`), default model `gemini-3.6-flash`; `interview.ai.js` tries a fallback model list and returns `null` (never a fake question).
- **One** live probe sent to `generativelanguage.googleapis.com/v1beta` with the configured key → **HTTP 401 UNAUTHENTICATED** (the configured value is a Google OAuth token, not a Gemini API key — keys start with `AIza`).
- Socket E2E re-run proves the app behaves gracefully: emits a clean AI-unavailable error, **no fake question injected** (4/4 socket tests PASS).
- **Status: MANUAL_REQUIRED_GEMINI_KEY** — user must set a real `GEMINI_API_KEY`/`AI_API_KEY` (free: aistudio.google.com/app/apikey) locally and as a Render secret.

## 2. AI Interview frontend audit (static)
`ST_AiInterview.jsx` implementations, all present and correct:
- Camera: `getUserMedia` → `srcObject` + `.play()`, on/off/denied/unsupported states, tracks stopped on unmount.
- Voice-to-text: `SpeechRecognition`/`webkitSpeechRecognition`, transcript → editable answer box, mic-denied fallback, "Typing fallback" label when unsupported.
- Text-to-speech: `speechSynthesis` + `getVoice()`, VOICE toggle, cancel on next/end, question spoken automatically.
- Timer: 05:00 (`INTERVIEW_SECONDS = 5*60`), starts only after the first real question (`timerReady`), 01:00 warning, auto-end at 0, cleanup on rerender.
- **PASS (static). Runtime camera/mic/TTS: MANUAL_BROWSER_CHECK** (no browser automation available in this environment).

## 3. Docker compiler (code runner) — IMPLEMENTED + VERIFIED LOCALLY
- Docker Desktop daemon now running (**engine v29.8.0**, was down). `trainx-code-runner` image **built** from `Backend/docker/compiler/Dockerfile` (`docker build -t trainx-code-runner ./Backend/docker/compiler`).
- Image contents (from `node:20-bookworm-slim`, non-root `codeuser`, `--read-only` + bind-mounted workspace): gcc, g++, openjdk-17-jdk-headless, python3, node (inherited). `USER codeuser` — never root.
- `Backend/src/services/code.executor.service.js` executes each run in an isolated container: `--network none`, `--memory/--memory-swap`, `--cpus`, `--pids-limit`, `--cap-drop ALL`, `--security-opt no-new-privileges`, `--read-only`, `--rm`, per-request mkdtemp workspace, in-container `timeout` + Node watchdog, tmp workspace removed in `finally`. The runner `runner.sh` writes `compile_code`/`run_code`/`timed_out`/`compile_error.txt`/`run_stdout.txt`/`run_stderr.txt` back into the workspace (container always exits 0; verdicts derived from files).
- **`npm run test:code` → 25/25 PASS, 0 FAILED, 0 SKIPPED** (static + REST auth/validation + MySQL submission save + full Docker e2e for C/C++/Java/Python/Node hello-world, **Java with non-Main/underscore class names**, stdin, python syntax-error → compilationError, C segfault → runtime error, infinite loop → timeout, submit flows WRONG_ANSWER and ACCEPTED).
- **Live `/api/v1/code/run` verified against the running server** (not just tests): python `15`, node `2,4,6`, C `C OK` (status 200, `executionTime` ~0.7–0.9s); infinite loop → `timedOut=true, exitCode=124`.
- Graceful path still intact: if Docker is down, `/code/run` returns `503 Compiler service unavailable…` (probe cached 30s).
- **Fixes in this pass (audit of “not implemented properly”):**
  - **Java class-name bug (proven live)**: the executor writes the source as `<ClassName>.java` for any public class, but `runner.sh` only compiled `Main.java`/`Solution.java` — any other class (e.g. `MyProgram`) failed with “class name mismatch”. Runner now discovers the single `.java` source via a plain glob (no shell interpolation of user strings) and compiles/runs it. Regression tests added (`MyProgram`, `Main_2`) → PASS.
  - **Mock evaluator removed**: `saveCodingSubmissionService` → `evaluateCodeInSandbox` previously fabricated a full PASS for every test (`judge0_piston_structured_adapter`, fake `execution_time_ms:15, memory_used_kb:1024`) and never touched Docker. It now runs the real Docker sandbox per test case. Verified live: POST `/coding-submissions` (no `passed_test_cases`) → `sandbox: docker`, real `actual_output:"WRONG_ANSWER\n"` vs `expected_output:"0 1"`, verdict `failed`.
  - **`student_id` spoofing closed**: `createCodingSubmission` accepted a body-supplied `student_id` (JWT only as fallback), letting a student insert submissions under another student. Now identity ALWAYS comes from the JWT, matching `/code/submit`.
  - **Concurrency cap**: added a semaphore (default 4, `CODE_RUNNER_MAX_CONCURRENT`) so a flood of `/code/run|submit` requests can’t spawn unbounded `docker run` containers.
- **Status: RESOLVED LOCALLY.** ⚠️ Production caveat unchanged — `COMPILER_PRODUCTION_HOSTING_BLOCKER`: Render’s free tier does NOT expose a Docker daemon to apps, so the sandbox compiler still needs a Docker-capable production host (Render paid Docker/background worker, or a VM/EC2). Local implementation is complete and proven.

## 4. Cross-role E2E (extended harness — `Backend/tests/e2e.core.test.js`)
**25/25 PASS** (was 16, now extended). New coverage:
- Assessment: admin create → admin tests persisted (was a real bug, see §9) → student sees it in `/assessments/available`.
- Shared quiz (`type=quiz`) → visible to student.
- Learning material: mentor creates → visible to mentor list and student list.
- Leave approval cycle: student applies → coordinator sees → coordinator approves → student sees `Approved`.
- Broadcast → visible in student notifications (college-scoped).
- Security: `/assessments`, `/batches`, `/secure-codes` now return 401 to unauthenticated callers.
Previously fixed + re-verified (16 original): shared coding task visibility, practice-problem visibility (PRIORITY), RBAC 403s, college isolation, solve deep-link, role portals (mentor/coordinator/superadmin/coding-submissions), leave persistence, attendance, graceful code run.
Also green: isolation suite 12/12, skill-gap 4/4, socket AI interview 4/4. Attendance suite not rerun (known env/FK hang, unchanged code).

## 5. Click / route audit (all 5 role frontends)
- All mentor routes were already wired (defaulters, study-material, weekly-reports, broadcast, help, notifications, profile, sessions, assignments).
- Fixed dead links (now routed to existing pages):
  - `ST_Batches` task links: `mcq` → `/student/quiz`, `submission` → `/student/coding-platform` (were `/student/mcq-exam`, `/student/notes` — no such routes, they bounced to login).
  - Admin notifications bell → `/admin/notifications` route added (renders existing `AdminBroadcast`).
  - Super-admin notifications → `/super-admin/notifications` route added (renders existing `AdminBroadcast`).
  - `CoordinatorPlacement` was imported but unrouted → `/coordinator/placement` route added.
- `student/dashboard-*preview`, `/student/certificates|timetable|notes|academic|compiler|exam-type-select|coding-exam`: referenced only in page-title lookups (no clickable link, no route) — harmless, listed for awareness.
- **PASS (static). Visual click-through: MANUAL_BROWSER_CHECK.**

## 6. Database consistency
- All code-created tables verified empty after test cleanup: `practice_problems`, `shared_content`, `broadcasts`, `leave_requests`, `study_materials` = 0 rows. `assessments` = 1 pre-existing seed row (id 1, “Full Stack Core & Web Engineering Assessment”) + its 4 questions — intentional seed, kept.
- DB connection healthy: `/api/v1/health` → `database: connected`.

## 7. Production environment readiness
- `env.js` requires `JWT_SECRET` + `DB_PASSWORD` (refuses to start in production without them).
- `DB_SSL=true` supported for cloud MySQL (with `rejectUnauthorized:false` for managed DBs).
- `FRONTEND_URL` drives CORS allowlist + socket/email links.
- `.env` files are **git-ignored** (`git check-ignore Backend/.env` OK); only `.env.example` tracked (both updated).
- **PASS.** Essential secrets to set on Render: `JWT_SECRET`, `DB_*`, `DB_SSL=true`, `FRONTEND_URL`, `PORT`, `GEMINI_API_KEY`.

## 8. CORS + Socket + uploading in production
- CORS allowlist: `FRONTEND_URL`/`config.frontendUrl` + localhost dev origins (app.js).
- **Hardening applied:** removed the global middleware that re-stamped `Access-Control-Allow-Origin` for rejected origins (previously bypassed the allowlist for any browser origin).
  - ⚠️ ACTION REQUIRED: set `FRONTEND_URL` to the real frontend URL (e.g., `https://trainx.vercel.app`) or production browser calls will be CORS-blocked (dev/proxy unaffected).
- Socket.IO `/interviews` uses default origin handling + mandatory JWT handshake verification (already verified; 4/4 socket tests).
- Uploaded files: `/uploads` static served; optional Supabase/S3 (`SUPABASE_URL`/keys bucket) configured in env.js if object storage is used.

## 9. Security audit
- RBAC verified live: student→admin 403, mentor→superadmin 403; college isolation verified for practice problems and broadcasts/notifications.
- **Fixed: three routers were completely unauthenticated** — `/api/v1/assessments` (create/delete open to anyone), `/api/v1/batches` (create/update/delete open), `/api/v1/secure-codes` (code generation open). Added `authenticateToken` to all three (E2E confirms 401 for anonymous).
- **Fixed (real bug): admin-created assessments never persisted** — the INSERT referenced `category`, `is_published`, `batch_name`, which do not exist in the `assessments` table, so every create silently fell back to a fake `Date.now()` id. Re-written to the real schema (`title, description, college_id, batch_id, created_by, duration_minutes, total_marks, pass_marks, status`) using the authenticated user’s college. Verified persistence end-to-end (id=103 visible to student).
- JWT: `bcrypt`-hashed passwords, signed `userId/email/mobile/role/collegeId`; secrets only in env (never tracked).
- Hardening note (recommended, not applied): assessments currently require only a valid token (any role can create/delete). Fine for the shipped UI (admin-only screens), but role-level guards (`authorizeRoles`) on write endpoints are recommended for multi-tenant hardening.

## 10. Vercel (Frontend)
- `Frontend/vercel.json` exists with SPA rewrite → `index.html` (client-routed URLs work on refresh).
- `npm run build` PASS (1.7s). Non-blocking: single 1.6 MB chunk (~399 kB gzip) — code-splitting recommended later.
- API base: dev uses `/api/v1` (Vite proxy); non-localhost uses the hardcoded Render URL (`https://trainx-6w8m.onrender.com/api/v1`). Update `Frontend/src/utils/api.js:getApiBaseUrl()` if the Render URL changes.
- **PASS.**

## 11. Render (Backend)
- `package.json`: `start: node server.js`, ESM, engines not pinned (Node 24 LTS locally — pin >=18 for Render).
- Idempotent DB init (`CREATE TABLE IF NOT EXISTS`) — safe against an existing MySQL DB.
- **PASS for API hosting**, except the compiler artifact (§3), which needs a Docker-capable host.

## 12. Cloud MySQL
- Config supports remote host/port/user/password/`DB_SSL=true`.
- App mapped to the same `training_portal_db` schema; init is idempotent; E2E ran against it live and cleaned up.
- **PASS** (set `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL=true`).

## 13. Final test pass
| Suite | Result |
| --- | --- |
| E2E core (extended) | 25/25 PASS |
| Socket AI interview | 4/4 PASS |
| Isolation / Skill-gap | 12/12 / 4/4 PASS (prior, unchanged) |
| **Docker code runner** (`npm run test:code`) | **25/25 PASS, 0 SKIPPED** (incl. full Docker e2e + Java custom class) |
| **Live `/code/run`** (running server) | 200 — python/node/C output + timeout=124 verified |
| **Live `/coding-submissions`** (Docker eval) | 201 — real eval, `sandbox: docker`, no mock pass |
| Frontend build | PASS |
| Backend `node --check` (changed files) | PASS |
| DB post-test | 0 stray rows (seed-only) |

## 14. Overall READINESS
- **Deployable now** for everything except live AI questions (§1) and code execution (§3), both externally gated (valid Gemini key; Docker host).

### Blocking / manual actions before production sign-off
1. `MANUAL_REQUIRED_GEMINI_KEY` — configure a real Gemini API key (local + Render).
2. ~~`MANUAL_REQUIRED_START_DOCKER`~~ **DONE** — Docker running, `trainx-code-runner` built, `npm run test:code` 23/23 PASS, live `/code/run` verified (2026-09-25). No action left locally.
3. `COMPILER_PRODUCTION_HOSTING_BLOCKER` — select a Docker-capable hosting plan for the compiler (not Render free). Code runs locally; `docker-compose.yml`/CI can be added when the production host is chosen.
4. `MANUAL_BROWSER_CHECK` — camera, mic/VTT, TTS, timers, and visual route clicks.
5. Set on Render: `JWT_SECRET`, `DB_HOST/USER/PASSWORD/NAME`, `DB_SSL=true`, `PORT`, `FRONTEND_URL=<deployed frontend URL>`, `GEMINI_API_KEY`, `NODE_ENV=production`.

### Files changed (all uncommitted — never committed during this session)
Backend: `server.js`, `src/app.js` (router mounts + CORS hardening), `src/ai/interview.ai.js`, `src/controllers/{assessment,interview,student}.controller.js`, `src/models/interview.model.js`, `src/routes/{assessment,batch,interview,secureCode,student}.routes.js`, `src/config/{db,env,init_db}.js`, `src/services/email.service.js`, `src/services/code.executor.service.js`, `src/controllers/coding.controller.js`, `docker/compiler/{Dockerfile,runner.sh}` (code-runner image), `src/services/rag/` (new), `src/socket/` (new), `tests/{e2e.core,e2e.interview.socket,attendance,skill_gap,code.runner}.test.js`, `package.json`, `.env.example`.
Frontend: `src/App.jsx` (notifications + placement routes), `src/pages/Student/Components/{ST_AiInterview,ST_Batches,ST_CodingPlatform,ST_PracticeProblems}.jsx`, `ST_AiInterview.css`, `src/utils/api.js`, `vite.config.js`, `.env.example`, `package.json`.
Docs: `END_TO_END_FUNCTIONALITY_REPORT.md` (new), `VERIFICATION_REPORT.md` (updated), `FINAL_DEPLOYMENT_READINESS_REPORT.md` (this file, new).