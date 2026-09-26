/**
 * Test Suite: Skill-Gap Analysis Module
 * Validates Model aggregation, AI Engine, Service Layer, Controller, and Express Route Endpoints.
 * Run with: node test_skillgap_module.js
 */

import jwt from 'jsonwebtoken';
import app from './src/app.js';
import { config } from './src/config/env.js';
import { ROLES } from './src/utils/constants.js';
import {
  getBatchSkillGapsModel,
  getStudentSkillGapsModel,
  saveRemedialInterventionModel,
  getRemedialInterventionsModel,
} from './src/models/skillGap.model.js';
import {
  generateAIDiagnostics,
  generateRemedialAssignmentAI,
} from './src/ai/skillGap.ai.js';
import {
  getBatchSkillGapsService,
  getStudentSkillGapReportService,
  triggerRemedialAssignmentService,
} from './src/services/skillGap.service.js';

const log = (label, color = '\x1b[37m') => console.log(`${color}${label}\x1b[0m`);
const ok   = (msg) => log(`  ✅ ${msg}`, '\x1b[32m');
const fail = (msg) => log(`  ❌ ${msg}`, '\x1b[31m');
const info = (msg) => log(`  ℹ️  ${msg}`, '\x1b[36m');
const section = (title) => {
  console.log('');
  log(`${'═'.repeat(60)}`, '\x1b[33m');
  log(`  ${title}`, '\x1b[33m');
  log(`${'═'.repeat(60)}`, '\x1b[33m');
};

// Generate test JWT tokens
const mentorToken = jwt.sign(
  { userId: 5, id: 5, role: ROLES.MENTOR, collegeId: 1, email: 'mentor@pvppcoe.ac.in' },
  config.jwt.secret,
  { expiresIn: '1h' }
);

