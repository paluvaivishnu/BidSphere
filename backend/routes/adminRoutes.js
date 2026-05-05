const express = require('express');
const router = express.Router();
const {
  getStats,
  getUsers,
  updateUser,
  getAllAuctions,
  deleteUser,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes are protected + admin only
router.use(protect, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/auctions', getAllAuctions);

module.exports = router;
