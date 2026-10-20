import { query } from './src/config/db.js';

async function testAttendanceFlow() {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    console.log("1. Testing mark attendance insert with on duplicate key update...");
    await query(
      `INSERT INTO attendance (college_id, batch_id, user_id, session_id, session_date, status, remarks)
       VALUES (?, ?, ?, ?, ?, 'present', ?)
       ON DUPLICATE KEY UPDATE session_id = VALUES(session_id), status = 'present', remarks = VALUES(remarks), updated_at = CURRENT_TIMESTAMP`,
      [1, 13, 6, null, todayStr, 'Scanned QR Code: TEST']
    );
    console.log("Attendance marked present in DB!");

    console.log("2. Testing query attendance for today...");
    const att = await query(
      `SELECT * FROM attendance WHERE user_id = ? AND session_date = ?`,
      [6, todayStr]
    );
    console.log("Attendance for today in DB:", att);

    console.log("3. Testing logAttendanceScan...");
    await query(
      `INSERT INTO attendance_scans 
        (user_id, batch_id, session_id, scanned_code, session_date, status, remarks)
       VALUES (?, ?, ?, ?, ?, 'present', ?)`,
      [6, 13, null, 'TEST', todayStr, 'QR Scan']
    );
    console.log("Attendance scan logged in DB!");

    console.log("4. Cleaning up test data...");
    await query(`DELETE FROM attendance WHERE user_id = 6 AND remarks LIKE '%TEST%'`);
    await query(`DELETE FROM attendance_scans WHERE user_id = 6 AND scanned_code = 'TEST'`);
    console.log("Cleaned up successfully! EVERYTHING WORKS!");
  } catch (err) {
    console.error("FLOW FAILED:", err);
  }
  process.exit(0);
}
testAttendanceFlow();
