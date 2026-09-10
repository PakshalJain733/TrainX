import mysql from 'mysql2/promise';
import { config } from '../config/env.js';
import { initializeDatabase } from '../config/init_db.js';

async function clearDatabase() {
  console.log('=== CLEARING ALL DATA FROM DATABASE FOR FRESH REGISTER ===');
  
  try {
    const conn = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });

    console.log('[DB Clear] Connected to MySQL database:', config.db.database);

    // Disable foreign key checks to allow truncating tables in any order
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    const tablesToClear = [
      'users',
      'students',
      'otps',
      'assessment_attempts',
      'assessment_questions',
      'assessments',
      'attendance',
      'attendance_sessions',
      'attendance_summary',
      'leave_requests',
      'support_tickets',
      'skill_gap_analysis',
      'live_sessions',
      'study_materials',
      'shared_content',
      'broadcast_notifications',
    ];

    for (const table of tablesToClear) {
      try {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`[DB Clear] Truncated table: ${table}`);
      } catch (err) {
        console.log(`[DB Clear] Could not truncate ${table} (may not exist): ${err.message}`);
      }
    }

    // Re-enable foreign key checks
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.end();

    console.log('[DB Clear] Database records successfully cleared!');
    console.log('[DB Clear] Re-initializing default colleges and departments...');
    
    await initializeDatabase();
    console.log('=== DATABASE RESET COMPLETED SUCCESSFULLY! READY FOR FRESH REGISTRATION ===');
    process.exit(0);
  } catch (error) {
    console.error('[DB Clear Error]', error);
    process.exit(1);
  }
}

clearDatabase();
