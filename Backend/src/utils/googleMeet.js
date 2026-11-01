import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, '../../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../../token.json');

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email'
];

let google = null;

async function getGoogleApi() {
  if (google) return google;
  try {
    const mod = await import('googleapis');
    google = mod.google;
    return google;
  } catch (err) {
    console.warn('[Google API Warning] googleapis package is not installed or available:', err.message);
    return null;
  }
}

/**
 * Returns OAuth client credentials from environment variables or credentials.json
 */
function getClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://trainingportal.getflytechnologies.com/api/google/auth/callback';

  if (clientId && clientSecret) {
    return { client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, source: 'env' };
  }

  if (fs.existsSync(CREDENTIALS_PATH)) {
    try {
      const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      const conf = credentials.installed || credentials.web;
      if (conf) {
        return {
          client_id: conf.client_id,
          client_secret: conf.client_secret,
          redirect_uri: (conf.redirect_uris && conf.redirect_uris[0]) || redirectUri,
          source: 'credentials.json'
        };
      }
    } catch (e) {
      console.warn('Failed to parse credentials.json:', e.message);
    }
  }

  return null;
}

/**
 * Creates an OAuth2 client with optional custom redirect_uri
 */
async function createOAuthClient(customRedirectUri = null) {
  const g = await getGoogleApi();
  if (!g) return null;

  const conf = getClientConfig();
  if (!conf) return null;

  const redirectUri = customRedirectUri || conf.redirect_uri;
  return new g.auth.OAuth2(conf.client_id, conf.client_secret, redirectUri);
}

/**
 * Fetch OAuth token for a specific user (mentor/trainer) from database
 */
async function getUserOAuthToken(userId) {
  if (!userId) return null;
  try {
    const rows = await query(
      `SELECT user_id, provider, email, refresh_token, access_token, expiry_date 
       FROM user_oauth_tokens 
       WHERE user_id = ? AND provider = 'google' LIMIT 1`,
      [userId]
    );

    if (rows && rows.length > 0 && rows[0].refresh_token) {
      return rows[0];
    }

    // Fallback: check users table columns if populated
    const userRows = await query(
      `SELECT id, google_calendar_email, google_refresh_token FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );
    if (userRows && userRows.length > 0 && userRows[0].google_refresh_token) {
      return {
        user_id: userRows[0].id,
        email: userRows[0].google_calendar_email,
        refresh_token: userRows[0].google_refresh_token,
      };
    }
  } catch (err) {
    console.warn(`[getUserOAuthToken] Warning checking tokens for user ${userId}:`, err.message);
  }
  return null;
}

/**
 * Check if a specific user has connected their Google account
 */
async function isUserGoogleConfigured(userId) {
  const tokenRecord = await getUserOAuthToken(userId);
  return {
    connected: Boolean(tokenRecord && tokenRecord.refresh_token),
    email: tokenRecord?.email || null,
  };
}

/**
 * Save user's OAuth tokens to the database
 */
async function saveUserOAuthToken(userId, tokens, userEmail = null) {
  if (!userId || !tokens) return;
  const refreshToken = tokens.refresh_token || null;
  const accessToken = tokens.access_token || null;
  const expiryDate = tokens.expiry_date || null;

  try {
    // If we have an existing row, preserve existing refresh_token if new one was not returned
    const existing = await getUserOAuthToken(userId);
    const finalRefreshToken = refreshToken || existing?.refresh_token;

    await query(
      `INSERT INTO user_oauth_tokens (user_id, provider, email, refresh_token, access_token, expiry_date)
       VALUES (?, 'google', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         email = COALESCE(VALUES(email), email),
         refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
         access_token = VALUES(access_token),
         expiry_date = VALUES(expiry_date),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, userEmail || existing?.email || null, finalRefreshToken, accessToken, expiryDate]
    );

    if (finalRefreshToken) {
      try {
        await query(
          `UPDATE users SET google_calendar_email = ?, google_refresh_token = ? WHERE id = ?`,
          [userEmail || existing?.email || null, finalRefreshToken, userId]
        );
      } catch (_) {}
    }

    console.log(`[Google Auth] Successfully linked Google account for user ID: ${userId} (${userEmail || 'no email'})`);
  } catch (err) {
    console.error(`[saveUserOAuthToken] Error storing token for user ${userId}:`, err.message);
    throw err;
  }
}

/**
 * Disconnects a user's Google account
 */
async function disconnectUserOAuthToken(userId) {
  if (!userId) return;
  try {
    await query(`DELETE FROM user_oauth_tokens WHERE user_id = ? AND provider = 'google'`, [userId]);
    try {
      await query(
        `UPDATE users SET google_calendar_email = NULL, google_refresh_token = NULL WHERE id = ?`,
        [userId]
      );
    } catch (_) {}
    console.log(`[Google Auth] Disconnected Google account for user ID: ${userId}`);
  } catch (err) {
    console.error(`[disconnectUserOAuthToken] Error disconnecting user ${userId}:`, err.message);
    throw err;
  }
}

/**
 * Returns general configuration status (environment / system level)
 */
