#!/usr/bin/env node

/**
 * Real-Time Ride Matching - Integration Test Script
 * 
 * This script tests the complete ride matching flow by simulating
 * rider and driver interactions through Socket.IO.
 * 
 * Usage:
 *   node test-ride-matching.cjs
 * 
 * Prerequisites:
 *   - Backend server running on port 5000
 *   - MongoDB running and accessible
 */

const { io } = require('socket.io-client');
const jwt = require('jsonwebtoken');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Test configuration
const TEST_CONFIG = {
  riderUserId: 'test-rider-001',
  driverUserId: 'test-driver-001',
  pickup: { lat: 34.5553, lng: 69.2075, landmarkName: 'Kabul Airport' },
  destination: { lat: 34.5289, lng: 69.1725, landmarkName: 'City Center' },
  proposedFare: 500,
  counterAmount: 600,
};

// Generate test JWT tokens
function generateToken(userId, role) {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: '1h' });
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, message) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (message) console.log(`   ${message}`);
  
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

// Test 1: Rider Connection
async function testRiderConnection() {
  return new Promise((resolve) => {
    console.log('\n📱 Test 1: Rider Socket Connection');
    
    const riderToken = generateToken(TEST_CONFIG.riderUserId, 'rider');
    const riderSocket = io(BACKEND_URL, {
      auth: { token: riderToken },
      transports: ['websocket'],
    });

    const timeout = setTimeout(() => {
      logTest('Rider Connection', false, 'Connection timeout after 5 seconds');
      riderSocket.disconnect();
      resolve(null);
    }, 5000);

    riderSocket.on('connect', () => {
      clearTimeout(timeout);
      logTest('Rider Connection', true, `Connected with socket ID: ${riderSocket.id}`);
      resolve(riderSocket);
    });

    riderSocket.on('connect_error', (error) => {
      clearTimeout(timeout);
      logTest('Rider Connection', false, `Connection error: ${error.message}`);
      resolve(null);
    });
  });
}

// Test 2: Driver Connection
async function testDriverConnection() {
  return new Promise((resolve) => {
    console.log('\n🚗 Test 2: Driver Socket Connection');
    
    const driverToken = generateToken(TEST_CONFIG.driverUserId, 'driver');
    const driverSocket = io(BACKEND_URL, {
      auth: { token: driverToken },
      transports: ['websocket'],
    });

    const timeout = setTimeout(() => {
      logTest('Driver Connection', false, 'Connection timeout after 5 seconds');
      driverSocket.disconnect();
      resolve(null);
    }, 5000);

    driverSocket.on('connect', () => {
      clearTimeout(timeout);
      logTest('Driver Connection', true, `Connected with socket ID: ${driverSocket.id}`);
      resolve(driverSocket);
    });

    driverSocket.on('connect_error', (error) => {
      clearTimeout(timeout);
      logTest('Driver Connection', false, `Connection error: ${error.message}`);
      resolve(null);
    });
  });
}

// Test 3: Ride Request
async function testRideRequest(riderSocket, driverSocket) {
  return new Promise((resolve) => {
    console.log('\n🚕 Test 3: Ride Request Flow');

    if (!riderSocket || !driverSocket) {
      logTest('Ride Request', false, 'Sockets not connected');
      resolve(null);
      return;
    }

    let requestId = null;
    let driverReceivedRequest = false;
    let riderReceivedConfirmation = false;

    // Driver listens for ride request
    driverSocket.on('rideRequest', (data) => {
      driverReceivedRequest = true;
      requestId = data.requestId;
      logTest('Driver Receives Request', true, `Request ID: ${requestId}`);
      
      // Check if rider also got confirmation
      if (riderReceivedConfirmation) {
        resolve(requestId);
      }
    });

    // Rider listens for confirmation
    riderSocket.on('requestRideSuccess', (data) => {
      riderReceivedConfirmation = true;
      requestId = data.requestId;
      logTest('Rider Request Confirmation', true, `Request ID: ${requestId}`);
      
      // Check if driver also got the request
      setTimeout(() => {
        if (driverReceivedRequest) {
          resolve(requestId);
        } else {
          logTest('Ride Request', false, 'Driver did not receive request');
          resolve(null);
        }
      }, 1000);
    });

    // Rider emits ride request
    riderSocket.emit('requestRide', {
      pickup: TEST_CONFIG.pickup,
      destination: TEST_CONFIG.destination,
      proposedFare: TEST_CONFIG.proposedFare,
      riderProfile: {
        name: 'Test Rider',
        rating: 4.8,
      },
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!requestId) {
        logTest('Ride Request', false, 'No response after 5 seconds');
        resolve(null);
      }
    }, 5000);
  });
}

