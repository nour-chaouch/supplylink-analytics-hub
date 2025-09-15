const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function diagnoseDatabase() {
  log('🔍 Diagnosing Database Issues', 'blue');
  log('==============================', 'blue');

  try {
    // Connect to MongoDB
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      log('✅ Connected to MongoDB', 'green');
    } else {
      log('❌ No MONGO_URI provided', 'red');
      return;
    }

    // Check if users collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const usersCollection = collections.find(col => col.name === 'users');
    
    if (usersCollection) {
      log('✅ Users collection exists', 'green');
      
      // Check collection stats
      const stats = await mongoose.connection.db.collection('users').stats();
      log(`📊 Collection stats:`, 'blue');
      log(`   - Document count: ${stats.count}`, 'yellow');
      log(`   - Size: ${(stats.size / 1024).toFixed(2)} KB`, 'yellow');
      
      // Check for existing users
      const existingUsers = await User.find({}).limit(5);
      log(`👥 Existing users (first 5):`, 'blue');
      
      if (existingUsers.length > 0) {
        existingUsers.forEach((user, index) => {
          log(`   ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`, 'yellow');
        });
      } else {
        log('   No users found in collection', 'yellow');
      }
      
      // Check for duplicate emails
      const duplicateEmails = await User.aggregate([
        { $group: { _id: '$email', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } }
      ]);
      
      if (duplicateEmails.length > 0) {
        log('⚠️  Duplicate emails found:', 'red');
        duplicateEmails.forEach(dup => {
          log(`   - ${dup._id}: ${dup.count} occurrences`, 'red');
        });
      } else {
        log('✅ No duplicate emails found', 'green');
      }
      
      // Check schema validation issues
      log('🔍 Checking schema validation...', 'blue');
      
      try {
        // Try to create a test user to check schema
        const testUser = new User({
          name: 'Test User',
          email: 'test@example.com',
          password: 'test123',
          role: 'farmer'
        });
        
        await testUser.validate();
        log('✅ Schema validation passed', 'green');
        
        // Clean up test user
        await User.deleteOne({ email: 'test@example.com' });
        
      } catch (validationError) {
        log('❌ Schema validation failed:', 'red');
        log(`   ${validationError.message}`, 'red');
      }
      
    } else {
      log('❌ Users collection does not exist', 'red');
    }

    // Check indexes
    log('🔍 Checking indexes...', 'blue');
    const indexes = await User.collection.getIndexes();
    log(`📋 Indexes found: ${Object.keys(indexes).length}`, 'yellow');
    
    Object.keys(indexes).forEach(indexName => {
      const index = indexes[indexName];
      log(`   - ${indexName}: ${JSON.stringify(index.key)}`, 'yellow');
    });

    // Test user creation
    log('🧪 Testing user creation...', 'blue');
    
    const testEmail = `test-${Date.now()}@example.com`;
    try {
      const testUser = await User.create({
        name: 'Test User',
        email: testEmail,
        password: 'test123456',
        role: 'farmer'
      });
      
      log('✅ User creation test passed', 'green');
      log(`   Created user: ${testUser.name} (${testUser.email})`, 'yellow');
      
      // Clean up
      await User.deleteOne({ _id: testUser._id });
      log('✅ Test user cleaned up', 'green');
      
    } catch (createError) {
      log('❌ User creation test failed:', 'red');
      log(`   ${createError.message}`, 'red');
      
      if (createError.code === 11000) {
        log('   This is a duplicate key error (email already exists)', 'red');
      }
    }

    // Test user login
    log('🔐 Testing user login...', 'blue');
    
    try {
      // Create a test user for login test
      const loginTestUser = await User.create({
        name: 'Login Test User',
        email: `login-test-${Date.now()}@example.com`,
        password: 'test123456',
        role: 'admin'
      });
      
      // Test login
      const foundUser = await User.findOne({ email: loginTestUser.email }).select('+password');
      
      if (foundUser) {
        const passwordMatch = await foundUser.matchPassword('test123456');
        if (passwordMatch) {
          log('✅ User login test passed', 'green');
        } else {
          log('❌ Password matching failed', 'red');
        }
      } else {
        log('❌ User not found for login test', 'red');
      }
      
      // Clean up
      await User.deleteOne({ _id: loginTestUser._id });
      log('✅ Login test user cleaned up', 'green');
      
    } catch (loginError) {
      log('❌ User login test failed:', 'red');
      log(`   ${loginError.message}`, 'red');
    }

  } catch (error) {
    log(`💥 Database diagnosis failed: ${error.message}`, 'red');
  } finally {
    await mongoose.disconnect();
    log('🔌 Disconnected from MongoDB', 'blue');
  }
}

// Run the diagnosis
if (require.main === module) {
  diagnoseDatabase().catch(console.error);
}

module.exports = { diagnoseDatabase };
