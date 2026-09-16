import mysql from 'mysql2/promise';
import { config } from '../config/env.js';

async function cleanDatabase() {
  try {
    const conn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });

    console.log('[Clean DB] Connected to MySQL database:', config.db.database);

    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    const tablesToWipe = [
      'students', 'mentors', 'coordinators', 'college_admins', 'batches', 
      'departments', 'colleges', 'quizzes', 'quiz_questions', 'practice_problems',
      'learning_content', 'weekly_reports', 'defaulters', 'interview_sessions',
      'broadcast_notifications', 'student_notifications', 'attendance', 'leaves',
      'certificates', 'study_notes', 'secure_codes', 'user_otps', 'user_sessions',
      'roadmaps'
    ];

    for (const table of tablesToWipe) {
      try {
        await conn.query(`TRUNCATE TABLE ${table}`);
        console.log(`[Clean DB] Truncated table: ${table}`);
      } catch (err) {
        try {
          await conn.query(`DELETE FROM ${table}`);
          console.log(`[Clean DB] Deleted all rows from table: ${table}`);
        } catch (_) {}
      }
    }

    // Retain only Super Admin user in `users` table
    await conn.query(`DELETE FROM users WHERE email != 'training.portal0987@gmail.com'`);
    console.log('[Clean DB] Deleted non-SuperAdmin users from users table');

    const [superAdminRows] = await conn.query(`SELECT id FROM users WHERE email = 'training.portal0987@gmail.com'`);
    if (!superAdminRows || superAdminRows.length === 0) {
      await conn.query(
        `INSERT INTO users (name, email, mobile_number, role, is_active) VALUES ('Super Admin', 'training.portal0987@gmail.com', '9876543210', 'super_admin', 1)`
      );
      console.log('[Clean DB] Created Super Admin user (training.portal0987@gmail.com)');
    } else {
      await conn.query(`UPDATE users SET role = 'super_admin', is_active = 1 WHERE email = 'training.portal0987@gmail.com'`);
      console.log('[Clean DB] Retained Super Admin user (training.portal0987@gmail.com)');
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('[Clean DB] Database reset complete! Retained only Super Admin credentials.');
    await conn.end();
  } catch (err) {
    console.error('[Clean DB Error]', err);
  }
}

cleanDatabase();
