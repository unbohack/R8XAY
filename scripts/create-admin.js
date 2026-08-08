require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to:', mongoose.connection.host);

    const email = process.env.ADMIN_EMAIL || 'admin@techservices.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin already exists:', existing.email);
    } else {
      const created = await User.create({ name: 'Admin', email, password, role: 'admin' });
      console.log('Admin created:', created.email);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
