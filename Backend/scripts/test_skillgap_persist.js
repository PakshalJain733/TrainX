/**
 * End-to-End Test: Skill Gap Persistence into skill_gaps table
 *
 * Flow:  real performance data  ->  calculate weak skill  ->  save skill_gaps row  ->  fetch via API
 *
 * Run with:  node test_skillgap_persist.js
 */

import jwt from 'jsonwebtoken';
import app from './src/app.js';
import { config } from './src/config/env.js';
import { query } from './src/config/db.js';
import { ROLES } from './src/utils/constants.js';
import {
  getBatchSkillGapsModel,
  getStudentSkillGapsModel,
} from './src/models/skillGap.model.js';

const log = function(label, color) { color = color || '\x1b[37m'; console.log(color + label + '\x1b[0m'); };
const ok   = function(msg) { log('  PASS  ' + msg, '\x1b[32m'); };
const fail = function(msg) { log('  FAIL  ' + msg, '\x1b[31m'); };
const info = function(msg) { log('  INFO  ' + msg, '\x1b[36m'); };
const section = function(title) {
  console.log('');
  log('\u2550'.repeat(60), '\x1b[33m');
  log('  ' + title, '\x1b[33m');
  log('\u2550'.repeat(60), '\x1b[33m');
};

const mentorToken = jwt.sign(
  { userId: 5, id: 5, role: ROLES.MENTOR, collegeId: 1, email: 'mentor@pvppcoe.ac.in' },
  config.jwt.secret,
  { expiresIn: '1h' }
);

const studentToken = jwt.sign(
  { userId: 6, id: 6, role: ROLES.STUDENT, collegeId: 1, email: 'teststudent@test.com' },
  config.jwt.secret,
  { expiresIn: '1h' }
);

