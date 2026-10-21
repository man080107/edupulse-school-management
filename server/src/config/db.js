const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Create a connection pool for efficient reuse of connections
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'school_management_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  timezone: 'Z',
});

// Test connection function
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[MySQL] ✅ Connected successfully to database: ${process.env.DB_NAME || 'school_management_db'}`);
    connection.release();
    return true;
  } catch (err) {
    console.error(`[MySQL] ❌ Connection failed: ${err.message}`);
    console.error('[MySQL] ⚠️ Ensure MySQL server is running and check DB credentials in server/.env');
    return false;
  }
}

// Transaction wrapper helper
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  testConnection,
  withTransaction,
};
