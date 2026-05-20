# Socket-to-User Mapping System

## Overview

The socket-to-user mapping system maintains bidirectional mappings between Socket.IO socket connections and authenticated users (riders and drivers). This enables the server to efficiently route events to specific users regardless of their socket connection ID.

## Architecture

### Data Structures

Two in-memory Maps maintain the bidirectional relationship:

```javascript
// Socket ID → User Data
socketToUser: Map<string, { userId: string, role: 'rider' | 'driver' }>

// User ID → Socket ID
userToSocket: Map<string, string>
```

### Key Components

#### 1. `registerUser(socketId, userId, role)`

Stores the socket-to-user mapping after successful authentication.

**Features:**
- Handles user reconnection by removing old socket mappings
- Maintains bidirectional mapping consistency
- Logs registration events for debugging

**Called by:** Authentication middleware during connection handshake

#### 2. `handleConnection(socket)`

Handles new socket connections after authentication.

**Features:**
- Emits `authenticated` event to client with user info
- Logs connection events
- Socket is already registered by authentication middleware at this point

#### 3. `handleDisconnection(socket)`

Cleans up mappings when a socket disconnects.

**Features:**
- Removes socket from both Maps
- Handles unauthenticated sockets gracefully
- Logs disconnection events

#### 4. `getUserSocket(userId)`

Retrieves the socket instance for a specific user.

**Returns:**
- Socket instance if user is connected
- `null` if user is not connected or socket not found

#### 5. `emitToUser(userId, eventName, payload)`

Emits an event to a specific user by their user ID.

**Features:**
- Automatically looks up user's socket
- Returns `true` if event was sent, `false` if user not connected
- Logs emission events and warnings

**Use cases:**
- Sending counter-offers to specific riders
- Sending ride acceptance confirmations
- Sending request expiration notifications

#### 6. `emitToDrivers(driverIds, eventName, payload)`

Emits an event to multiple drivers efficiently.

**Features:**
- Broadcasts to all connected drivers in the list
- Handles mix of connected/disconnected drivers
- Returns count of drivers who received the event
- Logs broadcast statistics

**Use cases:**
- Broadcasting ride requests to nearby drivers
- Sending request expiration to all drivers who received a request
- Sending request filled notifications

## Connection Lifecycle

### 1. Initial Connection

```
Client connects → Authentication middleware runs → Token verified → 
registerUser() called → handleConnection() called → 
'authenticated' event emitted to client
```

### 2. User Reconnection

```
Same user connects with new socket → registerUser() detects existing userId → 
Old socket mapping removed → New socket mapping stored → 
User can now receive events on new socket
```

### 3. Disconnection

```
Socket disconnects → handleDisconnection() called → 
Both mappings removed → User no longer receives events
```

## Usage Examples

### Sending Event to Specific User

```javascript
// Send counter-offer to rider
const success = socketServer.emitToUser(
  riderId, 
  'fareCounter', 
  {
    requestId: 'req123',
    driverId: 'driver456',
    counterAmount: 150
  }
);

if (!success) {
  console.log('Rider is offline, event not delivered');
}
```

### Broadcasting to Multiple Drivers

```javascript
// Send ride request to nearby drivers
const nearbyDriverIds = ['driver1', 'driver2', 'driver3'];
const deliveredCount = socketServer.emitToDrivers(
  nearbyDriverIds,
  'rideRequest',
  {
    requestId: 'req123',
    pickup: { lat: 34.5, lng: 69.2 },
    destination: { lat: 34.6, lng: 69.3 },
    proposedFare: 200
  }
);

console.log(`Delivered to ${deliveredCount}/${nearbyDriverIds.length} drivers`);
```

### Checking User Connection Status

```javascript
const socket = socketServer.getUserSocket(userId);
if (socket) {
  console.log('User is connected');
} else {
  console.log('User is offline');
}
```

## Error Handling

### Graceful Degradation

- **User not connected:** `emitToUser()` returns `false` and logs warning
- **Partial delivery:** `emitToDrivers()` returns count of successful deliveries
- **Unauthenticated socket:** `handleDisconnection()` handles gracefully without errors

### Reconnection Handling

- Old socket mappings are automatically cleaned up
- New socket takes precedence immediately
- No duplicate mappings possible

## Testing

Comprehensive test suite covers:
- ✅ Registration and mapping storage
- ✅ Connection and disconnection lifecycle
- ✅ User reconnection scenarios
- ✅ Event emission to single users
- ✅ Event broadcasting to multiple users
- ✅ Error handling for offline users
- ✅ Integration scenarios

Run tests:
```bash
npm test -- socketServer.test.js
```

## Performance Considerations

### Memory Efficiency

- Maps provide O(1) lookup time
- Only stores minimal data: socket IDs and user metadata
- Automatic cleanup on disconnection prevents memory leaks

### Scalability

For production deployments with multiple server instances:
- Consider using Redis for distributed socket-to-user mappings
- Implement sticky sessions or use Socket.IO Redis adapter
- Current in-memory implementation works for single-server deployments

## Requirements Validated

This implementation satisfies the following requirements:

- **Requirement 4.2:** Socket Server SHALL emit Ride_Request to each Nearby_Driver's socket connection
- **Requirement 7.1:** Socket Server SHALL route Counter_Offer to the specific rider who created the Ride_Request

## Related Files

- `socketServer.js` - Main implementation
- `connectionAuth.js` - Authentication middleware that calls `registerUser()`
- `socketServer.test.js` - Comprehensive test suite
- `connectionAuth.test.js` - Authentication tests
