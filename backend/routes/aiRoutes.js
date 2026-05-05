const express = require('express');
const router = express.Router();
const { suggestPrice } = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

// Allow both sellers and admins to test AI pricing
router.post('/suggest-price', protect, authorize('seller', 'admin'), suggestPrice);

module.exports = router;
