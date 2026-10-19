import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

async function test() {
  const token = jwt.sign(
    { userId: 30, id: 30, email: 'ganeshvshinde2006@gmail.com', role: 'student', collegeId: 1 },
    process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-this-in-production',
    { expiresIn: '7d' }
  );

  const testCodes = ['CSE-ALPH', 'BATCH-2', 'BECS-FAST', 'PYSH-MTQZ', 'CSE 2026 Alpha Cohort'];
  for (const c of testCodes) {
    const res = await fetch('http://localhost:5000/api/v1/batches/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ join_code: c })
    });
    const data = await res.json();
    console.log(`Code '${c}': status ${res.status}, success: ${data.success}, message: ${data.message}`);
  }

  // Also test /api/batches/my-batches
  const myBatchesRes = await fetch('http://localhost:5000/api/batches/my-batches', {
    headers: { Authorization: 'Bearer ' + token }
  });
  const myBatchesData = await myBatchesRes.json();
  console.log('my-batches count for user 30:', myBatchesData.data?.length);
}

test().catch(console.error);
