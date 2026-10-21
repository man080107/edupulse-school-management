const { pool } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// Get all subjects
async function getAllSubjects(req, res, next) {
  try {
    const [subjects] = await pool.query(`
      SELECT 
        s.id,
        s.subject_code,
        s.subject_name,
        s.description,
        s.created_at,
        COUNT(DISTINCT tcsa.teacher_id) AS assigned_teachers
      FROM subjects s
      LEFT JOIN teacher_class_subject_assignments tcsa ON tcsa.subject_id = s.id
      GROUP BY s.id, s.subject_code, s.subject_name, s.description, s.created_at
      ORDER BY s.subject_name ASC
    `);

    return res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    next(error);
  }
}

// Create subject
async function createSubject(req, res, next) {
  try {
    const { subject_code, subject_name, description } = req.body;

    if (!subject_code || !subject_name) {
      return res.status(400).json({
        success: false,
        message: 'Subject code and subject name are required.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO subjects (subject_code, subject_name, description)
       VALUES (?, ?, ?)`,
      [subject_code.trim().toUpperCase(), subject_name.trim(), description ? description.trim() : null]
    );

    await logActivity(
      req.user.id,
      'SUBJECT_CREATED',
      `Created subject ${subject_name} (${subject_code}).`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      subjectId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

// Update subject
async function updateSubject(req, res, next) {
  try {
    const subjectId = req.params.id;
    const { subject_code, subject_name, description } = req.body;

    await pool.query(
      `UPDATE subjects SET subject_code = ?, subject_name = ?, description = ? WHERE id = ?`,
      [subject_code.trim().toUpperCase(), subject_name.trim(), description ? description.trim() : null, subjectId]
    );

    await logActivity(
      req.user.id,
      'SUBJECT_UPDATED',
      `Updated subject ${subject_name} (${subject_code}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Delete subject
async function deleteSubject(req, res, next) {
  try {
    const subjectId = req.params.id;

    await pool.query('DELETE FROM subjects WHERE id = ?', [subjectId]);

    await logActivity(req.user.id, 'SUBJECT_DELETED', `Deleted subject ID ${subjectId}.`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
