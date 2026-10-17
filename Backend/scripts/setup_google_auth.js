import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The file token.json stores the user's access and refresh tokens
const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');

// Scopes required for creating Google Calendar events (and Meet links)
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0] || 'http://localhost:3000');

  // Check if we have previously stored a token.
  if (fs.existsSync(TOKEN_PATH)) {
    console.log(`Token already exists at ${TOKEN_PATH}`);
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  } else {
    getAccessToken(oAuth2Client, callback);
  }
}

function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('\n======================================================');
  console.log('Authorize this app by visiting this url:');
  console.log(authUrl);
  console.log('======================================================\n');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
      console.log('Token stored to', TOKEN_PATH);
      callback(oAuth2Client);
    });
  });
}

// Load client secrets from a local file.
if (fs.existsSync(CREDENTIALS_PATH)) {
  const content = fs.readFileSync(CREDENTIALS_PATH);
  authorize(JSON.parse(content), () => {
    console.log('Authorization successful! The backend can now generate Google Meet links automatically.');
  });
} else {
  console.log(`\nERROR: credentials.json not found at ${CREDENTIALS_PATH}`);
  console.log('Please download your OAuth 2.0 Client credentials from Google Cloud Console and save them as credentials.json in the Backend directory.\n');
}
