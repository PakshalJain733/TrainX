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
import { errorHandler } from './middleware/error.middleware.js';
import { sendSuccess, sendError } from './utils/response.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint (Section 28)
app.get('/api/v1/health', (req, res) => {
  return sendSuccess(res, 'Training Portal API is running', {
    status: 'healthy',
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
app.use('/api/v1/interventions', interventionRoutes);
app.use('/api/v1/drives', driveRoutes);
app.use('/api/v1/reports', reportRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  return sendError(res, `Route not found: ${req.originalUrl}`, 404);
});

// Global Error Handling Middleware
app.use(errorHandler);

export default app;
