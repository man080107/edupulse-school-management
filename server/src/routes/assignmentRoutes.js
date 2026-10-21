const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// View assignments
router.get('/', authenticateToken, authorizeRoles('admin', 'teacher'), assignmentController.getAllAssignments);
router.get('/my-classes', authenticateToken, authorizeRoles('teacher'), assignmentController.getMyAssignedClasses);

// Manage assignments: Admin only
router.post('/', authenticateToken, authorizeRoles('admin'), assignmentController.createAssignment);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), assignmentController.deleteAssignment);

module.exports = router;
