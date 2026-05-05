const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Transaction = require('../models/Transaction');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalBuyers,
    totalSellers,
    totalAuctions,
    activeAuctions,
    completedAuctions,
    totalBids,
    revenueResult,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'buyer' }),
    User.countDocuments({ role: 'seller' }),
    Auction.countDocuments(),
    Auction.countDocuments({ status: 'active' }),
    Auction.countDocuments({ status: 'completed' }),
    Bid.countDocuments(),
    Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  // Recent activity
  const recentAuctions = await Auction.find()
    .populate('sellerId', 'name')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email role createdAt');

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, buyers: totalBuyers, sellers: totalSellers },
      auctions: { total: totalAuctions, active: activeAuctions, completed: completedAuctions },
      totalBids,
      totalRevenue,
      recentAuctions,
      recentUsers,
    },
  });
});

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, role } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    count: users.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    data: users,
  });
});

// @desc    Update user (role, status, unban)
// @route   PATCH /api/admin/users/:id
// @access  Private (Admin)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (req.body.role) user.role = req.body.role;

  if (typeof req.body.isActive === 'boolean') {
    user.isActive = req.body.isActive;

    // When UNBANNING: fully clear fraud flags so they can bid normally again
    if (req.body.isActive === true) {
      user.isFlagged = false;
      user.fraudViolations = 0;
    }
  }

  await user.save();

  res.json({ success: true, data: user });
});

// @desc    Get all auctions (admin view)
// @route   GET /api/admin/auctions
// @access  Private (Admin)
const getAllAuctions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Auction.countDocuments(query);

  const auctions = await Auction.find(query)
    .populate('sellerId', 'name email')
    .populate('winner', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    success: true,
    count: auctions.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    data: auctions,
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot delete an admin account');
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});

module.exports = { getStats, getUsers, updateUser, getAllAuctions, deleteUser };
