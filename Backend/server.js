import app from './src/app.js';
import { config } from './src/config/env.js';
import { checkDatabaseConnection } from './src/config/db.js';
import { initializeDatabase } from './src/config/init_db.js';

const startServer = async () => {
  try {
    // Check DB connection and auto-initialize tables on startup
    await checkDatabaseConnection();
    await initializeDatabase();


    const PORT = config.port;
    const server = app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 Training Portal Backend Server running on port ${PORT}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
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
