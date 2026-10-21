const bcrypt = require('bcryptjs');
const { pool, withTransaction } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// Get all teachers with assigned classes & subjects
async function getAllTeachers(req, res, next) {
  try {
    const { search, status } = req.query;

    let whereClauses = ['1=1'];
    let params = [];

    if (search && search.trim()) {
      whereClauses.push('(u.full_name LIKE ? OR t.employee_id LIKE ? OR u.email LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereClauses.push('t.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.join(' AND ');

    const [teachers] = await pool.query(
      `SELECT 
        t.id,
        t.user_id,
        t.employee_id,
        u.full_name,
        u.email,
        u.phone,
        t.qualification,
        t.specialization,
        DATE_FORMAT(t.hire_date, '%Y-%m-%d') AS hire_date,
        t.status,
        t.created_at,
        (
          SELECT COUNT(DISTINCT tcsa.class_id)
          FROM teacher_class_subject_assignments tcsa
          WHERE tcsa.teacher_id = t.id
        ) AS assigned_class_count,
        (
          SELECT COUNT(DISTINCT tcsa.subject_id)
          FROM teacher_class_subject_assignments tcsa
          WHERE tcsa.teacher_id = t.id
        ) AS assigned_subject_count
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       WHERE ${whereSql}
       ORDER BY t.id DESC`,
      params
    );

    return res.status(200).json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
}

// Get single teacher details with assigned classes and subjects
async function getTeacherById(req, res, next) {
  try {
    const teacherId = req.params.id;

    const [rows] = await pool.query(
      `SELECT 
        t.id,
        t.user_id,
        t.employee_id,
        u.full_name,
        u.email,
        u.phone,
        t.qualification,
        t.specialization,
        DATE_FORMAT(t.hire_date, '%Y-%m-%d') AS hire_date,
        t.status,
        t.created_at
       FROM teachers t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = ?`,
      [teacherId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found.',
      });
    }

    const teacher = rows[0];

    // Get assignments
    const [assignments] = await pool.query(
      `SELECT 
        tcsa.id AS assignment_id,
        c.id AS class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        c.room_number,
        sub.id AS subject_id,
        sub.subject_code,
        sub.subject_name,
        tcsa.academic_year
       FROM teacher_class_subject_assignments tcsa
       JOIN classes c ON c.id = tcsa.class_id
       JOIN subjects sub ON sub.id = tcsa.subject_id
       WHERE tcsa.teacher_id = ?
       ORDER BY c.class_name, sub.subject_name`,
      [teacherId]
    );

    return res.status(200).json({
      success: true,
      teacher,
      assignments,
    });
  } catch (error) {
    next(error);
  }
}

// Create new teacher
async function createTeacher(req, res, next) {
  try {
    const {
      full_name,
      email,
      phone,
      password,
      employee_id,
      qualification,
      specialization,
      hire_date,
      status,
    } = req.body;

    if (!full_name || !email || !employee_id || !qualification || !hire_date) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, employee ID, qualification, and hire date are required.',
      });
    }

    // Default password 'teacher123' if none supplied
    const initialPassword = password && password.trim().length >= 6 ? password.trim() : 'teacher123';
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const result = await withTransaction(async (conn) => {
      // 1. Create user account
      const [userResult] = await conn.query(
        `INSERT INTO users (email, password_hash, full_name, role, phone, status)
         VALUES (?, ?, ?, 'teacher', ?, ?)`,
        [email.trim().toLowerCase(), passwordHash, full_name.trim(), phone ? phone.trim() : null, status || 'active']
      );

      const userId = userResult.insertId;

      // 2. Create teacher profile
      const [teacherResult] = await conn.query(
        `INSERT INTO teachers (user_id, employee_id, qualification, specialization, hire_date, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          employee_id.trim().toUpperCase(),
          qualification.trim(),
          specialization ? specialization.trim() : null,
          hire_date,
          status || 'active',
        ]
      );

      return { userId, teacherId: teacherResult.insertId };
    });

    await logActivity(
      req.user.id,
      'TEACHER_REGISTERED',
      `Registered faculty member ${full_name} (${employee_id}).`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Teacher created successfully.',
      teacherId: result.teacherId,
    });
  } catch (error) {
    next(error);
  }
}

// Update teacher profile
async function updateTeacher(req, res, next) {
  try {
    const teacherId = req.params.id;
    const {
      full_name,
      email,
      phone,
      employee_id,
      qualification,
      specialization,
      hire_date,
      status,
    } = req.body;

    const [teachers] = await pool.query('SELECT user_id FROM teachers WHERE id = ?', [teacherId]);
    if (teachers.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher record not found.' });
    }

    const userId = teachers[0].user_id;

    await withTransaction(async (conn) => {
      // Update user table
      await conn.query(
        `UPDATE users SET full_name = ?, email = ?, phone = ?, status = ? WHERE id = ?`,
        [full_name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, status || 'active', userId]
      );

      // Update teacher table
      await conn.query(
        `UPDATE teachers SET employee_id = ?, qualification = ?, specialization = ?, hire_date = ?, status = ? WHERE id = ?`,
        [
          employee_id.trim().toUpperCase(),
          qualification.trim(),
          specialization ? specialization.trim() : null,
          hire_date,
          status || 'active',
          teacherId,
        ]
      );
    });

    await logActivity(
      req.user.id,
      'TEACHER_UPDATED',
      `Updated faculty profile for ${full_name} (${employee_id}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Teacher profile updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Delete or deactivate teacher
async function deleteTeacher(req, res, next) {
  try {
    const teacherId = req.params.id;

    const [rows] = await pool.query(
      `SELECT t.user_id, u.full_name, t.employee_id 
       FROM teachers t 
       JOIN users u ON u.id = t.user_id 
       WHERE t.id = ?`,
      [teacherId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    const { user_id, full_name, employee_id } = rows[0];

    // Deleting user cascades to teacher and assignments
    await pool.query('DELETE FROM users WHERE id = ?', [user_id]);

    await logActivity(
      req.user.id,
      'TEACHER_DELETED',
      `Deleted teacher ${full_name} (${employee_id}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Teacher record and associated user account deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
};
