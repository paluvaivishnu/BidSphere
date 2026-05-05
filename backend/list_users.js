const mongoose = require('mongoose');

async function listUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/auctiondb');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    console.log('👤 Users in database:');
    users.forEach(user => {
      console.log(`- ID: ${user._id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

listUsers();
