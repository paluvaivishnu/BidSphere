const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Auction',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bidAmount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [0, 'Bid amount cannot be negative'],
    },
  },
  { timestamps: true }
);

// Index for fast retrieval of bids per auction
bidSchema.index({ auctionId: 1, createdAt: -1 });

module.exports = mongoose.model('Bid', bidSchema);
