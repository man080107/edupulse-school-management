const { pool } = require('../config/db');

// 1. Enrollment Report
async function getEnrollmentReport(req, res, next) {
  try {
    const [report] = await pool.query(`
      SELECT 
        c.id AS class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        c.room_number,
        c.capacity,
        COUNT(s.id) AS total_enrolled,
        SUM(CASE WHEN s.gender = 'Male' THEN 1 ELSE 0 END) AS male_count,
        SUM(CASE WHEN s.gender = 'Female' THEN 1 ELSE 0 END) AS female_count,
        ROUND((COUNT(s.id) / c.capacity) * 100, 1) AS occupancy_rate
      FROM classes c
      LEFT JOIN students s ON s.class_id = c.id AND s.status = 'active'
      GROUP BY c.id, c.class_name, c.section, c.room_number, c.capacity
      ORDER BY c.class_name, c.section
    `);

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

// 2. Attendance Summary Report with Date Range and Class Filters
async function getAttendanceReport(req, res, next) {
  try {
    const { classId, startDate, endDate } = req.query;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    let whereClauses = ['a.date BETWEEN ? AND ?'];
    let params = [start, end];

    if (classId) {
      whereClauses.push('s.class_id = ?');
      params.push(classId);
    }

    const whereSql = whereClauses.join(' AND ');

    const [report] = await pool.query(`
      SELECT 
        s.id AS student_id,
        s.admission_no,
        s.full_name,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        COUNT(a.id) AS total_recorded_days,
        SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_days,
        SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_days,
        ROUND((SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 1) AS attendance_percentage
      FROM students s
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN attendance a ON a.student_id = s.id AND ${whereSql}
      WHERE s.status = 'active' ${classId ? 'AND s.class_id = ?' : ''}
      GROUP BY s.id, s.admission_no, s.full_name, c.class_name, c.section
      ORDER BY attendance_percentage ASC, s.full_name ASC
    `, classId ? [...params, classId] : params);

    return res.status(200).json({
      success: true,
      startDate: start,
      endDate: end,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

// 3. Examination Performance Report
async function getExamReport(req, res, next) {
  try {
    const { examId, classId } = req.query;

    let whereClauses = ['1=1'];
    let params = [];

    if (examId) {
      whereClauses.push('e.id = ?');
      params.push(examId);
    }

    if (classId) {
      whereClauses.push('e.class_id = ?');
      params.push(classId);
    }

    const whereSql = whereClauses.join(' AND ');

    const [report] = await pool.query(`
      SELECT 
        e.id AS exam_id,
        e.exam_name,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        sub.subject_name,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
        e.max_marks,
        e.pass_marks,
        COUNT(em.id) AS total_appeared,
        SUM(CASE WHEN em.marks_obtained >= e.pass_marks THEN 1 ELSE 0 END) AS passed_count,
        SUM(CASE WHEN em.marks_obtained < e.pass_marks THEN 1 ELSE 0 END) AS failed_count,
        ROUND((SUM(CASE WHEN em.marks_obtained >= e.pass_marks THEN 1 ELSE 0 END) / NULLIF(COUNT(em.id), 0)) * 100, 1) AS pass_percentage,
        ROUND(AVG(em.marks_obtained), 1) AS average_score,
        MAX(em.marks_obtained) AS highest_score,
        MIN(em.marks_obtained) AS lowest_score
      FROM examinations e
      JOIN classes c ON c.id = e.class_id
      JOIN subjects sub ON sub.id = e.subject_id
      LEFT JOIN examination_marks em ON em.exam_id = e.id
      WHERE ${whereSql}
      GROUP BY e.id, e.exam_name, c.class_name, c.section, sub.subject_name, e.exam_date, e.max_marks, e.pass_marks
      ORDER BY e.exam_date DESC
    `, params);

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

// 4. Financial Fee Report
async function getFeeReport(req, res, next) {
  try {
    const { classId, status } = req.query;

    let whereClauses = ['1=1'];
    let params = [];

    if (classId) {
      whereClauses.push('s.class_id = ?');
      params.push(classId);
    }

    if (status) {
      whereClauses.push('sf.status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.join(' AND ');

    const [report] = await pool.query(`
      SELECT 
        sf.id,
        s.admission_no,
        s.full_name AS student_name,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        sf.title AS fee_title,
        sf.amount AS fee_amount,
        COALESCE(SUM(fp.amount_paid), 0) AS paid_amount,
        GREATEST(0, sf.amount - COALESCE(SUM(fp.amount_paid), 0)) AS outstanding_balance,
        DATE_FORMAT(sf.due_date, '%Y-%m-%d') AS due_date,
        sf.status
      FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN fee_payments fp ON fp.fee_id = sf.id
      WHERE ${whereSql}
      GROUP BY sf.id, s.admission_no, s.full_name, c.class_name, c.section, sf.title, sf.amount, sf.due_date, sf.status
      ORDER BY outstanding_balance DESC, sf.due_date ASC
    `, params);

    return res.status(200).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

// 5. CSV Export Endpoint
async function exportReportCSV(req, res, next) {
  try {
    const { type, classId } = req.query;

    let filename = `report_${type || 'general'}_${Date.now()}.csv`;
    let csvHeader = '';
    let csvRows = [];

    if (type === 'students') {
      filename = `students_list_${Date.now()}.csv`;
      csvHeader = 'Admission No,Full Name,Gender,Class,Guardian Name,Guardian Phone,Status,Admission Date\n';
      const [rows] = await pool.query(`
        SELECT s.admission_no, s.full_name, s.gender, CONCAT(c.class_name, ' - ', c.section) AS class_name,
               s.guardian_name, s.guardian_phone, s.status, s.admission_date
        FROM students s JOIN classes c ON c.id = s.class_id
        ${classId ? 'WHERE s.class_id = ?' : ''}
        ORDER BY s.full_name ASC
      `, classId ? [classId] : []);

      csvRows = rows.map(r => `"${r.admission_no}","${r.full_name}","${r.gender}","${r.class_name}","${r.guardian_name}","${r.guardian_phone}","${r.status}","${r.admission_date}"`);
    } else if (type === 'attendance') {
      filename = `attendance_summary_${Date.now()}.csv`;
      csvHeader = 'Admission No,Student Name,Class,Total Days,Present Days,Late Days,Absent Days,Attendance Rate (%)\n';
      const [rows] = await pool.query(`
        SELECT s.admission_no, s.full_name, CONCAT(c.class_name, ' - ', c.section) AS class_name,
               COUNT(a.id) AS total_days,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_days,
               SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) AS late_days,
               SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) AS absent_days,
               ROUND((SUM(CASE WHEN a.status IN ('Present', 'Late') THEN 1 ELSE 0 END) / NULLIF(COUNT(a.id), 0)) * 100, 1) AS att_pct
        FROM students s
        JOIN classes c ON c.id = s.class_id
        LEFT JOIN attendance a ON a.student_id = s.id
        ${classId ? 'WHERE s.class_id = ?' : ''}
        GROUP BY s.id, s.admission_no, s.full_name, c.class_name, c.section
        ORDER BY s.full_name ASC
      `, classId ? [classId] : []);

      csvRows = rows.map(r => `"${r.admission_no}","${r.full_name}","${r.class_name}",${r.total_days},${r.present_days},${r.late_days},${r.absent_days},${r.att_pct || 0}`);
    } else if (type === 'fees') {
      filename = `fee_defaulters_${Date.now()}.csv`;
      csvHeader = 'Admission No,Student Name,Class,Fee Title,Total Amount,Paid Amount,Outstanding Balance,Due Date,Status\n';
      const [rows] = await pool.query(`
        SELECT s.admission_no, s.full_name, CONCAT(c.class_name, ' - ', c.section) AS class_name,
               sf.title, sf.amount,
               COALESCE(SUM(fp.amount_paid), 0) AS paid_amount,
               GREATEST(0, sf.amount - COALESCE(SUM(fp.amount_paid), 0)) AS balance,
               DATE_FORMAT(sf.due_date, '%Y-%m-%d') AS due_date, sf.status
        FROM student_fees sf
        JOIN students s ON s.id = sf.student_id
        JOIN classes c ON c.id = s.class_id
        LEFT JOIN fee_payments fp ON fp.fee_id = sf.id
        ${classId ? 'WHERE s.class_id = ?' : ''}
        GROUP BY sf.id, s.admission_no, s.full_name, c.class_name, c.section, sf.title, sf.amount, sf.due_date, sf.status
        ORDER BY balance DESC
      `, classId ? [classId] : []);

      csvRows = rows.map(r => `"${r.admission_no}","${r.full_name}","${r.class_name}","${r.title}",${r.amount},${r.paid_amount},${r.balance},"${r.due_date}","${r.status}"`);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report export type. Available: students, attendance, fees.' });
    }

    const csvContent = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getEnrollmentReport,
  getAttendanceReport,
  getExamReport,
  getFeeReport,
  exportReportCSV,
};
