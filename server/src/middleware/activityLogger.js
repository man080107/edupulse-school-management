const { pool } = require('../config/db');

async function logActivity(userId, action, details, ipAddress = '127.0.0.1') {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address)
       VALUES (?, ?, ?, ?)`,
      [userId || null, action, details || '', ipAddress]
    );
  } catch (err) {
    // Audit logging should not crash the main flow
    console.error('[ActivityLogger Error]:', err.message);
  }
}

module.exports = { logActivity };
