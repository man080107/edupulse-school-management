const { pool } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// Get all students with search, filters, and pagination
async function getAllStudents(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const { search, classId, status } = req.query;

    let whereClauses = ['1=1'];
    let params = [];

    if (search && search.trim()) {
      whereClauses.push('(s.full_name LIKE ? OR s.admission_no LIKE ? OR s.guardian_name LIKE ?)');
      const searchTerm = `%${search.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (classId) {
      whereClauses.push('s.class_id = ?');
      params.push(classId);
    }

    if (status) {
      whereClauses.push('s.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.join(' AND ');

    // Total Count
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total 
       FROM students s 
       WHERE ${whereSql}`,
      params
    );

    // Paginated records
    const [students] = await pool.query(
      `SELECT 
        s.id,
        s.admission_no,
        s.full_name,
        DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
        s.gender,
        s.class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        c.room_number,
        s.guardian_name,
        s.guardian_phone,
        s.guardian_email,
        s.address,
        DATE_FORMAT(s.admission_date, '%Y-%m-%d') AS admission_date,
        s.status,
        s.created_at
       FROM students s
       JOIN classes c ON c.id = s.class_id
       WHERE ${whereSql}
       ORDER BY s.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return res.status(200).json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get single student details with academic & fee profile
async function getStudentById(req, res, next) {
  try {
    const studentId = req.params.id;

    const [rows] = await pool.query(
      `SELECT 
        s.id,
        s.admission_no,
        s.full_name,
        DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
        s.gender,
        s.class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        c.room_number,
        s.guardian_name,
        s.guardian_phone,
        s.guardian_email,
        s.address,
        DATE_FORMAT(s.admission_date, '%Y-%m-%d') AS admission_date,
        s.status,
        s.created_at
       FROM students s
       JOIN classes c ON c.id = s.class_id
       WHERE s.id = ?`,
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.',
      });
    }

    const student = rows[0];

    // Attendance summary for this student
    const [[attStats]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_days,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_days
      FROM attendance
      WHERE student_id = ?
    `, [studentId]);

    // Fee summary
    const [[feeStats]] = await pool.query(`
      SELECT 
        COALESCE(SUM(sf.amount), 0) AS total_fees,
        COALESCE((
          SELECT SUM(fp.amount_paid) 
          FROM fee_payments fp 
          JOIN student_fees sf2 ON sf2.id = fp.fee_id 
          WHERE sf2.student_id = ?
        ), 0) AS total_paid
      FROM student_fees sf
      WHERE sf.student_id = ?
    `, [studentId, studentId]);

    // Recent exam results
    const [recentMarks] = await pool.query(`
      SELECT 
        e.exam_name,
        sub.subject_name,
        em.marks_obtained,
        e.max_marks,
        em.grade,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date
      FROM examination_marks em
      JOIN examinations e ON e.id = em.exam_id
      JOIN subjects sub ON sub.id = e.subject_id
      WHERE em.student_id = ?
      ORDER BY e.exam_date DESC
      LIMIT 5
    `, [studentId]);

    return res.status(200).json({
      success: true,
      student,
      attendanceSummary: {
        totalDays: Number(attStats.total_days || 0),
        presentDays: Number(attStats.present_days || 0),
        lateDays: Number(attStats.late_days || 0),
        absentDays: Number(attStats.absent_days || 0),
        attendanceRate: attStats.total_days > 0
          ? Math.round(((Number(attStats.present_days) + Number(attStats.late_days)) / Number(attStats.total_days)) * 100)
          : 0,
      },
      feeSummary: {
        totalFees: Number(feeStats.total_fees || 0),
        totalPaid: Number(feeStats.total_paid || 0),
        balance: Math.max(0, Number(feeStats.total_fees || 0) - Number(feeStats.total_paid || 0)),
      },
      recentMarks,
    });
  } catch (error) {
    next(error);
  }
}

// Create new student
async function createStudent(req, res, next) {
  try {
    const {
      admission_no,
      full_name,
      date_of_birth,
      gender,
      class_id,
      guardian_name,
      guardian_phone,
      guardian_email,
      address,
      admission_date,
      status,
    } = req.body;

    // Validation
    if (!admission_no || !full_name || !date_of_birth || !gender || !class_id || !guardian_name || !guardian_phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all mandatory fields (admission number, full name, DOB, gender, class, guardian name, guardian phone, address).',
      });
    }

    // Verify class exists
    const [classRows] = await pool.query('SELECT id FROM classes WHERE id = ?', [class_id]);
    if (classRows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Selected class does not exist.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO students (
        admission_no, full_name, date_of_birth, gender, class_id,
        guardian_name, guardian_phone, guardian_email, address, admission_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        admission_no.trim().toUpperCase(),
        full_name.trim(),
        date_of_birth,
        gender,
        class_id,
        guardian_name.trim(),
        guardian_phone.trim(),
        guardian_email ? guardian_email.trim() : null,
        address.trim(),
        admission_date || new Date().toISOString().slice(0, 10),
        status || 'active',
      ]
    );

    await logActivity(
      req.user.id,
      'STUDENT_ENROLLED',
      `Enrolled student ${full_name} with admission number ${admission_no}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Student enrolled successfully.',
      studentId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

// Update existing student
async function updateStudent(req, res, next) {
  try {
    const studentId = req.params.id;
    const {
      admission_no,
      full_name,
      date_of_birth,
      gender,
      class_id,
      guardian_name,
      guardian_phone,
      guardian_email,
      address,
      admission_date,
      status,
    } = req.body;

    // Check if student exists
    const [exists] = await pool.query('SELECT id FROM students WHERE id = ?', [studentId]);
    if (exists.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await pool.query(
      `UPDATE students SET
        admission_no = ?,
        full_name = ?,
        date_of_birth = ?,
        gender = ?,
        class_id = ?,
        guardian_name = ?,
        guardian_phone = ?,
        guardian_email = ?,
        address = ?,
        admission_date = ?,
        status = ?
       WHERE id = ?`,
      [
        admission_no.trim().toUpperCase(),
        full_name.trim(),
        date_of_birth,
        gender,
        class_id,
        guardian_name.trim(),
        guardian_phone.trim(),
        guardian_email ? guardian_email.trim() : null,
        address.trim(),
        admission_date,
        status || 'active',
        studentId,
      ]
    );

    await logActivity(
      req.user.id,
      'STUDENT_UPDATED',
      `Updated profile for student ${full_name} (${admission_no}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Student record updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Delete student (or deactivate if academic records exist)
async function deleteStudent(req, res, next) {
  try {
    const studentId = req.params.id;

    // Check student
    const [students] = await pool.query('SELECT full_name, admission_no FROM students WHERE id = ?', [studentId]);
    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = students[0];

    // Deletion: ON DELETE CASCADE will clean related records, but to protect history, support status='inactive' or full removal
    await pool.query('DELETE FROM students WHERE id = ?', [studentId]);

    await logActivity(
      req.user.id,
      'STUDENT_DELETED',
      `Deleted student record for ${student.full_name} (${student.admission_no}).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Student record deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
