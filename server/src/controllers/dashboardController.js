const { pool } = require('../config/db');

async function getStats(req, res, next) {
  try {
    const userRole = req.user.role;
    const teacherId = req.user.teacherId;

    // 1. Core Counts
    const [[studentCount]] = await pool.query(
      `SELECT COUNT(*) AS total FROM students WHERE status = 'active'`
    );
    const [[teacherCount]] = await pool.query(
      `SELECT COUNT(*) AS total FROM teachers WHERE status = 'active'`
    );
    const [[classCount]] = await pool.query(
      `SELECT COUNT(*) AS total FROM classes`
    );

    // 2. Today's Attendance Percentage
    const [[todayAtt]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_marked,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count
      FROM attendance
      WHERE date = CURRENT_DATE()
    `);

    let todayAttendancePercent = 0;
    if (todayAtt.total_marked > 0) {
      // Treating Present and Late as in-attendance
      const attended = Number(todayAtt.present_count) + Number(todayAtt.late_count);
      todayAttendancePercent = Math.round((attended / Number(todayAtt.total_marked)) * 100);
    }

    // 3. Pending Fee Amount
    const [[feeObligations]] = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_fee_amount FROM student_fees`
    );
    const [[feePayments]] = await pool.query(
      `SELECT COALESCE(SUM(amount_paid), 0) AS total_paid_amount FROM fee_payments`
    );
    const pendingFeeAmount = Math.max(
      0,
      Number(feeObligations.total_fee_amount) - Number(feePayments.total_paid_amount)
    );

    // 4. Student Distribution by Class
    const [classDistribution] = await pool.query(`
      SELECT 
        CONCAT(c.class_name, ' - ', c.section) AS class_label,
        COUNT(s.id) AS student_count
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
      GROUP BY c.id, c.class_name, c.section
      ORDER BY c.class_name, c.section
    `);

    // 5. Attendance Trend (Last 7 distinct recorded dates)
    const [attendanceTrend] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m-%d') AS record_date,
        COUNT(*) AS total_students,
        SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present,
        SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late,
        SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent,
        ROUND((SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) AS attendance_rate
      FROM attendance
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `);

    // 6. Recent Student Admissions
    const [recentAdmissions] = await pool.query(`
      SELECT 
        s.id,
        s.admission_no,
        s.full_name,
        s.gender,
        s.admission_date,
        s.status,
        CONCAT(c.class_name, ' - ', c.section) AS class_name
      FROM students s
      JOIN classes c ON c.id = s.class_id
      ORDER BY s.admission_date DESC, s.id DESC
      LIMIT 6
    `);

    // 7. Recent Activity Logs
    const [recentActivities] = await pool.query(`
      SELECT 
        a.id,
        a.action,
        a.details,
        a.created_at,
        COALESCE(u.full_name, 'System') AS user_name,
        u.role AS user_role
      FROM activity_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC
      LIMIT 6
    `);

    // 8. If User is a Teacher, provide their assigned classes & subjects
    let teacherAssignedClasses = [];
    if (userRole === 'teacher' && teacherId) {
      const [assigned] = await pool.query(`
        SELECT 
          tcsa.id AS assignment_id,
          c.id AS class_id,
          CONCAT(c.class_name, ' - ', c.section) AS class_name,
          sub.id AS subject_id,
          sub.subject_name,
          sub.subject_code
        FROM teacher_class_subject_assignments tcsa
        JOIN classes c ON c.id = tcsa.class_id
        JOIN subjects sub ON sub.id = tcsa.subject_id
        WHERE tcsa.teacher_id = ?
      `, [teacherId]);
      teacherAssignedClasses = assigned;
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalStudents: Number(studentCount.total),
        totalTeachers: Number(teacherCount.total),
        totalClasses: Number(classCount.total),
        todayAttendancePercent,
        todayAttendanceSummary: {
          total: Number(todayAtt.total_marked || 0),
          present: Number(todayAtt.present_count || 0),
          late: Number(todayAtt.late_count || 0),
          absent: Number(todayAtt.absent_count || 0),
        },
        pendingFeeAmount,
        totalFeesObligated: Number(feeObligations.total_fee_amount),
        totalFeesCollected: Number(feePayments.total_paid_amount),
      },
      classDistribution,
      attendanceTrend: attendanceTrend.reverse(), // ascending chronological order for chart
      recentAdmissions,
      recentActivities,
      teacherAssignedClasses,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStats,
};
