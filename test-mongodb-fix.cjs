#!/usr/bin/env node

/**
 * MongoDB Connection Diagnostic and Fix Verification Script
 * 
 * This script tests MongoDB Atlas connection and provides detailed diagnostics
 */

const mongoose = require('mongoose');
const dns = require('dns').promises;

const MONGO_URI = 'mongodb+srv://hamah-admin:HamRah122710@hamrah.4infjgw.mongodb.net/hamrah';
const CLUSTER_HOST = 'hamrah.4infjgw.mongodb.net';

console.log('🔍 MongoDB Connection Diagnostic Tool\n');
console.log('=' .repeat(60));

async function testDNSResolution() {
  console.log('\n📡 Step 1: Testing DNS Resolution...');
  try {
    const addresses = await dns.resolve4(CLUSTER_HOST);
    console.log('✅ DNS Resolution: SUCCESS');
    console.log(`   Resolved to: ${addresses.join(', ')}`);
    return true;
  } catch (error) {
    console.log('❌ DNS Resolution: FAILED');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Possible fixes:');
    console.log('   - Check your internet connection');
    console.log('   - Try a different network (mobile hotspot)');
    console.log('   - Check if your firewall is blocking DNS queries');
    return false;
  }
}

async function testMongoDBConnection() {
  console.log('\n🔌 Step 2: Testing MongoDB Connection...');
  
  try {
    // Set a reasonable timeout
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB Connection: SUCCESS');
    console.log(`   Connected to: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    return true;
  } catch (error) {
    console.log('❌ MongoDB Connection: FAILED');
    console.log(`   Error: ${error.message}`);
    
    if (error.message.includes('ETIMEOUT') || error.message.includes('querySrv')) {
      console.log('\n💡 This error means your IP is NOT whitelisted in MongoDB Atlas!');
      console.log('\n🔧 TO FIX THIS:');
      console.log('   1. Go to: https://cloud.mongodb.com/');
      console.log('   2. Log in to your account');
      console.log('   3. Click "Network Access" in left sidebar');
      console.log('   4. Click "Add IP Address"');
      console.log('   5. Select "Allow Access from Anywhere" (0.0.0.0/0)');
      console.log('   6. Click "Confirm"');
      console.log('   7. Wait 2 minutes, then run this script again');
    } else if (error.message.includes('authentication failed')) {
      console.log('\n💡 Authentication error - check username/password');
    } else {
      console.log('\n💡 Unexpected error - check MongoDB Atlas dashboard');
    }
    
    return false;
  }
}

async function testDatabaseOperations() {
  console.log('\n📊 Step 3: Testing Database Operations...');
  
  try {
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Database Query: SUCCESS');
    console.log(`   Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Check if required collections exist
    const collectionNames = collections.map(c => c.name);
    const requiredCollections = ['users', 'drivers', 'rides'];
    const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
    
    if (missingCollections.length > 0) {
      console.log(`\n⚠️  Missing collections: ${missingCollections.join(', ')}`);
      console.log('   These will be created automatically when you use them.');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Database Query: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function checkIndexes() {
  console.log('\n🔍 Step 4: Checking Database Indexes...');
  
  try {
    const db = mongoose.connection.db;
    
    // Check drivers collection indexes
    if (await db.collection('drivers').countDocuments() >= 0) {
      const driverIndexes = await db.collection('drivers').indexes();
      console.log('✅ Drivers collection indexes:');
      driverIndexes.forEach(idx => {
        console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
      
      // Check for required geospatial index
      const hasGeoIndex = driverIndexes.some(idx => 
        idx.key.currentLocation === '2dsphere'
      );
      
      if (!hasGeoIndex) {
        console.log('\n⚠️  Missing geospatial index on drivers.currentLocation');
        console.log('   Run this command to create it:');
        console.log('   db.drivers.createIndex({ currentLocation: "2dsphere" })');
      }
    }
    
    // Check rides collection indexes
    if (await db.collection('rides').countDocuments() >= 0) {
      const rideIndexes = await db.collection('rides').indexes();
      console.log('\n✅ Rides collection indexes:');
      rideIndexes.forEach(idx => {
        console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    }
    
    return true;
  } catch (error) {
    console.log('⚠️  Could not check indexes (collections may not exist yet)');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runDiagnostics() {
  console.log('Starting MongoDB diagnostics...\n');
  
  let allPassed = true;
  
  // Test 1: DNS Resolution
  const dnsOk = await testDNSResolution();
  if (!dnsOk) {
    allPassed = false;
    console.log('\n❌ Diagnostics stopped - DNS resolution failed');
    console.log('   Fix your internet connection or try a different network');
    return;
  }
  
  // Test 2: MongoDB Connection
  const connectionOk = await testMongoDBConnection();
  if (!connectionOk) {
    allPassed = false;
    console.log('\n❌ Diagnostics stopped - MongoDB connection failed');
    console.log('   Follow the fix instructions above');
    return;
  }
  
  // Test 3: Database Operations
  const dbOk = await testDatabaseOperations();
  if (!dbOk) {
    allPassed = false;
  }
  
  // Test 4: Check Indexes
  await checkIndexes();
  
  // Summary
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('\n🎉 All diagnostics passed! MongoDB is ready to use.');
    console.log('\n📋 Next Steps:');
    console.log('   1. If indexes are missing, create them (see above)');
    console.log('   2. Restart your backend: cd apps/backend && node server.js');
    console.log('   3. Run integration tests: node test-ride-matching.cjs');
  } else {
    console.log('\n⚠️  Some diagnostics failed. Review the errors above.');
  }
  console.log('='.repeat(60) + '\n');
  
  // Close connection
  await mongoose.connection.close();
}

// Run diagnostics
runDiagnostics().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
