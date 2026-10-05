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
    await checkDatabaseConnection();
    await initializeDatabase();


    const PORT = process.env.PORT || 5000;
    const NODE_ENV = process.env.NODE_ENV || 'development';
    const server = http.createServer(app);

    initInterviewSocket(server);

    server.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 Training Portal Backend Server running on port ${PORT}`);
      console.log(`📡 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`🔌 Socket.IO interview namespace: /interviews`);
      console.log(`==================================================`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use by another process.`);
      } else {
        console.error(`❌ Server error: ${err.message}`);
      }
    });
  } catch (error) {
    console.error(`❌ Fatal Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
