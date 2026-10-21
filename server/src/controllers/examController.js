const { pool, withTransaction } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// Documented Grading Policy Helper
function calculateGrade(marks, maxMarks) {
  if (maxMarks <= 0) return 'F';
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

// Get all examinations
async function getAllExams(req, res, next) {
  try {
    const { classId, subjectId } = req.query;

    let whereClauses = ['1=1'];
    let params = [];

    if (classId) {
      whereClauses.push('e.class_id = ?');
      params.push(classId);
    }

    if (subjectId) {
      whereClauses.push('e.subject_id = ?');
      params.push(subjectId);
    }

    const whereSql = whereClauses.join(' AND ');

    const [exams] = await pool.query(`
      SELECT 
        e.id,
        e.exam_name,
        e.class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        e.subject_id,
        sub.subject_code,
        sub.subject_name,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
        e.max_marks,
        e.pass_marks,
        e.academic_term,
        e.created_at,
        COUNT(em.id) AS graded_students_count,
        ROUND(AVG(em.marks_obtained), 1) AS average_score
      FROM examinations e
      JOIN classes c ON c.id = e.class_id
      JOIN subjects sub ON sub.id = e.subject_id
      LEFT JOIN examination_marks em ON em.exam_id = e.id
      WHERE ${whereSql}
      GROUP BY e.id, e.exam_name, e.class_id, c.class_name, c.section, e.subject_id, sub.subject_code, sub.subject_name, e.exam_date, e.max_marks, e.pass_marks, e.academic_term, e.created_at
      ORDER BY e.exam_date DESC, e.id DESC
    `, params);

    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    next(error);
  }
}

// Create new examination
async function createExam(req, res, next) {
  try {
    const { exam_name, class_id, subject_id, exam_date, max_marks, pass_marks, academic_term } = req.body;

    if (!exam_name || !class_id || !subject_id || !exam_date) {
      return res.status(400).json({
        success: false,
        message: 'Exam name, class, subject, and exam date are required.',
      });
    }

    const maxM = parseFloat(max_marks || 100);
    const passM = parseFloat(pass_marks || 40);

    if (passM > maxM) {
      return res.status(400).json({
        success: false,
        message: 'Passing marks cannot exceed maximum marks.',
      });
    }

    const [result] = await pool.query(`
      INSERT INTO examinations (exam_name, class_id, subject_id, exam_date, max_marks, pass_marks, academic_term)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      exam_name.trim(),
      class_id,
      subject_id,
      exam_date,
      maxM,
      passM,
      academic_term ? academic_term.trim() : 'Term 1',
    ]);

    await logActivity(
      req.user.id,
      'EXAM_CREATED',
      `Created examination '${exam_name}' for class ID ${class_id}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Examination scheduled successfully.',
      examId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

// Get marks entry sheet for an exam
async function getExamMarks(req, res, next) {
  try {
    const examId = req.params.examId;

    // Get exam info
    const [exams] = await pool.query(`
      SELECT 
        e.id,
        e.exam_name,
        e.class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        e.subject_id,
        sub.subject_code,
        sub.subject_name,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
        e.max_marks,
        e.pass_marks,
        e.academic_term
      FROM examinations e
      JOIN classes c ON c.id = e.class_id
      JOIN subjects sub ON sub.id = e.subject_id
      WHERE e.id = ?
    `, [examId]);

    if (exams.length === 0) {
      return res.status(404).json({ success: false, message: 'Examination not found.' });
    }

    const exam = exams[0];

    // Get all enrolled students in the class with their marks if already entered
    const [marksList] = await pool.query(`
      SELECT 
        s.id AS student_id,
        s.admission_no,
        s.full_name,
        s.gender,
        em.id AS mark_id,
        em.marks_obtained,
        em.grade,
        em.remarks,
        CASE 
          WHEN em.marks_obtained IS NULL THEN 'Not Entered'
          WHEN em.marks_obtained >= ? THEN 'Pass'
          ELSE 'Fail'
        END AS result_status
      FROM students s
      LEFT JOIN examination_marks em ON em.student_id = s.id AND em.exam_id = ?
      WHERE s.class_id = ? AND s.status = 'active'
      ORDER BY s.full_name ASC
    `, [exam.pass_marks, examId, exam.class_id]);

    return res.status(200).json({
      success: true,
      exam,
      marks: marksList,
    });
  } catch (error) {
    next(error);
  }
}

// Save or update exam marks
async function saveExamMarks(req, res, next) {
  try {
    const examId = req.params.examId;
    const { marks } = req.body; // array of { student_id, marks_obtained, remarks }

    if (!Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Marks array is required.',
      });
    }

    const [exams] = await pool.query('SELECT max_marks, pass_marks FROM examinations WHERE id = ?', [examId]);
    if (exams.length === 0) {
      return res.status(404).json({ success: false, message: 'Exam not found.' });
    }

    const maxMarks = Number(exams[0].max_marks);
    const recordedBy = req.user.id;

    // Validate marks range
    for (const item of marks) {
      if (item.marks_obtained !== null && item.marks_obtained !== undefined && item.marks_obtained !== '') {
        const val = parseFloat(item.marks_obtained);
        if (isNaN(val) || val < 0 || val > maxMarks) {
          return res.status(400).json({
            success: false,
            message: `Invalid marks '${item.marks_obtained}' for student. Marks must be between 0 and ${maxMarks}.`,
          });
        }
      }
    }

    await withTransaction(async (conn) => {
      for (const item of marks) {
        if (item.marks_obtained === null || item.marks_obtained === undefined || item.marks_obtained === '') {
          continue;
        }

        const score = parseFloat(item.marks_obtained);
        const grade = calculateGrade(score, maxMarks);
        const remarks = item.remarks ? item.remarks.trim() : null;

        await conn.query(`
          INSERT INTO examination_marks (exam_id, student_id, marks_obtained, grade, remarks, recorded_by)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            marks_obtained = VALUES(marks_obtained),
            grade = VALUES(grade),
            remarks = VALUES(remarks),
            recorded_by = VALUES(recorded_by),
            updated_at = CURRENT_TIMESTAMP
        `, [examId, item.student_id, score, grade, remarks, recordedBy]);
      }
    });

    await logActivity(
      req.user.id,
      'EXAM_MARKS_RECORDED',
      `Recorded marks for examination ID ${examId} (${marks.length} students).`,
      req.ip
    );

    return res.status(200).json({
      success: true,
      message: 'Examination marks saved successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// Get comprehensive individual student result report card
async function getStudentResultCard(req, res, next) {
  try {
    const studentId = req.params.studentId;

    // Student and Class details
    const [students] = await pool.query(`
      SELECT 
        s.id,
        s.admission_no,
        s.full_name,
        DATE_FORMAT(s.date_of_birth, '%Y-%m-%d') AS date_of_birth,
        s.gender,
        s.class_id,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        c.room_number,
        s.guardian_name,
        s.guardian_phone
      FROM students s
      JOIN classes c ON c.id = s.class_id
      WHERE s.id = ?
    `, [studentId]);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = students[0];

    // All marks obtained by this student
    const [marks] = await pool.query(`
      SELECT 
        e.id AS exam_id,
        e.exam_name,
        e.academic_term,
        DATE_FORMAT(e.exam_date, '%Y-%m-%d') AS exam_date,
        sub.subject_code,
        sub.subject_name,
        e.max_marks,
        e.pass_marks,
        em.marks_obtained,
        em.grade,
        CASE WHEN em.marks_obtained >= e.pass_marks THEN 'Pass' ELSE 'Fail' END AS status,
        em.remarks
      FROM examination_marks em
      JOIN examinations e ON e.id = em.exam_id
      JOIN subjects sub ON sub.id = e.subject_id
      WHERE em.student_id = ?
      ORDER BY e.exam_date ASC
    `, [studentId]);

    // Aggregate calculations
    let totalMaxMarks = 0;
    let totalObtainedMarks = 0;
    let passedCount = 0;

    marks.forEach(m => {
      totalMaxMarks += Number(m.max_marks);
      totalObtainedMarks += Number(m.marks_obtained);
      if (m.status === 'Pass') passedCount++;
    });

    const overallPercentage = totalMaxMarks > 0
      ? Math.round((totalObtainedMarks / totalMaxMarks) * 1000) / 10
      : 0;
    const overallGrade = calculateGrade(totalObtainedMarks, totalMaxMarks);
    const overallStatus = passedCount === marks.length && marks.length > 0 ? 'Passed' : 'Needs Improvement';

    // Attendance summary for report card
    const [[att]] = await pool.query(`
      SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN status IN ('Present', 'Late') THEN 1 ELSE 0 END) AS attended_days
      FROM attendance
      WHERE student_id = ?
    `, [studentId]);

    const totalDays = Number(att.total_days || 0);
    const attendedDays = Number(att.attended_days || 0);
    const attendancePercentage = totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 100;

    return res.status(200).json({
      success: true,
      student,
      marks,
      summary: {
        totalSubjects: marks.length,
        totalMaxMarks,
        totalObtainedMarks,
        overallPercentage,
        overallGrade,
        overallStatus,
        attendancePercentage,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Delete exam
async function deleteExam(req, res, next) {
  try {
    const examId = req.params.examId;

    await pool.query('DELETE FROM examinations WHERE id = ?', [examId]);

    await logActivity(req.user.id, 'EXAM_DELETED', `Deleted examination ID ${examId}.`, req.ip);

    return res.status(200).json({
      success: true,
      message: 'Examination deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllExams,
  createExam,
  getExamMarks,
  saveExamMarks,
  getStudentResultCard,
  deleteExam,
};
