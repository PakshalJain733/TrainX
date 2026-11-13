import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

async function verifyRoadmapPersistence() {
  console.log('================================================================');
  console.log('AUDIT GAP 7: Verify AI Roadmap Scores & Progress Persistence');
  console.log('================================================================');

  const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_training_portal';
  const token = jwt.sign(
    { id: 1755, userId: 1755, email: 'ganesh@acadnexus.com', role: 'student' },
    secret,
    { expiresIn: '1h' }
  );

  // 1. Fetch current roadmap
  console.log('Fetching roadmap for Student 1755...');
  const res1 = await fetch('http://localhost:5000/api/v1/roadmap/my', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data1 = await res1.json();
  console.log('Fetch status:', res1.status);
  console.log('Current roadmap target role:', data1.data?.targetRole || 'None');
  console.log('Milestones count:', data1.data?.milestones?.length || 0);

  // 2. Update progress on milestone 1 (score: 85%, completed)
  const rmId = data1.data?.id || 1;
  const milestonesToUpdate = (data1.data?.milestones || [
    { id: 1, title: 'Milestone 1', progress: 0, status: 'in-progress' }
  ]).map((m, idx) => {
    if (idx === 0) {
      return { ...m, progress: 100, status: 'completed', score: 85, practiceScore: 100 };
    }
    return m;
  });

  console.log('\nSaving updated progress to server via POST /api/v1/roadmap/progress ...');
  const saveRes = await fetch('http://localhost:5000/api/v1/roadmap/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      roadmapId: rmId,
      milestones: milestonesToUpdate
    })
  });
  const saveData = await saveRes.json();
  console.log('Save response HTTP:', saveRes.status);
  console.log('Save success:', saveData.success);

  // 3. Simulate page reload / new login session by fetching again with fresh request
  console.log('\nSimulating fresh session reload (GET /api/v1/roadmap/my)...');
  const resReload = await fetch('http://localhost:5000/api/v1/roadmap/my', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const reloadData = await resReload.json();
  const loadedMilestone0 = reloadData.data?.milestones?.[0];
  console.log('Reloaded Milestone 0 state:', {
    title: loadedMilestone0?.title,
    status: loadedMilestone0?.status,
    progress: loadedMilestone0?.progress
  });

  const isPersisted = loadedMilestone0?.status === 'completed' || loadedMilestone0?.progress === 100;
  console.log(`\n- Verification: ${isPersisted ? 'PASS (Progress persisted and restored)' : 'FAIL'}`);

  console.log('\n================ AUDIT GAP 7 SUMMARY ================');
  console.log(`AI Roadmap Progress Persistence: ${isPersisted ? 'PASS' : 'FAIL'}`);
}

verifyRoadmapPersistence().catch(console.error);

