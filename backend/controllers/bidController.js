const asyncHandler = require('express-async-handler');
const Bid = require('../models/Bid');
const Auction = require('../models/Auction');
const AutoBid = require('../models/AutoBid');
const User = require('../models/User');
const { getIO } = require('../sockets/bidSocket');
const sendSMS = require('../utils/sendSMS');

const processAutoBids = async (auctionId) => {
  const auction = await Auction.findById(auctionId);
  if (!auction || auction.status !== 'active') return;

  const autoBids = await AutoBid.find({ auctionId })
    .populate('userId', 'name')
    .sort({ maxAmount: -1, createdAt: 1 });

  if (autoBids.length === 0) return;

  const currentBidderId = auction.currentBidder ? auction.currentBidder.toString() : null;
  const currentBid = auction.currentBid || auction.basePrice;

  const highestAuto = autoBids[0];

  if (currentBidderId === highestAuto.userId._id.toString()) return;

  if (highestAuto.maxAmount >= currentBid + 1) {
    let newCalculatedBid;

    if (autoBids.length > 1) {
      const secondHighest = autoBids[1];
      if (secondHighest.maxAmount >= currentBid + 1) {
        newCalculatedBid = Math.min(secondHighest.maxAmount + 1, highestAuto.maxAmount);
      } else {
        newCalculatedBid = currentBid + 1;
      }
    } else {
      newCalculatedBid = currentBid + 1;
    }

    const bid = await Bid.create({
      auctionId,
      userId: highestAuto.userId._id,
      bidAmount: newCalculatedBid,
    });

    auction.currentBid = newCalculatedBid;
    auction.currentBidder = highestAuto.userId._id;
    auction.totalBids += 1;
    await auction.save();

    // Send Outbid SMS to the person who just got proxy-outbid
    if (currentBidderId && currentBidderId !== highestAuto.userId._id.toString()) {
      const prevBidderUser = await User.findById(currentBidderId);
      if (prevBidderUser && prevBidderUser.phone) {
        sendSMS(
          prevBidderUser.phone, 
          `🚨 BidSphere Alert: You have been temporarily outbid on "${auction.title}" by an Auto-Bidder! The new highest bid is ₹${newCalculatedBid}. Counter-bid: ${process.env.CLIENT_URL || 'http://localhost:5173'}/auctions/${auction._id}`
        );
      }
    }

    const populatedBid = await Bid.findById(bid._id).populate('userId', 'name');

    try {
      getIO().to(auctionId.toString()).emit('bid-update', {
        bid: populatedBid,
        currentBid: newCalculatedBid,
        currentBidder: { _id: highestAuto.userId._id, name: highestAuto.userId.name },
        totalBids: auction.totalBids,
      });
      // Global broadcast — anyone on the platform receives this (e.g. AuctionList activity feed)
      getIO().emit('bid-activity', {
        auctionId: auctionId.toString(),
        auctionTitle: auction.title,
        currentBid: newCalculatedBid,
        currentBidder: { name: highestAuto.userId.name },
        totalBids: auction.totalBids,
      });
    } catch (err) {}
  }
};

