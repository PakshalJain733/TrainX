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
import { errorHandler } from './middleware/error.middleware.js';
import { sendSuccess, sendError } from './utils/response.js';
import { config } from './config/env.js';
import { pool } from './config/db.js';

import path from 'path';

const app = express();

// Production-safe CORS: allow the configured frontend origin(s) plus local dev
const allowedOrigins = new Set(
  [
    config.frontendUrl,
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    config.nodeEnv === 'production' ? '' : 'http://localhost:5500',
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
      if (config.nodeEnv !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?$/.test(cleanOrigin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token', 'token'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  // Global handler: mirror the CORS allowlist.
  const origin = req.headers.origin;
  const cleanOrigin = origin ? String(origin).replace(/\/$/, '') : '';
  const isAllowed = !origin || allowedOrigins.has(cleanOrigin) || (config.nodeEnv !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?$/.test(cleanOrigin));
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-access-token, token');
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health Check Endpoint (Section 28)
app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await pool.query('SELECT 1');
    dbStatus = 'connected';
  } catch {
    dbStatus = 'unreachable';
  }
  return sendSuccess(res, 'Training Portal API is running', {
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Mount Module Routes under /api/v1 (Section 11)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/student', studentRoutes);
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
app.use('/api/v1/interviews', interviewRoutes);
app.use('/api/v1/skill-gaps', skillGapRoutes);
app.use('/api/v1/skill-gap', skillGapRoutes);
app.use('/api/v1/interventions', interventionRoutes);
app.use('/api/v1/drives', driveRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/shared-content', sharedContentRoutes);
app.use('/api/v1/secure-codes', secureCodeRoutes);
app.use('/api/v1/code', codingRoutes);
app.use('/api/v1/coding-submissions', codingSubmissionRoutes);
app.use('/api/v1/mentor', mentorRoutes);
app.use('/api/v1/coordinator', coordinatorRoutes);
app.use('/api/v1/superadmin', superadminRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
});

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
