import dns from 'dns';

// Ensure IPv4 address resolution takes precedence over IPv6 across all Node.js outbound connections
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

import express from 'express';
import cors from 'cors';
import { corsMiddleware } from './config/cors.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import adminRoutes from './routes/admin.routes.js';
import collegeRoutes from './routes/college.routes.js';
import trainingRoutes from './routes/training.routes.js';
import assessmentRoutes from './routes/assessment.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import milestoneRoutes from './routes/milestone.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import roadmapRoutes from './routes/roadmap.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import skillGapRoutes from './routes/skillGap.routes.js';
import interventionRoutes from './routes/intervention.routes.js';
import driveRoutes from './routes/drive.routes.js';
import reportRoutes from './routes/report.routes.js';
import departmentRoutes from './routes/department.routes.js';
import batchRoutes from './routes/batch.routes.js';
import sharedContentRoutes from './routes/sharedContent.routes.js';
import secureCodeRoutes from './routes/secureCode.routes.js';
import codingRoutes from './routes/coding.routes.js';
import codingSubmissionRoutes from './routes/codingSubmission.routes.js';
import mentorRoutes from './routes/mentor.routes.js';
import coordinatorRoutes from './routes/coordinator.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import c2cRoutes from './routes/c2c.routes.js';
import featureSwitchRoutes from './routes/featureSwitch.routes.js';
import systemHealthRoutes from './routes/systemHealth.routes.js';
import googleAuthRoutes from './routes/googleAuth.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import retakeRoutes from './routes/retake.routes.js';
import careerGatewayRoutes from './modules/integrations/careerGateway/careerGateway.routes.js';
import { apiMetricsMiddleware } from './services/systemMetrics.service.js';

import { errorHandler } from './middleware/error.middleware.js';
import { sendSuccess, sendError } from './utils/response.js';
import { pool } from './config/db.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust reverse proxy (Nginx / Cloudflare) so req.ip and rate limiting work correctly
app.set('trust proxy', 1);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const nodeEnv = process.env.NODE_ENV || 'development';

// ============================================================================
// Authoritative Centralized CORS Middleware (All Routes, Preflights & Methods)
// ============================================================================
app.use(corsMiddleware);

// HTTP Payload Compression (Gzip / Brotli) - reduces network payload by 70%+
app.use(compression());

// Production Security Headers via Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Allows Vite HMR, custom CDNs, and Google Fonts
    frameguard: { action: 'sameorigin' }, // Clickjacking protection (same-site previews permitted)
    xContentTypeOptions: true, // MIME-sniffing protection enabled
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: nodeEnv === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiMetricsMiddleware);

// Security Rate Limiters (skip preflight OPTIONS and preserve CORS headers on 429)
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: nodeEnv === 'production' ? 120 : 2000, // Rate limit for authentication attempts (per IP/identifier)
  keyGenerator: (req) => {
    // Key by email/token when available so students on shared campus IP don't lock each other out
    const identifier = req.body?.email || req.body?.mobile || req.body?.identifier || (req.headers.authorization ? req.headers.authorization.slice(-16) : req.ip);
    return String(identifier || req.ip).toLowerCase().trim();
  },
  validate: { default: false, xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Never rate limit GET, HEAD, or OPTIONS requests (e.g. /auth/me, /colleges, /broadcast)
    if (req.method === 'OPTIONS' || req.method === 'GET' || req.method === 'HEAD') return true;
    const url = req.originalUrl || req.path || '';
    // Only throttle actual authentication attempt endpoints
    const isAuthAttempt = /\/(login|login-password|send-otp|verify-otp|verify-email-otp|reset-password-otp|register\/send-otp)/i.test(url);
    return !isAuthAttempt;
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: 'Too many authentication attempts. Please try again after 10 minutes.',
    });
  },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each client IP to 500 AI operations per windowMs
  validate: { default: false, xForwardedForHeader: false },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: 'AI rate limit reached. Please wait a few moments before trying again.',
    });
  },
});

