import { query } from '../src/config/db.js';

async function verifySchemaAndMigrations() {
  console.log('================================================================');
  console.log('AUDIT GAP 9: Database Schema and Tables Verification');
  console.log('================================================================');

  const requiredTables = [
    'coding_problems',
    'coding_test_cases',
    'coding_submissions',
    'practice_problems',
    'practice_problem_submissions',
    'batch_tasks',
    'task_submissions',
    'coding_retake_permissions'
  ];

  for (const table of requiredTables) {
    try {
      const columns = await query(`DESCRIBE ${table}`);
      console.log(`\nTable: [${table}] (${columns.length} columns)`);
      const keyCols = columns.map(c => `${c.Field} (${c.Type}${c.Key ? ', ' + c.Key : ''}${c.Null === 'NO' ? ', NOT NULL' : ''})`);
      console.log(keyCols.slice(0, 10).join('\n  - '));
      if (keyCols.length > 10) console.log(`  ... and ${keyCols.length - 10} more columns`);
    } catch (err) {
      console.error(`Missing or Error for Table [${table}]:`, err.message);
    }
  }

  // Check specific required fields for LeetCode / Retake functionality:
  console.log('\n--- Checking Specialized Column Schema ---');
  const [crpCols] = [await query(`DESCRIBE coding_retake_permissions`)];
  const crpFields = crpCols.map(c => c.Field);
  console.log('coding_retake_permissions fields:', crpFields.join(', '));
  console.log('Has target_type, target_id, student_id, status:', 
    ['target_type', 'target_id', 'student_id', 'status'].every(f => crpFields.includes(f)) ? 'PASS' : 'FAIL');

  const [tsCols] = [await query(`DESCRIBE task_submissions`)];
  const tsFields = tsCols.map(c => c.Field);
  console.log('task_submissions has is_retake, retake_permission_id, attempt_number:',
    ['is_retake', 'retake_permission_id', 'attempt_number'].every(f => tsFields.includes(f)) ? 'PASS' : 'FAIL');

  const [csCols] = [await query(`DESCRIBE coding_submissions`)];
  const csFields = csCols.map(c => c.Field);
  console.log('coding_submissions has is_retake, retake_permission_id:',
    ['is_retake', 'retake_permission_id'].every(f => csFields.includes(f)) ? 'PASS' : 'FAIL');
}

verifySchemaAndMigrations().catch(console.error);

