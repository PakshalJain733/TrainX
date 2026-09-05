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
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 Training Portal Backend Server running on port ${PORT}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error(`❌ Fatal Startup Error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
