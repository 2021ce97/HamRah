# Task 9.2: Exponential Backoff Reconnection Implementation

## Overview

This document describes the implementation of exponential backoff reconnection logic for the Socket.IO connection manager in both rider and driver apps.

## Requirements Addressed

- **Requirement 2.3**: Automatic reconnection with exponential backoff up to 30 seconds
- **Requirement 2.5**: Display connection status indicator to user

## Implementation Details

### Exponential Backoff Configuration

The reconnection delays follow a custom exponential backoff pattern:

```typescript
const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000]; // ms
```

This sequence provides:
- **Attempt 1**: 1 second delay (quick recovery for transient issues)
- **Attempt 2**: 2 seconds delay
- **Attempt 3**: 5 seconds delay
- **Attempt 4**: 10 seconds delay
- **Attempt 5+**: 30 seconds delay (capped at maximum)

### Key Features

#### 1. Manual Reconnection Management

The implementation disables Socket.IO's built-in automatic reconnection and implements custom logic to ensure precise control over the reconnection delays:

```typescript
const socket = io(BACKEND_URL, {
  auth: { token: authToken },
  reconnection: false, // Disable automatic reconnection
  transports: ['websocket', 'polling'],
  autoConnect: false,
});
```

#### 2. Reconnection Attempt Tracking

The hook tracks the current reconnection attempt number and exposes it for UI display:

```typescript
const [reconnectionAttempt, setReconnectionAttempt] = useState(0);
```

This counter:
- Increments with each reconnection attempt
- Resets to 0 on successful connection
- Is displayed in the ConnectionStatusIndicator component

#### 3. Connection Status States

The hook exposes three connection states:

- **`connected`**: Socket is successfully connected
- **`disconnected`**: Socket is disconnected and not attempting to reconnect
- **`reconnecting`**: Socket is disconnected and actively attempting to reconnect

#### 4. Smart Reconnection Logic

The `scheduleReconnection` function:
- Clears any existing reconnection timeout to prevent duplicate attempts
- Calculates the appropriate delay based on the attempt number
- Caps the delay at the maximum value (30000ms) for attempts beyond the array length
- Updates the UI state to show "reconnecting" status
- Schedules the next connection attempt

```typescript
const scheduleReconnection = useCallback((attemptNumber: number) => {
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;
  }

  const delayIndex = Math.min(attemptNumber, RECONNECT_DELAYS.length - 1);
  const delay = RECONNECT_DELAYS[delayIndex];

  console.log(`Scheduling reconnection attempt ${attemptNumber + 1} in ${delay}ms`);
  setConnectionStatus('reconnecting');
  setReconnectionAttempt(attemptNumber + 1);

  reconnectTimeoutRef.current = setTimeout(() => {
    reconnectTimeoutRef.current = null;
    
    if (socketRef.current && !socketRef.current.connected) {
      console.log(`Attempting reconnection ${attemptNumber + 1}`);
      socketRef.current.connect();
    }
  }, delay);
}, []);
```

#### 5. Automatic Reconnection Triggers

Reconnection is automatically triggered on:

- **Disconnect events** (except manual disconnects):
  ```typescript
  socket.on('disconnect', (reason) => {
    if (reason !== 'io client disconnect') {
      scheduleReconnection(0);
    }
  });
  ```

- **Connection errors**:
  ```typescript
  socket.on('connect_error', (error) => {
    if (!reconnectTimeoutRef.current && !socket.connected) {
      const currentAttempt = reconnectionAttempt;
      scheduleReconnection(currentAttempt);
    }
  });
  ```

#### 6. Manual Disconnect Handling

When the user manually disconnects, the hook:
- Clears any pending reconnection timeouts
- Resets the reconnection attempt counter
- Does not trigger automatic reconnection

