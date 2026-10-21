const { pool } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// Get all classes with enrolled student counts
async function getAllClasses(req, res, next) {
  try {
    const [classes] = await pool.query(`
      SELECT 
        c.id,
        c.class_name,
        c.section,
        CONCAT(c.class_name, ' - ', c.section) AS full_name,
        c.room_number,
        c.capacity,
        c.created_at,
        COUNT(s.id) AS enrolled_students
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
      GROUP BY c.id, c.class_name, c.section, c.room_number, c.capacity, c.created_at
      ORDER BY c.class_name ASC, c.section ASC
    `);

    return res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    next(error);
  }
}

// Get enrolled students for a specific class
async function getClassStudents(req, res, next) {
  try {
    const classId = req.params.id;

    const [students] = await pool.query(`
      SELECT 
        s.id,
        s.admission_no,
        s.full_name,
        s.gender,
        s.guardian_name,
        s.guardian_phone,
        s.status
      FROM students s
      WHERE s.class_id = ?
      ORDER BY s.full_name ASC
    `, [classId]);

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
}

// Create new class
async function createClass(req, res, next) {
  try {
    const { class_name, section, room_number, capacity } = req.body;

    if (!class_name || !section) {
      return res.status(400).json({
        success: false,
        message: 'Class name and section are required.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO classes (class_name, section, room_number, capacity)
       VALUES (?, ?, ?, ?)`,
      [class_name.trim(), section.trim().toUpperCase(), room_number ? room_number.trim() : null, capacity || 40]
    );

    await logActivity(
      req.user.id,
      'CLASS_CREATED',
      `Created class ${class_name} - ${section}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Class created successfully.',
      classId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

// Update class
async function updateClass(req, res, next) {
  try {
    const classId = req.params.id;
    const { class_name, section, room_number, capacity } = req.body;

    await pool.query(
      `UPDATE classes SET class_name = ?, section = ?, room_number = ?, capacity = ? WHERE id = ?`,
      [class_name.trim(), section.trim().toUpperCase(), room_number ? room_number.trim() : null, capacity || 40, classId]
    );

    await logActivity(
      req.user.id,
      'CLASS_UPDATED',
      `Updated class ID ${classId} (${class_name} - ${section}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Class updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Delete class (restricted if students are enrolled)
async function deleteClass(req, res, next) {
  try {
    const classId = req.params.id;

    // Check if students are enrolled
    const [[{ studentCount }]] = await pool.query(
      'SELECT COUNT(*) AS studentCount FROM students WHERE class_id = ?',
      [classId]
    );

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class because ${studentCount} student(s) are currently enrolled. Reassign or remove students first.`,
      });
    }

    await pool.query('DELETE FROM classes WHERE id = ?', [classId]);

    await logActivity(req.user.id, 'CLASS_DELETED', `Deleted class ID ${classId}.`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Class deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllClasses,
  getClassStudents,
  createClass,
  updateClass,
  deleteClass,
};
