const { pool, withTransaction } = require('../config/db');
const { logActivity } = require('../middleware/activityLogger');

// Get all student fees with status and payment totals
async function getAllFees(req, res, next) {
  try {
    const { classId, status, search } = req.query;

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

    if (search && search.trim()) {
      whereClauses.push('(s.full_name LIKE ? OR s.admission_no LIKE ? OR sf.title LIKE ?)');
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    const whereSql = whereClauses.join(' AND ');

    const [fees] = await pool.query(`
      SELECT 
        sf.id,
        sf.student_id,
        s.admission_no,
        s.full_name AS student_name,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        sf.title,
        sf.amount AS total_amount,
        DATE_FORMAT(sf.due_date, '%Y-%m-%d') AS due_date,
        sf.status,
        sf.academic_year,
        sf.created_at,
        COALESCE(SUM(fp.amount_paid), 0) AS paid_amount,
        GREATEST(0, sf.amount - COALESCE(SUM(fp.amount_paid), 0)) AS balance_amount
      FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN fee_payments fp ON fp.fee_id = sf.id
      WHERE ${whereSql}
      GROUP BY sf.id, sf.student_id, s.admission_no, s.full_name, c.class_name, c.section, sf.title, sf.amount, sf.due_date, sf.status, sf.academic_year, sf.created_at
      ORDER BY sf.due_date DESC, sf.id DESC
    `, params);

    // Summary calculations
    let totalObligation = 0;
    let totalCollected = 0;
    let pendingCount = 0;
    let partialCount = 0;
    let paidCount = 0;

    fees.forEach(f => {
      totalObligation += Number(f.total_amount);
      totalCollected += Number(f.paid_amount);
      if (f.status === 'pending') pendingCount++;
      else if (f.status === 'partial') partialCount++;
      else if (f.status === 'paid') paidCount++;
    });

    return res.status(200).json({
      success: true,
      data: fees,
      summary: {
        totalObligation,
        totalCollected,
        outstandingBalance: Math.max(0, totalObligation - totalCollected),
        counts: {
          pending: pendingCount,
          partial: partialCount,
          paid: paidCount,
          total: fees.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

// Create new fee allocation for a student or entire class
async function createFeeAllocation(req, res, next) {
  try {
    const { student_id, class_id, title, amount, due_date, academic_year } = req.body;

    if (!title || !amount || !due_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, amount, and due date are required.',
      });
    }

    const feeAmount = parseFloat(amount);
    if (isNaN(feeAmount) || feeAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Fee amount must be a positive number.',
      });
    }

    const year = academic_year || '2025-2026';

    // If assigned to an entire class
    if (class_id && !student_id) {
      const [students] = await pool.query(
        'SELECT id FROM students WHERE class_id = ? AND status = "active"',
        [class_id]
      );

      if (students.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active students found in the selected class.',
        });
      }

      await withTransaction(async (conn) => {
        for (const s of students) {
          await conn.query(`
            INSERT INTO student_fees (student_id, title, amount, due_date, status, academic_year)
            VALUES (?, ?, ?, ?, 'pending', ?)
          `, [s.id, title.trim(), feeAmount, due_date, year]);
        }
      });

      await logActivity(
        req.user.id,
        'BULK_FEE_ALLOCATION',
        `Allocated fee '${title}' ($${feeAmount}) to ${students.length} students in class ID ${class_id}.`,
        req.ip
      );

      return res.status(201).json({
        success: true,
        message: `Fee allocated to ${students.length} students in class successfully.`,
      });
    }

    // Single student assignment
    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: 'Please specify either a student or a class for fee allocation.',
      });
    }

    const [result] = await pool.query(`
      INSERT INTO student_fees (student_id, title, amount, due_date, status, academic_year)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `, [student_id, title.trim(), feeAmount, due_date, year]);

    await logActivity(
      req.user.id,
      'FEE_ALLOCATION',
      `Assigned fee '${title}' ($${feeAmount}) to student ID ${student_id}.`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Fee allocated successfully.',
      feeId: result.insertId,
    });
  } catch (error) {
    next(error);
  }
}