// HTML escaping helper to prevent Reflected XSS
const escapeHtml = (unsafeStr) => {
  return String(unsafeStr || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Serve uploaded files statically with path resolution fallback
const uploadPaths = [
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(__dirname, '../uploads'),
  path.resolve(__dirname, '../../uploads'),
];

const handleUploadsFile = (req, res, next) => {
  const rawFilename = req.params.filename || req.params[0];
  if (!rawFilename) return next();

  // Prevent path traversal attacks
  const filename = path.basename(rawFilename);

  for (const uploadDir of uploadPaths) {
    const fullPath = path.join(uploadDir, filename);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return res.sendFile(fullPath);
    }
  }

  // If API / JSON client, return standard 404 JSON response
  if (req.accepts('json') && !req.accepts('html')) {
    return res.status(404).json({
      success: false,
      message: 'The requested document or uploaded file was not found.',
      filename,
    });
  }

  // For browser navigation, return a sanitized HTML notice page (XSS safe)
  const safeFilename = escapeHtml(filename);
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document File Notice</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
        .card { background: #1e293b; border: 1.5px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3); }
        .icon { width: 56px; height: 56px; border-radius: 50%; background: #312e81; color: #818cf8; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; font-size: 24px; font-weight: bold; }
        h2 { font-size: 20px; margin: 0 0 8px 0; color: #ffffff; }
        p { font-size: 14px; color: #94a3b8; line-height: 1.5; margin: 0 0 20px 0; }
        .badge { display: inline-block; background: #334155; color: #cbd5e1; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">📄</div>
        <h2>Document Unavailable</h2>
        <p>The uploaded file is not stored on local disk or has been replaced. Please re-upload the document or select an active file.</p>
        <div class="badge">${safeFilename}</div>
      </div>
    </body>
    </html>
  `);
};

uploadPaths.forEach((p) => {
  if (fs.existsSync(p)) {
    app.use('/uploads', express.static(p));
    app.use('/api/v1/uploads', express.static(p));
    app.use('/api/uploads', express.static(p));
  }
});

app.get('/uploads/:filename', handleUploadsFile);
app.get('/api/v1/uploads/:filename', handleUploadsFile);
app.get('/api/uploads/:filename', handleUploadsFile);

// Mount Health & System Monitoring Routes
app.use('/api/v1/health', systemHealthRoutes);
app.use('/api/health', systemHealthRoutes);
app.use('/api/v1/admin/system-health', systemHealthRoutes);
app.use('/api/admin/system-health', systemHealthRoutes);
app.use('/api/v1/system/health', systemHealthRoutes);
app.use('/api/v1/system-health', systemHealthRoutes);
app.use('/api/v1/system', systemHealthRoutes);
app.use('/api/system/health', systemHealthRoutes);

// Mount Module Routes under /api/v1 (Section 11)
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/practice-problems', studentRoutes);
app.use('/api/practice-problems', studentRoutes);
app.use('/api/v1/users', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/colleges', collegeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/v1/trainings', trainingRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/milestones', milestoneRoutes);
app.use('/api/v1/milestone', milestoneRoutes);
app.use('/api/v1/leaderboards', leaderboardRoutes);
app.use('/api/v1/leaderboard', leaderboardRoutes);
app.use('/api/v1/roadmaps', aiLimiter, roadmapRoutes);
app.use('/api/v1/roadmap', aiLimiter, roadmapRoutes);
app.use('/api/v1/interviews', aiLimiter, interviewRoutes);
app.use('/api/v1/skill-gaps', skillGapRoutes);
app.use('/api/v1/skill-gap', skillGapRoutes);
app.use('/api/v1/interventions', interventionRoutes);
app.use('/api/v1/drives', driveRoutes);
app.use('/api/v1/mock-drives', driveRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/shared-content', sharedContentRoutes);
app.use('/api/v1/secure-codes', authLimiter, secureCodeRoutes);
app.use('/api/v1/code', codingRoutes);
app.use('/api/v1/coding', codingRoutes);
app.use('/api/v1/coding-submissions', codingSubmissionRoutes);
app.use('/api/v1/mentor', mentorRoutes);
app.use('/api/v1/coordinator', coordinatorRoutes);
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/c2c', c2cRoutes);
app.use('/api/v1/admin/c2c', c2cRoutes);
app.use('/api/v1/feature-switches', featureSwitchRoutes);
app.use('/api/v1/maintenance', featureSwitchRoutes);
app.use('/api/v1/retakes', retakeRoutes);
app.use('/api/retakes', retakeRoutes);
app.use('/api/google/auth', googleAuthRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/notification', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/v1/google/auth', googleAuthRoutes);
app.use('/api/integrations/career-gateway', careerGatewayRoutes);
app.use('/api/v1/integrations/career-gateway', careerGatewayRoutes);
app.use('/api/career-gateway', careerGatewayRoutes);
app.use('/api/v1/career-gateway', careerGatewayRoutes);
app.use('/integrations/career-gateway', careerGatewayRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  console.log(`[TrainX 404 Debug] Unmatched incoming request: ${req.method} ${req.originalUrl}`);
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
});

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
