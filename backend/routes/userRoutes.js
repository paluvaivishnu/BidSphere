const express = require('express');
const router = express.Router();
const { toggleWatchlist, getWatchlist, getWonAuctions, getMyProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile', protect, getMyProfile);
router.post('/watchlist/:auctionId', protect, authorize('buyer'), toggleWatchlist);
router.get('/watchlist', protect, authorize('buyer'), getWatchlist);
router.get('/won', protect, authorize('buyer'), getWonAuctions);

module.exports = router;
