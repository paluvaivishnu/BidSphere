const cron = require('node-cron');
const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendWinnerEmail, sendSellerEmail } = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');

const finalizeExpiredAuctions = async (io) => {
  try {
    // Find all active auctions that have expired
    const expiredAuctions = await Auction.find({
      status: 'active',
      endTime: { $lte: new Date() },
    }).populate('sellerId', 'name email');

    if (expiredAuctions.length === 0) return;

    console.log(`⏰ Finalizing ${expiredAuctions.length} expired auction(s)...`);

    for (const auction of expiredAuctions) {
      // Find the highest bid
      const highestBid = await Bid.findOne({ auctionId: auction._id })
        .sort({ bidAmount: -1 })
        .populate('userId', 'name email phone');

      if (highestBid) {
        // Auction has a winner
        auction.status = 'completed';
        auction.winner = highestBid.userId._id;
        auction.currentBid = highestBid.bidAmount;
        await auction.save();

        // Create transaction record
        await Transaction.create({
          auctionId: auction._id,
          winnerId: highestBid.userId._id,
          sellerId: auction.sellerId._id,
          amount: highestBid.bidAmount,
          paymentStatus: 'pending',
        });

        // Send winner email
        await sendWinnerEmail(
          highestBid.userId.email,
          highestBid.userId.name,
          auction.title,
          highestBid.bidAmount
        );

        // Send winner SMS
        if (highestBid.userId.phone) {
          sendSMS(
            highestBid.userId.phone,
            `🏆 BidSphere: Congratulations ${highestBid.userId.name.split(' ')[0]}! You won "${auction.title}" for ₹${highestBid.bidAmount}. Tap to complete your payment now: ${process.env.CLIENT_URL || 'http://localhost:5173'}/won-auctions`
          );
        }

        // Send seller email
        if (auction.sellerId && auction.sellerId.email) {
          await sendSellerEmail(
            auction.sellerId.email,
            auction.sellerId.name,
            auction.title,
            highestBid.bidAmount,
            highestBid.userId.name
          );
        }

        // Broadcast auction ended to all in this room
        if (io) {
          io.to(auction._id.toString()).emit('auction-ended', {
            auctionId: auction._id,
            winner: {
              _id: highestBid.userId._id,
              name: highestBid.userId.name,
            },
            finalBid: highestBid.bidAmount,
            title: auction.title,
          });
        }

        console.log(`✅ Auction "${auction.title}" finalized. Winner: ${highestBid.userId.name} with ₹${highestBid.bidAmount}`);
      } else {
        // No bids → cancel
        auction.status = 'completed';
        await auction.save();

        if (io) {
          io.to(auction._id.toString()).emit('auction-ended', {
            auctionId: auction._id,
            winner: null,
            finalBid: 0,
            title: auction.title,
          });
        }

        console.log(`ℹ️ Auction "${auction.title}" ended with no bids.`);
      }
    }
  } catch (error) {
    console.error('❌ Error in auction finalizer:', error.message);
  }
};

const startAuctionFinalizer = (io) => {
  // Run every minute
  cron.schedule('* * * * *', () => {
    finalizeExpiredAuctions(io);
  });
  console.log('⏰ Auction finalizer cron job started (runs every minute)');
};

module.exports = { startAuctionFinalizer };
