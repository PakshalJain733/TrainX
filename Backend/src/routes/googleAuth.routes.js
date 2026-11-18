import express from 'express';
import {
  getAuthUrl,
  handleAuthCallback,
  isUserGoogleConfigured,
  disconnectUserOAuthToken,
  isGoogleCalendarConfigured
} from '../utils/googleMeet.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

const escapeHtml = (unsafeStr) => {
  return String(unsafeStr || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const sanitizeReturnTo = (url) => {
  if (!url || typeof url !== 'string') return '/mentor/live-sessions';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\') && !trimmed.includes(':')) {
    return trimmed;
  }
  return '/mentor/live-sessions';
};

/**
 * GET /status
 * Checks system-level configuration
 */
router.get('/status', (req, res) => {
  try {
    const status = isGoogleCalendarConfigured();
    return res.json({
      success: true,
      ...status,
      message: status.hasCredentials
        ? 'Google OAuth credentials are configured in .env'
        : 'Google OAuth credentials are missing from .env'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /user-status
 * Checks if the current authenticated user has connected their Google account
 */
router.get('/user-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const status = await isUserGoogleConfigured(userId);
    return res.json({
      success: true,
      connected: status.connected,
      email: status.email,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /disconnect
 * Disconnects the authenticated user's Google account
 */
router.post('/disconnect', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    await disconnectUserOAuthToken(userId);
    return res.json({
      success: true,
      message: 'Google account disconnected successfully'
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /login
 * Redirects user to Google consent screen, carrying userId in state
 */
router.get('/login', async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const returnTo = sanitizeReturnTo(req.query.returnTo);

    const url = await getAuthUrl({ userId, returnTo });
    return res.redirect(url);
  } catch (err) {
    const safeMsg = escapeHtml(err.message);
    return res.status(500).send(`
      <html>
        <body style="font-family: sans-serif; padding: 40px; text-align: center;">
          <h2 style="color: #ef4444;">Failed to start Google Authorization</h2>
          <p>${safeMsg}</p>
        </body>
      </html>
    `);
  }
});

/**
 * GET /callback
 * Google redirects here with authorization code
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    const safeError = escapeHtml(error);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Google Authorization Failed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); max-width: 480px; text-align: center; }
          h2 { color: #dc2626; margin-top: 0; }
          p { color: #475569; font-size: 15px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Authorization Cancelled</h2>
          <p>Google authorization was not completed: <strong>${safeError}</strong></p>
          <a href="/mentor/live-sessions" style="display:inline-block; margin-top:16px; padding: 10px 20px; background:#4f46e5; color:white; border-radius:8px; text-decoration:none;">Return to Portal</a>
        </div>
      </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  try {
    const result = await handleAuthCallback(code, state);
    const returnTo = sanitizeReturnTo(result.returnTo);
    const emailParam = result.googleEmail ? `&email=${encodeURIComponent(result.googleEmail)}` : '';

    // If request has returnTo, redirect directly back to the mentor's portal page
    const redirectUrl = `${returnTo}${returnTo.includes('?') ? '&' : '?'}google_connected=true${emailParam}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error('Error exchanging Google OAuth code:', err);
    const safeErrMsg = escapeHtml(err.message);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Token Exchange Failed</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #fff1f2; }
          .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); max-width: 520px; text-align: center; }
          h2 { color: #e11d48; margin-top: 0; }
          p { color: #475569; font-size: 14px; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Failed to Connect Google Account</h2>
          <p>${safeErrMsg}</p>
          <a href="/mentor/live-sessions" style="display:inline-block; margin-top:16px; padding: 10px 20px; background:#2563eb; color:white; border-radius:8px; text-decoration:none;">Back to Portal</a>
        </div>
      </body>
      </html>
    `);
  }
});

export default router;
