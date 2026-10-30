import 'dotenv/config';
import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import app from './src/app.js';
import { checkDatabaseConnection } from './src/config/db.js';
import { initializeDatabase } from './src/config/init_db.js';
import { initInterviewSocket } from './src/socket/interview.socket.js';
import http from 'node:http';

const startServer = async () => {
  try {
    // Check DB connection and auto-initialize tables on startup
    try {
      await checkDatabaseConnection();
      await initializeDatabase();
    } catch (dbErr) {
      console.error('Initial database connection warning:', dbErr.message);
      console.log('Server will continue starting to serve CORS and health check endpoints. Retrying DB in background...');
      setTimeout(async () => {
        try {
          await checkDatabaseConnection();
          await initializeDatabase();
          console.log('Background database initialization succeeded.');
        } catch (retryErr) {
          console.error('Background DB retry error:', retryErr.message);
        }
      }, 5000);
    }

    // Trigger reload: 2026-10-19
    const PORT = process.env.PORT || 5000;
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const server = http.createServer(app);

    initInterviewSocket(server);

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`==================================================`);
      console.log(`Training Portal Backend Server running on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`Socket.IO interview namespace: /interviews`);
      console.log(`==================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use by another process.`);
      } else {
        console.error(`Server error: ${err.message}`);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[Unhandled Rejection at]:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('[Uncaught Exception]:', err);
    });
  } catch (error) {
    console.error(`Fatal Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();

