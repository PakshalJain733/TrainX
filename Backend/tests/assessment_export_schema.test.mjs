import test from 'node:test';
import assert from 'node:assert/strict';
import { query, pool } from '../src/config/db.js';
import { collectTrainingExportRecords } from '../src/modules/integrations/careerGateway/services/trainingDataExport.service.js';
import { executeDailyTrainingSync } from '../src/modules/integrations/careerGateway/services/dailyTrainingSync.worker.js';

test('Assessment Export Schema & Calculation Regression Tests', async (t) => {
  let testUserId = null;
  let testAssessmentId = null;
  let passAttemptId = null;
  let failAttemptId = null;

  // Setup test student and mapping
  const extStudentId = Math.floor(200000 + Math.random() * 700000);
  const testEmail = `export_test_${extStudentId}@somaiya.edu`;

  // 1. Insert user and mapping for College 9
  const userInsert = await query(
    `INSERT INTO users (name, email, role, college_id, career_gateway_student_id, source_system, is_active, is_verified)
     VALUES ('Export Tester', ?, 'student', 9, ?, 'career_gateway', 1, 1)`,
    [testEmail, extStudentId]
  );
  testUserId = userInsert.insertId;

  await query(
    `INSERT INTO students (user_id, college_id, career_gateway_student_id, clg_id, roll_number)
     VALUES (?, 9, ?, 'EXP-999', 'CG-EXP-999')`,
    [testUserId, extStudentId]
  );

  await query(
    `INSERT INTO career_gateway_student_mappings
     (trainx_user_id, career_gateway_student_id, clg_id, source_system, eligibility_status, provisioned_at, last_synced_at)
     VALUES (?, ?, 'EXP-999', 'career_gateway', 'eligible', NOW(), NOW())`,
    [testUserId, extStudentId]
  );

  // 2. Insert test assessment with total_marks = 100, pass_marks = 40 (no passing_percentage column)
  const asmInsert = await query(
    `INSERT INTO assessments (college_id, title, category, duration_minutes, total_marks, pass_marks, status)
     VALUES (9, 'Automated Test Diagnostic Assessment', 'Technical Quiz', 45, 100, 40, 'published')`
  );
  testAssessmentId = asmInsert.insertId;

  // 3. Insert passing attempt (score 75 >= 40)
  const passAttempt = await query(
    `INSERT INTO assessment_attempts
     (user_id, assessment_id, score, marks_obtained, total_marks, percentage, status, total_questions, correct_count, submitted_at)
     VALUES (?, ?, 75, 75, 100, 75.00, 'completed', 10, 8, NOW())`,
    [testUserId, testAssessmentId]
  );
  passAttemptId = passAttempt.insertId;

  // 4. Insert failing attempt (score 25 < 40)
  const failAttempt = await query(
    `INSERT INTO assessment_attempts
     (user_id, assessment_id, score, marks_obtained, total_marks, percentage, status, total_questions, correct_count, submitted_at)
     VALUES (?, ?, 25, 25, 100, 25.00, 'completed', 10, 3, NOW())`,
    [testUserId, testAssessmentId]
  );
  failAttemptId = failAttempt.insertId;

  await t.test('1: Assessment export safely reads pass_marks and computes passing_percentage dynamically', async () => {
    const result = await collectTrainingExportRecords({ collegeId: 9 });
    assert.ok(Array.isArray(result.data.assessments), 'assessments must be an array');
    
    const targetAsm = result.data.assessments.find((a) => a.assessment_id === testAssessmentId);
    assert.ok(targetAsm, 'Test assessment must be present in export');
    assert.equal(targetAsm.total_marks, 100);
    assert.equal(targetAsm.pass_marks, 40);
    assert.equal(targetAsm.passing_percentage, 40, 'Passing percentage should be (40/100)*100 = 40%');
  });

  await t.test('2: Assessment export query succeeds without physical passing_percentage column', async () => {
    // Verify MySQL column does not exist
    const cols = await query("SHOW COLUMNS FROM assessments LIKE 'passing_percentage'");
    assert.equal(cols.length, 0, 'Physical table assessments should not have passing_percentage');

    // Export must execute without throwing "Unknown column 'asm.passing_percentage'"
    const result = await collectTrainingExportRecords({ collegeId: 9 });
    assert.ok(result.data.assessments.length > 0);
  });

  await t.test('3: Assessment export with no student results returns empty array, not null', async () => {
    // Query for college 999999 (non-existent)
    const result = await collectTrainingExportRecords({ collegeId: 999999 });
    assert.ok(Array.isArray(result.data.batches));
    assert.ok(Array.isArray(result.data.sessions));
    assert.ok(Array.isArray(result.data.attendance));
    assert.ok(Array.isArray(result.data.assessments));
    assert.ok(Array.isArray(result.data.assessment_results));
    assert.ok(Array.isArray(result.data.student_progress));
    assert.equal(result.data.assessment_results.length, 0);
    assert.equal(result.total, 0);
  });

  await t.test('4: Assessment result score, max_score, and pass/fail mapping are preserved', async () => {
    const result = await collectTrainingExportRecords({ collegeId: 9 });
    const results = result.data.assessment_results;
    assert.ok(results.length >= 2, 'Should export at least the two test attempts');

    const passRes = results.find((r) => r.attempt_id === passAttemptId);
    assert.ok(passRes, 'Passing attempt must be present');
    assert.equal(passRes.score, 75);
    assert.equal(passRes.max_score, 100);
    assert.equal(passRes.passing_score, 40);
    assert.equal(passRes.status, 'passed');
    assert.equal(passRes.passed, true);
    assert.equal(passRes.student_id, extStudentId);

    const failRes = results.find((r) => r.attempt_id === failAttemptId);
    assert.ok(failRes, 'Failing attempt must be present');
    assert.equal(failRes.score, 25);
    assert.equal(failRes.max_score, 100);
    assert.equal(failRes.passing_score, 40);
    assert.equal(failRes.status, 'failed');
    assert.equal(failRes.passed, false);
    assert.equal(failRes.student_id, extStudentId);
  });

  await t.test('5: Full six-category export contract validation', async () => {
    const result = await collectTrainingExportRecords({ collegeId: 9 });
    assert.ok(result.data);
    const categories = ['batches', 'sessions', 'attendance', 'assessments', 'assessment_results', 'student_progress'];
    for (const cat of categories) {
      assert.ok(Array.isArray(result.data[cat]), `Category ${cat} must be an array`);
      assert.notEqual(result.data[cat], null, `Category ${cat} must not be null`);
    }
    assert.equal(result.resolvedCollegeId, 'col_somaiya_eng_01');
    assert.ok(result.total >= 3);
  });

  // Cleanup
  if (passAttemptId) await query('DELETE FROM assessment_attempts WHERE id = ?', [passAttemptId]);
  if (failAttemptId) await query('DELETE FROM assessment_attempts WHERE id = ?', [failAttemptId]);
  if (testAssessmentId) await query('DELETE FROM assessments WHERE id = ?', [testAssessmentId]);
  if (testUserId) {
    await query('DELETE FROM career_gateway_student_mappings WHERE trainx_user_id = ?', [testUserId]);
    await query('DELETE FROM students WHERE user_id = ?', [testUserId]);
    await query('DELETE FROM users WHERE id = ?', [testUserId]);
  }
});

test.after(async () => {
  await pool.end();
});

