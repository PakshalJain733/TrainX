import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

async function testHiddenTestCaseLeakage() {
  console.log('================================================================');
  console.log('AUDIT GAP 8: Inspect API Responses for Hidden Test Case Leakage');
  console.log('================================================================');

  const secret = process.env.JWT_SECRET || 'test_jwt_secret_key_training_portal';
  const token = jwt.sign(
    { id: 1755, userId: 1755, email: 'ganesh@acadnexus.com', role: 'student' },
    secret,
    { expiresIn: '1h' }
  );

  // 1. Test POST /api/v1/code/evaluate (AI Roadmap Practice)
  console.log('\n--- 1. Testing POST /api/v1/code/evaluate ---');
  const evalPayload = {
    code: `class Solution:\n    def solve(self, n: int) -> int:\n        return n * 2`,
    language: 'python',
    function_name: 'solve',
    testCases: [
      { id: 101, input: '5', expected_output: '10', is_hidden: false },
      { id: 102, input: 'SECRET_HIDDEN_INPUT_999', expected_output: 'SECRET_HIDDEN_OUTPUT_999', is_hidden: true }
    ]
  };

  const evalRes = await fetch('http://localhost:5000/api/v1/code/evaluate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(evalPayload)
  });

  const evalData = await evalRes.json();
  console.log('Evaluate API HTTP Status:', evalRes.status);
  console.log('Evaluate API Response Body:\n', JSON.stringify(evalData, null, 2));

  const evalCases = evalData.data?.testCases || evalData.data?.results || [];
  let leakedInEval = false;
  for (const tc of evalCases) {
    if (tc.is_hidden) {
      if (tc.input !== undefined || tc.expected_output !== undefined || tc.actual_output !== undefined) {
        leakedInEval = true;
        console.error('LEAK DETECTED in evaluate API for hidden test case:', tc);
      }
    }
  }

  // Check if SECRET_HIDDEN string appears anywhere in raw response body
  const rawEvalStr = JSON.stringify(evalData);
  const secretLeakedInEval = rawEvalStr.includes('SECRET_HIDDEN_INPUT_999') || rawEvalStr.includes('SECRET_HIDDEN_OUTPUT_999');
  console.log(`- Hidden test cases masked in evaluate API: ${!leakedInEval ? 'PASS' : 'FAIL'}`);
  console.log(`- Secret string search in raw evaluate response: ${!secretLeakedInEval ? 'CLEAN (PASS)' : 'LEAK DETECTED (FAIL)'}`);

  // 2. Test POST /api/v1/code/submit (Practice Arena / Coding Tasks)
  console.log('\n--- 2. Testing POST /api/v1/code/submit ---');
  const submitPayload = {
    problem_id: 1,
    code: `class Solution:\n    def solve(self, n: int) -> int:\n        return n * 2`,
    language: 'python',
    source: 'practice',
    function_name: 'solve'
  };

  const submitRes = await fetch('http://localhost:5000/api/v1/code/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(submitPayload)
  });

  const submitData = await submitRes.json();
  console.log('Submit API HTTP Status:', submitRes.status);
  console.log('Submit API Response Body (Results slice):\n', JSON.stringify(submitData.data?.results || submitData.data || {}, null, 2));

  const submitCases = submitData.data?.results || [];
  let leakedInSubmit = false;
  for (const tc of submitCases) {
    if (tc.is_hidden) {
      if (tc.input !== undefined || tc.expected_output !== undefined || tc.actual_output !== undefined || tc.stderr !== undefined) {
        leakedInSubmit = true;
        console.error('LEAK DETECTED in submit API for hidden test case:', tc);
      }
    }
  }

  console.log(`- Hidden test cases masked in submit API: ${!leakedInSubmit ? 'PASS' : 'FAIL'}`);

  console.log('\n================ AUDIT GAP 8 SUMMARY ================');
  console.log(`Hidden Test Case Leakage in evaluate API: ${!secretLeakedInEval ? 'NO LEAKAGE (PASS)' : 'FAIL'}`);
  console.log(`Hidden Test Case Leakage in submit API: ${!leakedInSubmit ? 'NO LEAKAGE (PASS)' : 'FAIL'}`);
}

testHiddenTestCaseLeakage().catch(console.error);

