const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Configuration
const BASE_URL = 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

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

function logTest(testName, status, details = '') {
  const statusColor = status === 'PASS' ? 'green' : 'FAIL' ? 'red' : 'yellow';
  const statusSymbol = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '⚠';
  log(`${statusSymbol} ${testName}: ${status}`, statusColor);
  if (details) {
    log(`  ${details}`, 'yellow');
  }
}

async function testDatabaseConnection() {
  log('🔌 Testing Database Connection', 'blue');
  
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      logTest('Database Connection', 'PASS', 'Connected to MongoDB');
      
      // Test basic operations
      const userCount = await User.countDocuments();
      logTest('Database Query', 'PASS', `${userCount} users found`);
      
      await mongoose.disconnect();
      return true;
    } else {
      logTest('Database Connection', 'FAIL', 'No MONGO_URI provided');
      return false;
    }
  } catch (error) {
    logTest('Database Connection', 'FAIL', error.message);
    return false;
  }
}

async function testUserRegistration() {
  log('\n📝 Testing User Registration', 'blue');
  
  const testUser = {
    name: 'Test User Registration',
    email: `test-reg-${Date.now()}@example.com`,
    password: 'test123456',
    role: 'farmer'
  };

  try {
    const response = await axios.post(`${API_BASE}/users/signup`, testUser);
    
    if (response.status === 201 && response.data.success) {
      logTest('User Registration', 'PASS', `User created: ${testUser.email}`);
      logTest('Token Generation', 'PASS', `Token received: ${response.data.token ? 'Yes' : 'No'}`);
      logTest('Refresh Token', 'PASS', `Refresh token received: ${response.data.refreshToken ? 'Yes' : 'No'}`);
      
      return {
        success: true,
        user: response.data.data,
        token: response.data.token,
        refreshToken: response.data.refreshToken
      };
    } else {
      logTest('User Registration', 'FAIL', 'Registration failed');
      return { success: false };
    }
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('User Registration', 'FAIL', error.response.data.message);
    } else {
      logTest('User Registration', 'FAIL', error.message);
    }
    return { success: false };
  }
}

async function testUserLogin() {
  log('\n🔐 Testing User Login', 'blue');
  
  const credentials = {
    email: 'admin@supplylink.com',
    password: 'admin123'
  };

  try {
    const response = await axios.post(`${API_BASE}/users/signin`, credentials);
    
    if (response.status === 200 && response.data.success) {
      logTest('User Login', 'PASS', `Logged in as: ${response.data.data.name}`);
      logTest('Token Generation', 'PASS', `Token received: ${response.data.token ? 'Yes' : 'No'}`);
      
      return {
        success: true,
        user: response.data.data,
        token: response.data.token,
        refreshToken: response.data.refreshToken
      };
    } else {
      logTest('User Login', 'FAIL', 'Login failed');
      return { success: false };
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('User Login', 'FAIL', 'Invalid credentials');
    } else if (error.response?.status === 400) {
      logTest('User Login', 'FAIL', error.response.data.message);
    } else {
      logTest('User Login', 'FAIL', error.message);
    }
    return { success: false };
  }
}

async function testTokenVerification(token) {
  log('\n🔍 Testing Token Verification', 'blue');
  
  if (!token) {
    logTest('Token Verification', 'SKIP', 'No token available');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE}/users/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      logTest('Token Verification', 'PASS', `User verified: ${response.data.data.name}`);
      return true;
    } else {
      logTest('Token Verification', 'FAIL', 'Token verification failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Token Verification', 'FAIL', 'Token expired or invalid');
    } else {
      logTest('Token Verification', 'FAIL', error.response?.data?.message || error.message);
    }
    return false;
  }
}

async function testProtectedRoute(token) {
  log('\n🛡️ Testing Protected Route Access', 'blue');
  
  if (!token) {
    logTest('Protected Route Access', 'SKIP', 'No token available');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      logTest('Protected Route Access', 'PASS', `Profile accessed: ${response.data.name}`);
      return true;
    } else {
      logTest('Protected Route Access', 'FAIL', 'Profile access failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Protected Route Access', 'FAIL', 'Unauthorized access');
    } else {
      logTest('Protected Route Access', 'FAIL', error.response?.data?.message || error.message);
    }
    return false;
  }
}

