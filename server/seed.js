const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  const existing = await User.findOne({ $or: [{ email: 'admin@gmail.com' }, { username: 'admin' }] });
  if (existing) {
    existing.isAdmin = true; existing.isActive = true;
    if (!existing.email) existing.email = 'admin@gmail.com';
    await existing.save();
    console.log('Admin promoted:', existing.name);
  } else {
    await User.create({ name: 'Admin', username: 'admin', email: 'admin@gmail.com', password: 'admin123', role: 'Administrator', color: '#6366F1', isAdmin: true });
    console.log('Admin created!');
  }
  console.log('Email: admin@gmail.com | Password: admin123');
  mongoose.disconnect();
}
seed().catch(console.error);