const studentToken = jwt.sign(
  { userId: 6, id: 6, role: ROLES.STUDENT, collegeId: 1, email: 'ganesh@student.pvppcoe.ac.in' },
  config.jwt.secret,
  { expiresIn: '1h' }
);

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      ok(message);
      passed++;
    } else {
      fail(message);
      failed++;
    }
  }

  // ─── 1. TEST MODEL LAYER ───────────────────────────────────────────────────
  section('1. Skill Gap Model Layer Tests');
  try {
    const batchGaps = await getBatchSkillGapsModel(1, 1);
    assert(Array.isArray(batchGaps) && batchGaps.length > 0, `Model returns batch skill gaps (found ${batchGaps.length})`);
    assert(batchGaps[0].topic && batchGaps[0].deficiencyRate && batchGaps[0].priority, 'Gap record contains topic, deficiencyRate, and priority');

    const studentGaps = await getStudentSkillGapsModel(6);
    assert(Array.isArray(studentGaps) && studentGaps.length > 0, `Model returns student weak areas (found ${studentGaps.length})`);
    assert(studentGaps[0].topic && studentGaps[0].avgScore, 'Student weak area contains topic and score');

    const intervention = await saveRemedialInterventionModel({
      college_id: 1,
      batch_id: 1,
      topic: 'Database Indexing',
      title: 'Sprint on DB Indexing',
      description: 'Practice task',
      assignment_details: { level: 'Intermediate' },
      recommended_problems: [{ title: 'B-Tree Query' }],
    });
    assert(intervention && intervention.id, `Saved remedial intervention with ID: ${intervention.id}`);

    const allInterventions = await getRemedialInterventionsModel(1);
    assert(Array.isArray(allInterventions) && allInterventions.length > 0, `Retrieved saved interventions (count: ${allInterventions.length})`);
  } catch (err) {
    fail(`Model error: ${err.message}`);
    failed++;
  }

  // ─── 2. TEST AI ENGINE LAYER ───────────────────────────────────────────────
  section('2. AI Diagnostic & Remedial Engine Tests');
  try {
    info('Testing AI diagnostic generation (Gemini or intelligent heuristic)...');
    const aiDiag = await generateAIDiagnostics({
      topic: 'Dynamic Programming & Memoization',
      batchName: 'Batch TE-A',
      deficiencyRate: '45%',
      avgScore: '52%',
    });
    assert(Array.isArray(aiDiag.rootCauses) && aiDiag.rootCauses.length >= 2, `AI generated root causes (source: ${aiDiag.source})`);
    assert(aiDiag.remedialActionPlan, 'AI generated remedial action plan');

    info('Testing AI remedial assignment generation...');
    const aiRemedial = await generateRemedialAssignmentAI({
      topic: 'REST API Authentication & JWT',
      batchName: 'Batch TE-A',
      difficultyLevel: 'Medium',
    });
    assert(aiRemedial.title && Array.isArray(aiRemedial.practiceProblems), `AI synthesized remedial assignment: "${aiRemedial.title}" with ${aiRemedial.practiceProblems.length} practice problems`);
  } catch (err) {
    fail(`AI Engine error: ${err.message}`);
    failed++;
  }

  // ─── 3. TEST SERVICE LAYER ─────────────────────────────────────────────────
  section('3. Skill Gap Service Layer Tests');
  try {
    const serviceSummary = await getBatchSkillGapsService(1, 1);
    assert(serviceSummary.totalGapsIdentified > 0, `Service computed total gaps: ${serviceSummary.totalGapsIdentified}`);
    assert(typeof serviceSummary.highPriorityCount === 'number', `High priority count: ${serviceSummary.highPriorityCount}`);

    const studentReport = await getStudentSkillGapReportService(6);
    assert(studentReport.identifiedGapsCount > 0, `Student report generated with ${studentReport.identifiedGapsCount} weak topics`);
    assert(studentReport.suggestedRoadmapTrack, `Suggested roadmap track: ${studentReport.suggestedRoadmapTrack}`);

    const triggered = await triggerRemedialAssignmentService({
      collegeId: 1,
      batchId: 1,
      topic: 'SQL Indexing',
      batchName: 'TE-A',
      createdBy: 5,
    });
    assert(triggered && triggered.title, `Service triggered remedial assignment: "${triggered.title}"`);
  } catch (err) {
    fail(`Service layer error: ${err.message}`);
    failed++;
  }

  // ─── 4. TEST HTTP EXPRESS ROUTES ───────────────────────────────────────────
  section('4. HTTP Route & Controller Integration Tests');
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/v1`;

  async function req(method, path, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}${path}`, options);
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  try {
    // 4.1 Unauthenticated request should fail (401)
    const unauth = await req('GET', '/skill-gaps');
    assert(unauth.status === 401, 'GET /skill-gaps without token returns 401 Unauthorized');

    // 4.2 Student forbidden from accessing batch-wide mentor skill-gaps (403)
    const forbidden = await req('GET', '/skill-gaps', null, studentToken);
    assert(forbidden.status === 403, 'GET /skill-gaps with student role returns 403 Forbidden');

    // 4.3 Mentor accessing batch-wide skill-gaps (200)
    const mentorGaps = await req('GET', '/skill-gaps?batchId=1', null, mentorToken);
    assert(mentorGaps.status === 200 && mentorGaps.data.success, `GET /skill-gaps as mentor returns 200 with ${mentorGaps.data.data?.skillGaps?.length || 0} gaps`);

    // 4.4 Student accessing own personal skill gaps (200)
    const myGaps = await req('GET', '/skill-gaps/my-gaps', null, studentToken);
    assert(myGaps.status === 200 && myGaps.data.success, `GET /skill-gaps/my-gaps as student returns 200 with ${myGaps.data.data?.weakTopics?.length || 0} weak areas`);

    // 4.5 Mentor accessing student skill gaps by student ID (200)
    const studentById = await req('GET', '/skill-gaps/student/6', null, mentorToken);
    assert(studentById.status === 200 && studentById.data.success, 'GET /skill-gaps/student/6 as mentor returns 200');

    // 4.6 Mentor triggering a remedial assignment (201)
    const triggerRes = await req(
      'POST',
      '/skill-gaps/remedial',
      {
        topic: 'Dynamic Programming & Memoization',
        batchId: 1,
        batchName: 'Batch TE-A',
        difficultyLevel: 'Medium',
      },
      mentorToken
    );
    assert(triggerRes.status === 201 && triggerRes.data.success, `POST /skill-gaps/remedial returns 201 Created: "${triggerRes.data.data?.title}"`);

    // 4.7 Retrieving remedial interventions (200)
    const remedialList = await req('GET', '/skill-gaps/remedial', null, mentorToken);
    assert(remedialList.status === 200 && remedialList.data.success, `GET /skill-gaps/remedial returns 200 with ${remedialList.data.data?.length || 0} interventions`);

    // 4.8 Running live AI diagnostics (200)
    const diagRes = await req(
      'POST',
      '/skill-gaps/diagnostics',
      {
        topic: 'Graph Algorithms',
        batchName: 'Batch TE-A',
        deficiencyRate: '38%',
        avgScore: '60%',
      },
      mentorToken
    );
    assert(diagRes.status === 200 && diagRes.data.success, 'POST /skill-gaps/diagnostics returns 200 with AI root causes');
  } catch (err) {
    fail(`HTTP integration error: ${err.message}`);
    failed++;
  } finally {
    server.close();
  }

  // ─── SUMMARY ───────────────────────────────────────────────────────────────
  section('Test Execution Summary');
  log(`Total Passed: ${passed}`, '\x1b[32m');
  if (failed > 0) {
    log(`Total Failed: ${failed}`, '\x1b[31m');
  } else {
    log('🎉 ALL TESTS PASSED PERFECTLY!', '\x1b[32m');
  }
}

runTests().catch(console.error);
