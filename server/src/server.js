const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const { pool, testConnection } = require('./config/db');

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  // Check database connection
  const isConnected = await testConnection();
  if (!isConnected) {
    console.warn('Warning: MySQL database connection check failed.');
    console.warn('Make sure MySQL is running and DB_PASSWORD in server/.env is valid.');
  }

  // Start server
  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = async (signal) => {
    console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      console.log('[Server] HTTP listener closed.');
      try {
        await pool.end();
        console.log('[MySQL] Connection pool drained and closed.');
      } catch (err) {
        console.error('[MySQL] Error closing pool:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer();
