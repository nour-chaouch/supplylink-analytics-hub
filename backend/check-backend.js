#!/usr/bin/env node

/**
 * Backend Server Status Checker
 * Checks if the backend server is running and responding correctly
 */

const http = require('http');

const PORT = process.env.PORT || 5001;
const HEALTH_URL = `http://localhost:${PORT}/api/health`;

console.log('🔍 Checking backend server status...\n');
console.log(`📍 Port: ${PORT}`);
console.log(`🌐 Health endpoint: ${HEALTH_URL}\n`);

// Check if port is in use
const net = require('net');
const server = net.createServer();

server.once('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('✅ Port 5001 is in use (server likely running)');
    checkHealthEndpoint();
  } else {
    console.log(`❌ Error checking port: ${err.message}`);
    process.exit(1);
  }
});

server.once('listening', () => {
  console.log('❌ Port 5001 is NOT in use - backend server is NOT running');
  console.log('\n📝 To start the backend server, run:');
  console.log('   cd backend');
  console.log('   npm start');
  server.close();
  process.exit(1);
});

server.listen(PORT, () => {
  // This callback means the port is free
});

function checkHealthEndpoint() {
  console.log('\n🏥 Checking health endpoint...\n');
  
  const req = http.get(HEALTH_URL, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        try {
          const response = JSON.parse(data);
          console.log('✅ Backend server is RUNNING and responding correctly!');
          console.log(`   Status: ${response.status}`);
          console.log(`   Message: ${response.message}`);
          console.log(`   Response time: ${Date.now() - startTime}ms`);
          process.exit(0);
        } catch (err) {
          console.log('⚠️  Backend responded but response is not valid JSON');
          console.log(`   Response: ${data}`);
          process.exit(1);
        }
      } else {
        console.log(`❌ Backend responded with status code: ${res.statusCode}`);
        console.log(`   Response: ${data}`);
        process.exit(1);
      }
    });
  });
  
  const startTime = Date.now();
  
  req.on('error', (err) => {
    console.log('❌ Failed to connect to backend server');
    console.log(`   Error: ${err.message}`);
    console.log('\n📝 Possible issues:');
    console.log('   1. Backend server is not running');
    console.log('   2. Backend server is running on a different port');
    console.log('   3. Firewall is blocking the connection');
    console.log('\n💡 To start the backend server:');
    console.log('   cd backend');
    console.log('   npm start');
    process.exit(1);
  });
  
  req.setTimeout(5000, () => {
    req.destroy();
    console.log('❌ Request timed out - backend server may not be responding');
    console.log('\n💡 To start the backend server:');
    console.log('   cd backend');
    console.log('   npm start');
    process.exit(1);
  });
}

