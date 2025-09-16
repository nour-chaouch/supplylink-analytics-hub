// Test script to verify authentication persistence
// This can be run in the browser console to test localStorage persistence

console.log('🧪 Testing Authentication Persistence...');

// Check if auth data exists in localStorage
const token = localStorage.getItem('token');
const refreshToken = localStorage.getItem('refreshToken');
const user = localStorage.getItem('user');

console.log('📊 Current localStorage state:');
console.log('Token:', token ? '✅ Present' : '❌ Missing');
console.log('Refresh Token:', refreshToken ? '✅ Present' : '❌ Missing');
console.log('User Data:', user ? '✅ Present' : '❌ Missing');

if (user) {
  try {
    const userData = JSON.parse(user);
    console.log('👤 User Info:', {
      name: userData.name,
      email: userData.email,
      role: userData.role
    });
  } catch (error) {
    console.error('❌ Error parsing user data:', error);
  }
}

// Test Redux store state
if (window.__REDUX_DEVTOOLS_EXTENSION__) {
  console.log('🔧 Redux DevTools available');
} else {
  console.log('⚠️ Redux DevTools not available');
}

console.log('✅ Authentication persistence test completed');

// Helper function to clear all auth data
window.clearAuthData = function() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  console.log('🧹 All authentication data cleared');
};

// Helper function to simulate login
window.simulateLogin = function() {
  const mockUser = {
    _id: 'test123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin'
  };
  
  localStorage.setItem('token', 'mock-token-123');
  localStorage.setItem('refreshToken', 'mock-refresh-token-123');
  localStorage.setItem('user', JSON.stringify(mockUser));
  
  console.log('🔐 Mock login data saved');
  console.log('Reload the page to test persistence');
};

console.log('💡 Available helper functions:');
console.log('  - clearAuthData(): Clear all auth data');
console.log('  - simulateLogin(): Save mock login data');

