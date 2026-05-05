const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

async function setupTestUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/auctiondb');
    console.log('✅ Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('Password@123', salt);

    // Setup Seller
    let seller = await User.findOne({ email: 'seller@test.com' });
    if (!seller) {
      seller = new User({
        name: 'Test Seller',
        email: 'seller@test.com',
        password: 'Password@123',
        role: 'seller'
      });
    } else {
      seller.password = 'Password@123';
      seller.role = 'seller';
    }
    await seller.save();

    // Setup Buyer
    let buyer = await User.findOne({ email: 'buyer@test.com' });
    if (!buyer) {
      buyer = new User({
        name: 'Test Buyer',
        email: 'buyer@test.com',
        password: 'Password@123',
        role: 'buyer'
      });
    } else {
      buyer.password = 'Password@123';
      buyer.role = 'buyer';
    }
    await buyer.save();

    console.log(`
👤 Test Credentials Created:
----------------------------
Role   : SELLER
Email  : seller@test.com
Pass   : Password@123

Role   : BUYER
Email  : buyer@test.com
Pass   : Password@123
----------------------------
    `);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

setupTestUsers();
