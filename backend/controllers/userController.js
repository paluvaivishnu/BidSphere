const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc    Toggle auction in watchlist
// @route   POST /api/users/watchlist/:auctionId
// @access  Private (Buyer)
const toggleWatchlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const auctionId = req.params.auctionId;

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isFavorited = user.watchlist.includes(auctionId);

  if (isFavorited) {
    // Remove from watchlist
    user.watchlist = user.watchlist.filter(id => id.toString() !== auctionId);
  } else {
    // Add to watchlist
    user.watchlist.push(auctionId);
  }

  await user.save();

  res.json({
    success: true,
    message: isFavorited ? 'Removed from watchlist' : 'Added to watchlist',
    watchlist: user.watchlist,
  });
});

// @desc    Get user's watchlist
// @route   GET /api/users/watchlist
// @access  Private (Buyer)
const getWatchlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'watchlist',
    populate: [
      { path: 'sellerId', select: 'name email' },
      { path: 'currentBidder', select: 'name' },
      { path: 'winner', select: 'name email' }
    ]
  });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json({
    success: true,
    data: user.watchlist,
  });
});

// @desc    Get auctions won by user (Transactions)
// @route   GET /api/users/won
// @access  Private (Buyer)
const getWonAuctions = asyncHandler(async (req, res) => {
  const Transaction = require('../models/Transaction');
  
  const wonTransactions = await Transaction.find({ winnerId: req.user._id })
    .populate({
      path: 'auctionId',
      select: 'title image category basePrice endTime',
    })
    .populate({
      path: 'sellerId',
      select: 'name email'
    })
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: wonTransactions,
  });
});

// @desc    Get current user's profile with stats
// @route   GET /api/users/profile
// @access  Private
const getMyProfile = asyncHandler(async (req, res) => {
  const User = require('../models/User');
  const Auction = require('../models/Auction');
  const Bid = require('../models/Bid');
  const Transaction = require('../models/Transaction');

  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  let stats = {};

  if (user.role === 'seller') {
    const myAuctions = await Auction.find({ sellerId: user._id });
    const active = myAuctions.filter(a => a.status === 'active').length;
    const completed = myAuctions.filter(a => a.status === 'completed').length;
    const totalBids = myAuctions.reduce((s, a) => s + (a.totalBids || 0), 0);
    const revenue = myAuctions
      .filter(a => a.status === 'completed' && a.currentBid > 0)
      .reduce((s, a) => s + a.currentBid, 0);
    stats = { totalListings: myAuctions.length, active, completed, totalBids, revenue };
  }

  if (user.role === 'buyer') {
    const myBids = await Bid.find({ userId: user._id });
    const wonTx = await Transaction.find({ winnerId: user._id });
    const totalSpent = wonTx.filter(t => t.paymentStatus === 'paid').reduce((s, t) => s + t.amount, 0);
    stats = {
      totalBidsPlaced: myBids.length,
      auctionsWon: wonTx.length,
      totalSpent,
      watchlistCount: user.watchlist?.length || 0,
    };
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      createdAt: user.createdAt,
      isActive: user.isActive,
      stats,
    }
  });
});

module.exports = {
  toggleWatchlist,
  getWatchlist,
  getWonAuctions,
  getMyProfile,
};
