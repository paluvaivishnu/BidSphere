const mongoose = require('mongoose');

async function checkDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/auctiondb');
    console.log('✅ Successfully connected to MongoDB at mongodb://localhost:27017/auctiondb\n');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Database Collections & Document Counts:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(` - ${collection.name}: ${count} document(s)`);
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkDB();