// Test 4: Counter-Offer
async function testCounterOffer(riderSocket, driverSocket, requestId) {
  return new Promise((resolve) => {
    console.log('\n💰 Test 4: Counter-Offer Flow');

    if (!riderSocket || !driverSocket || !requestId) {
      logTest('Counter-Offer', false, 'Prerequisites not met');
      resolve(false);
      return;
    }

    let riderReceivedOffer = false;
    let driverReceivedConfirmation = false;

    // Rider listens for counter-offer
    riderSocket.on('fareCounter', (data) => {
      riderReceivedOffer = true;
      logTest('Rider Receives Counter-Offer', true, 
        `Amount: ${data.counterAmount} AFN from driver ${data.driverName}`);
      
      if (driverReceivedConfirmation) {
        resolve(true);
      }
    });

    // Driver listens for confirmation
    driverSocket.on('fareCounterSuccess', (data) => {
      driverReceivedConfirmation = true;
      logTest('Driver Counter-Offer Confirmation', true, 'Counter-offer submitted successfully');
      
      setTimeout(() => {
        if (riderReceivedOffer) {
          resolve(true);
        } else {
          logTest('Counter-Offer', false, 'Rider did not receive counter-offer');
          resolve(false);
        }
      }, 1000);
    });

    // Driver emits counter-offer
    driverSocket.emit('fareCounter', {
      requestId,
      driverId: TEST_CONFIG.driverUserId,
      counterAmount: TEST_CONFIG.counterAmount,
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!riderReceivedOffer || !driverReceivedConfirmation) {
        logTest('Counter-Offer', false, 'Incomplete flow after 5 seconds');
        resolve(false);
      }
    }, 5000);
  });
}

// Test 5: Ride Acceptance
async function testRideAcceptance(riderSocket, driverSocket, requestId) {
  return new Promise((resolve) => {
    console.log('\n✅ Test 5: Ride Acceptance Flow');

    if (!riderSocket || !driverSocket || !requestId) {
      logTest('Ride Acceptance', false, 'Prerequisites not met');
      resolve(false);
      return;
    }

    let riderReceivedConfirmation = false;
    let driverReceivedConfirmation = false;

    // Rider listens for acceptance confirmation
    riderSocket.on('rideAccepted', (data) => {
      riderReceivedConfirmation = true;
      logTest('Rider Acceptance Confirmation', true, 
        `Ride accepted with fare: ${data.acceptedFare} AFN`);
      
      if (driverReceivedConfirmation) {
        resolve(true);
      }
    });

    // Driver listens for acceptance confirmation
    driverSocket.on('rideAccepted', (data) => {
      driverReceivedConfirmation = true;
      logTest('Driver Acceptance Confirmation', true, 
        `Ride accepted with fare: ${data.acceptedFare} AFN`);
      
      setTimeout(() => {
        if (riderReceivedConfirmation) {
          resolve(true);
        } else {
          logTest('Ride Acceptance', false, 'Rider did not receive confirmation');
          resolve(false);
        }
      }, 1000);
    });

    // Rider emits acceptance
    riderSocket.emit('rideAccepted', {
      requestId,
      driverId: TEST_CONFIG.driverUserId,
      acceptedFare: TEST_CONFIG.counterAmount,
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!riderReceivedConfirmation || !driverReceivedConfirmation) {
        logTest('Ride Acceptance', false, 'Incomplete flow after 5 seconds');
        resolve(false);
      }
    }, 5000);
  });
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Real-Time Ride Matching Integration Tests\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test Rider ID: ${TEST_CONFIG.riderUserId}`);
  console.log(`Test Driver ID: ${TEST_CONFIG.driverUserId}\n`);
  console.log('═'.repeat(60));

  try {
    // Test 1: Rider Connection
    const riderSocket = await testRiderConnection();
    
    // Test 2: Driver Connection
    const driverSocket = await testDriverConnection();
    
    // Test 3: Ride Request
    const requestId = await testRideRequest(riderSocket, driverSocket);
    
    // Test 4: Counter-Offer
    if (requestId) {
      await testCounterOffer(riderSocket, driverSocket, requestId);
    }
    
    // Test 5: Ride Acceptance
    if (requestId) {
      await testRideAcceptance(riderSocket, driverSocket, requestId);
    }

    // Cleanup
    if (riderSocket) riderSocket.disconnect();
    if (driverSocket) driverSocket.disconnect();

  } catch (error) {
    console.error('\n❌ Test execution error:', error);
  }

  // Print summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 Test Summary\n');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.tests.length) * 100).toFixed(1)}%\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed! The ride matching system is working correctly.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
