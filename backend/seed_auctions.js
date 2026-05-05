const mongoose = require('mongoose');
const Auction = require('./models/Auction');
const User = require('./models/User');

async function seedAuctions() {
  try {
    await mongoose.connect('mongodb://localhost:27017/auctiondb');
    console.log('✅ Connected to MongoDB');

    // Find a seller or admin to be the sellerId
    const seller = await User.findOne({ role: { $in: ['seller', 'admin'] } });
    if (!seller) {
      console.log('❌ No seller or admin found in database. Please run seed.js first.');
      process.exit(1);
    }

    const auctions = [
      {
        title: 'Wilson Official NBA Basketball',
        description: 'Official Wilson NBA game ball, signed by league legends. Genuine leather and professional weight.',
        basePrice: 5000,
        currentBid: 5000,
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        sellerId: seller._id,
        category: 'Sports',
        status: 'active',
        image: '/uploads/auction-1777364105375-245866569.jpg'
      },
      {
        title: 'Gucci Marmont Handbag',
        description: 'A luxury Gucci Marmont shoulder bag in beige quilted leather with iconic gold-tone hardware.',
        basePrice: 3500,
        currentBid: 3500,
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 1d 6h from now
        sellerId: seller._id,
        category: 'Fashion',
        status: 'active',
        image: '/uploads/auction-1777363804981-17760967.png'
      },
      {
        title: 'Patek Philippe Nautilus',
        description: 'An exquisite Patek Philippe Nautilus with a stunning olive green dial and stainless steel bracelet.',
        basePrice: 1200,
        currentBid: 1200,
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // 3d 6h from now
        sellerId: seller._id,
        category: 'Jewelry',
        status: 'active',
        image: '/uploads/auction-1777234948070-625562292.webp'
      }
    ];

    await Auction.deleteMany({}); // Clear existing auctions
    await Auction.insertMany(auctions);

    console.log('🌱 Successfully seeded 3 auctions!');
    
  } catch (error) {
    console.error('❌ Error seeding auctions:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedAuctions();
