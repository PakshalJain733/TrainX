import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

async function testRoadmapPersistenceWithUser6() {
  console.log('================================================================');
  console.log('AUDIT GAP 7: Roadmap Persistence with User 6 (Existing Roadmaps)');
  console.log('================================================================');

  const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_training_portal';
  const token = jwt.sign(
    { id: 6, userId: 6, email: 'vu3f2425047@pvppcoe.ac.in', role: 'student' },
    secret,
    { expiresIn: '1h' }
  );

  // 1. Fetch current roadmap for User 6
  console.log('Fetching roadmap for Student 6...');
  const res1 = await fetch('http://localhost:5000/api/v1/roadmap/my', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data1 = await res1.json();
  console.log('Fetch status:', res1.status);
  console.log('Roadmap ID:', data1.data?.id);
  console.log('Roadmap target role:', data1.data?.targetRole);
  console.log('Milestones count:', data1.data?.milestones?.length);

  if (data1.data?.milestones?.length > 0) {
    console.log('First milestone initial state:', {
      title: data1.data.milestones[0].title,
      status: data1.data.milestones[0].status,
      progress: data1.data.milestones[0].progress
    });

    // 2. Update progress
    const updatedMilestones = [...data1.data.milestones];
    updatedMilestones[0] = {
      ...updatedMilestones[0],
      progress: 100,
      status: 'completed',
      score: 95
    };

    console.log('Saving updated milestone progress...');
    const saveRes = await fetch(`http://localhost:5000/api/v1/roadmap/${data1.data.id}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        milestones: updatedMilestones
      })
    });
    const saveData = await saveRes.json();
    console.log('Save response HTTP:', saveRes.status, 'success:', saveData.success);

    // 3. Re-fetch in a completely new request (simulating logout/login/refresh)
    console.log('Re-fetching roadmap in fresh request...');
    const res2 = await fetch('http://localhost:5000/api/v1/roadmap/my', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data2 = await res2.json();
    const reloadedM0 = data2.data?.milestones?.[0];
    console.log('Reloaded first milestone:', {
      title: reloadedM0?.title,
      status: reloadedM0?.status,
      progress: reloadedM0?.progress
    });

    const passed = reloadedM0?.status === 'completed' || reloadedM0?.progress === 100;
    console.log('Verification:', passed ? 'PASS' : 'FAIL');
  } else {
    console.log('User 6 has no milestones in returned roadmap.');
  }
}

testRoadmapPersistenceWithUser6().catch(console.error);

