const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, mockPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes (Buyer only)
router.post('/create-order/:transactionId', protect, authorize('buyer'), createRazorpayOrder);
router.post('/verify', protect, authorize('buyer'), verifyPayment);
router.post('/mock-payment/:transactionId', protect, authorize('buyer'), mockPayment);

module.exports = router;
