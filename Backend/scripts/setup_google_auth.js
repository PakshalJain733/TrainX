import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import readline from 'readline';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar'
];

function cleanCode(rawInput) {
  if (!rawInput) return '';
  let str = String(rawInput).trim();
  if (str.includes('code=')) {
    try {
      const match = str.match(/[?&]code=([^&]+)/);
      if (match && match[1]) {
        str = decodeURIComponent(match[1]);
      }
    } catch (_) {}
  }
  return str;
}

function getCredentials() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'https://trainingportal.getflytechnologies.com/api/google/auth/callback',
      source: '.env'
    };
  }

  if (fs.existsSync(CREDENTIALS_PATH)) {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    const conf = credentials.installed || credentials.web;
    if (conf) {
      return {
        client_id: conf.client_id,
        client_secret: conf.client_secret,
        redirect_uri: (conf.redirect_uris && conf.redirect_uris[0]) || 'https://trainingportal.getflytechnologies.com/api/google/auth/callback',
        source: 'credentials.json'
      };
    }
  }

  return null;
}

function startAuth() {
  const creds = getCredentials();
  if (!creds) {
    console.log('\n[ERROR] Google OAuth credentials not found in .env or credentials.json.');
    console.log('Set GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET in Backend/.env, or save credentials.json in Backend/.\n');
    process.exit(1);
  }

  console.log(`[Google Auth] Loaded credentials from ${creds.source}`);
  const oAuth2Client = new google.auth.OAuth2(creds.client_id, creds.client_secret, creds.redirect_uri);

  if (process.env.GOOGLE_REFRESH_TOKEN) {
    console.log('[Google Auth] GOOGLE_REFRESH_TOKEN is already defined in .env.');
  }

  if (fs.existsSync(TOKEN_PATH)) {
    console.log(`[Google Auth] Token already exists at ${TOKEN_PATH}`);
  }

  getAccessToken(oAuth2Client);
}

function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('\n======================================================');
  console.log('Authorize this app by visiting this URL in your browser:');
  console.log(authUrl);
  console.log('======================================================\n');

  const argCode = process.argv[2];
  if (argCode) {
    const code = cleanCode(argCode);
    exchangeCode(oAuth2Client, code);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Paste the authorization code (or the full redirected URL) here: ', (input) => {
    rl.close();
    const code = cleanCode(input);
    exchangeCode(oAuth2Client, code);
  });
}

function exchangeCode(oAuth2Client, code) {
  oAuth2Client.getToken(code, (err, token) => {
    if (err) {
      return console.error('\n[Error retrieving access token]:', err.message || err);
    }
    oAuth2Client.setCredentials(token);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), 'utf-8');
    console.log('\n[SUCCESS] Token stored to', TOKEN_PATH);
    if (token.refresh_token) {
      console.log('\n[OPTIONAL BEST PRACTICE]:');
      console.log('You can also add this refresh token to your Backend/.env file:');
      console.log(`GOOGLE_REFRESH_TOKEN=${token.refresh_token}\n`);
    }
    console.log('Google Meet link generation is now fully active!');
  });
}

startAuth();
