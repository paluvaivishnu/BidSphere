const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Auction title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    image: {
      type: String,
      default: null,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Base price cannot be negative'],
    },
    currentBid: {
      type: Number,
      default: 0,
    },
    currentBidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: ['Electronics', 'Fashion', 'Furniture', 'Vehicles', 'Art', 'Jewelry', 'Sports', 'Other'],
      default: 'Other',
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    totalBids: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Virtual: is auction live
auctionSchema.virtual('isLive').get(function () {
  return this.status === 'active' && new Date() < this.endTime;
});

auctionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Auction', auctionSchema);
