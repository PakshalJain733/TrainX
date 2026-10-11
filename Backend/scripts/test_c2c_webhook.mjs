import fetch from 'node-fetch';

const WEBHOOK_URL = process.env.TEST_WEBHOOK_URL || 'http://localhost:5000/api/v1/c2c/google-form/webhook';
const WEBHOOK_SECRET = 'TrainX_C2C_Webhook_Secret_Key_2026';

async function runTest() {
  console.log('----------------------------------------------------');
  console.log('Testing TrainX C2C Webhook Ingestion Pipeline...');
  console.log('Target URL:', WEBHOOK_URL);
  console.log('----------------------------------------------------');

  const testPayload = {
    source_response_id: 'test_resp_' + Date.now(),
    full_name: 'Rahul Sharma',
    email: 'rahul.sharma.test@pvppcoe.ac.in',
    mobile: '9820123456',
    roll_number: '2029CS105',
    college: 'PVPPCOE',
    branch: 'Computer Science',
    year: 'Third Year',
    division: 'A',
    batch: 'C2C 2029 - CS',
    amount_paid: 3500,
    utr_number: 'UTR' + Math.floor(100000000000 + Math.random() * 900000000000),
    payment_date: new Date().toISOString(),
    payment_proof_url: 'https://drive.google.com/file/d/test_proof_sample/view',
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-c2c-webhook-secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify(testPayload),
    });

    const body = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response Payload:', JSON.stringify(body, null, 2));

    if (res.ok && (res.status === 200 || res.status === 201)) {
      console.log('\n✅ WEBHOOK TEST PASSED: Student enrollment ingested into MySQL successfully!');
    } else {
      console.error('\n❌ WEBHOOK TEST FAILED:', body);
    }
  } catch (err) {
    console.error('\n❌ HTTP Request Error:', err.message);
  }
}

runTest();
