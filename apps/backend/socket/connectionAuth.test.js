/**
 * Unit Tests for ConnectionAuthenticator
 * 
 * Tests JWT authentication for Socket.IO connections including:
 * - Valid token authentication
 * - Invalid token rejection
 * - Expired token handling
 * - Missing token handling
 * - Role validation
 */

const ConnectionAuthenticator = require('./connectionAuth');
const jwt = require('jsonwebtoken');

describe('ConnectionAuthenticator', () => {
  const TEST_SECRET = 'test-secret-key-for-jwt';
  let authenticator;
  
  beforeEach(() => {
    authenticator = new ConnectionAuthenticator(TEST_SECRET);
  });
  
  describe('constructor', () => {
    it('should throw error if JWT secret is not provided', () => {
      expect(() => new ConnectionAuthenticator()).toThrow('JWT secret is required');
      expect(() => new ConnectionAuthenticator(null)).toThrow('JWT secret is required');
      expect(() => new ConnectionAuthenticator('')).toThrow('JWT secret is required');
    });
    
    it('should create authenticator with valid secret', () => {
      const auth = new ConnectionAuthenticator(TEST_SECRET);
      expect(auth).toBeInstanceOf(ConnectionAuthenticator);
      expect(auth.jwtSecret).toBe(TEST_SECRET);
    });
  });
  
  describe('authenticate', () => {
    it('should authenticate valid token with userId and role', async () => {
      const token = jwt.sign(
        { id: 'user123', role: 'rider' },
        TEST_SECRET,
        { expiresIn: '1h' }
      );
      
      const result = await authenticator.authenticate(token);
      
      expect(result).toEqual({
        userId: 'user123',
        role: 'rider'
      });
    });
    
    it('should authenticate token with driver role', async () => {
      const token = jwt.sign(
        { id: 'driver456', role: 'driver' },
        TEST_SECRET,
        { expiresIn: '1h' }
      );
      
      const result = await authenticator.authenticate(token);
      
      expect(result).toEqual({
        userId: 'driver456',
        role: 'driver'
      });
    });
    
    it('should default to rider role if role not specified', async () => {
      const token = jwt.sign(
        { id: 'user789' },
        TEST_SECRET,
        { expiresIn: '1h' }
      );
      
      const result = await authenticator.authenticate(token);
      
      expect(result).toEqual({
        userId: 'user789',
        role: 'rider'
      });
    });
    
    it('should handle _id field for backward compatibility', async () => {
      const token = jwt.sign(
        { _id: 'user999', role: 'rider' },
        TEST_SECRET,
        { expiresIn: '1h' }
      );
      
      const result = await authenticator.authenticate(token);
      
      expect(result).toEqual({
        userId: 'user999',
        role: 'rider'
      });
    });
    
    it('should throw error if token is missing', async () => {
      await expect(authenticator.authenticate()).rejects.toThrow('Authentication token is required');
      await expect(authenticator.authenticate(null)).rejects.toThrow('Authentication token is required');
      await expect(authenticator.authenticate('')).rejects.toThrow('Authentication token is required');
    });
    
    it('should throw error for invalid token', async () => {
      await expect(authenticator.authenticate('invalid-token')).rejects.toThrow('Invalid authentication token');
    });
    
    it('should throw error for token signed with wrong secret', async () => {
      const token = jwt.sign(
        { id: 'user123', role: 'rider' },
        'wrong-secret',
        { expiresIn: '1h' }
      );
      
      await expect(authenticator.authenticate(token)).rejects.toThrow('Invalid authentication token');
    });
    
    it('should throw error for expired token', async () => {
      const token = jwt.sign(
        { id: 'user123', role: 'rider' },
        TEST_SECRET,
        { expiresIn: '-1h' } // Already expired
      );
      
      await expect(authenticator.authenticate(token)).rejects.toThrow('Authentication token has expired');
    });
    
    it('should throw error if token does not contain user ID', async () => {
      const token = jwt.sign(
        { role: 'rider' }, // Missing id
        TEST_SECRET,
        { expiresIn: '1h' }
      );
      
      await expect(authenticator.authenticate(token)).rejects.toThrow('Token does not contain user ID');
    });
    
    it('should throw error for invalid role', async () => {
      const token = jwt.sign(
        { id: 'user123', role: 'admin' }, // Invalid role
        TEST_SECRET,
        { expiresIn: '1h' }
      );
      
      await expect(authenticator.authenticate(token)).rejects.toThrow('Invalid role: admin');
    });
    
    it('should convert userId to string', async () => {
      const token = jwt.sign(
        { id: 12345, role: 'rider' }, // Numeric ID
        TEST_SECRET,
        { expiresIn: '1h' }
      );
      
      const result = await authenticator.authenticate(token);
      
      expect(result.userId).toBe('12345');
      expect(typeof result.userId).toBe('string');
    });
  });
  
  describe('generateToken', () => {
    it('should generate valid token for rider', () => {
      const token = authenticator.generateToken('user123', 'rider');
      
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      
      // Verify token can be decoded
      const decoded = jwt.verify(token, TEST_SECRET);
      expect(decoded.id).toBe('user123');
      expect(decoded.role).toBe('rider');
    });
    
    it('should generate valid token for driver', () => {
      const token = authenticator.generateToken('driver456', 'driver');
      
      const decoded = jwt.verify(token, TEST_SECRET);
      expect(decoded.id).toBe('driver456');
      expect(decoded.role).toBe('driver');
    });
    
    it('should respect custom expiration time', () => {
      const token = authenticator.generateToken('user123', 'rider', '7d');
      
      const decoded = jwt.verify(token, TEST_SECRET);
      expect(decoded.id).toBe('user123');
      
      // Check expiration is set (exp field exists)
      expect(decoded.exp).toBeTruthy();
    });
    
    it('should throw error if userId is missing', () => {
      expect(() => authenticator.generateToken(null, 'rider')).toThrow('User ID is required');
      expect(() => authenticator.generateToken('', 'rider')).toThrow('User ID is required');
    });
    
    it('should throw error for invalid role', () => {
      expect(() => authenticator.generateToken('user123', 'admin')).toThrow('Invalid role: admin');
      expect(() => authenticator.generateToken('user123', 'invalid')).toThrow('Invalid role: invalid');
    });
  });
  
  describe('createMiddleware', () => {
    let mockSocketServer;
    let mockSocket;
    let middleware;
    
    beforeEach(() => {
      // Mock SocketServer
      mockSocketServer = {
        registerUser: jest.fn()
      };
      
      // Mock Socket
      mockSocket = {
        id: 'socket123',
        handshake: {
          auth: {},
          query: {}
        }
      };
      
      middleware = authenticator.createMiddleware(mockSocketServer);
    });
    
    it('should create middleware function', () => {
      expect(middleware).toBeInstanceOf(Function);
      expect(middleware.length).toBe(2); // (socket, next)
    });
    
    it('should authenticate socket with valid token in auth', async () => {
      const token = jwt.sign({ id: 'user123', role: 'rider' }, TEST_SECRET, { expiresIn: '1h' });
      mockSocket.handshake.auth.token = token;
      
      const next = jest.fn();
      await middleware(mockSocket, next);
      
      expect(mockSocket.userId).toBe('user123');
      expect(mockSocket.role).toBe('rider');
      expect(mockSocketServer.registerUser).toHaveBeenCalledWith('socket123', 'user123', 'rider');
      expect(next).toHaveBeenCalledWith(); // Called without error
    });
    
    it('should authenticate socket with valid token in query', async () => {
      const token = jwt.sign({ id: 'driver456', role: 'driver' }, TEST_SECRET, { expiresIn: '1h' });
      mockSocket.handshake.query.token = token;
      
      const next = jest.fn();
      await middleware(mockSocket, next);
      
      expect(mockSocket.userId).toBe('driver456');
      expect(mockSocket.role).toBe('driver');
      expect(mockSocketServer.registerUser).toHaveBeenCalledWith('socket123', 'driver456', 'driver');
      expect(next).toHaveBeenCalledWith();
    });
    
    it('should prefer auth token over query token', async () => {
      const authToken = jwt.sign({ id: 'user-auth', role: 'rider' }, TEST_SECRET, { expiresIn: '1h' });
      const queryToken = jwt.sign({ id: 'user-query', role: 'driver' }, TEST_SECRET, { expiresIn: '1h' });
      
      mockSocket.handshake.auth.token = authToken;
      mockSocket.handshake.query.token = queryToken;
      
      const next = jest.fn();
      await middleware(mockSocket, next);
      
      expect(mockSocket.userId).toBe('user-auth');
      expect(mockSocket.role).toBe('rider');
    });
    
    it('should reject connection if token is missing', async () => {
      const next = jest.fn();
      await middleware(mockSocket, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Authentication token is required');
      expect(error.data.code).toBe('AUTH_TOKEN_REQUIRED');
      expect(mockSocketServer.registerUser).not.toHaveBeenCalled();
    });
    
    it('should reject connection with invalid token', async () => {
      mockSocket.handshake.auth.token = 'invalid-token';
      
      const next = jest.fn();
      await middleware(mockSocket, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid authentication token');
      expect(error.data.code).toBe('AUTH_FAILED');
      expect(mockSocketServer.registerUser).not.toHaveBeenCalled();
    });
    
    it('should reject connection with expired token', async () => {
      const token = jwt.sign({ id: 'user123', role: 'rider' }, TEST_SECRET, { expiresIn: '-1h' });
      mockSocket.handshake.auth.token = token;
      
      const next = jest.fn();
      await middleware(mockSocket, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Authentication token has expired');
      expect(error.data.code).toBe('AUTH_FAILED');
    });
  });
});
