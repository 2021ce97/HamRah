#!/usr/bin/env node

/**
 * MongoDB Connection Diagnostic Tool
 * Tests MongoDB Atlas connection and provides detailed diagnostics
 */

const mongoose = require('mongoose');
const dns = require('dns').promises;

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://hamah-admin:HamRah122710@hamrah.4infjgw.mongodb.net/hamrah?appName=HamRah';

console.log('🔍 MongoDB Connection Diagnostic Tool\n');
console.log('═'.repeat(60));
console.log('\n📋 Connection Details:');
console.log(`URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
console.log(`Cluster: hamrah.4infjgw.mongodb.net`);
console.log(`Database: hamrah\n`);

async function testDNS() {
  console.log('🌐 Step 1: Testing DNS Resolution...');
  try {
    const records = await dns.resolveSrv('_mongodb._tcp.hamrah.4infjgw.mongodb.net');
    console.log('✅ DNS Resolution: SUCCESS');
    console.log(`   Found ${records.length} MongoDB servers`);
    records.forEach((record, i) => {
      console.log(`   Server ${i + 1}: ${record.name}:${record.port}`);
    });
    return true;
  } catch (error) {
    console.log('❌ DNS Resolution: FAILED');
    console.log(`   Error: ${error.message}`);
    console.log('\n💡 Possible causes:');
    console.log('   - Internet connection issue');
    console.log('   - DNS server not responding');
    console.log('   - Firewall blocking DNS queries');
    console.log('   - VPN interfering with connection');
    return false;
  }
}

async function testConnection() {
  console.log('\n🔌 Step 2: Testing MongoDB Connection...');
  
  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  try {
    await mongoose.connect(MONGO_URI, options);
    console.log('✅ MongoDB Connection: SUCCESS');
    console.log(`   Connected to: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Ready State: ${mongoose.connection.readyState}`);
    
    // Test a simple query
    console.log('\n📊 Step 3: Testing Database Query...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Database Query: SUCCESS');
    console.log(`   Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.log('❌ MongoDB Connection: FAILED');
    console.log(`   Error: ${error.message}`);
    console.log(`   Error Code: ${error.code || 'N/A'}`);
    
    console.log('\n💡 Possible causes:');
    if (error.message.includes('ETIMEOUT') || error.message.includes('ECONNREFUSED')) {
      console.log('   - Your IP address is not whitelisted in MongoDB Atlas');
      console.log('   - Firewall blocking port 27017');
      console.log('   - Network connectivity issue');
    } else if (error.message.includes('authentication failed')) {
      console.log('   - Incorrect username or password');
      console.log('   - User does not have access to this database');
    } else {
      console.log('   - Unknown connection issue');
    }
    
    console.log('\n🔧 Solutions:');
    console.log('   1. Add your IP to MongoDB Atlas whitelist:');
    console.log('      - Go to https://cloud.mongodb.com/');
    console.log('      - Click "Network Access"');
    console.log('      - Click "Add IP Address"');
    console.log('      - Add your current IP or 0.0.0.0/0 for testing');
    console.log('   2. Check your internet connection');
    console.log('   3. Try disabling VPN if you\'re using one');
    console.log('   4. Check Windows Firewall settings');
    
    return false;
  }
}

async function checkIndexes() {
  console.log('\n📑 Step 4: Checking Database Indexes...');
  
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    
    const db = mongoose.connection.db;
    
    // Check drivers collection
    const driversIndexes = await db.collection('drivers').indexes();
    console.log('\n✅ Drivers Collection Indexes:');
    driversIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Check rides collection
    const ridesIndexes = await db.collection('rides').indexes();
    console.log('\n✅ Rides Collection Indexes:');
    ridesIndexes.forEach(index => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Check if required indexes exist
    const has2dsphere = driversIndexes.some(idx => idx.key.currentLocation === '2dsphere');
    const hasRiderIndex = ridesIndexes.some(idx => idx.key.riderId === 1);
    
    if (!has2dsphere) {
      console.log('\n⚠️  Missing required index: drivers.currentLocation (2dsphere)');
      console.log('   Run: db.drivers.createIndex({ currentLocation: "2dsphere" })');
    }
    
    if (!hasRiderIndex) {
      console.log('\n⚠️  Missing required index: rides.riderId');
      console.log('   Run: db.rides.createIndex({ riderId: 1, status: 1 })');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.log('❌ Could not check indexes (connection failed)');
  }
}

async function runDiagnostics() {
  try {
    const dnsOk = await testDNS();
    
    if (!dnsOk) {
      console.log('\n❌ DNS resolution failed. Cannot proceed with connection test.');
      console.log('\n🔧 Try these solutions:');
      console.log('   1. Check your internet connection');
      console.log('   2. Try using Google DNS (8.8.8.8, 8.8.4.4)');
      console.log('   3. Restart your router');
      console.log('   4. Try a different network (mobile hotspot)');
      process.exit(1);
    }
    
    const connectionOk = await testConnection();
    
    if (connectionOk) {
      await checkIndexes();
      console.log('\n' + '═'.repeat(60));
      console.log('\n🎉 All diagnostics passed! MongoDB is ready to use.\n');
      process.exit(0);
    } else {
      console.log('\n' + '═'.repeat(60));
      console.log('\n❌ Connection failed. Please fix the issues above.\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run diagnostics
runDiagnostics();
