const { pool } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// Get all teacher class-subject assignments
async function getAllAssignments(req, res, next) {
  try {
    const { teacherId, classId } = req.query;

    let whereClauses = ['1=1'];
    let params = [];

    if (teacherId) {
      whereClauses.push('tcsa.teacher_id = ?');
      params.push(teacherId);
    }

    if (classId) {
      whereClauses.push('tcsa.class_id = ?');
      params.push(classId);
    }

    const whereSql = whereClauses.join(' AND ');

    const [assignments] = await pool.query(
      `SELECT 
        tcsa.id,
        tcsa.teacher_id,
        t.employee_id,
        u.full_name AS teacher_name,
        tcsa.class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        tcsa.subject_id,
        sub.subject_code,
        sub.subject_name,
        tcsa.academic_year,
        tcsa.created_at
       FROM teacher_class_subject_assignments tcsa
       JOIN teachers t ON t.id = tcsa.teacher_id
       JOIN users u ON u.id = t.user_id
       JOIN classes c ON c.id = tcsa.class_id
       JOIN subjects sub ON sub.id = tcsa.subject_id
       WHERE ${whereSql}
       ORDER BY c.class_name ASC, sub.subject_name ASC`,
      params
    );

    return res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    next(error);
  }
}

// Create new assignment
async function createAssignment(req, res, next) {
  try {
    const { teacher_id, class_id, subject_id, academic_year } = req.body;

    if (!teacher_id || !class_id || !subject_id) {
      return res.status(400).json({
        success: false,
        message: 'Teacher, class, and subject are required.',
      });
    }

    const year = academic_year || '2025-2026';

    const [result] = await pool.query(
      `INSERT INTO teacher_class_subject_assignments (teacher_id, class_id, subject_id, academic_year)
       VALUES (?, ?, ?, ?)`,
      [teacher_id, class_id, subject_id, year]
    );

    await logActivity(
      req.user.id,
      'TEACHER_ASSIGNED',
      `Assigned teacher ID ${teacher_id} to class ID ${class_id} and subject ID ${subject_id}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Teacher assigned successfully.',
      assignmentId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

// Delete assignment
async function deleteAssignment(req, res, next) {
  try {
    const assignmentId = req.params.id;

    await pool.query('DELETE FROM teacher_class_subject_assignments WHERE id = ?', [assignmentId]);

    await logActivity(
      req.user.id,
      'ASSIGNMENT_REMOVED',
      `Removed teacher assignment ID ${assignmentId}.`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Assignment removed successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Get logged-in teacher's authorized classes
async function getMyAssignedClasses(req, res, next) {
  try {
    if (req.user.role !== 'teacher' || !req.user.teacherId) {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is for teachers only.',
      });
    }

    const [classes] = await pool.query(`
      SELECT DISTINCT 
        c.id,
        c.class_name,
        c.section,
        CONCAT(c.class_name, ' - ', c.section) AS full_name,
        c.room_number
      FROM teacher_class_subject_assignments tcsa
      JOIN classes c ON c.id = tcsa.class_id
      WHERE tcsa.teacher_id = ?
      ORDER BY c.class_name ASC, c.section ASC
    `, [req.user.teacherId]);

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllAssignments,
  createAssignment,
  deleteAssignment,
  getMyAssignedClasses,
};
