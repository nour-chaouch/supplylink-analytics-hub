const axios = require('axios');
const jwt = require('jsonwebtoken');

// Configuration
const BASE_URL = 'http://localhost:5001';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUser = {
  name: 'Test Admin',
  email: 'testadmin@supplylink.com',
  password: 'test123456',
  role: 'admin'
};

const testCredentials = {
  email: 'testadmin@supplylink.com',
  password: 'test123456'
};

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
  const statusColor = status === 'PASS' ? 'green' : 'red';
  const statusSymbol = status === 'PASS' ? '✓' : '✗';
  log(`${statusSymbol} ${testName}: ${status}`, statusColor);
  if (details) {
    log(`  ${details}`, 'yellow');
  }
}

async function testJWTAuthentication() {
  log('🚀 Starting JWT Authentication Tests', 'blue');
  log('=====================================', 'blue');

  let authToken = null;
  let refreshToken = null;

  try {
    // Test 1: Register a new user
    log('\n📝 Test 1: User Registration', 'blue');
    try {
      const registerResponse = await axios.post(`${API_BASE}/users/signup`, testUser);
      
      if (registerResponse.status === 201 && registerResponse.data.success) {
        authToken = registerResponse.data.token;
        refreshToken = registerResponse.data.refreshToken;
        logTest('User Registration', 'PASS', `Token received: ${authToken ? 'Yes' : 'No'}`);
        logTest('Refresh Token', 'PASS', `Refresh token received: ${refreshToken ? 'Yes' : 'No'}`);
        
        // Verify token structure
        const decoded = jwt.decode(authToken);
        if (decoded && decoded.id) {
          logTest('Token Structure', 'PASS', `User ID: ${decoded.id}`);
        } else {
          logTest('Token Structure', 'FAIL', 'Invalid token structure');
        }
      } else {
        logTest('User Registration', 'FAIL', 'Registration failed');
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        logTest('User Registration', 'PASS', 'User already exists (expected)');
      } else {
        logTest('User Registration', 'FAIL', error.response?.data?.message || error.message);
      }
    }

    // Test 2: User Login
    log('\n🔐 Test 2: User Login', 'blue');
    try {
      const loginResponse = await axios.post(`${API_BASE}/users/signin`, testCredentials);
      
      if (loginResponse.status === 200 && loginResponse.data.success) {
        authToken = loginResponse.data.token;
        refreshToken = loginResponse.data.refreshToken;
        logTest('User Login', 'PASS', `Token received: ${authToken ? 'Yes' : 'No'}`);
        logTest('User Data', 'PASS', `Name: ${loginResponse.data.data.name}, Role: ${loginResponse.data.data.role}`);
      } else {
        logTest('User Login', 'FAIL', 'Login failed');
      }
    } catch (error) {
      logTest('User Login', 'FAIL', error.response?.data?.message || error.message);
    }

    // Test 3: Token Verification
    log('\n🔍 Test 3: Token Verification', 'blue');
    if (authToken) {
      try {
        const verifyResponse = await axios.get(`${API_BASE}/users/verify`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (verifyResponse.status === 200 && verifyResponse.data.success) {
          logTest('Token Verification', 'PASS', `User verified: ${verifyResponse.data.data.name}`);
        } else {
          logTest('Token Verification', 'FAIL', 'Token verification failed');
        }
      } catch (error) {
        logTest('Token Verification', 'FAIL', error.response?.data?.message || error.message);
      }
    } else {
      logTest('Token Verification', 'SKIP', 'No token available');
    }

    // Test 4: Protected Route Access
    log('\n🛡️ Test 4: Protected Route Access', 'blue');
    if (authToken) {
      try {
        const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (profileResponse.status === 200) {
          logTest('Profile Access', 'PASS', `Profile retrieved for: ${profileResponse.data.name}`);
        } else {
          logTest('Profile Access', 'FAIL', 'Profile access failed');
        }
      } catch (error) {
        logTest('Profile Access', 'FAIL', error.response?.data?.message || error.message);
      }
    } else {
      logTest('Profile Access', 'SKIP', 'No token available');
    }

    // Test 5: Admin Route Access
    log('\n👑 Test 5: Admin Route Access', 'blue');
    if (authToken) {
      try {
        const adminStatsResponse = await axios.get(`${API_BASE}/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (adminStatsResponse.status === 200 && adminStatsResponse.data.success) {
          logTest('Admin Stats Access', 'PASS', `Stats retrieved: ${adminStatsResponse.data.data.totalUsers} users`);
        } else {
          logTest('Admin Stats Access', 'FAIL', 'Admin access failed');
        }
      } catch (error) {
        if (error.response?.status === 403) {
          logTest('Admin Stats Access', 'FAIL', 'Access denied - not admin');
        } else {
          logTest('Admin Stats Access', 'FAIL', error.response?.data?.message || error.message);
        }
      }
    } else {
      logTest('Admin Stats Access', 'SKIP', 'No token available');
    }

    // Test 6: Token Refresh
    log('\n🔄 Test 6: Token Refresh', 'blue');
    if (refreshToken) {
      try {
        const refreshResponse = await axios.post(`${API_BASE}/users/refresh`, {
          refreshToken: refreshToken
        });
        
        if (refreshResponse.status === 200 && refreshResponse.data.success) {
          const newToken = refreshResponse.data.token;
          const newRefreshToken = refreshResponse.data.refreshToken;
          logTest('Token Refresh', 'PASS', `New token received: ${newToken ? 'Yes' : 'No'}`);
          logTest('Refresh Token Update', 'PASS', `New refresh token: ${newRefreshToken ? 'Yes' : 'No'}`);
          
          // Update tokens for further tests
          authToken = newToken;
          refreshToken = newRefreshToken;
        } else {
          logTest('Token Refresh', 'FAIL', 'Token refresh failed');
        }
      } catch (error) {
        logTest('Token Refresh', 'FAIL', error.response?.data?.message || error.message);
      }
    } else {
      logTest('Token Refresh', 'SKIP', 'No refresh token available');
    }

    // Test 7: Invalid Token Handling
    log('\n❌ Test 7: Invalid Token Handling', 'blue');
    try {
      const invalidResponse = await axios.get(`${API_BASE}/users/profile`, {
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

    // Test 8: No Token Handling
    log('\n🚫 Test 8: No Token Handling', 'blue');
    try {
      const noTokenResponse = await axios.get(`${API_BASE}/users/profile`);
      logTest('No Token Rejection', 'FAIL', 'Should have been rejected');
    } catch (error) {
      if (error.response?.status === 401) {
        logTest('No Token Rejection', 'PASS', 'Correctly rejected request without token');
      } else {
        logTest('No Token Rejection', 'FAIL', `Unexpected error: ${error.response?.status}`);
      }
    }

    log('\n🎉 JWT Authentication Tests Completed!', 'green');
    log('=====================================', 'green');

  } catch (error) {
    log(`\n💥 Test suite failed: ${error.message}`, 'red');
  }
}

// Run the tests
if (require.main === module) {
  testJWTAuthentication().catch(console.error);
}

module.exports = { testJWTAuthentication };
