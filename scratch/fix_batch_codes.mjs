import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config({ path: './Backend/.env' });

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'c2c_portal'
  });

  await db.query("UPDATE batches SET code = 'CSE-ALPH', join_code = 'CSE-ALPH', code_expires_at = NULL WHERE id = 1");
  await db.query("UPDATE batches SET code = 'AIDS-BETA', join_code = 'AIDS-BETA', code_expires_at = NULL WHERE id = 2");
  await db.query("UPDATE batches SET code = 'BECS-FAST', join_code = 'BECS-FAST', code_expires_at = NULL WHERE id = 3");
  await db.query("UPDATE batches SET code_expires_at = NULL WHERE id = 4");
  await db.query("UPDATE batches SET code = 'BTCH-A001', join_code = 'BTCH-A001', code_expires_at = NULL WHERE id = 5");
  await db.query("UPDATE batches SET code = 'BTCH-A002', join_code = 'BTCH-A002', code_expires_at = NULL WHERE id = 6");

  const [rows] = await db.query('SELECT id, name, code, join_code, code_expires_at, status FROM batches');
  console.log('Updated batches:', rows);

  // Sync existing students.batch_id into student_batches table
  await db.query(`
    INSERT IGNORE INTO student_batches (user_id, batch_id)
    SELECT user_id, batch_id FROM students WHERE batch_id IS NOT NULL AND user_id IS NOT NULL
  `);
  const [sbCount] = await db.query('SELECT COUNT(*) as count FROM student_batches');
  console.log('Student batches count:', sbCount[0].count);

  await db.end();
}

run().catch(console.error);
