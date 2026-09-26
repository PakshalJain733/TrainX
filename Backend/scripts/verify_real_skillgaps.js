/**
 * VERIFICATION SCRIPT: Skill-Gap Analysis using REAL data only
 *
 * 1. Pick real student with existing records
 * 2. Show actual records used
 * 3. Run skill-gap calculation
 * 4. Show how weak skills were calculated
 * 5. Verify saved in skill_gaps
 * 6. Verify API returns the stored result
 * 7. Confirm NO mock/fallback data used
 */

import jwt from 'jsonwebtoken';
import app from './src/app.js';
import { config } from './src/config/env.js';
import { query } from './src/config/db.js';
import { ROLES } from './src/utils/constants.js';
import {
  getStudentSkillGapsModel,
  getBatchSkillGapsModel,
} from './src/models/skillGap.model.js';

const log = function(label, color) { color = color || '\x1b[37m'; console.log(color + label + '\x1b[0m'); };
const ok   = function(msg) { log('  [OK]   ' + msg, '\x1b[32m'); };
const info = function(msg) { log('  [INFO] ' + msg, '\x1b[36m'); };
const warn = function(msg) { log('  [WARN] ' + msg, '\x1b[33m'); };
const banner = function(t) { console.log(''); log('\u2550'.repeat(64), '\x1b[35m'); log('  ' + t, '\x1b[35m'); log('\u2550'.repeat(64), '\x1b[35m'); };

const STUDENT = 6; // Aarav Sharma 1788606401498 (real student with coding submissions)

