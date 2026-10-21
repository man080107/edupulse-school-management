const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Examination catalog
router.get('/', authenticateToken, authorizeRoles('admin', 'teacher'), examController.getAllExams);
router.post('/', authenticateToken, authorizeRoles('admin'), examController.createExam);
router.delete('/:examId', authenticateToken, authorizeRoles('admin'), examController.deleteExam);

// Marks sheet and entry
router.get('/:examId/marks', authenticateToken, authorizeRoles('admin', 'teacher'), examController.getExamMarks);
router.post('/:examId/marks', authenticateToken, authorizeRoles('admin', 'teacher'), examController.saveExamMarks);

// Student report card
router.get('/student/:studentId/report-card', authenticateToken, authorizeRoles('admin', 'teacher'), examController.getStudentResultCard);

module.exports = router;