// @desc    Place a bid on an auction
// @route   POST /api/bids/:auctionId
// @access  Private (Buyer)
const placeBid = asyncHandler(async (req, res) => {
  const { bidAmount } = req.body;
  const { auctionId } = req.params;

  if (!bidAmount || isNaN(bidAmount)) {
    res.status(400);
    throw new Error('Please provide a valid bid amount');
  }

  // --- Fraud Detection Engine: Phase 1 (Check Flag) ---
  const user = await User.findById(req.user._id);
  if (user && user.isFlagged) {
    res.status(403);
    throw new Error('🚫 Your account has been suspended due to suspicious bidding activity.');
  }

  // --- Fraud Detection Engine: Phase 2 (Velocity Check) ---
  // Look for bids placed in the last 10 seconds across ALL active auctions by this user
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const recentBids = await Bid.countDocuments({
    userId: req.user._id,
    createdAt: { $gte: tenSecondsAgo }
  });

  if (recentBids >= 4) { // Max 4 bids per 10s window
    user.fraudViolations = (user.fraudViolations || 0) + 1;
    
    let errorMessage = 'Slow down! You are placing bids too rapidly.';
    
    // Auto- ban after 3 violations
    if (user.fraudViolations >= 3) {
      user.isFlagged = true;
      errorMessage = '🚫 Account automatically suspended for bot-like spam behavior.';
    }
    
    await user.save();
    res.status(429); // 429 Too Many Requests
    throw new Error(errorMessage);
  }

  const amount = parseFloat(bidAmount);

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  // Must be active
  if (auction.status !== 'active') {
    res.status(400);
    throw new Error('This auction is no longer active');
  }

  // Must not be expired
  if (new Date() > auction.endTime) {
    res.status(400);
    throw new Error('This auction has ended');
  }

  // Seller cannot bid on own auction
  if (auction.sellerId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Sellers cannot bid on their own auctions');
  }

  // Bid must be higher than current bid
  const minBid = auction.currentBid > 0 ? auction.currentBid + 1 : auction.basePrice;
  if (amount < minBid) {
    res.status(400);
    throw new Error(`Bid must be at least ₹${minBid}`);
  }

  // Check if we are outbidding someone specific
  const previousBidderId = auction.currentBidder ? auction.currentBidder.toString() : null;
  const previousBidAmount = auction.currentBid;

  // Create bid document
  const bid = await Bid.create({
    auctionId,
    userId: req.user._id,
    bidAmount: amount,
  });

  // Update auction's current bid
  auction.currentBid = amount;
  auction.currentBidder = req.user._id;
  auction.totalBids += 1;
  await auction.save();

  // Send Outbid SMS to the person who just got outbid
  if (previousBidderId && previousBidderId !== req.user._id.toString()) {
    const prevBidderUser = await User.findById(previousBidderId);
    if (prevBidderUser && prevBidderUser.phone) {
      sendSMS(
        prevBidderUser.phone, 
        `🚨 BidSphere Alert: You have been outbid on "${auction.title}"! The new highest bid is ₹${amount}. Tap here to counter-bid: ${process.env.CLIENT_URL || 'http://localhost:5173'}/auctions/${auction._id}`
      );
    }
  }

  // Populate user for socket broadcast
  const populatedBid = await Bid.findById(bid._id).populate('userId', 'name');

  // Broadcast to all users in this auction room
  try {
    getIO().to(auctionId).emit('bid-update', {
      bid: populatedBid,
      currentBid: amount,
      currentBidder: { _id: req.user._id, name: req.user.name },
      totalBids: auction.totalBids,
    });
    // Global broadcast — anyone on the platform receives this (e.g. AuctionList activity feed)
    getIO().emit('bid-activity', {
      auctionId,
      auctionTitle: auction.title,
      currentBid: amount,
      currentBidder: { name: req.user.name },
      totalBids: auction.totalBids,
    });
  } catch (err) {
    console.error('Socket emit error:', err.message);
  }

  res.status(201).json({
    success: true,
    data: populatedBid,
    currentBid: amount,
  });

  // Trigger proxy bidding check
  await processAutoBids(auctionId);
});

// @desc    Set maximum auto-bid for an auction
// @route   POST /api/bids/:auctionId/auto
// @access  Private (Buyer)
const placeAutoBid = asyncHandler(async (req, res) => {
  const { maxAmount } = req.body;
  const { auctionId } = req.params;

  if (!maxAmount || isNaN(maxAmount)) {
    res.status(400);
    throw new Error('Please provide a valid max amount');
  }

  // --- Fraud Detection Engine: Phase 1 (Check Flag) ---
  const user = await User.findById(req.user._id);
  if (user && user.isFlagged) {
    res.status(403);
    throw new Error('🚫 Your account has been suspended due to suspicious bidding activity.');
  }

  // --- Fraud Detection Engine: Phase 2 (Velocity Check) ---
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const recentBids = await Bid.countDocuments({
    userId: req.user._id,
    createdAt: { $gte: tenSecondsAgo }
  });

  if (recentBids >= 4) { // Max 4 bids or auto-bids equivalent config per 10s window roughly
    user.fraudViolations = (user.fraudViolations || 0) + 1;
    let errorMessage = 'Slow down! You are interacting with the bidding agent too rapidly.';
    if (user.fraudViolations >= 3) {
      user.isFlagged = true;
      errorMessage = '🚫 Account automatically suspended for bot-like spam behavior.';
    }
    await user.save();
    res.status(429);
    throw new Error(errorMessage);
  }

  const limit = parseFloat(maxAmount);
  const auction = await Auction.findById(auctionId);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  if (auction.status !== 'active' || new Date() > auction.endTime) {
    res.status(400);
    throw new Error('This auction is no longer active');
  }

  if (auction.sellerId.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Sellers cannot bid on their own auctions');
  }

  const minBid = auction.currentBid > 0 ? auction.currentBid + 1 : auction.basePrice;
  if (limit < minBid) {
    res.status(400);
    throw new Error(`Auto-bid limit must be at least ₹${minBid}`);
  }

  // Upsert the auto-bid
  await AutoBid.findOneAndUpdate(
    { auctionId, userId: req.user._id },
    { maxAmount: limit },
    { upsert: true, new: true }
  );

  res.json({
    success: true,
    message: `Auto-bid established up to ₹${limit.toLocaleString('en-IN')}`,
  });

  // Calculate proxy
  await processAutoBids(auctionId);
});

// @desc    Get bid history for an auction
// @route   GET /api/bids/:auctionId
// @access  Public
const getBidHistory = asyncHandler(async (req, res) => {
  const bids = await Bid.find({ auctionId: req.params.auctionId })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, count: bids.length, data: bids });
});

// @desc    Get recent bids across all active auctions (for Live Activity feed)
// @route   GET /api/bids/recent
// @access  Public
const getRecentBids = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const bids = await Bid.find({})
    .populate('userId', 'name')
    .populate('auctionId', 'title')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ success: true, data: bids });
});

module.exports = { placeBid, getBidHistory, placeAutoBid, getRecentBids };
