import { markSelfAttendanceByCode } from '../controllers/attendance.controller.js';
import { initializeDatabase } from '../config/init_db.js';
import { query } from '../config/db.js';

async function testQrAttendance() {
  await initializeDatabase();
  console.log("=== TESTING QR ATTENDANCE SCAN & PERSISTENCE ===");

  const req = {
    user: { id: 1, userId: 1, college_id: 1, email: 'student@test.com' },
    body: { code: 'BATCH-A-2026-QR' },
  };

  let resData = null;
  const res = {
    status: (code) => res,
    json: (payload) => {
      resData = payload;
      return payload;
    },
  };

  const next = (err) => {
    console.error("Next called with error:", err);
  };

  try {
    await markSelfAttendanceByCode(req, res, next);
    console.log("API Response:", JSON.stringify(resData, null, 2));

    const rows = await query(`SELECT * FROM attendance WHERE user_id = 1 ORDER BY id DESC LIMIT 1`);
    console.log("Database Verification Record:", rows);
  } catch (err) {
    console.error("ERROR testing QR attendance:", err);
  }
  process.exit(0);
}

testQrAttendance();