```typescript
const disconnect = useCallback(() => {
  if (reconnectTimeoutRef.current) {
    clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = null;
  }

  if (socketRef.current) {
    socketRef.current.disconnect();
    socketRef.current = null;
    setConnectionStatus('disconnected');
    setIsConnected(false);
    setReconnectionAttempt(0);
  }
}, []);
```

### Connection Status Indicator Component

The `ConnectionStatusIndicator` component displays the connection state to users:

**Features:**
- Color-coded status dot (green/orange/red)
- Status text (Connected/Reconnecting/Disconnected)
- Reconnection attempt counter (shown during reconnecting state)

**Usage:**
```tsx
<ConnectionStatusIndicator
  connectionStatus={connectionStatus}
  isConnected={isConnected}
  reconnectionAttempt={reconnectionAttempt}
/>
```

## Files Modified

### Rider App
- `apps/rider/src/hooks/useSocketConnection.ts` - Updated with exponential backoff logic
- `apps/rider/src/components/ConnectionStatusIndicator.tsx` - Already existed (created in task 9.1)

### Driver App
- `apps/driver/src/hooks/useSocketConnection.ts` - Updated with exponential backoff logic
- `apps/driver/src/components/ConnectionStatusIndicator.tsx` - Already existed (created in task 9.1)

## Testing

Unit tests have been created for both apps:
- `apps/rider/src/hooks/useSocketConnection.test.ts`
- `apps/driver/src/hooks/useSocketConnection.test.ts`

**Test Coverage:**
1. Reconnection attempt count tracking
2. Exponential backoff delay sequence verification
3. Maximum delay capping at 30000ms
4. Reconnection attempt counter reset on successful connection
5. Connection status state transitions
6. Manual disconnect behavior (no automatic reconnection)
7. Reconnection timeout cleanup on manual disconnect
8. Connection status properties exposure for UI

**Note:** These tests require Jest and React Native Testing Library to be configured in the Expo apps. The test files are ready to run once the testing infrastructure is set up.

## Verification Steps

To verify the implementation:

1. **Start the app** and observe the initial connection
2. **Simulate network failure** (e.g., turn off WiFi or disconnect backend)
3. **Observe reconnection attempts** in the console logs:
   - First attempt after 1 second
   - Second attempt after 2 seconds
   - Third attempt after 5 seconds
   - Fourth attempt after 10 seconds
   - Subsequent attempts after 30 seconds
4. **Check the UI** - ConnectionStatusIndicator should show:
   - "Reconnecting..." status
   - Current attempt number
   - Orange status dot
5. **Restore network** and verify:
   - Connection is re-established
   - Status changes to "Connected"
   - Attempt counter resets to 0
   - Green status dot appears

## Design Decisions

### Why Manual Reconnection Management?

Socket.IO's built-in exponential backoff uses a formula-based approach (delay * multiplier^attempt), which doesn't allow for the specific delay sequence required: `[1000, 2000, 5000, 10000, 30000]`.

By implementing manual reconnection management, we have:
- **Precise control** over each delay value
- **Predictable behavior** for testing and debugging
- **Better UX** with a carefully tuned backoff sequence optimized for Afghanistan's network conditions

### Why These Specific Delays?

The delay sequence was chosen to balance:
- **Quick recovery** for transient network issues (1-2 seconds)
- **Reduced server load** for persistent issues (5-30 seconds)
- **User experience** - not too aggressive, not too slow
- **Network conditions** in Afghanistan (high latency, intermittent connectivity)

## Future Enhancements

Potential improvements for future iterations:

1. **Adaptive backoff** - Adjust delays based on network quality metrics
2. **Jitter** - Add random jitter to prevent thundering herd problem
3. **Max attempts limit** - Stop reconnecting after N failed attempts and prompt user
4. **Network state detection** - Use React Native's NetInfo to detect network availability
5. **Reconnection analytics** - Track reconnection patterns for monitoring

## Conclusion

The exponential backoff reconnection implementation provides robust connection management for the real-time ride matching feature, ensuring reliable operation even in challenging network conditions while providing clear feedback to users about connection status.
