const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_school_management_2026_secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// User Login Controller
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Query user record by email
    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.phone, u.status,
              t.id AS teacher_id, t.employee_id
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE LOWER(u.email) = LOWER(?)`,
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const user = rows[0];

    // Check account status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    // Compare bcrypt password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Audit log
    await logActivity(
      user.id,
      'USER_LOGIN',
      `User ${user.full_name} (${user.role}) logged in successfully.`,
      req.ip
    );

    // Return sanitized user object (never return password hash)
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone,
        teacherId: user.teacher_id || null,
        employeeId: user.employee_id || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get Current User Profile
async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.status, u.created_at,
              t.id AS teacher_id, t.employee_id, t.qualification, t.specialization, t.hire_date
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const user = rows[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        phone: user.phone,
        status: user.status,
        createdAt: user.created_at,
        teacherId: user.teacher_id || null,
        employeeId: user.employee_id || null,
        qualification: user.qualification || null,
        specialization: user.specialization || null,
        hireDate: user.hire_date || null,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Change Password
async function changePassword(req, res, next) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.',
      });
    }

    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedNew, userId]);

    await logActivity(userId, 'PASSWORD_CHANGED', 'User updated account password.', req.ip);

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getProfile,
  changePassword,
};
