import { pool, query } from '../src/config/db.js';

async function resetDatabaseSequence() {
  console.log('[Reset] Starting database cleanup and ID sequence reset...');

  // 1. Fetch the Super Admin user
  const superAdminRows = await query(`
    SELECT * FROM users 
    WHERE role = 'super_admin' OR email = 'admin@trainingportal.com' 
    LIMIT 1
  `);

  if (!superAdminRows || superAdminRows.length === 0) {
    throw new Error('Super Admin account not found in database! Aborting to prevent data loss.');
  }

  const superAdmin = superAdminRows[0];
  console.log(`[Reset] Found Super Admin: ID=${superAdmin.id}, Name=${superAdmin.name}, Email=${superAdmin.email}`);

  // Tables to completely clear (truncate & reset auto_increment to 1)
  const tablesToClear = [
    'account_activations',
    'alumni_data',
    'assessment_answers',
    'assessment_attempts',
    'assessment_questions',
    'assessments',
    'attendance',
    'attendance_scans',
    'attendance_sessions',
    'attendance_summary',
    'batch_daily_topics',
    'batch_tasks',
    'batch_trainers',
    'batches',
    'broadcast_notifications',
    'broadcasts',
    'c2c_enrollments',
    'c2c_registrations',
    'career_gateway_integration_events',
    'career_gateway_student_mappings',
    'career_gateway_sync_executions',
    'career_gateway_sync_log',
    'coding_submissions',
    'colleges',
    'coordinator_departments',
    'defaulters',
    'departments',
    'drive_participations',
    'faculty',
    'faculty_branch_management',
    'interventions',
    'interview_sessions',
    'interview_submissions',
    'interviews',
    'leave_requests',
    'live_sessions',
    'mentor_assignments',
    'mentor_student_assignments',
    'milestones',
    'mock_drives',
    'notifications',
    'otps',
    'practice_problem_submissions',
    'practice_problems',
    'remedial_interventions',
    'reports',
    'roadmap_items',
    'roadmaps',
    'secure_code_requests',
    'secure_codes',
    'shared_content',
    'skill_gap_analysis',
    'skill_gaps',
    'student_add',
    'student_batches',
    'student_classroom_mapping',
    'student_parentdetail',
    'student_personaldetails',
    'student_quiz_completions',
    'students',
    'students_erp_backup',
    'students_prn_mapping',
    'students_sem_mapping',
    'study_materials',
    'subjects',
    'support_tickets',
    'syllabus_tracker',
    'task_submissions',
    'tbl_student_batch_sem_div_mapping',
    'tbl_student_exam_classrom_mapping',
    'time_table_batch_subject',
    'training_enrollments',
    'training_programs',
    'trainings',
    'trainx_training_export_batches',
    'user_auth_token',
    'user_oauth_tokens',
    'weekly_reports',
  ];

  await query('SET FOREIGN_KEY_CHECKS = 0');

  try {
    // 2. Clear all tables
    for (const tName of tablesToClear) {
      try {
        await query(`TRUNCATE TABLE \`${tName}\``);
        await query(`ALTER TABLE \`${tName}\` AUTO_INCREMENT = 1`);
        console.log(`[Reset] Truncated and reset AUTO_INCREMENT for: ${tName}`);
      } catch (err) {
        // Table might not exist in this environment, try DELETE + reset
        try {
          await query(`DELETE FROM \`${tName}\``);
          await query(`ALTER TABLE \`${tName}\` AUTO_INCREMENT = 1`);
          console.log(`[Reset] Cleared table via DELETE: ${tName}`);
        } catch (innerErr) {
          // Table doesn't exist, safely ignore
        }
      }
    }

    // 3. Clear users table completely
    await query('TRUNCATE TABLE users');
    console.log('[Reset] Truncated users table.');

    // 4. Re-insert Super Admin with ID = 1
    await query(`
      INSERT INTO users (
        id,
        name,
        email,
        mobile_number,
        role,
        college_id,
        is_active,
        is_verified,
        is_approved,
        password_hash,
        source_system,
        activation_status,
        approval_status,
        force_password_change,
        created_at,
        updated_at
      ) VALUES (
        1,
        ?,
        ?,
        ?,
        'super_admin',
        NULL,
        1,
        1,
        1,
        ?,
        'trainx',
        'completed',
        'approved',
        0,
        NOW(),
        NOW()
      )
    `, [
      superAdmin.name || 'Super Admin',
      superAdmin.email || 'admin@trainingportal.com',
      superAdmin.mobile_number || '9876543210',
      superAdmin.password_hash
    ]);

    console.log('[Reset] Super Admin re-inserted with ID = 1.');

    // 5. Set users table AUTO_INCREMENT to 2 so the next created user gets ID 2
    await query('ALTER TABLE users AUTO_INCREMENT = 2');
    console.log('[Reset] Set users table AUTO_INCREMENT = 2.');

  } finally {
    await query('SET FOREIGN_KEY_CHECKS = 1');
  }

  // 6. Verify current users table
  const currentUsers = await query('SELECT id, name, email, role, is_active, is_verified, is_approved FROM users');
  console.log('[Reset] Verification of users table:', currentUsers);

  // Check AUTO_INCREMENT value from INFORMATION_SCHEMA
  const [userAutoInc] = await query(`
    SELECT AUTO_INCREMENT 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
  `);
  console.log(`[Reset] Next User ID (AUTO_INCREMENT): ${userAutoInc?.AUTO_INCREMENT}`);

  console.log('\n✅ [Reset Complete] Database successfully reset:');
  console.log('- Super Admin ID: 1');
  console.log(`- Next User ID will be: ${userAutoInc?.AUTO_INCREMENT || 2}`);
  console.log('- All test data purged and sequences reset.');

  process.exit(0);
}

resetDatabaseSequence().catch(err => {
  console.error('[Reset Error]', err);
  process.exit(1);
});