// Record fee payment with transaction and balance update
async function recordFeePayment(req, res, next) {
  try {
    const { fee_id, amount_paid, payment_date, payment_method, notes } = req.body;

    if (!fee_id || !amount_paid) {
      return res.status(400).json({
        success: false,
        message: 'Fee record ID and payment amount are required.',
      });
    }

    const paymentAmount = parseFloat(amount_paid);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.',
      });
    }

    // Check fee existence and current balance
    const [fees] = await pool.query(`
      SELECT 
        sf.id,
        sf.amount AS total_amount,
        sf.student_id,
        s.full_name AS student_name,
        COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE fee_id = sf.id), 0) AS paid_so_far
      FROM student_fees sf
      JOIN students s ON s.id = sf.student_id
      WHERE sf.id = ?
    `, [fee_id]);

    if (fees.length === 0) {
      return res.status(404).json({ success: false, message: 'Fee record not found.' });
    }

    const fee = fees[0];
    const totalAmount = Number(fee.total_amount);
    const paidSoFar = Number(fee.paid_so_far);
    const remainingBalance = totalAmount - paidSoFar;

    if (paymentAmount > remainingBalance + 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${paymentAmount}) exceeds the remaining balance ($${remainingBalance.toFixed(2)}).`,
      });
    }

    // Generate unique receipt number e.g. REC-YYYYMMDD-XXXX
    const receiptNo = `REC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const payDate = payment_date || new Date().toISOString().slice(0, 10);
    const method = ['Cash', 'Bank Transfer', 'Cheque', 'UPI'].includes(payment_method) ? payment_method : 'Cash';
    const collectedBy = req.user.id;

    const receiptResult = await withTransaction(async (conn) => {
      // 1. Insert payment record
      const [payResult] = await conn.query(`
        INSERT INTO fee_payments (fee_id, amount_paid, payment_date, payment_method, receipt_no, notes, collected_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [fee_id, paymentAmount, payDate, method, receiptNo, notes ? notes.trim() : null, collectedBy]);

      // 2. Compute new total paid and update fee status
      const newTotalPaid = paidSoFar + paymentAmount;
      let newStatus = 'partial';
      if (newTotalPaid >= totalAmount - 0.01) {
        newStatus = 'paid';
      }

      await conn.query(`UPDATE student_fees SET status = ? WHERE id = ?`, [newStatus, fee_id]);

      return { paymentId: payResult.insertId, receiptNo, newStatus };
    });

    await logActivity(
      req.user.id,
      'FEE_PAYMENT_COLLECTED',
      `Collected $${paymentAmount} from student ${fee.student_name} (${receiptNo}).`,
      req.ip
    );

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      receipt: {
        paymentId: receiptResult.paymentId,
        receiptNo: receiptResult.receiptNo,
        amountPaid: paymentAmount,
        paymentDate: payDate,
        paymentMethod: method,
        status: receiptResult.newStatus,
      },
    });
  } catch (error) {
    next(error);
  }
}

// Get printable payment receipt details
async function getReceiptDetails(req, res, next) {
  try {
    const receiptNo = req.params.receiptNo;

    const [rows] = await pool.query(`
      SELECT 
        fp.id AS payment_id,
        fp.receipt_no,
        fp.amount_paid,
        DATE_FORMAT(fp.payment_date, '%Y-%m-%d') AS payment_date,
        fp.payment_method,
        fp.notes,
        fp.created_at,
        sf.title AS fee_title,
        sf.amount AS total_fee_amount,
        sf.academic_year,
        s.admission_no,
        s.full_name AS student_name,
        CONCAT(c.class_name, ' - ', c.section) AS class_name,
        u.full_name AS collected_by_name
      FROM fee_payments fp
      JOIN student_fees sf ON sf.id = fp.fee_id
      JOIN students s ON s.id = sf.student_id
      JOIN classes c ON c.id = s.class_id
      LEFT JOIN users u ON u.id = fp.collected_by
      WHERE fp.receipt_no = ?
    `, [receiptNo]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    return res.status(200).json({
      success: true,
      receipt: rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// Get student fee details with payment history
async function getStudentFeeDetails(req, res, next) {
  try {
    const studentId = req.params.studentId;

    const [fees] = await pool.query(`
      SELECT 
        sf.id,
        sf.title,
        sf.amount AS total_amount,
        DATE_FORMAT(sf.due_date, '%Y-%m-%d') AS due_date,
        sf.status,
        sf.academic_year,
        COALESCE((SELECT SUM(amount_paid) FROM fee_payments WHERE fee_id = sf.id), 0) AS paid_amount
      FROM student_fees sf
      WHERE sf.student_id = ?
      ORDER BY sf.due_date DESC
    `, [studentId]);

    const [payments] = await pool.query(`
      SELECT 
        fp.id,
        fp.receipt_no,
        fp.amount_paid,
        DATE_FORMAT(fp.payment_date, '%Y-%m-%d') AS payment_date,
        fp.payment_method,
        fp.notes,
        sf.title AS fee_title
      FROM fee_payments fp
      JOIN student_fees sf ON sf.id = fp.fee_id
      WHERE sf.student_id = ?
      ORDER BY fp.payment_date DESC
    `, [studentId]);

    return res.status(200).json({
      success: true,
      fees,
      payments,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllFees,
  createFeeAllocation,
  recordFeePayment,
  getReceiptDetails,
  getStudentFeeDetails,
};
