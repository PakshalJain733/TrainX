module.exports = {
  apps: [
    {
      name: 'training-portal-backend',
      script: 'server.js',
      // Cluster mode creates 1 worker per CPU core to handle 500+ concurrent requests
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Automatically restart a worker if memory leaks beyond 800MB
      max_memory_restart: '800M',
      // Graceful reload timeout
      kill_timeout: 5000,
      listen_timeout: 10000,
      autorestart: true,
      watch: false,
    },
  ],
};

