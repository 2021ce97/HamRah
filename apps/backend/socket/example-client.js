/**
 * Example Socket.IO Client for Testing Authentication
 * 
 * This script demonstrates how to connect to the Socket.IO server
 * with JWT authentication from a Node.js client.
 * 
 * Usage:
 *   node socket/example-client.js
 */

const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Configuration
const SERVER_URL = 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'hamrah_super_secret_key_2026';

// Generate a test token
function generateTestToken(userId, role) {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Test Case 1: Valid Rider Connection
function testValidRiderConnection() {
  console.log('\n=== Test 1: Valid Rider Connection ===');
  
  const token = generateTestToken('rider123', 'rider');
  console.log('Generated token:', token.substring(0, 50) + '...');
  
  const socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('✅ Connected to server, socket ID:', socket.id);
  });
  
  socket.on('authenticated', (data) => {
    console.log('✅ Authentication successful:', data);
    socket.disconnect();
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    if (error.data) {
      console.error('   Error code:', error.data.code);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from server');
  });
}

// Test Case 2: Valid Driver Connection
function testValidDriverConnection() {
  console.log('\n=== Test 2: Valid Driver Connection ===');
  
  const token = generateTestToken('driver456', 'driver');
  console.log('Generated token:', token.substring(0, 50) + '...');
  
  const socket = io(SERVER_URL, {
    auth: { token },
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('✅ Connected to server, socket ID:', socket.id);
  });
  
  socket.on('authenticated', (data) => {
    console.log('✅ Authentication successful:', data);
    socket.disconnect();
  });
  
  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    if (error.data) {
      console.error('   Error code:', error.data.code);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from server');
  });
}

// Test Case 3: Missing Token
function testMissingToken() {
  console.log('\n=== Test 3: Missing Token (Should Fail) ===');
  
  const socket = io(SERVER_URL, {
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('❌ Should not connect without token');
  });
  
  socket.on('authenticated', (data) => {
    console.log('❌ Should not authenticate without token');
  });
  
  socket.on('connect_error', (error) => {
    console.log('✅ Expected error:', error.message);
    if (error.data) {
      console.log('   Error code:', error.data.code);
    }
  });
}

// Test Case 4: Invalid Token
function testInvalidToken() {
  console.log('\n=== Test 4: Invalid Token (Should Fail) ===');
  
  const socket = io(SERVER_URL, {
    auth: { token: 'invalid-token-string' },
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('❌ Should not connect with invalid token');
  });
  
  socket.on('authenticated', (data) => {
    console.log('❌ Should not authenticate with invalid token');
  });
  
  socket.on('connect_error', (error) => {
    console.log('✅ Expected error:', error.message);
    if (error.data) {
      console.log('   Error code:', error.data.code);
    }
  });
}

// Test Case 5: Expired Token
function testExpiredToken() {
  console.log('\n=== Test 5: Expired Token (Should Fail) ===');
  
  const expiredToken = jwt.sign(
    { id: 'user789', role: 'rider' },
    JWT_SECRET,
    { expiresIn: '-1h' } // Already expired
  );
  
  const socket = io(SERVER_URL, {
    auth: { token: expiredToken },
    transports: ['websocket', 'polling']
  });
  
  socket.on('connect', () => {
    console.log('❌ Should not connect with expired token');
  });
  
  socket.on('authenticated', (data) => {
    console.log('❌ Should not authenticate with expired token');
  });
  
  socket.on('connect_error', (error) => {
    console.log('✅ Expected error:', error.message);
    if (error.data) {
      console.log('   Error code:', error.data.code);
    }
  });
}

// Run tests sequentially with delays
async function runTests() {
  console.log('🚀 Starting Socket.IO Authentication Tests');
  console.log('Server URL:', SERVER_URL);
  console.log('Make sure the server is running: npm start');
  
  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  testValidRiderConnection();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  testValidDriverConnection();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  testMissingToken();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  testInvalidToken();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  testExpiredToken();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n✅ All tests completed');
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
