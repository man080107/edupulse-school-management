// Centralized Error Handling Middleware
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.url}:`, err);

  // MySQL Duplicate Entry Error (Code 1062)
  if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
    let duplicateField = 'entry';
    if (err.sqlMessage && err.sqlMessage.includes('admission_no')) {
      duplicateField = 'Student admission number already exists.';
    } else if (err.sqlMessage && err.sqlMessage.includes('employee_id')) {
      duplicateField = 'Teacher employee ID already exists.';
    } else if (err.sqlMessage && err.sqlMessage.includes('email')) {
      duplicateField = 'Email address is already registered.';
    } else if (err.sqlMessage && err.sqlMessage.includes('uq_class_section')) {
      duplicateField = 'Class with this name and section already exists.';
    } else if (err.sqlMessage && err.sqlMessage.includes('uq_student_attendance_date')) {
      duplicateField = 'Attendance for this student on this date has already been recorded.';
    } else if (err.sqlMessage && err.sqlMessage.includes('receipt_no')) {
      duplicateField = 'Receipt number already exists.';
    } else {
      duplicateField = 'A duplicate record already exists.';
    }

    return res.status(409).json({
      success: false,
      message: duplicateField,
      errorType: 'DUPLICATE_ENTRY',
    });
  }

  // MySQL Foreign Key Constraint Error (Code 1451 / 1452)
  if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
    return res.status(409).json({
      success: false,
      message: 'Cannot delete or modify record because it is referenced by existing academic or financial data.',
      errorType: 'FOREIGN_KEY_RESTRICTION',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
    return res.status(400).json({
      success: false,
      message: 'Referenced entity does not exist.',
      errorType: 'INVALID_REFERENCE',
    });
  }

  // Bad Request or Validation Error
  if (err.status === 400 || err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message || 'Invalid input data.',
      errors: err.errors || null,
    });
  }

  // Default to 500 Server Error
  const statusCode = err.statusCode || err.status || 500;
  return res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected server error occurred.'
      : err.message || 'Internal server error.',
  });
}

module.exports = errorHandler;
