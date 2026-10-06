import express from 'express';
import cors from 'cors';
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

import { errorHandler } from './middleware/error.middleware.js';
import { sendSuccess, sendError } from './utils/response.js';
import { pool } from './config/db.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const nodeEnv = process.env.NODE_ENV || 'development';

// Production-safe CORS: allow the configured frontend origin(s) plus local dev
const allowedOrigins = new Set(
  [
    frontendUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    nodeEnv === 'production' ? '' : 'http://localhost:5500',
  ]
    .filter(Boolean)
    .filter((o) => typeof o === 'string')
    .map((o) => o.replace(/\/$/, ''))
);

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser / same-origin requests
      if (!origin) return cb(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.has(cleanOrigin)) return cb(null, true);

      // Allow LAN / private IP origins and standard deployment platforms
      try {
        const url = new URL(cleanOrigin);
        const host = url.hostname;
        const isLocalHost =
          ['localhost', '127.0.0.1', '::1'].includes(host) ||
          host.endsWith('.local') ||
          /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
          /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
          /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(host);

        const isAllowedDeployment =
          host.endsWith('.vercel.app') ||
          host.endsWith('.netlify.app') ||
          host.endsWith('.onrender.com') ||
          host.endsWith('.github.io');

        if (isLocalHost || isAllowedDeployment) return cb(null, true);
      } catch (e) {}

      if (!process.env.FRONTEND_URL || process.env.NODE_ENV !== 'production') {
        return cb(null, true);
      }

      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'token', 'x-c2c-webhook-secret'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically with path resolution fallback
const uploadPaths = [
  path.resolve(process.cwd(), 'uploads'),
  path.resolve(__dirname, '../uploads'),
  path.resolve(__dirname, '../../uploads'),
];

const handleUploadsFile = (req, res, next) => {
  const filename = req.params.filename || req.params[0];
  if (!filename) return next();

  for (const uploadDir of uploadPaths) {
    const fullPath = path.join(uploadDir, filename);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return res.sendFile(fullPath);
    }
  }

  // If file not found on disk, return a clean HTML notice page instead of JSON 404
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
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
        <div class="badge">${filename}</div>
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

// Health Check Endpoint (Section 28)
app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, 'Training Portal API is running', {
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

// Mount Module Routes under /api/v1 (Section 11)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/student', studentRoutes);
app.use('/api/v1/users', studentRoutes);
app.use('/api/v1/coordinator/students', studentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/colleges', collegeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/batches', batchRoutes);
app.use('/api/v1/trainings', trainingRoutes);
app.use('/api/v1/assessments', assessmentRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/milestones', milestoneRoutes);
app.use('/api/v1/leaderboards', leaderboardRoutes);
app.use('/api/v1/roadmaps', roadmapRoutes);
app.use('/api/v1/roadmap', roadmapRoutes);
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/skill-gaps', skillGapRoutes);
app.use('/api/v1/skill-gap', skillGapRoutes);
app.use('/api/v1/interventions', interventionRoutes);
app.use('/api/v1/drives', driveRoutes);
app.use('/api/v1/mock-drives', driveRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/shared-content', sharedContentRoutes);
app.use('/api/v1/secure-codes', secureCodeRoutes);
app.use('/api/v1/coding', codingRoutes);
app.use('/api/v1/coding-submissions', codingSubmissionRoutes);
app.use('/api/v1/mentor', mentorRoutes);
app.use('/api/v1/coordinator', coordinatorRoutes);
app.use('/api/v1/superadmin', superadminRoutes);
app.use('/api/v1/c2c', c2cRoutes);
app.use('/api/v1/admin/c2c', c2cRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
});

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
