# Socket.IO Real-Time Ride Matching

This directory contains the Socket.IO server implementation for real-time ride matching between riders and drivers.

## Components

### `socketServer.js`
Main Socket.IO server class that manages WebSocket connections, handles authentication, routes events between users, and maintains socket-to-user mappings.

**Key Features:**
- CORS configuration for React Native clients
- Support for both WebSocket and polling transports (for poor network conditions)
- In-memory socket-to-user mappings
- Event routing to specific users or groups of drivers
- Automatic reconnection handling

### `connectionAuth.js`
JWT authentication handler for Socket.IO connections.

**Key Features:**
- Verifies JWT tokens during connection handshake
- Extracts userId and role (rider/driver) from tokens
- Rejects invalid, expired, or missing tokens
- Provides middleware for Socket.IO authentication
- Utility methods for token generation (testing)

## Authentication Flow

1. Client connects to Socket.IO server with JWT token
2. `ConnectionAuthenticator` middleware intercepts the connection
3. Token is extracted from `socket.handshake.auth.token` or `socket.handshake.query.token`
4. Token is verified using JWT secret
5. If valid, userId and role are extracted and stored in socket object
6. User is registered in SocketServer mappings
7. Connection is allowed and `authenticated` event is emitted to client
8. If invalid, connection is rejected with error event

## Usage Example

### Server Setup (already configured in `server.js`)

```javascript
const SocketServer = require('./socket/socketServer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const socketServer = new SocketServer(httpServer, JWT_SECRET);
socketServer.initialize();
```

### Client Connection (React Native)

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token-here'
  },
  transports: ['websocket', 'polling']
});

socket.on('authenticated', (data) => {
  console.log('Authenticated:', data);
  // { userId: '...', role: 'rider', message: 'Successfully authenticated' }
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Handle authentication errors
});
```

## Token Format

JWT tokens must contain:
- `id` or `_id`: User ID (string or number)
- `role`: User role ('rider' or 'driver') - defaults to 'rider' if not specified

Example token payload:
```json
{
  "id": "user123",
  "role": "rider",
  "iat": 1234567890,
  "exp": 1234567890
}
```

## Error Handling

### Authentication Errors

| Error Code | Message | Cause |
|------------|---------|-------|
| `AUTH_TOKEN_REQUIRED` | Authentication token is required | No token provided in handshake |
| `AUTH_FAILED` | Invalid authentication token | Token is malformed or signed with wrong secret |
| `AUTH_FAILED` | Authentication token has expired | Token expiration time has passed |
| `AUTH_FAILED` | Token does not contain user ID | Token missing required `id` field |
| `AUTH_FAILED` | Invalid role: {role} | Token contains role other than 'rider' or 'driver' |

### Client Error Handling

```javascript
socket.on('connect_error', (error) => {
  if (error.data?.code === 'AUTH_TOKEN_REQUIRED') {
    // Redirect to login
  } else if (error.data?.code === 'AUTH_FAILED') {
    // Token expired or invalid - refresh token or re-login
  }
});
```

## Testing

Run unit tests:
```bash
npm test -- connectionAuth.test.js
```

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Network Resilience

The Socket.IO server is configured for Afghanistan's challenging network conditions:

- **Transports**: WebSocket (preferred) with polling fallback
- **Ping Timeout**: 60 seconds (allows for high latency)
- **Ping Interval**: 25 seconds (frequent heartbeats)
- **Connect Timeout**: 45 seconds (accommodates slow connections)

## Security Considerations

1. **JWT Secret**: Always use a strong, unique secret in production (set via `JWT_SECRET` environment variable)
2. **Token Expiration**: Tokens should have reasonable expiration times (e.g., 30 days)
3. **CORS**: In production, restrict CORS origins to specific domains instead of `*`
4. **HTTPS**: Always use HTTPS/WSS in production
5. **Token Storage**: Clients should store tokens securely (e.g., secure storage on mobile)

## Future Enhancements

- [ ] Redis adapter for horizontal scaling across multiple server instances
- [ ] Rate limiting for event emissions
- [ ] Automatic token refresh mechanism
- [ ] Connection analytics and monitoring
- [ ] Graceful shutdown handling
