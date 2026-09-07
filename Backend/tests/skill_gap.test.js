// @ts-nocheck
import { analyzeStudentPerformance } from '../src/ai/skillGap.ai.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/env.js';

const generateToken = (payload) => jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

import app from '../src/app.js';
import http from 'http';

let server;
let baseUrl;

const startServer = () => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      resolve();
    });
  });
};

const stopServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
};

const request = async (endpoint, { method = 'GET', token, body } = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
};

const log = (label, color = '\x1b[37m') => console.log(`${color}${label}\x1b[0m`);
const ok = (msg) => log(`  ✅ ${msg}`, '\x1b[32m');
const fail = (msg) => log(`  ❌ ${msg}`, '\x1b[31m');

async function runTests() {
  log('\n🧪 AI SKILL GAP ANALYSIS & RECOMMENDATION ENGINE — SUITE', '\x1b[35m');
  let passed = 0;
  let failed = 0;

  await startServer();
  const studentToken = generateToken({ userId: 101, role: 'student', college_id: 1 });

  try {
    // SCENARIO 0: User Prompt Specific Example
    const promptData = {
      student_name: 'Ganesh Shinde',
      quizMarks: { DBMS: 42, OOP: 78 },
      codingMarks: { Arrays: 80, 'Dynamic Programming': 35 },
      interviewScores: { DBMS: 'Weak', Communication: 'Good' },
    };

    const res0 = await analyzeStudentPerformance(promptData);
    const dpSuggestion = res0.suggestions.find((s) => s.skill === 'Dynamic Programming');
    const dbmsSuggestion = res0.suggestions.find((s) => s.skill === 'DBMS');

    if (res0.weak_areas.includes('Dynamic Programming') && res0.weak_areas.includes('DBMS') && dpSuggestion && dbmsSuggestion) {
      ok('Scenario 0 Passed: Identified Dynamic Programming & DBMS as weak areas');
      passed++;
    } else {
      fail('Scenario 0 Failed');
      failed++;
    }

    // SCENARIO 1: Very Low Performance
    const lowPerfData = {
      quizMarks: { DBMS: 25, OOP: 20 },
      codingMarks: { Arrays: 30, 'Dynamic Programming': 15 },
      interviewScores: { DBMS: 'Critical' },
    };
    const res1 = await analyzeStudentPerformance(lowPerfData);
    if (res1.overall_status === 'Needs Improvement') {
      ok('Scenario 1 Passed: Low performance detected');
      passed++;
    } else {
      fail('Scenario 1 Failed');
      failed++;
    }

    // SCENARIO 2: Good Performance
    const goodPerfData = {
      quizMarks: { DBMS: 90, OOP: 88 },
      codingMarks: { Arrays: 95, 'Dynamic Programming': 82 },
      interviewScores: { DBMS: 'Good' },
    };
    const res2 = await analyzeStudentPerformance(goodPerfData);
    if (res2.weak_areas_count === 0) {
      ok('Scenario 2 Passed: High performance (0 weak areas)');
      passed++;
    } else {
      fail('Scenario 2 Failed');
      failed++;
    }

    // SCENARIO 3: API Endpoint Integration
    const apiRes = await request('/skill-gaps/analyze', {
      method: 'POST',
      token: studentToken,
      body: promptData,
    });
    if (apiRes.status === 200 && apiRes.data?.success) {
      ok('Scenario 3 Passed: HTTP API Endpoint returned 200 OK');
      passed++;
    } else {
      fail('Scenario 3 Failed');
      failed++;
    }
  } catch (err) {
    fail(`Test error: ${err.message}`);
    failed++;
  } finally {
    await stopServer();
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED\n`);
  }
}

runTests();