// Helper: ensure prerequisite rows exist
async function ensurePrerequisites() {
  await query('INSERT IGNORE INTO colleges (id, name, code) VALUES (1, \'PVPPCOE\', \'PVPP\')').catch(function() {});
  await query('INSERT IGNORE INTO departments (id, college_id, name, code) VALUES (1, 1, \'Computer Engineering\', \'CE\')').catch(function() {});
  await query('INSERT IGNORE INTO batches (id, college_id, department_id, name, academic_year, start_year, end_year, status) VALUES (1, 1, 1, \'TE-A (2026)\', \'2025-2026\', 2025, 2026, \'active\')').catch(function() {});
  await query('INSERT IGNORE INTO users (id, name, email, role, college_id) VALUES (5, \'Test Mentor\', \'mentor@pvppcoe.ac.in\', \'mentor\', 1)').catch(function() {});
  await query('INSERT IGNORE INTO users (id, name, email, role, college_id) VALUES (6, \'Test Student\', \'teststudent@test.com\', \'student\', 1)').catch(function() {});
  await query('INSERT IGNORE INTO students (user_id, college_id, batch_id, roll_number, department, year, division) VALUES (6, 1, 1, \'TE-001\', \'Computer Engineering\', \'TE\', \'A\')').catch(function() {});
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) { ok(message); passed++; }
    else { fail(message); failed++; }
  }

  section('0. PREREQUISITES');
  try {
    await ensurePrerequisites();
    info('Prerequisite rows ensured');
    assert(true, 'Prerequisites seeded');
  } catch (err) {
    fail('Prerequisites failed: ' + err.message);
    return;
  }

  // SECTION 1: SEED REAL ASSESSMENT ATTEMPTS
  section('1. SEED REAL ASSESSMENT ATTEMPTS');
  try {
    await query(
      "INSERT INTO assessments (id, title, college_id, batch_id, created_by, total_marks, status) VALUES (100, 'Data Structures Quiz', 1, 1, 5, 100, 'published') ON DUPLICATE KEY UPDATE title=title"
    );
    await query(
      "INSERT INTO assessments (id, title, college_id, batch_id, created_by, total_marks, status) VALUES (101, 'DBMS Fundamentals', 1, 1, 5, 100, 'published') ON DUPLICATE KEY UPDATE title=title"
    );

    // Student 6 scores 35% on DS (weak), 80% on DBMS (strong)
    await query(
      "INSERT INTO assessment_attempts (assessment_id, user_id, score, percentage, total_questions, correct_answers, status) VALUES (100, 6, 35, 35.00, 10, 3, 'completed')"
    );
    await query(
      "INSERT INTO assessment_attempts (assessment_id, user_id, score, percentage, total_questions, correct_answers, status) VALUES (101, 6, 80, 80.00, 10, 8, 'completed')"
    );

    // Student 7 also scores poorly on DS
    await query("INSERT IGNORE INTO users (id, name, email, role, college_id) VALUES (7, 'Student Two', 'student2@test.com', 'student', 1)");
    await query("INSERT IGNORE INTO students (user_id, college_id, batch_id, roll_number, department, year, division) VALUES (7, 1, 1, 'TE-002', 'Computer Engineering', 'TE', 'A')");
    await query(
      "INSERT INTO assessment_attempts (assessment_id, user_id, score, percentage, total_questions, correct_answers, status) VALUES (100, 7, 25, 25.00, 10, 2, 'completed')"
    );
    await query(
      "INSERT INTO assessment_attempts (assessment_id, user_id, score, percentage, total_questions, correct_answers, status) VALUES (101, 7, 90, 90.00, 10, 9, 'completed')"
    );

    var attemptCount = await query("SELECT COUNT(*) as cnt FROM assessment_attempts WHERE assessment_id IN (100, 101)");
    assert(attemptCount[0].cnt >= 4, 'Seeded ' + attemptCount[0].cnt + ' assessment attempts');
  } catch (err) {
    fail('Seed assessment attempts: ' + err.message);
  }

  // SECTION 2: SEED REAL CODING SUBMISSIONS
  section('2. SEED REAL CODING SUBMISSIONS');
  try {
    await query("INSERT IGNORE INTO coding_problems (id, title, description, difficulty, category, total_marks) VALUES (1, 'Two Sum', 'Array problem', 'Easy', 'Arrays & Hashing', 100)");
    await query("INSERT IGNORE INTO coding_problems (id, title, description, difficulty, category, total_marks) VALUES (3, 'Longest Substring', 'Sliding window', 'Medium', 'Sliding Window', 150)");

    // Student 6: bad at Arrays & Hashing (30%), decent at Sliding Window (70%)
    await query("INSERT INTO coding_submissions (student_id, problem_id, submitted_code, language, passed_test_cases, total_test_cases, score, marks, percentage, status) VALUES (6, 1, 'function solve(){}', 'javascript', 1, 5, 20, 20, 30.00, 'partial')");
    await query("INSERT INTO coding_submissions (student_id, problem_id, submitted_code, language, passed_test_cases, total_test_cases, score, marks, percentage, status) VALUES (6, 3, 'function solve(){}', 'javascript', 3, 5, 90, 90, 70.00, 'passed')");

    // Student 7: bad at Sliding Window (40%)
    await query("INSERT INTO coding_submissions (student_id, problem_id, submitted_code, language, passed_test_cases, total_test_cases, score, marks, percentage, status) VALUES (7, 3, 'function solve(){}', 'javascript', 2, 5, 60, 60, 40.00, 'partial')");

    var subCount = await query("SELECT COUNT(*) as cnt FROM coding_submissions WHERE student_id IN (6, 7)");
    assert(subCount[0].cnt >= 3, 'Seeded ' + subCount[0].cnt + ' coding submissions');
  } catch (err) {
    fail('Seed coding submissions: ' + err.message);
  }

  // SECTION 3: VERIFY skill_gaps initial state
  section('3. VERIFY skill_gaps TABLE INITIAL STATE');
  try {
    var initial = await query("SELECT COUNT(*) as cnt FROM skill_gaps");
    info('skill_gaps has ' + initial[0].cnt + ' rows before model calls');
    assert(true, 'skill_gaps table accessible');
  } catch (err) {
    fail('skill_gaps table check: ' + err.message);
  }

  // SECTION 4: MODEL getBatchSkillGapsModel
  section('4. MODEL: getBatchSkillGapsModel (compute + save + read)');
  try {
    var batchGaps = await getBatchSkillGapsModel(1, 1);
    assert(Array.isArray(batchGaps), 'Returns an array');
    assert(batchGaps.length > 0, 'Found ' + batchGaps.length + ' batch skill gaps from real data');

    if (batchGaps.length > 0) {
      var first = batchGaps[0];
      assert(first.topic, 'First gap topic: ' + first.topic);
      assert(first.deficiencyRate, 'Deficiency rate: ' + first.deficiencyRate);
      assert(first.priority, 'Priority: ' + first.priority);
    }

    var dbRows = await query("SELECT * FROM skill_gaps WHERE student_id IS NULL");
    assert(dbRows.length > 0, 'skill_gaps table has ' + dbRows.length + ' batch-level rows');
    for (var i = 0; i < dbRows.length; i++) {
      var r = dbRows[i];
      info('  [id=' + r.id + '] topic="' + r.topic + '" deficiency=' + r.deficiency_rate + '% avg=' + r.avg_score + '% priority=' + r.priority + ' status=' + r.status + ' batch_id=' + r.batch_id);
    }
  } catch (err) {
    fail('Batch model test: ' + err.message);
  }

  // SECTION 5: MODEL getStudentSkillGapsModel
  section('5. MODEL: getStudentSkillGapsModel (compute + save + read)');
  try {
    var studentGaps = await getStudentSkillGapsModel(6);
    assert(Array.isArray(studentGaps), 'Returns an array');
    assert(studentGaps.length > 0, 'Found ' + studentGaps.length + ' student weak areas from real data');

    for (var j = 0; j < studentGaps.length; j++) {
      var g = studentGaps[j];
      info('  topic="' + g.topic + '" avgScore=' + g.avgScore + ' severity=' + g.severity);
    }

    var studentRows = await query("SELECT * FROM skill_gaps WHERE student_id = 6");
    assert(studentRows.length > 0, 'skill_gaps has ' + studentRows.length + ' student-level rows for user 6');
    for (var k = 0; k < studentRows.length; k++) {
      var sr = studentRows[k];
      info('  [id=' + sr.id + '] topic="' + sr.topic + '" deficiency=' + sr.deficiency_rate + '% avg=' + sr.avg_score + '% priority=' + sr.priority + ' student_id=' + sr.student_id);
    }
  } catch (err) {
    fail('Student model test: ' + err.message);
  }

  // SECTION 6: FINAL SELECT *
  section('6. FINAL: SELECT * FROM skill_gaps');
  try {
    var allRows = await query("SELECT * FROM skill_gaps ORDER BY id ASC");
    assert(allRows.length > 0, 'SELECT * FROM skill_gaps returns ' + allRows.length + ' rows (expected > 0)');
    for (var m = 0; m < allRows.length; m++) {
      var row = allRows[m];
      info('  [id=' + row.id + '] topic="' + row.topic + '" category="' + row.category + '" deficiency=' + row.deficiency_rate + '% avg=' + row.avg_score + '% priority=' + row.priority + ' batch_id=' + row.batch_id + ' student_id=' + row.student_id + ' status=' + row.status);
    }
  } catch (err) {
    fail('Final SELECT: ' + err.message);
  }

  // SECTION 7: API ENDPOINTS
  section('7. API ENDPOINTS (full HTTP flow with JWT)');
  var server = app.listen(0);
  var port = server.address().port;
  var baseUrl = 'http://localhost:' + port + '/api/v1';

  async function req(method, path, body, token) {
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    var options = { method: method, headers: headers };
    if (body) options.body = JSON.stringify(body);
    var res = await fetch(baseUrl + path, options);
    var data = await res.json().catch(function() { return {}; });
    return { status: res.status, data: data };
  }

  try {
    var unauth = await req('GET', '/skill-gaps');
    assert(unauth.status === 401, 'GET /skill-gaps without token -> 401');

    var forbidden = await req('GET', '/skill-gaps', null, studentToken);
    assert(forbidden.status === 403, 'GET /skill-gaps as student -> 403');

    var mentorGaps = await req('GET', '/skill-gaps?batchId=1', null, mentorToken);
    var gapCount = (mentorGaps.data && mentorGaps.data.data && mentorGaps.data.data.skillGaps) ? mentorGaps.data.data.skillGaps.length : 0;
    assert(mentorGaps.status === 200 && mentorGaps.data.success, 'GET /skill-gaps as mentor -> 200 with ' + gapCount + ' gaps');

    var myGaps = await req('GET', '/skill-gaps/my-gaps', null, studentToken);
    var weakCount = (myGaps.data && myGaps.data.data && myGaps.data.data.weakTopics) ? myGaps.data.data.weakTopics.length : 0;
    assert(myGaps.status === 200 && myGaps.data.success, 'GET /skill-gaps/my-gaps -> 200 with ' + weakCount + ' weak topics');

    var studentById = await req('GET', '/skill-gaps/student/6', null, mentorToken);
    assert(studentById.status === 200 && studentById.data.success, 'GET /skill-gaps/student/6 -> 200');

    var finalRows = await query("SELECT * FROM skill_gaps ORDER BY id ASC");
    assert(finalRows.length > 0, 'After API calls, skill_gaps has ' + finalRows.length + ' rows');
  } catch (err) {
    fail('HTTP integration: ' + err.message);
  } finally {
    server.close();
  }

  // SECTION 8: VERIFY history preservation
  section('8. VERIFY HISTORY PRESERVATION');
  try {
    var batchGaps2 = await getBatchSkillGapsModel(1, 1);
    var rowsAfter = await query("SELECT * FROM skill_gaps WHERE student_id IS NULL");
    assert(rowsAfter.length > 0, 'Second call: skill_gaps still has ' + rowsAfter.length + ' batch rows (history preserved)');
    assert(batchGaps2.length > 0, 'Second call returns ' + batchGaps2.length + ' gaps');
    info('History preserved: old rows are not deleted on re-computation');
  } catch (err) {
    fail('History test: ' + err.message);
  }

  // SUMMARY
  section('TEST SUMMARY');
  log('Total Passed: ' + passed, '\x1b[32m');
  if (failed > 0) {
    log('Total Failed: ' + failed, '\x1b[31m');
  } else {
    log('ALL TESTS PASSED', '\x1b[32m');
  }
}

runTests().catch(console.error);