function isGoogleCalendarConfigured() {
  const conf = getClientConfig();
  const hasCredentials = Boolean(conf && conf.client_id && conf.client_secret);
  const hasToken = Boolean(process.env.GOOGLE_REFRESH_TOKEN || fs.existsSync(TOKEN_PATH));

  return {
    configured: hasCredentials,
    hasCredentials,
    hasSystemToken: hasToken,
    credentialSource: conf?.source || 'none',
  };
}

/**
 * Generates an authorization URL for a specific user to visit
 * Uses `state` to carry the mentor's user ID and return path
 */
async function getAuthUrl(stateData = {}) {
  const client = await createOAuthClient();
  if (!client) {
    throw new Error('Google OAuth credentials not configured in .env or credentials.json');
  }

  const encodedState = Buffer.from(JSON.stringify(stateData || {})).toString('base64');

  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: encodedState,
  });
}

/**
 * Exchanges authorization code for tokens and saves to specific user (or system fallback)
 */
async function handleAuthCallback(code, rawState = null) {
  const client = await createOAuthClient();
  if (!client) {
    throw new Error('OAuth2 client not initialized. Check your credentials in .env.');
  }

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  let stateObj = {};
  if (rawState) {
    try {
      stateObj = JSON.parse(Buffer.from(rawState, 'base64').toString('utf-8'));
    } catch (e) {
      console.warn('Could not parse OAuth state:', e.message);
    }
  }

  const userId = stateObj.userId ? parseInt(stateObj.userId, 10) : null;
  const returnTo = stateObj.returnTo || '/mentor/live-sessions';

  // Fetch authenticated Google user info (email)
  let googleEmail = null;
  try {
    const g = await getGoogleApi();
    const oauth2 = g.oauth2({ version: 'v2', auth: client });
    const userinfo = await oauth2.userinfo.get();
    googleEmail = userinfo?.data?.email || null;
  } catch (err) {
    console.warn('[Google Auth] Could not retrieve user profile email:', err.message);
  }

  if (userId) {
    await saveUserOAuthToken(userId, tokens, googleEmail);
  } else {
    // Save as system fallback
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
    console.log('[Google Auth] Saved system fallback token.json');
  }

  return { tokens, userId, googleEmail, returnTo };
}

/**
 * Initializes an OAuth client for a specific user or system
 */
async function getClientForUser(userId = null) {
  const g = await getGoogleApi();
  if (!g) return null;

  const conf = getClientConfig();
  if (!conf) return null;

  const client = new g.auth.OAuth2(conf.client_id, conf.client_secret, conf.redirect_uri);

  // 1. Try per-user token first if userId provided
  if (userId) {
    const userToken = await getUserOAuthToken(userId);
    if (userToken && userToken.refresh_token) {
      client.setCredentials({ refresh_token: userToken.refresh_token });
      return { client, userEmail: userToken.email, isUserAccount: true };
    }
  }

  // 2. Fallback to system env token
  if (process.env.GOOGLE_REFRESH_TOKEN) {
    client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
    return { client, userEmail: 'system', isUserAccount: false };
  }

  // 3. Fallback to token.json
  if (fs.existsSync(TOKEN_PATH)) {
    try {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      client.setCredentials(token);
      return { client, userEmail: 'system', isUserAccount: false };
    } catch (_) {}
  }

  return null;
}

/**
 * Generates a real Google Meet link using the specific mentor's Google Calendar
 */
async function generateRealGoogleMeetLink(summary = 'Mentorship Meeting', startDateTime = null, durationMinutes = 60, userId = null) {
  const clientInfo = await getClientForUser(userId);
  const g = await getGoogleApi();

  if (!g || !clientInfo) {
    throw new Error('Google Meet integration is not connected. Mentor needs to authorize their Google account.');
  }

  const { client, userEmail } = clientInfo;
  const calendar = g.calendar({ version: 'v3', auth: client });

  const start = startDateTime ? new Date(startDateTime) : new Date();
  const end = new Date(start.getTime() + (durationMinutes || 60) * 60 * 1000);

  const event = {
    summary: summary,
    description: `TrainX Live Mentorship Session: ${summary}`,
    start: {
      dateTime: start.toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: end.toISOString(),
      timeZone: 'Asia/Kolkata',
    },
    conferenceData: {
      createRequest: {
        requestId: Math.random().toString(36).substring(7) + Date.now().toString(36),
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    if (res.data && res.data.hangoutLink) {
      console.log(`[Google Meet] Real Google Meet generated via calendar ${userEmail}: ${res.data.hangoutLink}`);
      return res.data.hangoutLink;
    } else if (res.data && res.data.conferenceData?.entryPoints) {
      const meetEp = res.data.conferenceData.entryPoints.find((ep) => ep.entryPointType === 'video');
      if (meetEp?.uri) return meetEp.uri;
    }

    throw new Error('No hangoutLink returned by Google Calendar API');
  } catch (error) {
    console.error('[Google Meet] Error creating Google Meet event:', error.message);
    throw error;
  }
}

export {
  generateRealGoogleMeetLink,
  getAuthUrl,
  handleAuthCallback,
  getUserOAuthToken,
  isUserGoogleConfigured,
  saveUserOAuthToken,
  disconnectUserOAuthToken,
  isGoogleCalendarConfigured,
  createOAuthClient,
};
