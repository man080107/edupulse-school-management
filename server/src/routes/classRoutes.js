const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// View classes and enrolled students
router.get('/', authenticateToken, authorizeRoles('admin', 'teacher'), classController.getAllClasses);
router.get('/:id/students', authenticateToken, authorizeRoles('admin', 'teacher'), classController.getClassStudents);

// Manage classes: Admin only
router.post('/', authenticateToken, authorizeRoles('admin'), classController.createClass);
router.put('/:id', authenticateToken, authorizeRoles('admin'), classController.updateClass);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), classController.deleteClass);

module.exports = router;
