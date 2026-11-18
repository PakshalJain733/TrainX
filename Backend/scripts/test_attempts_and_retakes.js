import 'dotenv/config';
import { query } from '../src/config/db.js';
import { submitCodeAndSaveService } from '../src/services/codingSubmission.service.js';

async function testAttemptsAndRetakes() {
  console.log('================================================================');
  console.log('🧪 Testing Attempt Limits & Retake Permissions');
  console.log('================================================================\n');

  // Find a test practice problem
  const probRows = await query('SELECT id, title, total_marks FROM coding_problems LIMIT 1');
  if (!probRows || probRows.length === 0) {
    console.error('No coding problems found in DB');
    return;
  }
  const testProb = probRows[0];
  console.log(`Using Test Problem ID ${testProb.id}: "${testProb.title}"`);

  const studentA = 1752; // Demo Student
  const studentB = 1755; // Ganesh Shinde

  // Clean up any test submissions for student A and B on this problem to ensure fresh clean state
  await query('DELETE FROM coding_submissions WHERE problem_id = ? AND student_id IN (?, ?)', [testProb.id, studentA, studentB]);
  await query('DELETE FROM coding_retake_permissions WHERE target_id = ? AND student_id IN (?, ?)', [testProb.id, studentA, studentB]);

  console.log('\n--- Test 4.1: Practice Problem 3-Attempt Rule for Student A ---');
  const validCode = 'import sys\nprint("0 1")';

  // Submission 1
  const sub1 = await submitCodeAndSaveService({
    student_id: studentA,
    problem_id: testProb.id,
    code: validCode,
    language: 'python',
    source: 'practice_problem',
    task_id: `practice-${testProb.id}`
  });
  console.log(`Submission 1: Attempt ${sub1.attempts_used}/3 -> Status: ${sub1.status}`);

  // Submission 2
  const sub2 = await submitCodeAndSaveService({
    student_id: studentA,
    problem_id: testProb.id,
    code: validCode,
    language: 'python',
    source: 'practice_problem',
    task_id: `practice-${testProb.id}`
  });
  console.log(`Submission 2: Attempt ${sub2.attempts_used}/3 -> Status: ${sub2.status}`);

  // Submission 3
  const sub3 = await submitCodeAndSaveService({
    student_id: studentA,
    problem_id: testProb.id,
    code: validCode,
    language: 'python',
    source: 'practice_problem',
    task_id: `practice-${testProb.id}`
  });
  console.log(`Submission 3: Attempt ${sub3.attempts_used}/3 -> Status: ${sub3.status}`);

  // Submission 4 (Expected to be rejected due to 3-attempt limit)
  let sub4Error = null;
  try {
    await submitCodeAndSaveService({
      student_id: studentA,
      problem_id: testProb.id,
      code: validCode,
      language: 'python',
      source: 'practice_problem',
      task_id: `practice-${testProb.id}`
    });
  } catch (err) {
    sub4Error = err;
  }
  if (sub4Error && sub4Error.statusCode === 403) {
    console.log(`✅ 4th Submission cleanly rejected: "${sub4Error.message}" (Status ${sub4Error.statusCode})`);
  } else {
    console.error(`❌ FAILED: 4th submission was NOT rejected as expected!`);
  }

  console.log('\n--- Test 5.1: Granting Retake to Student A (Isolation from Student B) ---');
  // Insert retake permission for Student A
  await query(`
    INSERT INTO coding_retake_permissions (student_id, target_type, target_id, granted_by, status)
    VALUES (?, 'problem', ?, 1, 'pending')
  `, [studentA, testProb.id]);
  console.log(`Granted retake permission for Student A on Problem ${testProb.id}`);

  // Check Student B attempts (should still have 0 attempts and NO retake)
  const bSubmissions = await query('SELECT COUNT(*) as cnt FROM coding_submissions WHERE problem_id = ? AND student_id = ?', [testProb.id, studentB]);
  console.log(`Student B current attempts: ${bSubmissions[0].cnt}`);

  // Student A retake attempt (4th attempt succeeds with retake)
  const sub4Retake = await submitCodeAndSaveService({
    student_id: studentA,
    problem_id: testProb.id,
    code: validCode,
    language: 'python',
    source: 'practice_problem',
    task_id: `practice-${testProb.id}`
  });
  console.log(`✅ Student A retake submission accepted! Attempt used: ${sub4Retake.attempts_used}`);

  // Verify retake status is now 'used'
  const retakeRow = await query('SELECT status FROM coding_retake_permissions WHERE student_id = ? AND target_id = ?', [studentA, testProb.id]);
  console.log(`Retake permission status after attempt: "${retakeRow[0]?.status}"`);

  // Verify Student A is locked again now that retake is used
  let sub5Error = null;
  try {
    await submitCodeAndSaveService({
      student_id: studentA,
      problem_id: testProb.id,
      code: validCode,
      language: 'python',
      source: 'practice_problem',
      task_id: `practice-${testProb.id}`
    });
  } catch (err) {
    sub5Error = err;
  }
  if (sub5Error && sub5Error.statusCode === 403) {
    console.log(`✅ Retake exhausted: 5th attempt rejected cleanly: "${sub5Error.message}"`);
  } else {
    console.error(`❌ FAILED: 5th submission was NOT rejected after retake was used!`);
  }

  // Cleanup test data
  await query('DELETE FROM coding_submissions WHERE problem_id = ? AND student_id IN (?, ?)', [testProb.id, studentA, studentB]);
  await query('DELETE FROM coding_retake_permissions WHERE target_id = ? AND student_id IN (?, ?)', [testProb.id, studentA, studentB]);
  console.log('\n✅ Cleaned up temporary test data.');
}

testAttemptsAndRetakes().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});

