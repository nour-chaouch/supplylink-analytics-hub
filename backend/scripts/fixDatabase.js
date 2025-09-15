const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
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

async function fixDatabaseIssues() {
  log('🔧 Fixing Database Issues', 'blue');
  log('=========================', 'blue');

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
    
    if (!usersCollection) {
      log('❌ Users collection does not exist', 'red');
      log('Creating users collection...', 'yellow');
      
      // Create the collection by inserting a dummy document
      await User.create({
        name: 'Dummy User',
        email: 'dummy@example.com',
        password: 'dummy123',
        role: 'farmer'
      });
      
      // Remove the dummy user
      await User.deleteOne({ email: 'dummy@example.com' });
      log('✅ Users collection created', 'green');
    }

    // Fix 1: Remove duplicate emails
    log('🔍 Checking for duplicate emails...', 'blue');
    
    const duplicateEmails = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, docs: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicateEmails.length > 0) {
      log(`⚠️  Found ${duplicateEmails.length} duplicate emails`, 'red');
      
      for (const dup of duplicateEmails) {
        log(`   Fixing duplicates for: ${dup._id}`, 'yellow');
        
        // Keep the first document, remove the rest
        const docsToKeep = dup.docs.slice(0, 1);
        const docsToRemove = dup.docs.slice(1);
        
        await User.deleteMany({ _id: { $in: docsToRemove } });
        log(`   ✅ Removed ${docsToRemove.length} duplicate(s)`, 'green');
      }
    } else {
      log('✅ No duplicate emails found', 'green');
    }

    // Fix 2: Fix users with missing or invalid passwords
    log('🔍 Checking for users with password issues...', 'blue');
    
    const usersWithPasswordIssues = await User.find({
      $or: [
        { password: { $exists: false } },
        { password: null },
        { password: '' },
        { password: { $regex: /^(?!\$2[aby]\$)/ } } // Not bcrypt hashed
      ]
    });
    
    if (usersWithPasswordIssues.length > 0) {
      log(`⚠️  Found ${usersWithPasswordIssues.length} users with password issues`, 'red');
      
      for (const user of usersWithPasswordIssues) {
        log(`   Fixing password for: ${user.email}`, 'yellow');
        
        // Set a default password
        const defaultPassword = 'default123';
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(defaultPassword, salt);
        
        await user.save();
        log(`   ✅ Password fixed for ${user.email} (default: ${defaultPassword})`, 'green');
      }
    } else {
      log('✅ No password issues found', 'green');
    }

    // Fix 3: Fix users with missing roles
    log('🔍 Checking for users with missing roles...', 'blue');
    
    const usersWithMissingRoles = await User.find({
      $or: [
        { role: { $exists: false } },
        { role: null },
        { role: '' },
        { role: { $nin: ['farmer', 'retailer', 'transporter', 'manager', 'regulator', 'admin'] } }
      ]
    });
    
    if (usersWithMissingRoles.length > 0) {
      log(`⚠️  Found ${usersWithMissingRoles.length} users with role issues`, 'red');
      
      for (const user of usersWithMissingRoles) {
        log(`   Fixing role for: ${user.email}`, 'yellow');
        
        // Set default role
        user.role = 'farmer';
        await user.save();
        log(`   ✅ Role fixed for ${user.email} (set to: farmer)`, 'green');
      }
    } else {
      log('✅ No role issues found', 'green');
    }

    // Fix 4: Fix users with missing names
    log('🔍 Checking for users with missing names...', 'blue');
    
    const usersWithMissingNames = await User.find({
      $or: [
        { name: { $exists: false } },
        { name: null },
        { name: '' }
      ]
    });
    
    if (usersWithMissingNames.length > 0) {
      log(`⚠️  Found ${usersWithMissingNames.length} users with missing names`, 'red');
      
      for (const user of usersWithMissingNames) {
        log(`   Fixing name for: ${user.email}`, 'yellow');
        
        // Generate name from email
        const emailName = user.email.split('@')[0];
        user.name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        await user.save();
        log(`   ✅ Name fixed for ${user.email} (set to: ${user.name})`, 'green');
      }
    } else {
      log('✅ No name issues found', 'green');
    }

    // Fix 5: Create indexes if they don't exist
    log('🔍 Checking and creating indexes...', 'blue');
    
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true });
      log('✅ Email index created/verified', 'green');
    } catch (indexError) {
      if (indexError.code === 11000) {
        log('⚠️  Email index already exists (duplicate key)', 'yellow');
      } else {
        log(`❌ Error creating email index: ${indexError.message}`, 'red');
      }
    }

    // Fix 6: Test user creation and login
    log('🧪 Testing user creation and login...', 'blue');
    
    const testEmail = `test-fix-${Date.now()}@example.com`;
    
    try {
      // Test user creation
      const testUser = await User.create({
        name: 'Test Fix User',
        email: testEmail,
        password: 'test123456',
        role: 'admin'
      });
      
      log('✅ User creation test passed', 'green');
      
      // Test login
      const foundUser = await User.findOne({ email: testEmail }).select('+password');
      if (foundUser) {
        const passwordMatch = await foundUser.matchPassword('test123456');
        if (passwordMatch) {
          log('✅ User login test passed', 'green');
        } else {
          log('❌ Password matching failed', 'red');
        }
      }
      
      // Clean up
      await User.deleteOne({ _id: testUser._id });
      log('✅ Test user cleaned up', 'green');
      
    } catch (testError) {
      log(`❌ Test failed: ${testError.message}`, 'red');
    }

    // Summary
    log('\n📊 Database Fix Summary', 'blue');
    log('=======================', 'blue');
    
    const totalUsers = await User.countDocuments();
    log(`Total users in database: ${totalUsers}`, 'yellow');
    
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    log('Users by role:', 'yellow');
    usersByRole.forEach(role => {
      log(`   - ${role._id}: ${role.count}`, 'yellow');
    });

    log('\n🎉 Database fixes completed!', 'green');

  } catch (error) {
    log(`💥 Database fix failed: ${error.message}`, 'red');
  } finally {
    await mongoose.disconnect();
    log('🔌 Disconnected from MongoDB', 'blue');
  }
}

// Run the fix
if (require.main === module) {
  fixDatabaseIssues().catch(console.error);
}

module.exports = { fixDatabaseIssues };
