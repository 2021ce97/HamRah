# Real-Time Ride Matching - Testing Guide

## Quick Start Testing

### Prerequisites
1. MongoDB running locally or accessible remotely
2. Backend server running on port 5000
3. Rider and Driver apps running on separate devices/emulators

### Step 1: Start the Backend

```bash
cd apps/backend
npm start
```

**Expected Output:**
```
✅ Connected to MongoDB
✅ RideMatcher initialized
✅ TimeoutManager initialized
🚀 Server running on port 5000
🔌 Socket.IO server ready for real-time ride matching
```

### Step 2: Start the Rider App

```bash
cd apps/rider
npm start
```

Then:
1. Open on your device/emulator
2. Navigate to the RideRequestDemo screen
3. Verify the connection status shows "Connected" (green dot)

### Step 3: Start the Driver App

```bash
cd apps/driver
npm start
```

Then:
1. Open on a different device/emulator
2. Navigate to the DriverRequestsDemo screen
3. Verify the connection status shows "Connected" (green dot)

### Step 4: Test the Complete Flow

#### Test Case 1: Basic Ride Request with Counter-Offer

**Rider Side:**
1. Enter pickup coordinates (default: 34.5553, 69.2075 - Kabul)
2. Enter destination coordinates (default: 34.5289, 69.1725)
3. Enter proposed fare (e.g., 500 AFN)
4. Click "Request Ride"
5. Observe:
   - Loading indicator appears
   - Success message shows
   - Countdown timer starts (120 seconds)
   - Request status changes to "pending"

**Driver Side:**
1. Observe ride request card appears showing:
   - Rider name and rating
   - Pickup location
   - Destination location
   - Proposed fare (500 AFN)
   - Estimated distance
2. Click "Counter-Offer"
3. Enter counter amount (e.g., 600 AFN)
4. Click "Submit"
5. Observe success confirmation

**Rider Side (continued):**
1. Observe counter-offer appears in the list
2. Verify it shows:
   - Driver name and rating
   - Counter amount (600 AFN)
   - Elapsed time
3. Click "Accept" on the counter-offer
4. Observe:
   - All other offers dismissed
   - Countdown timer stops
   - Confirmation message appears

**Driver Side (continued):**
1. Observe ride acceptance confirmation
2. Verify card is dismissed

#### Test Case 2: Direct Acceptance (No Counter-Offer)

**Rider Side:**
1. Request a new ride with 700 AFN

**Driver Side:**
1. Click "Accept" directly (without counter-offer)
2. Observe immediate acceptance

**Both Sides:**
1. Verify both receive confirmation
2. Verify ride details are correct

#### Test Case 3: Request Timeout

**Rider Side:**
1. Request a ride

**Driver Side:**
1. Do NOT respond (don't accept or counter-offer)

**Rider Side (continued):**
1. Wait for 120 seconds
2. Observe:
   - Countdown reaches 0
   - "Request Expired" message appears
   - Status changes to "expired"

**Driver Side (continued):**
1. Observe card is automatically dismissed

#### Test Case 4: Multiple Drivers

**Setup:**
1. Open 2-3 driver app instances

**Rider Side:**
1. Request a ride

**All Driver Sides:**
1. Verify all drivers receive the request
2. Have one driver accept
3. Observe other drivers' cards are dismissed with "Request Filled" message

#### Test Case 5: Network Disconnection

**Rider Side:**
1. Request a ride
2. Turn off WiFi/disconnect network
3. Observe:
   - Connection status changes to "Disconnected" (red)
   - Then "Reconnecting..." (orange)
   - Reconnection attempt counter increments
4. Turn WiFi back on
5. Observe:
   - Connection restored (green)
   - Queued events are sent
   - Attempt counter resets to 0

#### Test Case 6: RTL Support (Dari/Pashto)

**Both Apps:**
1. Change device language to Dari (فارسی) or Pashto (پښتو)
2. Restart the app
3. Verify:
   - Layout is right-to-left
   - Numbers display in Persian numerals (۱۲۳۴)
   - Currency formatting is correct
   - Text alignment is appropriate

### Step 5: Verify Database Records

```bash
# Connect to MongoDB
mongosh

# Switch to hamrah database
use hamrah

# Check rides collection
db.rides.find().pretty()

# Verify ride document contains:
# - riderId, driverId
# - pickup, destination coordinates
# - proposedFare, agreedFare
# - counterOffers array
# - status (should be 'Accepted')
# - timestamps

# Check drivers collection
db.drivers.find().pretty()

# Verify driver documents have:
# - status (ONLINE/OFFLINE)
# - currentLocation (GeoJSON Point)
# - socketId
```

## Common Issues and Solutions

### Issue: "Socket connection fails"
**Solution:**
- Verify backend is running on port 5000
- Check `EXPO_PUBLIC_API_URL` in .env files
- Ensure firewall allows connections

### Issue: "No drivers found"
**Solution:**
- Verify driver status is 'ONLINE' in database
- Check driver has valid currentLocation (GeoJSON Point)
- Ensure driver is within 5km of pickup location

### Issue: "Counter-offers not appearing"
**Solution:**
- Check rider's socket is connected
- Verify request hasn't expired
- Check backend logs for routing errors

### Issue: "Map not displaying"
**Solution:**
- Install react-native-maps: `npm install react-native-maps`
- Configure Google Maps API key (if needed)
- Grant location permissions

### Issue: "RTL not working"
**Solution:**
- Verify `supportsRtl: true` in app.json
- Rebuild the app after enabling RTL
- Call `forceRTL(true)` on app startup

## Performance Benchmarks

Expected performance metrics:

- **Connection Time**: < 100ms (local network)
- **Event Latency**: < 50ms (local network)
- **Geospatial Query**: < 100ms (with indexes)
- **Database Write**: < 50ms (with indexes)
- **UI Update**: < 16ms (60 FPS)
- **Map Rendering**: < 500ms

## Test Checklist

### Backend
- [ ] Server starts successfully
- [ ] MongoDB connection established
- [ ] Socket.IO server initialized
- [ ] JWT authentication works
- [ ] RideMatcher finds nearby drivers
- [ ] TimeoutManager expires requests after 120s
- [ ] Event handlers process requests correctly

### Rider App
- [ ] Socket connection establishes
- [ ] Ride request sends successfully
- [ ] Counter-offers are received and sorted
- [ ] Countdown timer works
- [ ] Ride acceptance works
- [ ] Request expiration is handled
- [ ] Map displays route correctly
- [ ] RTL layout works

### Driver App
- [ ] Socket connection establishes
- [ ] Ride requests are received
- [ ] Counter-offer submission works
- [ ] Ride acceptance works
- [ ] Request rejection works
- [ ] Expired/filled requests are removed
- [ ] RTL layout works

### Integration
- [ ] End-to-end ride flow works
- [ ] Multiple drivers receive same request
- [ ] First-acceptance-wins logic works
- [ ] Timeout expiration notifies all parties
- [ ] Network disconnection/reconnection works
- [ ] Event queue flushes on reconnection

## Next Steps After Testing

Once all tests pass:

1. **Add Real Authentication**: Replace mock JWT tokens with real auth
2. **Add Location Services**: Integrate device GPS for real-time location
3. **Add Push Notifications**: Notify users when app is in background
4. **Deploy to Staging**: Test in staging environment
5. **Performance Testing**: Load test with multiple concurrent users
6. **Security Audit**: Review authentication and data validation
7. **Production Deployment**: Deploy to production servers

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review SETUP_GUIDE.md
3. Check IMPLEMENTATION_SUMMARY.md
4. Review design.md and requirements.md
