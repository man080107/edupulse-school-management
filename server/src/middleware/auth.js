const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Middleware to authenticate JWT token
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required. Please log in.',
      });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_school_management_2026_secure';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session. Please log in again.',
      });
    }

    // Verify user in database
    const [users] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.status, t.id AS teacher_id, t.employee_id
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE u.id = ?`,
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const user = users[0];
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'User account has been deactivated. Please contact the administrator.',
      });
    }

    // Attach user information to request object
    req.user = {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      teacherId: user.teacher_id || null,
      employeeId: user.employee_id || null,
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.',
    });
  }
}

// Middleware for Role-Based Authorization
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthenticated. Access denied.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] role. Your role is '${req.user.role}'.`,
      });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles,
};
