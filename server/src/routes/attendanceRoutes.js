const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Get attendance records
router.get('/', authenticateToken, authorizeRoles('admin', 'teacher'), attendanceController.getAttendanceByClassAndDate);

// Save attendance
router.post('/', authenticateToken, authorizeRoles('admin', 'teacher'), attendanceController.saveAttendance);

// Daily summary
router.get('/summary/daily', authenticateToken, authorizeRoles('admin', 'teacher'), attendanceController.getDailySummary);

// Student attendance history
router.get('/student/:studentId', authenticateToken, authorizeRoles('admin', 'teacher'), attendanceController.getStudentAttendanceHistory);

module.exports = router;
