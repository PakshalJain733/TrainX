import 'dotenv/config';
import mysql from 'mysql2/promise';

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '3307', 10);
const dbUser = process.env.DB_USER || 'root';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'training_portal_db';
const dbSsl = process.env.DB_SSL === 'true' 
  ? { 
      rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' ? false : true,
      ...(process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : {})
    } 
  : undefined;
const connectTimeout = parseInt(process.env.DB_CONNECT_TIMEOUT || '15000', 10);

export const pool = mysql.createPool({
  host: dbHost,
  port: dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '40', 10),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '500', 10),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  ...(dbSsl ? { ssl: dbSsl } : {}),
  connectTimeout: connectTimeout,
});

export const query = async (sql, params = []) => {
  const safeParams = (params || []).map((p) => (p === undefined ? null : p));
  const [results] = await pool.execute(sql, safeParams);
  return results;
};

export const checkDatabaseConnection = async () => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log(`[Database] Connected successfully to MySQL database: ${dbName}`);

    // Ensure extended profile columns exist on users table
    try {
      const existingCols = await query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
      );
      const colSet = new Set((existingCols || []).map(c => c.COLUMN_NAME.toLowerCase()));
      const colsToAdd = [
        { name: 'employee_id', def: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'office_location', def: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'experience', def: 'VARCHAR(100) DEFAULT NULL' },
        { name: 'specialization', def: 'VARCHAR(255) DEFAULT NULL' },
        { name: 'avatar_url', def: 'LONGTEXT DEFAULT NULL' },
        { name: 'bio', def: 'TEXT DEFAULT NULL' },
      ];
      for (const col of colsToAdd) {
        if (!colSet.has(col.name.toLowerCase())) {
          await query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.def}`);
          console.log(`[Database Migration] Added column ${col.name} to users table.`);
        }
      }
    } catch (migErr) {
      console.warn(`[Database Migration Warning] Could not verify/apply users schema extensions: ${migErr.message}`);
    }

    // Auto-create essential performance indexes for 500+ concurrent users
    try {
      const performanceIndexes = [
        { table: 'assessment_attempts', name: 'idx_perf_attempts_user_assessment', sql: 'CREATE INDEX idx_perf_attempts_user_assessment ON assessment_attempts (user_id, assessment_id, status)' },
        { table: 'attendance', name: 'idx_perf_attendance_batch_date', sql: 'CREATE INDEX idx_perf_attendance_batch_date ON attendance (batch_id, session_date)' },
        { table: 'users', name: 'idx_perf_users_role_active', sql: 'CREATE INDEX idx_perf_users_role_active ON users (role, is_active, college_id)' },
        { table: 'practice_problems', name: 'idx_perf_practice_college_batch', sql: 'CREATE INDEX idx_perf_practice_college_batch ON practice_problems (college_id, batch_id)' },
      ];
      for (const idx of performanceIndexes) {
        try {
          const existingIdx = await query(`SHOW INDEX FROM \`${idx.table}\` WHERE Key_name = ?`, [idx.name]);
          if (!existingIdx || existingIdx.length === 0) {
            await query(idx.sql);
            console.log(`[Database Migration] Created performance index ${idx.name} on ${idx.table}.`);
          }
        } catch (_) {}
      }
    } catch (_) {}

    return true;
  } catch (error) {
    console.warn(`[Database Warning] Database connection failed (${error.message}). Server running with fallback mode.`);
    return false;
  }
};
