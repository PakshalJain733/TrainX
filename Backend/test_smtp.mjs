/**
 * Brevo Email / SMTP Test Script
 * --------------------------------
 * Reads credentials from Backend/.env and sends a test email
 * via the Brevo Transactional API — exactly the same path
 * your email.service.js uses in production.
 *
 * Run:  node test_smtp.mjs [recipient@email.com]
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 1. Load .env manually (no dotenv dependency needed) ──────────────────────
const envPath = resolve(__dirname, '.env');
let envVars = {};
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    envVars[key] = val;
  }
  console.log('✅  Loaded .env from:', envPath);
} catch (e) {
  console.error('❌  Could not read .env file:', e.message);
  process.exit(1);
}

// ── 2. Read and validate BREVO credentials ───────────────────────────────────
const apiKey      = (envVars.BREVO_API_KEY      || '').trim();
const senderEmail = (envVars.BREVO_SENDER_EMAIL || '').trim();
const senderName  = (envVars.BREVO_SENDER_NAME  || 'TrainX Test').trim();
const recipient   = process.argv[2] || senderEmail; // defaults to sender itself

console.log('\n── Brevo Configuration ─────────────────────────────────────────');
console.log('  API Key      :', apiKey ? `${apiKey.slice(0, 10)}...${apiKey.slice(-6)}  (length: ${apiKey.length})` : '❌  NOT SET');
console.log('  Sender Email :', senderEmail || '❌  NOT SET');
console.log('  Sender Name  :', senderName);
console.log('  Test Recipient:', recipient);
console.log('────────────────────────────────────────────────────────────────\n');

if (!apiKey) {
  console.error('❌  BREVO_API_KEY is missing in .env. Cannot send email.');
  process.exit(1);
}
if (!senderEmail) {
  console.error('❌  BREVO_SENDER_EMAIL is missing in .env. Cannot send email.');
  process.exit(1);
}

// ── 3. Send test email via Brevo Transactional HTTPS API ─────────────────────
const payload = {
  sender: { name: senderName, email: senderEmail },
  to: [{ email: recipient }],
  subject: 'TrainX — SMTP / Brevo Test Email',
  htmlContent: `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;background:#f9fafb">
      <h2 style="color:#4f46e5;margin-top:0">Brevo Email Test</h2>
      <p style="color:#374151">This is a <strong>test email</strong> sent from your <em>TrainX Campus Training Portal</em> backend.</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
      <table style="width:100%;font-size:13px;color:#6b7280">
        <tr><td><strong>Timestamp</strong></td><td>${new Date().toISOString()}</td></tr>
        <tr><td><strong>Sender</strong></td><td>${senderEmail}</td></tr>
        <tr><td><strong>API Key</strong></td><td>${apiKey.slice(0, 10)}...${apiKey.slice(-6)}</td></tr>
      </table>
      <p style="margin-top:24px;color:#22c55e;font-weight:bold">If you received this, your Brevo email service is working correctly!</p>
    </div>
  `,
};

console.log('Sending test email to:', recipient, '...\n');

try {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}

  if (res.ok) {
    console.log('SUCCESS! Email sent via Brevo API.');
    console.log('   Status    :', res.status, res.statusText);
    console.log('   Message ID:', data.messageId || '(not returned)');
    console.log('\nYour SMTP / Brevo email service is working correctly!');
  } else {
    console.error('FAILED — Brevo API returned an error:');
    console.error('   HTTP Status :', res.status, res.statusText);
    console.error('   Error Body  :', JSON.stringify(data, null, 2));
    console.error('\nCommon causes:');
    console.error('   - Invalid or expired BREVO_API_KEY');
    console.error('   - Sender email not verified in Brevo dashboard');
    console.error('   - Account suspended or plan limit reached');
  }
} catch (err) {
  console.error('Network error — could not reach Brevo API:');
  console.error('  ', err.message);
  console.error('\nCommon causes:');
  console.error('   - No internet connection');
  console.error('   - Firewall blocking outbound HTTPS to api.brevo.com');
}
