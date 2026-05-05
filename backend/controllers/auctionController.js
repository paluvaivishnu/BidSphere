const asyncHandler = require('express-async-handler');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const path = require('path');

// @desc    Get all active auctions (with search/filter/sort)
// @route   GET /api/auctions
// @access  Public
const getAuctions = asyncHandler(async (req, res) => {
  const { search, category, status, sort, page = 1, limit = 12 } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (category) query.category = category;
  if (status) query.status = status;
  else query.status = 'active';

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { currentBid: 1 },
    'price-desc': { currentBid: -1 },
    'ending-soon': { endTime: 1 },
  };

  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Auction.countDocuments(query);

  const auctions = await Auction.find(query)
    .populate('sellerId', 'name email')
    .populate('currentBidder', 'name')
    .populate('winner', 'name')
    .sort(sortBy)
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    count: auctions.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    data: auctions,
  });
});

// @desc    Get single auction with bid history
// @route   GET /api/auctions/:id
// @access  Public
const getAuctionById = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
    .populate('sellerId', 'name email')
    .populate('currentBidder', 'name')
    .populate('winner', 'name email');

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  const bids = await Bid.find({ auctionId: auction._id })
    .populate('userId', 'name')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({
    success: true,
    data: { ...auction.toJSON(), bids },
  });
});

// @desc    Create auction listing
// @route   POST /api/auctions
// @access  Private (Seller)
const createAuction = asyncHandler(async (req, res) => {
  const { title, description, basePrice, endTime, category } = req.body;

  if (!title || !description || !basePrice || !endTime) {
    res.status(400);
    throw new Error('Please provide title, description, basePrice, and endTime');
  }

  const end = new Date(endTime);
  if (end <= new Date()) {
    res.status(400);
    throw new Error('End time must be in the future');
  }

  const imageUrl = req.file
    ? `/uploads/${req.file.filename}`
    : null;

  const auction = await Auction.create({
    title,
    description,
    basePrice: parseFloat(basePrice),
    currentBid: parseFloat(basePrice),
    endTime: end,
    sellerId: req.user._id,
    category: category || 'Other',
    image: imageUrl,
  });

  res.status(201).json({
    success: true,
    data: auction,
  });
});

// @desc    Update auction
// @route   PUT /api/auctions/:id
// @access  Private (Seller - own, Admin)
const updateAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  // Only seller (own) or admin can update
  if (
    auction.sellerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to update this auction');
  }

  if (auction.status !== 'active') {
    res.status(400);
    throw new Error('Cannot update a completed or cancelled auction');
  }

  const { title, description, category, status } = req.body;
  if (title) auction.title = title;
  if (description) auction.description = description;
  if (category) auction.category = category;
  if (status && req.user.role === 'admin') auction.status = status;

  if (req.file) {
    auction.image = `/uploads/${req.file.filename}`;
  }

  const updated = await auction.save();

  res.json({ success: true, data: updated });
});

// @desc    Delete auction (seller = own, admin = any)
// @route   DELETE /api/auctions/:id
// @access  Private (Seller - own, Admin)
const deleteAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id);

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  // Seller can only delete own auctions; admin can delete any
  if (
    auction.sellerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to delete this auction');
  }

  await Bid.deleteMany({ auctionId: auction._id });
  await auction.deleteOne();

  res.json({ success: true, message: 'Auction deleted successfully' });
});

// @desc    End auction early (seller = own, admin = any)
// @route   PUT /api/auctions/:id/end
// @access  Private (Seller - own, Admin)
const endAuction = asyncHandler(async (req, res) => {
  const auction = await Auction.findById(req.params.id)
    .populate('currentBidder', 'name email');

  if (!auction) {
    res.status(404);
    throw new Error('Auction not found');
  }

  if (
    auction.sellerId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to end this auction');
  }

  if (auction.status !== 'active') {
    res.status(400);
    throw new Error('Auction is already ended');
  }

  // Mark as completed, set endTime to now, assign winner if there are bids
  auction.status = 'completed';
  auction.endTime = new Date();
  if (auction.currentBidder) {
    auction.winner = auction.currentBidder._id || auction.currentBidder;
  }

  await auction.save();

  res.json({ success: true, data: auction, message: 'Auction ended successfully' });
});

// @desc    Get seller's own auctions
// @route   GET /api/auctions/my
// @access  Private (Seller)
const getMyAuctions = asyncHandler(async (req, res) => {
  const auctions = await Auction.find({ sellerId: req.user._id })
    .populate('currentBidder', 'name')
    .populate('winner', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: auctions.length, data: auctions });
});

module.exports = {
  getAuctions,
  getAuctionById,
  createAuction,
  updateAuction,
  deleteAuction,
  endAuction,
  getMyAuctions,
};
