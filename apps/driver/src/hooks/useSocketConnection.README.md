# useSocketConnection Hook

A React hook for managing Socket.IO connections in the HamRah driver app with automatic reconnection, event queuing, and connection status tracking.

## Features

- **Automatic Connection Management**: Connects on mount, disconnects on unmount
- **Exponential Backoff Reconnection**: Automatically reconnects with delays up to 30 seconds
- **Event Queuing**: Queues events during disconnection and flushes on reconnection
- **Event Subscription Restoration**: Re-subscribes to all event handlers after reconnection
- **Connection Status Tracking**: Provides real-time connection status
- **JWT Authentication**: Authenticates Socket.IO connection with JWT token

## Usage

```typescript
import { useSocketConnection } from '@/hooks/useSocketConnection';

function MyComponent() {
  const authToken = 'your-jwt-token';
  const socket = useSocketConnection(authToken);

  useEffect(() => {
    // Listen for events
    const handleRideRequest = (data: any) => {
      console.log('Received ride request:', data);
    };

    socket.on('rideRequest', handleRideRequest);

    // Cleanup
    return () => {
      socket.off('rideRequest', handleRideRequest);
    };
  }, [socket]);

  const sendCounterOffer = async () => {
    try {
      await socket.emit('fareCounter', {
        requestId: '123',
        driverId: '456',
        counterAmount: 100,
      });
      console.log('Counter-offer sent');
    } catch (error) {
      console.error('Failed to send counter-offer:', error);
    }
  };

  return (
    <View>
      <Text>Status: {socket.connectionStatus}</Text>
      <Text>Connected: {socket.isConnected ? 'Yes' : 'No'}</Text>
      <Button title="Send Counter-Offer" onPress={sendCounterOffer} />
    </View>
  );
}
```

## API

### ConnectionManager Interface

```typescript
interface ConnectionManager {
  connect: () => void;
  disconnect: () => void;
  emit: (eventName: string, payload: any) => Promise<void>;
  on: (eventName: string, handler: Function) => void;
  off: (eventName: string, handler: Function) => void;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}
```

### Methods

- **connect()**: Manually connect to the Socket.IO server (auto-called on mount)
- **disconnect()**: Manually disconnect from the Socket.IO server
- **emit(eventName, payload)**: Emit an event to the server (queues if disconnected)
- **on(eventName, handler)**: Register an event listener
- **off(eventName, handler)**: Unregister an event listener

### Properties

- **isConnected**: Boolean indicating if the socket is currently connected
- **connectionStatus**: Current connection status ('connected' | 'disconnected' | 'reconnecting')

## Configuration

The hook uses the following configuration:

- **Backend URL**: `process.env.EXPO_PUBLIC_API_URL` (defaults to `http://localhost:3000`)
- **Reconnection Delays**: `[1000, 2000, 5000, 10000, 30000]` ms (exponential backoff)
- **Max Retry Attempts**: 3 attempts for queued events
- **Transports**: WebSocket (primary), Polling (fallback)

## Event Queue

When the socket is disconnected, events are automatically queued and will be sent when the connection is restored. Events that fail after 3 retry attempts will be logged and dropped.

## Reconnection Behavior

The hook implements exponential backoff reconnection:
1. First attempt: 1 second delay
2. Second attempt: 2 seconds delay
3. Third attempt: 5 seconds delay
4. Fourth attempt: 10 seconds delay
5. Fifth+ attempts: 30 seconds delay (max)

## Requirements Validated

- **Requirement 2.1**: Establishes Socket.IO connection on app launch
- **Requirement 2.2**: Maintains stable connection with automatic reconnection
- **Requirement 2.6**: Emits authentication event with JWT token on connection
