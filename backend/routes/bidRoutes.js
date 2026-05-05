const express = require('express');
const router = express.Router();
const { placeBid, getBidHistory, placeAutoBid, getRecentBids } = require('../controllers/bidController');
const { protect, authorize } = require('../middleware/auth');

router.post('/:auctionId/auto', protect, authorize('buyer'), placeAutoBid);

router.post('/:auctionId', protect, authorize('buyer', 'admin'), placeBid);
router.get('/recent', getRecentBids);          // must be BEFORE /:auctionId
router.get('/:auctionId', getBidHistory);

module.exports = router;
