const { pool, withTransaction } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// Helper to check if teacher is authorized for a class
async function isTeacherAuthorizedForClass(teacherId, classId) {
  const [rows] = await pool.query(
    'SELECT id FROM teacher_class_subject_assignments WHERE teacher_id = ? AND class_id = ?',
    [teacherId, classId]
  );
  return rows.length > 0;
}

// Get attendance sheet for a specific class and date
async function getAttendanceByClassAndDate(req, res, next) {
  try {
    const { classId, date } = req.query;

    if (!classId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Class ID and Date are required.',
      });
    }

    // Role check: If teacher, must be assigned to this class
    if (req.user.role === 'teacher') {
      const authorized = await isTeacherAuthorizedForClass(req.user.teacherId, classId);
      if (!authorized) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You are not assigned to teach this class.',
        });
      }
    }

    // Fetch class details
    const [classes] = await pool.query('SELECT class_name, section FROM classes WHERE id = ?', [classId]);
    if (classes.length === 0) {
      return res.status(404).json({ success: false, message: 'Class not found.' });
    }

    // Fetch enrolled students joined with attendance record for the date
    const [records] = await pool.query(`
      SELECT 
        s.id AS student_id,
        s.admission_no,
        s.full_name,
        s.gender,
        COALESCE(a.status, 'Present') AS status,
        a.remarks,
        a.id AS attendance_id,
        a.updated_at
      FROM students s
      LEFT JOIN attendance a ON a.student_id = s.id AND a.date = ?
      WHERE s.class_id = ? AND s.status = 'active'
      ORDER BY s.full_name ASC
    `, [date, classId]);

    // Calculate summary for this sheet
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let recordedCount = 0;

    records.forEach(r => {
      if (r.attendance_id) {
        recordedCount++;
        if (r.status === 'Present') presentCount++;
        else if (r.status === 'Late') lateCount++;
        else if (r.status === 'Absent') absentCount++;
      }
    });

    return res.status(200).json({
      success: true,
      classInfo: classes[0],
      date,
      records,
      isAlreadyRecorded: recordedCount > 0,
      summary: {
        totalStudents: records.length,
        recorded: recordedCount,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendanceRate: records.length > 0 && recordedCount > 0
          ? Math.round(((presentCount + lateCount) / records.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Save or bulk update attendance records
async function saveAttendance(req, res, next) {
  try {
    const { classId, date, records } = req.body;

    if (!classId || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Class ID, date, and student attendance records are required.',
      });
    }

    // Check teacher authorization
    if (req.user.role === 'teacher') {
      const authorized = await isTeacherAuthorizedForClass(req.user.teacherId, classId);
      if (!authorized) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: You cannot record attendance for unassigned classes.',
        });
      }
    }

    const recordedBy = req.user.id;

    // Use transaction and batch UPSERT
    await withTransaction(async (conn) => {
      for (const item of records) {
        const studentId = item.student_id;
        const status = ['Present', 'Absent', 'Late'].includes(item.status) ? item.status : 'Present';
        const remarks = item.remarks ? item.remarks.trim() : null;

        await conn.query(`
          INSERT INTO attendance (student_id, class_id, date, status, remarks, recorded_by)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            remarks = VALUES(remarks),
            recorded_by = VALUES(recorded_by),
            updated_at = CURRENT_TIMESTAMP
        `, [studentId, classId, date, status, remarks, recordedBy]);
      }
    });

    await logActivity(
      req.user.id,
      'ATTENDANCE_SAVED',
      `Saved attendance for class ID ${classId} on date ${date} (${records.length} students).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Attendance records saved successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Get individual student attendance history
async function getStudentAttendanceHistory(req, res, next) {
  try {
    const studentId = req.params.studentId;

    const [history] = await pool.query(`
      SELECT 
        a.id,
        DATE_FORMAT(a.date, '%Y-%m-%d') AS date,
        a.status,
        a.remarks,
        u.full_name AS recorded_by_name
      FROM attendance a
      LEFT JOIN users u ON u.id = a.recorded_by
      WHERE a.student_id = ?
      ORDER BY a.date DESC
      LIMIT 60
    `, [studentId]);

    const [[stats]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count
      FROM attendance
      WHERE student_id = ?
    `, [studentId]);

    const totalDays = Number(stats.total_days || 0);
    const presentCount = Number(stats.present_count || 0);
    const lateCount = Number(stats.late_count || 0);
    const absentCount = Number(stats.absent_count || 0);
    const percentage = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 0;

    return res.status(200).json({
      success: true,
      history,
      summary: {
        totalDays,
        presentCount,
        lateCount,
        absentCount,
        percentage,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get Daily Attendance Summary across all classes
async function getDailySummary(req, res, next) {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().slice(0, 10);

    const [classSummaries] = await pool.query(`
      SELECT 
        c.id AS class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        COUNT(DISTINCT s.id) AS total_enrolled,
        COUNT(a.id) AS recorded_count,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
        ROUND((SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 1) AS attendance_rate
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
      LEFT JOIN attendance a ON a.class_id = c.id AND a.student_id = s.id AND a.date = ?
      GROUP BY c.id, c.class_name, c.section
      ORDER BY c.class_name, c.section
    `, [targetDate]);

    return res.status(200).json({
      success: true,
      date: targetDate,
      summaries: classSummaries,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAttendanceByClassAndDate,
  saveAttendance,
  getStudentAttendanceHistory,
  getDailySummary,
};
