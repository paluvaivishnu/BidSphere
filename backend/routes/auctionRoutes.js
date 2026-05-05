const express = require('express');
const router = express.Router();
const {
  getAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  endAuction,
  getMyAuctions,
} = require('../controllers/auctionController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAuctions);
router.get('/my', protect, authorize('seller', 'admin'), getMyAuctions);
router.get('/:id', getAuctionById);
router.post('/', protect, authorize('seller', 'admin'), upload.single('image'), createAuction);
router.put('/:id/end', protect, authorize('seller', 'admin'), endAuction);
router.put('/:id', protect, authorize('seller', 'admin'), upload.single('image'), updateAuction);
router.delete('/:id', protect, authorize('seller', 'admin'), deleteAuction);

module.exports = router;
