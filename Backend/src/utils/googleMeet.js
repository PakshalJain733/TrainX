const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// To use this, you MUST download your OAuth 2.0 Client credentials from Google Cloud Console
// and save them as 'credentials.json' in the Backend root directory.
const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');

let oAuth2Client;

try {
  if (fs.existsSync(CREDENTIALS_PATH)) {
    const content = fs.readFileSync(CREDENTIALS_PATH);
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0] || 'http://localhost:3000');
    
    if (fs.existsSync(TOKEN_PATH)) {
      const token = fs.readFileSync(TOKEN_PATH);
      oAuth2Client.setCredentials(JSON.parse(token));
    }
  }
} catch (error) {
  console.warn('Google API Credentials not loaded:', error.message);
}

/**
 * Generates a real Google Meet link using Google Calendar API
 */
async function generateRealGoogleMeetLink(summary = 'Mentorship Meeting') {
  if (!oAuth2Client || !fs.existsSync(TOKEN_PATH)) {
    throw new Error('Google OAuth2 credentials not fully configured.');
  }

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  
  const event = {
    summary: summary,
    start: {
      dateTime: new Date().toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: new Date(Date.now() + 3600000).toISOString(), // +1 hour
      timeZone: 'Asia/Kolkata',
    },
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(36).substring(7),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });
    
    if (res.data && res.data.hangoutLink) {
      return res.data.hangoutLink;
    } else {
      throw new Error('Failed to generate Google Meet link from Google Calendar response');
    }
  } catch (error) {
    console.error('Error creating Google Meet event:', error);
    throw error;
  }
}

module.exports = {
  generateRealGoogleMeetLink,
  oAuth2Client
};
