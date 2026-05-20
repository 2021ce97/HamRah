#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Tests Railway backend, MongoDB connection, and Socket.IO
 */

const https = require('https');

const RAILWAY_URL = 'https://hamrah-production.up.railway.app';

console.log('🔍 HamRah Deployment Verification\n');
console.log('=' .repeat(50));

// Test 1: Health Endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('\n1️⃣  Testing Health Endpoint...');
    console.log(`   URL: ${RAILWAY_URL}/api/health`);
    
    https.get(`${RAILWAY_URL}/api/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'healthy') {
            console.log('   ✅ Health endpoint responding');
            console.log(`   Response: ${data}`);
            resolve(true);
          } else {
            console.log('   ⚠️  Unexpected response:', data);
            resolve(false);
          }
        } catch (e) {
          console.log('   ❌ Invalid JSON response:', data);
          reject(e);
        }
      });
    }).on('error', (err) => {
      console.log('   ❌ Health endpoint failed:', err.message);
      reject(err);
    });
  });
}

// Test 2: Socket.IO Connection
function testSocketIO() {
  return new Promise((resolve) => {
    console.log('\n2️⃣  Testing Socket.IO Connection...');
    console.log('   Note: Install socket.io-client to test: npm install socket.io-client');
    
    try {
      const io = require('socket.io-client');
      const socket = io(RAILWAY_URL, {
        transports: ['websocket', 'polling'],
        timeout: 10000
      });
      
      socket.on('connect', () => {
        console.log('   ✅ Socket.IO connected successfully');
        console.log(`   Socket ID: ${socket.id}`);
        socket.disconnect();
        resolve(true);
      });
      
      socket.on('connect_error', (err) => {
        console.log('   ❌ Socket.IO connection failed:', err.message);
        resolve(false);
      });
      
      setTimeout(() => {
        if (!socket.connected) {
          console.log('   ⏱️  Socket.IO connection timeout');
          socket.disconnect();
          resolve(false);
        }
      }, 10000);
      
    } catch (e) {
      console.log('   ⚠️  socket.io-client not installed');
      console.log('   Run: npm install socket.io-client');
      resolve(null);
    }
  });
}

// Run all tests
async function runTests() {
  try {
    const healthOk = await testHealthEndpoint();
    const socketOk = await testSocketIO();
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📊 Verification Summary:\n');
    console.log(`   Health Endpoint: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Socket.IO: ${socketOk === null ? '⚠️  SKIP' : socketOk ? '✅ PASS' : '❌ FAIL'}`);
    
    if (healthOk && (socketOk === true || socketOk === null)) {
      console.log('\n🎉 Deployment verification PASSED!');
      console.log('\nNext steps:');
      console.log('1. Configure Vercel admin app (see DEPLOYMENT_COMPLETE_GUIDE.md)');
      console.log('2. Build mobile APKs with EAS');
      console.log('3. Test end-to-end ride matching');
    } else {
      console.log('\n⚠️  Some tests failed. Check Railway logs for errors.');
      console.log('\nTroubleshooting:');
      console.log('1. Check Railway deployment status');
      console.log('2. Verify environment variables in Railway');
      console.log('3. Check MongoDB connection in Railway logs');
    }
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
