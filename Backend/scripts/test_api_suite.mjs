import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { query } from '../src/config/db.js';

async function run() {
  console.log('=== TEST API SUITE ===');

  // 1. Staff users in DB
  const staff = await query("SELECT id, name, email, role, college_id FROM users WHERE role != 'student'");
  console.log('Staff users count:', staff.length);
  staff.forEach(s => console.log(` - ID: ${s.id}, Name: ${s.name}, Email: ${s.email}, Role: ${s.role}`));

  // 2. Generate a valid test token for Super Admin (id: staff[0]?.id || 1)
  const superAdmin = staff.find(s => s.role === 'super_admin' || s.role === 'superadmin') || staff[0];
  const jwtSecret = process.env.JWT_SECRET || 'trainx_dev_secret_2026_ganesh_shinde_training_portal';
  const superAdminToken = jwt.sign(
    { userId: superAdmin?.id || 1, id: superAdmin?.id || 1, email: superAdmin?.email || 'admin@trainx.com', role: 'super_admin', collegeId: null },
    jwtSecret,
    { expiresIn: '1h' }
  );

  // 3. Test Health endpoint with Super Admin token (should return detailed system health)
  const hRes = await fetch('http://localhost:5000/api/v1/health', {
    headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  console.log('Detailed health status (authenticated super admin):', hRes.status);
  const hData = await hRes.json();
  console.log('Detailed health data keys:', Object.keys(hData.data || {}));

  // 4. Test Leave Requests POST
  const postLeave = await fetch('http://localhost:5000/api/v1/attendance/leave-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`
    },
    body: JSON.stringify({
      studentName: 'Test Student Verification',
      category: 'Medical Leave Application',
      reason: 'Automated verification test',
      days: 2
    })
  });
  console.log('POST /leave-requests status:', postLeave.status);
  const postLeaveData = await postLeave.json();
  console.log('POST /leave-requests result:', postLeaveData.data?.studentName, 'ID:', postLeaveData.data?.id);

  // 5. Test Leave Requests GET
  const getLeave = await fetch('http://localhost:5000/api/v1/attendance/leave-requests', {
    headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  console.log('GET /leave-requests status:', getLeave.status);
  const getLeaveData = await getLeave.json();
  console.log('GET /leave-requests count:', getLeaveData.data?.length);

  // 6. Test Leave Request DELETE
  if (postLeaveData.data?.id) {
    const delLeave = await fetch(`http://localhost:5000/api/v1/attendance/leave-requests/${postLeaveData.data.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log('DELETE /leave-requests status:', delLeave.status);
  }

  // 7. Test Mentor route as Super Admin (Bug E verification)
  const mentorOverview = await fetch('http://localhost:5000/api/v1/mentor/overview', {
    headers: { Authorization: `Bearer ${superAdminToken}` }
  });
  console.log('GET /mentor/overview (as Super Admin) status:', mentorOverview.status);

  // 8. Test Assessment attempts submit route (Bug C verification)
  const submitAttempt = await fetch('http://localhost:5000/api/v1/assessments/attempts/1/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${superAdminToken}`
    },
    body: JSON.stringify({ answers: [] })
  });
  console.log('POST /assessments/attempts/1/submit status:', submitAttempt.status);

  // 9. Test YouTube service fallback video (Bug F verification)
  const { searchYouTubeVideos } = await import('../src/services/youtube.service.js');
  const videos = await searchYouTubeVideos('react hooks');
  console.log('YouTube fallback video count:', videos.length, 'Title:', videos[0]?.title);

  console.log('=== TEST SUITE COMPLETED SUCCESSFULLY ===');
  process.exit(0);
}

run().catch(e => {
  console.error('Test suite failed:', e);
  process.exit(1);
});
