const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  // Updated: kawadesidhhi@gmail.com as admin
  const existing = await User.findOne({
    $or: [{ email: 'kawadesidhhi@gmail.com' }, { email: 'admin@gmail.com' }, { username: 'admin' }]
  });

  if (existing) {
    existing.isAdmin    = true;
    existing.isActive   = true;
    existing.isApproved = true;
    existing.email      = 'kawadesidhhi@gmail.com';
    await existing.save();
    console.log('✅ Admin updated:', existing.name);
  } else {
    await User.create({
      name:       'Admin',
      username:   'admin_skilli',
      email:      'kawadesidhhi@gmail.com',
      password:   'admin123',
      role:       'Administrator',
      color:      '#6366F1',
      isAdmin:    true,
      isActive:   true,
      isApproved: true,
    });
    console.log('✅ Admin created!');
  }

  console.log('─────────────────────────────────');
  console.log('  Email   : kawadesidhhi@gmail.com');
  console.log('  Password: admin123');
  console.log('─────────────────────────────────');
  mongoose.disconnect();
}

seed().catch(console.error);