require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
  await connectDB();

  const existingAdmin = await User.findOne({ role: 'admin' });

  if (existingAdmin) {
    console.log(`✅ Admin already exists: ${existingAdmin.email}`);
    process.exit(0);
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@auction.com',
    password: 'Admin@123',
    role: 'admin',
  });

  console.log(`
🌱 Admin seeded successfully!
   Email    : ${admin.email}
   Password : Admin@123
   ⚠️  Change this password after first login!
  `);

  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
