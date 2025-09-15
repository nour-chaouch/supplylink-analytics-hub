const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('Connected to MongoDB');
    } else {
      console.log('No MONGO_URI provided, skipping database connection');
      return;
    }

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Administrateur',
      email: 'admin@supplylink.com',
      password: 'admin123', // Change this in production!
      role: 'admin',
      phone: '+1-555-0123',
      address: '123 Admin Street',
      company: 'SupplyLink Analytics',
      bio: 'Administrateur système SupplyLink Analytics'
    });

    console.log('Admin user created successfully:');
    console.log('Email:', adminUser.email);
    console.log('Password: admin123');
    console.log('Role:', adminUser.role);
    console.log('\n⚠️  IMPORTANT: Change the default password in production!');

  } catch (error) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createAdminUser();