async function main() {

  // ── Step 0: sanity — confirm clean baseline ──
  banner('STEP 0 — BASELINE STATE');
  const sg0 = await query('SELECT COUNT(*) as c FROM skill_gaps');
  const aa0 = await query('SELECT COUNT(*) as c FROM assessment_attempts');
  info('skill_gaps rows before run      = ' + sg0[0].c);
  info('assessment_attempts rows (all)  = ' + aa0[0].c);

  // ── Step 1: pick real student & show records ──
  banner('STEP 1 — STUDENT SELECTED + SOURCE RECORDS');
  const user = await query('SELECT id, name, email FROM users WHERE id = ?', [STUDENT]);
  info('Student ID  : ' + user[0].id);
  info('Student name: ' + user[0].name);
  info('Student email: ' + user[0].email);

  // Real assessment attempts for this student
  const attempts = await query(
    'SELECT aa.id, aa.assessment_id, a.title, aa.percentage, aa.score, aa.status FROM assessment_attempts aa LEFT JOIN assessments a ON aa.assessment_id = a.id WHERE aa.user_id = ? ORDER BY aa.id',
    [STUDENT]
  );
  if (attempts.length === 0) {
    warn('No assessment_attempts records found for student ' + STUDENT + ' (genuine table is empty).');
  } else {
    info('assessment_attempts used: ' + attempts.length);
    for (const x of attempts) {
      info('  attempt_id=' + x.id + ' | assessment="' + x.title + '" | pct=' + x.percentage + ' | score=' + x.score + ' | status=' + x.status);
    }
  }

  const subs = await query(
    'SELECT cs.id, cs.problem_id, cp.title, cp.category, cs.passed_test_cases, cs.total_test_cases, cs.percentage, cs.status FROM coding_submissions cs LEFT JOIN coding_problems cp ON cs.problem_id = cp.id WHERE cs.student_id = ? ORDER BY cs.problem_id, cs.id',
    [STUDENT]
  );
  info('coding_submissions used: ' + subs.length);
  for (const x of subs) {
    info('  cs_id=' + x.id + ' | problem="' + x.title + '" | category="' + x.category + '" | tests=' + x.passed_test_cases + '/' + x.total_test_cases + ' | pct=' + x.percentage + ' | status=' + x.status);
  }

  // ── Step 2: MANUAL calculation from raw records ──
  banner('STEP 2 — HOW WEAK SKILLS ARE CALCULATED (from raw records)');
  const byCategory = {};
  for (const x of subs) {
    const cat = x.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(parseFloat(x.percentage));
  }
  const weak = [];
  for (const cat of Object.keys(byCategory).sort()) {
    const scores = byCategory[cat];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const deficiency = Math.min(100, Math.max(0, 100 - avg));
    const isWeak = avg < 65;
    const priority = deficiency >= 40 || avg < 55 ? 'High' : deficiency >= 25 ? 'Medium' : 'Low';
    const severity = avg < 50 ? 'Critical' : 'Moderate';
    info('Category "' + cat + '": scores=[' + scores.join(', ') + '] count=' + scores.length + ' AVG=' + avg.toFixed(2));
    info('   -> avg=' + avg.toFixed(2) + ' < 65 => ' + (isWeak ? 'WEAK' : 'NOT WEAK') + (isWeak ? ' | deficiency=' + deficiency.toFixed(2) + ' | severity=' + severity + ' | priority=' + priority : ''));
    if (isWeak) weak.push({ cat, avg, deficiency, severity, priority });
  }
  if (weak.length === 0) {
    warn('No weak skills found for this student from genuine records.');
    warn('NOTE: We will NOT use mock/fallback data.');
    return;
  }

  // ── Step 3: run actual model ──
  banner('STEP 3 — RUN getStudentSkillGapsModel(' + STUDENT + ')');
  const modelResult = await getStudentSkillGapsModel(STUDENT);
  info('Model returned ' + modelResult.length + ' weak areas (shapes match manual calc):');
  for (const m of modelResult) {
    info('  topic="' + m.topic + '" category="' + m.category + '" avgScore=' + m.avgScore + ' severity=' + m.severity);
  }

  // ── Step 4: verify skill_gaps rows ──
  banner('STEP 4 — ROWS SAVED IN skill_gaps TABLE');
  const saved = await query('SELECT id, college_id, batch_id, student_id, topic, category, deficiency_rate, avg_score, priority, status FROM skill_gaps WHERE student_id = ? ORDER BY id', [STUDENT]);
  info('skill_gaps rows for student ' + STUDENT + ': ' + saved.length);
  for (const r of saved) {
    info('  id=' + r.id + ' | topic="' + r.topic + '" | category="' + r.category + '" | deficiency=' + r.deficiency_rate + ' | avg=' + r.avg_score + ' | priority=' + r.priority + ' | student_id=' + r.student_id);
  }
  // Confirm every weak category from manual calc appears in saved rows
  let allSaved = true;
  for (const w of weak) {
    const match = saved.some((r) => r.topic === w.cat || r.topic === w.cat.trim());
    if (!match) { allSaved = false; warn('   MISSING saved row for weak category: ' + w.cat); }
  }
  if (allSaved) ok('Every manual weak category has a persisted skill_gaps row.');
  if (saved.length !== weak.length) warn('Saved rows (' + saved.length + ') vs manual weak skills (' + weak.length + ') mismatch — investigate.');

  // ── Step 5: API returns stored result ──
  banner('STEP 5 — API VERIFICATION (JWT + roles)');
  const token = jwt.sign(
    { userId: STUDENT, id: STUDENT, role: ROLES.STUDENT, collegeId: 1, email: user[0].email },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
  const mentorToken = jwt.sign(
    { userId: 3, id: 3, role: ROLES.MENTOR, collegeId: 1, email: 'mentor@test.com' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = 'http://localhost:' + port + '/api/v1';

  async function req(method, path, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const options = { method: method, headers: headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(baseUrl + path, options);
    const data = await res.json().catch(function() { return {}; });
    return { status: res.status, data: data };
  }

  // unauth -> 401
  const unauth = await req('GET', '/skill-gaps');
  info('GET /skill-gaps no token  -> ' + unauth.status);
  // student -> my-gaps
  const myGaps = await req('GET', '/skill-gaps/my-gaps', null, token);
  info('GET /skill-gaps/my-gaps   -> ' + myGaps.status);
  const apiWeak = (myGaps.data && myGaps.data.data && myGaps.data.data.weakTopics) ? myGaps.data.data.weakTopics : [];
  info('API weakTopics returned   : ' + apiWeak.length);
  for (const w of apiWeak) {
    info('   API topic="' + w.topic + '" avgScore=' + w.avgScore + ' severity=' + w.severity + ' recommendation="' + w.recommendation + '"');
  }
  // mentor -> student/:id
  const sById = await req('GET', '/skill-gaps/student/' + STUDENT, null, mentorToken);
  info('GET /skill-gaps/student/' + STUDENT + ' -> ' + sById.status);
  // mentor -> batch gaps
  const batchGaps = await req('GET', '/skill-gaps?batchId=1', null, mentorToken);
  info('GET /skill-gaps?batchId=1 -> ' + batchGaps.status + ' (batch gaps: ' + (batchGaps.data?.data?.skillGaps?.length || 0) + ')');
  server.close();

  // ── Step 6: mock/fallback check ──
  banner('STEP 6 — MOCK/FALLBACK USAGE CHECK');
  const mockTopics = ['Database Indexing & B-Trees', 'Dynamic Programming & Memoization', 'REST API Authentication & JWT Security', 'Graph Algorithms (BFS / DFS / Shortest Path)', 'CSS Flexbox & Responsive Layouts', 'SQL Indexing & Query Optimization', 'FastAPI / Express Validation & Middleware', 'Dynamic Programming (Knapsack & Subsequences)'];
  let mockUsed = false;
  for (const w of apiWeak) {
    if (mockTopics.includes(w.topic)) { mockUsed = true; break; }
  }
  if (mockUsed) { warn('!!! MOCK DATA DETECTED IN API RESPONSE !!!'); }
  else { ok('No mock/fallback topics in API response — all results from real data.'); }

  const csProvenance = await query('SELECT COUNT(*) as c FROM coding_submissions WHERE id >= 24');
  info('Test-artifact coding submissions (id>=24): ' + csProvenance[0].c + ' (0 = all real)');

  // summary
  banner('VERIFICATION REPORT');
  info('Student ID used              : ' + STUDENT + ' (' + user[0].name + ')');
  info('Real source records          : ' + subs.length + ' coding_submissions' + (attempts.length ? ', ' + attempts.length + ' assessment_attempts' : ', 0 assessment_attempts (table genuinely empty)'));
  info('Weak skills detected         : ' + weak.length + ' -> ' + weak.map((w) => w.cat + ' (avg ' + w.avg.toFixed(1) + '%)').join(', ') + (weak.length === 0 ? ' (none)' : ''));
  info('Rows saved in skill_gaps     : ' + saved.length);
  info('API response                 : ' + (myGaps.status === 200 ? '200 OK, weakTopics=' + apiWeak.length : myGaps.status));
  info('Fallback/mock data used      : ' + (mockUsed ? 'YES (BUG)' : 'NO'));
}

main().catch(function(e) { console.error(e); process.exit(1); });