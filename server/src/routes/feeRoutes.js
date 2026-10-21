const express = require('express');
const router = express.Router();
const feeController = require('../controllers/feeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All fee operations are restricted to admin
router.get('/', authenticateToken, authorizeRoles('admin'), feeController.getAllFees);
router.post('/allocate', authenticateToken, authorizeRoles('admin'), feeController.createFeeAllocation);
router.post('/pay', authenticateToken, authorizeRoles('admin'), feeController.recordFeePayment);
router.get('/receipt/:receiptNo', authenticateToken, authorizeRoles('admin'), feeController.getReceiptDetails);
router.get('/student/:studentId', authenticateToken, authorizeRoles('admin'), feeController.getStudentFeeDetails);

module.exports = router;