async function testAdminAccess(token) {
  log('\n👑 Testing Admin Access', 'blue');
  
  if (!token) {
    logTest('Admin Access', 'SKIP', 'No token available');
    return false;
  }

  try {
    const response = await axios.get(`${API_BASE}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200 && response.data.success) {
      logTest('Admin Access', 'PASS', `Admin stats accessed: ${response.data.data.totalUsers} users`);
      return true;
    } else {
      logTest('Admin Access', 'FAIL', 'Admin access failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 403) {
      logTest('Admin Access', 'FAIL', 'Access denied - not admin');
    } else if (error.response?.status === 401) {
      logTest('Admin Access', 'FAIL', 'Unauthorized');
    } else {
      logTest('Admin Access', 'FAIL', error.response?.data?.message || error.message);
    }
    return false;
  }
}

async function testErrorHandling() {
  log('\n❌ Testing Error Handling', 'blue');
  
  // Test invalid email
  try {
    await axios.post(`${API_BASE}/users/signin`, {
      email: 'invalid-email',
      password: 'test123'
    });
    logTest('Invalid Email Rejection', 'FAIL', 'Should have been rejected');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Invalid Email Rejection', 'PASS', 'Correctly rejected invalid email');
    } else {
      logTest('Invalid Email Rejection', 'FAIL', `Unexpected error: ${error.response?.status}`);
    }
  }

  // Test missing fields
  try {
    await axios.post(`${API_BASE}/users/signup`, {
      name: 'Test User'
      // Missing email, password, role
    });
    logTest('Missing Fields Rejection', 'FAIL', 'Should have been rejected');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Missing Fields Rejection', 'PASS', 'Correctly rejected missing fields');
    } else {
      logTest('Missing Fields Rejection', 'FAIL', `Unexpected error: ${error.response?.status}`);
    }
  }

  // Test invalid token
  try {
    await axios.get(`${API_BASE}/users/profile`, {
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      }
    });
    logTest('Invalid Token Rejection', 'FAIL', 'Should have been rejected');
  } catch (error) {
    if (error.response?.status === 401) {
      logTest('Invalid Token Rejection', 'PASS', 'Correctly rejected invalid token');
    } else {
      logTest('Invalid Token Rejection', 'FAIL', `Unexpected error: ${error.response?.status}`);
    }
  }
}

async function runCompleteTest() {
  log('🚀 Starting Complete Authentication Test', 'blue');
  log('==========================================', 'blue');

  // Test 1: Database Connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    log('\n💥 Database connection failed. Please check your MongoDB connection.', 'red');
    return;
  }

  // Test 2: User Registration
  const registrationResult = await testUserRegistration();

  // Test 3: User Login
  const loginResult = await testUserLogin();
  
  if (!loginResult.success) {
    log('\n⚠️  Login failed. Make sure admin user exists. Run: npm run create-admin', 'yellow');
  }

  // Test 4: Token Verification
  const token = loginResult.token || registrationResult.token;
  await testTokenVerification(token);

  // Test 5: Protected Route Access
  await testProtectedRoute(token);

  // Test 6: Admin Access
  await testAdminAccess(token);

  // Test 7: Error Handling
  await testErrorHandling();

  // Summary
  log('\n📊 Test Summary', 'blue');
  log('===============', 'blue');
  
  if (registrationResult.success) {
    log('✅ User registration is working', 'green');
  } else {
    log('❌ User registration has issues', 'red');
  }
  
  if (loginResult.success) {
    log('✅ User login is working', 'green');
  } else {
    log('❌ User login has issues', 'red');
  }
  
  if (token) {
    log('✅ Token generation is working', 'green');
  } else {
    log('❌ Token generation has issues', 'red');
  }

  log('\n🎉 Complete authentication test finished!', 'green');
  
  if (!loginResult.success) {
    log('\n💡 If login failed, try running:', 'yellow');
    log('   cd backend && npm run create-admin', 'yellow');
    log('   cd backend && npm run fix-db', 'yellow');
  }
}

// Run the complete test
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = { runCompleteTest };
