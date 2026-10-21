const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Academic reports
router.get('/enrollment', authenticateToken, authorizeRoles('admin', 'teacher'), reportController.getEnrollmentReport);
router.get('/attendance', authenticateToken, authorizeRoles('admin', 'teacher'), reportController.getAttendanceReport);
router.get('/exams', authenticateToken, authorizeRoles('admin', 'teacher'), reportController.getExamReport);

// Financial reports
router.get('/fees', authenticateToken, authorizeRoles('admin'), reportController.getFeeReport);

// Export CSV
router.get('/export-csv', authenticateToken, authorizeRoles('admin', 'teacher'), reportController.exportReportCSV);

module.exports = router;
