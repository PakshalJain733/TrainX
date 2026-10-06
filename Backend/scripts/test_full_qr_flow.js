import { createAttendanceSession, refreshAttendanceSessionQr, markSelfAttendanceByCode, getAttendanceSessionStatus, closeAttendanceSession } from '../src/controllers/attendance.controller.js';
import { initializeDatabase } from '../src/config/init_db.js';
import { query } from '../src/config/db.js';

async function testFullFlow() {
  await initializeDatabase();
  console.log("=== STARTING FULL GENERAL COLLEGE ATTENDANCE FLOW TEST ===");

  // 1. Setup mock response helper
  const createMockRes = () => {
    let result = { statusCode: 200, payload: null };
    const res = {
      status: (code) => {
        result.statusCode = code;
        return res;
      },
      json: (data) => {
        result.payload = data;
        return res;
      }
    };
    return { res, getResult: () => result };
  };

  const next = (err) => console.error("Next called:", err);

  // 2. Fetch or create a batch & student for test
  let batches = await query(`SELECT id FROM batches LIMIT 1`);
  let batchId = batches.length > 0 ? batches[0].id : 1;
  if (batches.length === 0) {
    const bRes = await query(`INSERT INTO batches (name, code) VALUES ('ECS-SE-A', 'ECS-SE-A')`);
    batchId = bRes.insertId;
  }

  let users = await query(`SELECT id FROM users LIMIT 1`);
  let userId = users.length > 0 ? users[0].id : 1;

  // Add user to students table if not present
  const bs = await query(`SELECT * FROM students WHERE user_id = ?`, [userId]);
  if (bs.length === 0) {
    await query(`INSERT INTO students (user_id, batch_id, roll_number) VALUES (?, ?, 'ROLL-101')`, [userId, batchId]);
  } else {
    await query(`UPDATE students SET batch_id = ? WHERE user_id = ?`, [batchId, userId]);
  }

  const today = new Date().toISOString().split('T')[0];

  // STEP 1: Admin Creates Attendance Session
  console.log("\n1. Admin Creates Attendance Session for batch:", batchId, "and date:", today);
  const adminReq = {
    user: { id: 99, role: 'college_admin' },
    body: { batch_id: batchId, date: today }
  };
  const mock1 = createMockRes();
  await createAttendanceSession(adminReq, mock1.res, next);
  console.log("Create Session Status:", mock1.getResult().statusCode);
  console.log("Create Session Payload:", mock1.getResult().payload);

  const sessionId = mock1.getResult().payload?.data?.id;
  const initialToken = mock1.getResult().payload?.data?.current_qr_token;

  if (!sessionId || !initialToken) {
    console.error("FAILED to create session!");
    process.exit(1);
  }

  // STEP 2: Duplicate Session Prevention Test
  console.log("\n2. Admin Tries to Create Duplicate Session for same batch and date...");
  const mockDup = createMockRes();
  await createAttendanceSession(adminReq, mockDup.res, next);
  console.log("Duplicate Create Status (Should be 409):", mockDup.getResult().statusCode);
  console.log("Duplicate Message:", mockDup.getResult().payload?.message);

  // STEP 3: Student Scans Initial QR Token (Valid)
  console.log("\n3. Student Scans Initial Valid QR Token:", initialToken);
  const studentReq = {
    user: { id: userId, role: 'student' },
    body: { token: initialToken }
  };
  const mockScan1 = createMockRes();
  await markSelfAttendanceByCode(studentReq, mockScan1.res, next);
  console.log("Scan 1 Status (Should be 200):", mockScan1.getResult().statusCode);
  console.log("Scan 1 Message:", mockScan1.getResult().payload?.message);

  // STEP 4: Duplicate Scan Prevention Test (Same Student Scans Again)
  console.log("\n4. Same Student Scans Again (Duplicate Scan Test)...");
  const mockScanDup = createMockRes();
  await markSelfAttendanceByCode(studentReq, mockScanDup.res, next);
  console.log("Duplicate Scan Status (Should be 409):", mockScanDup.getResult().statusCode);
  console.log("Duplicate Scan Message:", mockScanDup.getResult().payload?.message);

  // STEP 5: Student from Another Batch Scans Test
  console.log("\n5. Student from Another Batch Scans Test...");
  const outsiderReq = {
    user: { id: 99999, role: 'student' }, // Not in batch
    body: { token: initialToken }
  };
  const mockOutsider = createMockRes();
  await markSelfAttendanceByCode(outsiderReq, mockOutsider.res, next);
  console.log("Outsider Scan Status (Should be 403):", mockOutsider.getResult().statusCode);
  console.log("Outsider Scan Message:", mockOutsider.getResult().payload?.message);

  // STEP 6: Refresh QR Code (Dynamic 5-second Rotation)
  console.log("\n6. Admin Refreshes QR Code (Simulating 5-second Rotation)...");
  const refreshReq = {
    user: { id: 99, role: 'college_admin' },
    params: { sessionId: sessionId }
  };
  const mockRefresh = createMockRes();
  await refreshAttendanceSessionQr(refreshReq, mockRefresh.res, next);
  const newToken = mockRefresh.getResult().payload?.data?.token;
  console.log("New QR Token:", newToken);

  // STEP 7: Old QR Token Invalidation Test
  console.log("\n7. Student Tries Scanning Old Invalidated QR Token:", initialToken);
  const oldScanReq = {
    user: { id: 8888, role: 'student' },
    body: { token: initialToken }
  };
  const mockOldScan = createMockRes();
  await markSelfAttendanceByCode(oldScanReq, mockOldScan.res, next);
  console.log("Old Token Scan Status (Should be 400):", mockOldScan.getResult().statusCode);
  console.log("Old Token Scan Message:", mockOldScan.getResult().payload?.message);

  // STEP 8: Get Session Status & Roster
  console.log("\n8. Admin Checks Session Status & Live Roster...");
  const statusReq = { params: { sessionId: sessionId } };
  const mockStatus = createMockRes();
  await getAttendanceSessionStatus(statusReq, mockStatus.res, next);
  console.log("Session Status Payload:", JSON.stringify(mockStatus.getResult().payload, null, 2));

  // STEP 9: Admin Closes Attendance Session
  console.log("\n9. Admin Closes Attendance Session...");
  const closeReq = {
    user: { id: 99, role: 'college_admin' },
    params: { sessionId: sessionId }
  };
  const mockClose = createMockRes();
  await closeAttendanceSession(closeReq, mockClose.res, next);
  console.log("Close Status:", mockClose.getResult().statusCode);

  // STEP 10: Scan After Session Closed Test
  console.log("\n10. Student Scans After Session Closure Test...");
  const closedScanReq = {
    user: { id: 7777, role: 'student' },
    body: { token: newToken }
  };
  const mockClosedScan = createMockRes();
  await markSelfAttendanceByCode(closedScanReq, mockClosedScan.res, next);
  console.log("Closed Session Scan Status (Should be 400):", mockClosedScan.getResult().statusCode);
  console.log("Closed Session Scan Message:", mockClosedScan.getResult().payload?.message);

  console.log("\n=== ALL TEST SCENARIOS COMPLETED SUCCESSFULLY ===");
  process.exit(0);
}

testFullFlow();
