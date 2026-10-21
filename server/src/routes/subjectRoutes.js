const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// View subjects
router.get('/', authenticateToken, authorizeRoles('admin', 'teacher'), subjectController.getAllSubjects);

// Manage subjects: Admin only
router.post('/', authenticateToken, authorizeRoles('admin'), subjectController.createSubject);
router.put('/:id', authenticateToken, authorizeRoles('admin'), subjectController.updateSubject);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), subjectController.deleteSubject);

module.exports = router;
