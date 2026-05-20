/**
 * Unit Tests for SocketServer - Socket-to-User Mapping System
 * 
 * Tests the socket-to-user mapping functionality including:
 * - Connection handling and user registration
 * - Disconnection handling and cleanup
 * - getUserSocket utility method
 * - emitToUser utility method
 * - emitToDrivers utility method
 */

const SocketServer = require('./socketServer');
const ConnectionAuthenticator = require('./connectionAuth');
const http = require('http');

describe('SocketServer - Socket-to-User Mapping', () => {
  const TEST_SECRET = 'test-secret-key-for-jwt';
  let httpServer;
  let socketServer;
  
  beforeEach(() => {
    // Create HTTP server for Socket.IO
    httpServer = http.createServer();
    socketServer = new SocketServer(httpServer, TEST_SECRET);
  });
  
  afterEach(() => {
    // Clean up
    if (socketServer && socketServer.io) {
      socketServer.io.close();
    }
    if (httpServer) {
      httpServer.close();
    }
  });
  
  describe('constructor', () => {
    it('should initialize with empty socket-to-user mappings', () => {
      expect(socketServer.socketToUser).toBeInstanceOf(Map);
      expect(socketServer.userToSocket).toBeInstanceOf(Map);
      expect(socketServer.socketToUser.size).toBe(0);
      expect(socketServer.userToSocket.size).toBe(0);
    });
    
    it('should initialize ConnectionAuthenticator', () => {
      expect(socketServer.authenticator).toBeInstanceOf(ConnectionAuthenticator);
    });
    
    it('should initialize Socket.IO server', () => {
      expect(socketServer.io).toBeDefined();
    });
  });
  
  describe('registerUser', () => {
    it('should store socket-to-user mapping for rider', () => {
      socketServer.registerUser('socket123', 'user456', 'rider');
      
      expect(socketServer.socketToUser.get('socket123')).toEqual({
        userId: 'user456',
        role: 'rider'
      });
      expect(socketServer.userToSocket.get('user456')).toBe('socket123');
    });
    
    it('should store socket-to-user mapping for driver', () => {
      socketServer.registerUser('socket789', 'driver101', 'driver');
      
      expect(socketServer.socketToUser.get('socket789')).toEqual({
        userId: 'driver101',
        role: 'driver'
      });
      expect(socketServer.userToSocket.get('driver101')).toBe('socket789');
    });
    
    it('should handle user reconnection by removing old socket mapping', () => {
      // First connection
      socketServer.registerUser('socket-old', 'user123', 'rider');
      expect(socketServer.socketToUser.get('socket-old')).toBeDefined();
      expect(socketServer.userToSocket.get('user123')).toBe('socket-old');
      
      // User reconnects with new socket
      socketServer.registerUser('socket-new', 'user123', 'rider');
      
      // Old socket should be removed
      expect(socketServer.socketToUser.get('socket-old')).toBeUndefined();
      // New socket should be mapped
      expect(socketServer.socketToUser.get('socket-new')).toEqual({
        userId: 'user123',
        role: 'rider'
      });
      expect(socketServer.userToSocket.get('user123')).toBe('socket-new');
    });
    
    it('should handle multiple users with different sockets', () => {
      socketServer.registerUser('socket1', 'user1', 'rider');
      socketServer.registerUser('socket2', 'user2', 'driver');
      socketServer.registerUser('socket3', 'user3', 'rider');
      
      expect(socketServer.socketToUser.size).toBe(3);
      expect(socketServer.userToSocket.size).toBe(3);
      
      expect(socketServer.userToSocket.get('user1')).toBe('socket1');
      expect(socketServer.userToSocket.get('user2')).toBe('socket2');
      expect(socketServer.userToSocket.get('user3')).toBe('socket3');
    });
  });
  
  describe('handleConnection', () => {
    it('should emit authenticated event to socket', () => {
      const mockSocket = {
        id: 'socket123',
        userId: 'user456',
        role: 'rider',
        emit: jest.fn()
      };
      
      socketServer.handleConnection(mockSocket);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', {
        userId: 'user456',
        role: 'rider',
        message: 'Successfully authenticated'
      });
    });
  });
  
  describe('handleDisconnection', () => {
    it('should clean up socket-to-user mappings on disconnection', () => {
      // Register user
      socketServer.registerUser('socket123', 'user456', 'rider');
      expect(socketServer.socketToUser.size).toBe(1);
      expect(socketServer.userToSocket.size).toBe(1);
      
      // Simulate disconnection
      const mockSocket = { id: 'socket123' };
      socketServer.handleDisconnection(mockSocket);
      
      // Mappings should be cleaned up
      expect(socketServer.socketToUser.size).toBe(0);
      expect(socketServer.userToSocket.size).toBe(0);
      expect(socketServer.socketToUser.get('socket123')).toBeUndefined();
      expect(socketServer.userToSocket.get('user456')).toBeUndefined();
    });
    
    it('should handle disconnection of unauthenticated socket gracefully', () => {
      const mockSocket = { id: 'unauthenticated-socket' };
      
      // Should not throw error
      expect(() => {
        socketServer.handleDisconnection(mockSocket);
      }).not.toThrow();
      
      expect(socketServer.socketToUser.size).toBe(0);
      expect(socketServer.userToSocket.size).toBe(0);
    });
    
    it('should only remove the disconnected socket, not other users', () => {
      // Register multiple users
      socketServer.registerUser('socket1', 'user1', 'rider');
      socketServer.registerUser('socket2', 'user2', 'driver');
      socketServer.registerUser('socket3', 'user3', 'rider');
      
      // Disconnect one user
      const mockSocket = { id: 'socket2' };
      socketServer.handleDisconnection(mockSocket);
      
      // Only socket2 should be removed
      expect(socketServer.socketToUser.size).toBe(2);
      expect(socketServer.userToSocket.size).toBe(2);
      expect(socketServer.socketToUser.get('socket1')).toBeDefined();
      expect(socketServer.socketToUser.get('socket2')).toBeUndefined();
      expect(socketServer.socketToUser.get('socket3')).toBeDefined();
      expect(socketServer.userToSocket.get('user2')).toBeUndefined();
    });
  });
  
  describe('getUserSocket', () => {
    it('should return socket instance for connected user', () => {
      // Register user
      socketServer.registerUser('socket123', 'user456', 'rider');
      
      // Mock socket in io.sockets.sockets
      const mockSocket = { id: 'socket123' };
      socketServer.io.sockets.sockets.set('socket123', mockSocket);
      
      const result = socketServer.getUserSocket('user456');
      
      expect(result).toBe(mockSocket);
    });
    
    it('should return null for user not connected', () => {
      const result = socketServer.getUserSocket('nonexistent-user');
      
      expect(result).toBeNull();
    });
    
    it('should return null if socket ID exists but socket is not in io.sockets', () => {
      // Register user but don't add socket to io.sockets
      socketServer.registerUser('socket123', 'user456', 'rider');
      
      const result = socketServer.getUserSocket('user456');
      
      expect(result).toBeNull();
    });
  });
  
  describe('emitToUser', () => {
    it('should emit event to connected user and return true', () => {
      // Register user
      socketServer.registerUser('socket123', 'user456', 'rider');
      
      // Mock socket with emit method
      const mockSocket = {
        id: 'socket123',
        emit: jest.fn()
      };
      socketServer.io.sockets.sockets.set('socket123', mockSocket);
      
      const result = socketServer.emitToUser('user456', 'testEvent', { data: 'test' });
      
      expect(result).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('testEvent', { data: 'test' });
    });
    
    it('should return false for user not connected', () => {
      const result = socketServer.emitToUser('nonexistent-user', 'testEvent', { data: 'test' });
      
      expect(result).toBe(false);
    });
    
    it('should handle multiple events to same user', () => {
      // Register user
      socketServer.registerUser('socket123', 'user456', 'rider');
      
      // Mock socket
      const mockSocket = {
        id: 'socket123',
        emit: jest.fn()
      };
      socketServer.io.sockets.sockets.set('socket123', mockSocket);
      
      // Emit multiple events
      socketServer.emitToUser('user456', 'event1', { data: 1 });
      socketServer.emitToUser('user456', 'event2', { data: 2 });
      socketServer.emitToUser('user456', 'event3', { data: 3 });
      
      expect(mockSocket.emit).toHaveBeenCalledTimes(3);
      expect(mockSocket.emit).toHaveBeenNthCalledWith(1, 'event1', { data: 1 });
      expect(mockSocket.emit).toHaveBeenNthCalledWith(2, 'event2', { data: 2 });
      expect(mockSocket.emit).toHaveBeenNthCalledWith(3, 'event3', { data: 3 });
    });
  });
  
  describe('emitToDrivers', () => {
    it('should emit event to all connected drivers', () => {
      // Register multiple drivers
      socketServer.registerUser('socket1', 'driver1', 'driver');
      socketServer.registerUser('socket2', 'driver2', 'driver');
      socketServer.registerUser('socket3', 'driver3', 'driver');
      
      // Mock sockets
      const mockSocket1 = { id: 'socket1', emit: jest.fn() };
      const mockSocket2 = { id: 'socket2', emit: jest.fn() };
      const mockSocket3 = { id: 'socket3', emit: jest.fn() };
      
      socketServer.io.sockets.sockets.set('socket1', mockSocket1);
      socketServer.io.sockets.sockets.set('socket2', mockSocket2);
      socketServer.io.sockets.sockets.set('socket3', mockSocket3);
      
      const driverIds = ['driver1', 'driver2', 'driver3'];
      const result = socketServer.emitToDrivers(driverIds, 'rideRequest', { requestId: 'req123' });
      
      expect(result).toBe(3);
      expect(mockSocket1.emit).toHaveBeenCalledWith('rideRequest', { requestId: 'req123' });
      expect(mockSocket2.emit).toHaveBeenCalledWith('rideRequest', { requestId: 'req123' });
      expect(mockSocket3.emit).toHaveBeenCalledWith('rideRequest', { requestId: 'req123' });
    });
    
    it('should handle mix of connected and disconnected drivers', () => {
      // Register only 2 out of 3 drivers
      socketServer.registerUser('socket1', 'driver1', 'driver');
      socketServer.registerUser('socket2', 'driver2', 'driver');
      
      // Mock sockets for connected drivers
      const mockSocket1 = { id: 'socket1', emit: jest.fn() };
      const mockSocket2 = { id: 'socket2', emit: jest.fn() };
      
      socketServer.io.sockets.sockets.set('socket1', mockSocket1);
      socketServer.io.sockets.sockets.set('socket2', mockSocket2);
      
      // Try to emit to 3 drivers (one not connected)
      const driverIds = ['driver1', 'driver2', 'driver3'];
      const result = socketServer.emitToDrivers(driverIds, 'rideRequest', { requestId: 'req123' });
      
      // Should return 2 (only connected drivers)
      expect(result).toBe(2);
      expect(mockSocket1.emit).toHaveBeenCalled();
      expect(mockSocket2.emit).toHaveBeenCalled();
    });
    
    it('should return 0 if no drivers are connected', () => {
      const driverIds = ['driver1', 'driver2', 'driver3'];
      const result = socketServer.emitToDrivers(driverIds, 'rideRequest', { requestId: 'req123' });
      
      expect(result).toBe(0);
    });
    
    it('should handle empty driver list', () => {
      const result = socketServer.emitToDrivers([], 'rideRequest', { requestId: 'req123' });
      
      expect(result).toBe(0);
    });
  });
  
  describe('getUserData', () => {
    it('should return user data for socket ID', () => {
      socketServer.registerUser('socket123', 'user456', 'rider');
      
      const result = socketServer.getUserData('socket123');
      
      expect(result).toEqual({
        userId: 'user456',
        role: 'rider'
      });
    });
    
    it('should return null for unknown socket ID', () => {
      const result = socketServer.getUserData('unknown-socket');
      
      expect(result).toBeNull();
    });
  });
  
  describe('Integration - Full connection lifecycle', () => {
    it('should handle complete connection and disconnection flow', () => {
      // 1. Register user (simulating authentication middleware)
      socketServer.registerUser('socket123', 'user456', 'rider');
      
      // Verify registration
      expect(socketServer.socketToUser.size).toBe(1);
      expect(socketServer.userToSocket.size).toBe(1);
      
      // 2. Handle connection
      const mockSocket = {
        id: 'socket123',
        userId: 'user456',
        role: 'rider',
        emit: jest.fn()
      };
      socketServer.handleConnection(mockSocket);
      
      // Verify authenticated event was emitted
      expect(mockSocket.emit).toHaveBeenCalledWith('authenticated', expect.any(Object));
      
      // 3. Emit event to user
      socketServer.io.sockets.sockets.set('socket123', mockSocket);
      const emitResult = socketServer.emitToUser('user456', 'testEvent', { data: 'test' });
      
      expect(emitResult).toBe(true);
      expect(mockSocket.emit).toHaveBeenCalledWith('testEvent', { data: 'test' });
      
      // 4. Handle disconnection
      socketServer.handleDisconnection(mockSocket);
      
      // Verify cleanup
      expect(socketServer.socketToUser.size).toBe(0);
      expect(socketServer.userToSocket.size).toBe(0);
    });
    
    it('should handle user reconnection scenario', () => {
      // 1. First connection
      socketServer.registerUser('socket-old', 'user123', 'rider');
      const oldSocket = {
        id: 'socket-old',
        userId: 'user123',
        role: 'rider',
        emit: jest.fn()
      };
      socketServer.io.sockets.sockets.set('socket-old', oldSocket);
      
      // 2. User reconnects with new socket
      socketServer.registerUser('socket-new', 'user123', 'rider');
      const newSocket = {
        id: 'socket-new',
        userId: 'user123',
        role: 'rider',
        emit: jest.fn()
      };
      socketServer.io.sockets.sockets.set('socket-new', newSocket);
      
      // 3. Emit to user should use new socket
      const result = socketServer.emitToUser('user123', 'testEvent', { data: 'test' });
      
      expect(result).toBe(true);
      expect(newSocket.emit).toHaveBeenCalledWith('testEvent', { data: 'test' });
      expect(oldSocket.emit).not.toHaveBeenCalled();
      
      // 4. Old socket should not be in mappings
      expect(socketServer.socketToUser.get('socket-old')).toBeUndefined();
      expect(socketServer.socketToUser.get('socket-new')).toBeDefined();
    });
  });
});

describe('SocketServer - onRequestRide Event Handler', () => {
  const TEST_SECRET = 'test-secret-key-for-jwt';
  const mongoose = require('mongoose');
  let httpServer;
  let socketServer;
  let mockRideMatcher;
  let mockTimeoutManager;
  let mockSocket;
  const testRiderId = new mongoose.Types.ObjectId().toString();
  const testDriver1Id = new mongoose.Types.ObjectId().toString();
  const testDriver2Id = new mongoose.Types.ObjectId().toString();
  
  beforeEach(() => {
    // Create HTTP server for Socket.IO
    httpServer = http.createServer();
    socketServer = new SocketServer(httpServer, TEST_SECRET);
    
    // Mock RideMatcher
    mockRideMatcher = {
      findNearbyDrivers: jest.fn()
    };
    socketServer.setRideMatcher(mockRideMatcher);
    
    // Mock TimeoutManager
    mockTimeoutManager = {
      startTimeout: jest.fn()
    };
    socketServer.setTimeoutManager(mockTimeoutManager);
    
    // Mock socket
    mockSocket = {
      id: 'socket123',
      emit: jest.fn()
    };
    
    // Register rider with valid ObjectId
    socketServer.registerUser('socket123', testRiderId, 'rider');
  });
  
  afterEach(() => {
    // Clean up
    if (socketServer && socketServer.io) {
      socketServer.io.close();
    }
    if (httpServer) {
      httpServer.close();
    }
    jest.clearAllMocks();
  });
  
  describe('Validation', () => {
    it('should reject request from non-rider', async () => {
      // Register as driver instead
      const testDriverId = new mongoose.Types.ObjectId().toString();
      socketServer.registerUser('socket123', testDriverId, 'driver');
      
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: 100,
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'UNAUTHORIZED',
        message: 'Only riders can request rides'
      });
    });
    
    it('should reject invalid payload', async () => {
      await socketServer.onRequestRide(mockSocket, null);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid request payload'
      });
    });
    
    it('should reject invalid pickup coordinates', async () => {
      const payload = {
        pickup: { lat: 100, lng: 69.2 }, // Invalid latitude
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: 100,
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_PICKUP_COORDINATES',
        message: 'Pickup coordinates must be valid latitude/longitude'
      });
    });
    
    it('should reject invalid destination coordinates', async () => {
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 34.6, lng: 200 }, // Invalid longitude
        proposedFare: 100,
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_DESTINATION_COORDINATES',
        message: 'Destination coordinates must be valid latitude/longitude'
      });
    });
    
    it('should reject pickup outside Afghanistan', async () => {
      const payload = {
        pickup: { lat: 20, lng: 50 }, // Outside Afghanistan
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: 100,
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'PICKUP_OUT_OF_BOUNDS',
        message: 'Pickup location must be within Afghanistan'
      });
    });
    
    it('should reject destination outside Afghanistan', async () => {
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 20, lng: 50 }, // Outside Afghanistan
        proposedFare: 100,
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'DESTINATION_OUT_OF_BOUNDS',
        message: 'Destination location must be within Afghanistan'
      });
    });
    
    it('should reject invalid fare (zero)', async () => {
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: 0, // Invalid fare
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_FARE',
        message: 'Proposed fare must be a positive number'
      });
    });
    
    it('should reject invalid fare (negative)', async () => {
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: -100, // Invalid fare
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_FARE',
        message: 'Proposed fare must be a positive number'
      });
    });
    
    it('should reject missing rider profile', async () => {
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: 100
        // Missing riderProfile
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_RIDER_PROFILE',
        message: 'Invalid rider profile'
      });
    });
  });
  
  describe('No Drivers Available', () => {
    it('should handle case when no drivers are nearby', async () => {
      mockRideMatcher.findNearbyDrivers.mockResolvedValue([]);
      
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: 100,
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'NO_DRIVERS_AVAILABLE',
        message: 'No drivers available in your area'
      });
      
      expect(mockTimeoutManager.startTimeout).not.toHaveBeenCalled();
    });
  });
  
  describe('Successful Request Processing', () => {
    it('should process valid ride request successfully', async () => {
      // Mock nearby drivers
      const nearbyDrivers = [
        { driverId: testDriver1Id, socketId: 'socket-d1', location: { lat: 34.51, lng: 69.21 }, distance: 0.5 },
        { driverId: testDriver2Id, socketId: 'socket-d2', location: { lat: 34.52, lng: 69.22 }, distance: 1.2 }
      ];
      mockRideMatcher.findNearbyDrivers.mockResolvedValue(nearbyDrivers);
      
      // Register drivers
      socketServer.registerUser('socket-d1', testDriver1Id, 'driver');
      socketServer.registerUser('socket-d2', testDriver2Id, 'driver');
      
      // Mock driver sockets
      const mockDriverSocket1 = { id: 'socket-d1', emit: jest.fn() };
      const mockDriverSocket2 = { id: 'socket-d2', emit: jest.fn() };
      socketServer.io.sockets.sockets.set('socket-d1', mockDriverSocket1);
      socketServer.io.sockets.sockets.set('socket-d2', mockDriverSocket2);
      
      const payload = {
        pickup: { lat: 34.5, lng: 69.2, landmarkName: 'Kabul Airport' },
        destination: { lat: 34.6, lng: 69.3, landmarkName: 'City Center' },
        proposedFare: 150,
        riderProfile: { name: 'Test Rider', rating: 4.5 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      // Verify RideMatcher was called
      expect(mockRideMatcher.findNearbyDrivers).toHaveBeenCalledWith(
        { lat: 34.5, lng: 69.2, landmarkName: 'Kabul Airport' },
        5
      );
      
      // Verify ride request was emitted to drivers
      expect(mockDriverSocket1.emit).toHaveBeenCalledWith('rideRequest', expect.objectContaining({
        pickup: expect.objectContaining({ lat: 34.5, lng: 69.2 }),
        destination: expect.objectContaining({ lat: 34.6, lng: 69.3 }),
        proposedFare: 150,
        riderRating: 4.5
      }));
      
      expect(mockDriverSocket2.emit).toHaveBeenCalledWith('rideRequest', expect.objectContaining({
        pickup: expect.objectContaining({ lat: 34.5, lng: 69.2 }),
        destination: expect.objectContaining({ lat: 34.6, lng: 69.3 }),
        proposedFare: 150,
        riderRating: 4.5
      }));
      
      // Verify timeout was started
      expect(mockTimeoutManager.startTimeout).toHaveBeenCalledWith(
        expect.any(String), // requestId (UUID)
        testRiderId,
        [testDriver1Id, testDriver2Id]
      );
      
      // Verify success response to rider
      expect(mockSocket.emit).toHaveBeenCalledWith('requestRideSuccess', expect.objectContaining({
        requestId: expect.any(String),
        driversNotified: 2
      }));
    });
    
    it('should generate unique requestId using UUID', async () => {
      const nearbyDrivers = [
        { driverId: testDriver1Id, socketId: 'socket-d1', location: { lat: 34.51, lng: 69.21 }, distance: 0.5 }
      ];
      mockRideMatcher.findNearbyDrivers.mockResolvedValue(nearbyDrivers);
      
      socketServer.registerUser('socket-d1', testDriver1Id, 'driver');
      const mockDriverSocket1 = { id: 'socket-d1', emit: jest.fn() };
      socketServer.io.sockets.sockets.set('socket-d1', mockDriverSocket1);
      
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: 100,
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      // Verify requestId is a valid UUID format
      const successCall = mockSocket.emit.mock.calls.find(call => call[0] === 'requestRideSuccess');
      expect(successCall).toBeDefined();
      const requestId = successCall[1].requestId;
      
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestId).toMatch(uuidRegex);
    });
    
    it('should include all required fields in ride request payload', async () => {
      const nearbyDrivers = [
        { driverId: testDriver1Id, socketId: 'socket-d1', location: { lat: 34.51, lng: 69.21 }, distance: 0.5 }
      ];
      mockRideMatcher.findNearbyDrivers.mockResolvedValue(nearbyDrivers);
      
      socketServer.registerUser('socket-d1', testDriver1Id, 'driver');
      const mockDriverSocket1 = { id: 'socket-d1', emit: jest.fn() };
      socketServer.io.sockets.sockets.set('socket-d1', mockDriverSocket1);
      
      const payload = {
        pickup: { lat: 34.5, lng: 69.2, landmarkName: 'Pickup Point' },
        destination: { lat: 34.6, lng: 69.3, landmarkName: 'Destination Point' },
        proposedFare: 200,
        riderProfile: { name: 'John Doe', rating: 4.8 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      const rideRequestCall = mockDriverSocket1.emit.mock.calls.find(call => call[0] === 'rideRequest');
      expect(rideRequestCall).toBeDefined();
      
      const rideRequestPayload = rideRequestCall[1];
      
      // Verify all required fields are present
      expect(rideRequestPayload).toHaveProperty('requestId');
      expect(rideRequestPayload).toHaveProperty('rideId');
      expect(rideRequestPayload).toHaveProperty('pickup');
      expect(rideRequestPayload.pickup).toHaveProperty('lat', 34.5);
      expect(rideRequestPayload.pickup).toHaveProperty('lng', 69.2);
      expect(rideRequestPayload.pickup).toHaveProperty('landmarkName', 'Pickup Point');
      expect(rideRequestPayload).toHaveProperty('destination');
      expect(rideRequestPayload.destination).toHaveProperty('lat', 34.6);
      expect(rideRequestPayload.destination).toHaveProperty('lng', 69.3);
      expect(rideRequestPayload.destination).toHaveProperty('landmarkName', 'Destination Point');
      expect(rideRequestPayload).toHaveProperty('proposedFare', 200);
      expect(rideRequestPayload).toHaveProperty('riderRating', 4.8);
      expect(rideRequestPayload).toHaveProperty('riderName', 'John Doe');
      expect(rideRequestPayload).toHaveProperty('estimatedDistance');
      expect(rideRequestPayload).toHaveProperty('createdAt');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle RideMatcher errors gracefully', async () => {
      mockRideMatcher.findNearbyDrivers.mockRejectedValue(new Error('Database connection failed'));
      
      const payload = {
        pickup: { lat: 34.5, lng: 69.2 },
        destination: { lat: 34.6, lng: 69.3 },
        proposedFare: 100,
        riderProfile: { name: 'Test Rider', rating: 5.0 }
      };
      
      await socketServer.onRequestRide(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'REQUEST_FAILED',
        message: 'Failed to process ride request'
      }));
    });
  });
});

describe('SocketServer - onFareCounter Event Handler', () => {
  const TEST_SECRET = 'test-secret-key-for-jwt';
  const mongoose = require('mongoose');
  const Ride = require('../models/Ride');
  const Driver = require('../models/Driver');
  const User = require('../models/User');
  
  let httpServer;
  let socketServer;
  let mockSocket;
  let mockRiderSocket;
  
  const testDriverId = new mongoose.Types.ObjectId().toString();
  const testRiderId = new mongoose.Types.ObjectId().toString();
  const testRideId = new mongoose.Types.ObjectId().toString();
  
  beforeEach(() => {
    // Create HTTP server for Socket.IO
    httpServer = http.createServer();
    socketServer = new SocketServer(httpServer, TEST_SECRET);
    
    // Mock driver socket
    mockSocket = {
      id: 'socket-driver',
      emit: jest.fn()
    };
    
    // Mock rider socket
    mockRiderSocket = {
      id: 'socket-rider',
      emit: jest.fn()
    };
    
    // Register driver
    socketServer.registerUser('socket-driver', testDriverId, 'driver');
    
    // Register rider
    socketServer.registerUser('socket-rider', testRiderId, 'rider');
    socketServer.io.sockets.sockets.set('socket-rider', mockRiderSocket);
  });
  
  afterEach(() => {
    // Clean up
    if (socketServer && socketServer.io) {
      socketServer.io.close();
    }
    if (httpServer) {
      httpServer.close();
    }
    jest.clearAllMocks();
  });
  
  describe('Authorization', () => {
    it('should reject request from non-driver', async () => {
      // Register as rider instead
      socketServer.registerUser('socket-driver', testDriverId, 'rider');
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'UNAUTHORIZED',
        message: 'Only drivers can submit counter-offers'
      });
    });
    
    it('should reject when driverId does not match authenticated user', async () => {
      const differentDriverId = new mongoose.Types.ObjectId().toString();
      
      const payload = {
        requestId: testRideId,
        driverId: differentDriverId, // Different from authenticated driver
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'DRIVER_ID_MISMATCH',
        message: 'Driver ID does not match authenticated user'
      });
    });
  });
  
  describe('Payload Validation', () => {
    it('should reject invalid payload', async () => {
      await socketServer.onFareCounter(mockSocket, null);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid counter-offer payload'
      });
    });
    
    it('should reject missing requestId', async () => {
      const payload = {
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_REQUEST_ID',
        message: 'Request ID is required'
      });
    });
    
    it('should reject missing driverId', async () => {
      const payload = {
        requestId: testRideId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_DRIVER_ID',
        message: 'Driver ID is required'
      });
    });
    
    it('should reject invalid counterAmount (zero)', async () => {
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 0
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_COUNTER_AMOUNT',
        message: 'Counter-offer amount must be a positive number'
      });
    });
    
    it('should reject invalid counterAmount (negative)', async () => {
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: -100
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_COUNTER_AMOUNT',
        message: 'Counter-offer amount must be a positive number'
      });
    });
    
    it('should reject invalid counterAmount (NaN)', async () => {
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: NaN
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_COUNTER_AMOUNT',
        message: 'Counter-offer amount must be a positive number'
      });
    });
  });
  
  describe('Ride Status Validation', () => {
    it('should reject counter-offer for non-existent ride', async () => {
      // Mock Ride.findById to return null
      jest.spyOn(Ride, 'findById').mockResolvedValue(null);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'RIDE_NOT_FOUND',
        message: 'Ride request not found'
      });
    });
    
    it('should reject counter-offer for expired ride', async () => {
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Expired',
        counterOffers: [],
        save: jest.fn()
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'RIDE_EXPIRED',
        message: 'This ride request has expired'
      });
    });
    
    it('should reject counter-offer for accepted ride', async () => {
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Accepted',
        counterOffers: [],
        save: jest.fn()
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'RIDE_ALREADY_ACCEPTED',
        message: 'This ride request has already been accepted'
      });
    });
    
    it('should reject counter-offer for cancelled ride', async () => {
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Cancelled',
        counterOffers: [],
        save: jest.fn()
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'RIDE_CANCELLED',
        message: 'This ride request has been cancelled'
      });
    });
    
    it('should reject counter-offer for ride past expiresAt timestamp', async () => {
      const pastDate = new Date(Date.now() - 10000); // 10 seconds ago
      
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Pending',
        expiresAt: pastDate,
        counterOffers: [],
        save: jest.fn()
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'RIDE_EXPIRED',
        message: 'This ride request has expired'
      });
    });
  });
  
  describe('Successful Counter-Offer Processing', () => {
    it('should process valid counter-offer successfully', async () => {
      const futureDate = new Date(Date.now() + 120000); // 2 minutes from now
      
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Pending',
        expiresAt: futureDate,
        counterOffers: [],
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockDriver = {
        _id: testDriverId,
        name: 'Test Driver',
        rating: 4.5
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      jest.spyOn(Driver, 'findById').mockResolvedValue(mockDriver);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      // Verify counter-offer was added to ride
      expect(mockRide.counterOffers).toHaveLength(1);
      expect(mockRide.counterOffers[0]).toMatchObject({
        driverId: testDriverId,
        amount: 150
      });
      expect(mockRide.counterOffers[0].timestamp).toBeInstanceOf(Date);
      
      // Verify status changed to Negotiating
      expect(mockRide.status).toBe('Negotiating');
      
      // Verify ride was saved
      expect(mockRide.save).toHaveBeenCalled();
      
      // Verify fareCounter event was emitted to rider
      expect(mockRiderSocket.emit).toHaveBeenCalledWith('fareCounter', expect.objectContaining({
        requestId: testRideId,
        rideId: testRideId,
        driverId: testDriverId,
        driverName: 'Test Driver',
        driverRating: 4.5,
        counterAmount: 150
      }));
      
      // Verify success confirmation to driver
      expect(mockSocket.emit).toHaveBeenCalledWith('fareCounterSuccess', expect.objectContaining({
        requestId: testRideId,
        rideId: testRideId,
        counterAmount: 150,
        message: 'Counter-offer sent successfully'
      }));
    });
    
    it('should allow multiple counter-offers from same driver', async () => {
      const futureDate = new Date(Date.now() + 120000);
      
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Negotiating',
        expiresAt: futureDate,
        counterOffers: [
          { driverId: testDriverId, amount: 150, timestamp: new Date() }
        ],
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockDriver = {
        _id: testDriverId,
        name: 'Test Driver',
        rating: 4.5
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      jest.spyOn(Driver, 'findById').mockResolvedValue(mockDriver);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 140 // Lower counter-offer
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      // Verify second counter-offer was added
      expect(mockRide.counterOffers).toHaveLength(2);
      expect(mockRide.counterOffers[1]).toMatchObject({
        driverId: testDriverId,
        amount: 140
      });
      
      // Status should remain Negotiating
      expect(mockRide.status).toBe('Negotiating');
    });
    
    it('should handle missing driver details gracefully', async () => {
      const futureDate = new Date(Date.now() + 120000);
      
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Pending',
        expiresAt: futureDate,
        counterOffers: [],
        save: jest.fn().mockResolvedValue(true)
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      jest.spyOn(Driver, 'findById').mockResolvedValue(null); // Driver not found
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      // Should still process with default values
      expect(mockRiderSocket.emit).toHaveBeenCalledWith('fareCounter', expect.objectContaining({
        driverName: 'Driver',
        driverRating: 5.0,
        counterAmount: 150
      }));
      
      expect(mockSocket.emit).toHaveBeenCalledWith('fareCounterSuccess', expect.any(Object));
    });
    
    it('should handle offline rider gracefully', async () => {
      const futureDate = new Date(Date.now() + 120000);
      
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Pending',
        expiresAt: futureDate,
        counterOffers: [],
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockDriver = {
        _id: testDriverId,
        name: 'Test Driver',
        rating: 4.5
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      jest.spyOn(Driver, 'findById').mockResolvedValue(mockDriver);
      
      // Remove rider socket (simulate offline)
      socketServer.io.sockets.sockets.delete('socket-rider');
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      // Counter-offer should still be saved
      expect(mockRide.counterOffers).toHaveLength(1);
      expect(mockRide.save).toHaveBeenCalled();
      
      // Driver should receive confirmation with note about offline rider
      expect(mockSocket.emit).toHaveBeenCalledWith('fareCounterSuccess', expect.objectContaining({
        message: 'Counter-offer saved (rider currently offline)'
      }));
    });
    
    it('should include all required fields in fareCounter event', async () => {
      const futureDate = new Date(Date.now() + 120000);
      
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Pending',
        expiresAt: futureDate,
        counterOffers: [],
        save: jest.fn().mockResolvedValue(true)
      };
      
      const mockDriver = {
        _id: testDriverId,
        name: 'Ahmad Khan',
        rating: 4.8
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      jest.spyOn(Driver, 'findById').mockResolvedValue(mockDriver);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 175
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      const fareCounterCall = mockRiderSocket.emit.mock.calls.find(call => call[0] === 'fareCounter');
      expect(fareCounterCall).toBeDefined();
      
      const fareCounterPayload = fareCounterCall[1];
      
      // Verify all required fields
      expect(fareCounterPayload).toHaveProperty('requestId', testRideId);
      expect(fareCounterPayload).toHaveProperty('rideId', testRideId);
      expect(fareCounterPayload).toHaveProperty('driverId', testDriverId);
      expect(fareCounterPayload).toHaveProperty('driverName', 'Ahmad Khan');
      expect(fareCounterPayload).toHaveProperty('driverRating', 4.8);
      expect(fareCounterPayload).toHaveProperty('counterAmount', 175);
      expect(fareCounterPayload).toHaveProperty('timestamp');
      expect(fareCounterPayload.timestamp).toBeInstanceOf(Date);
    });
  });
  
  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      jest.spyOn(Ride, 'findById').mockRejectedValue(new Error('Database connection failed'));
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'COUNTER_OFFER_FAILED',
        message: 'Failed to process counter-offer'
      }));
    });
    
    it('should handle save errors gracefully', async () => {
      const futureDate = new Date(Date.now() + 120000);
      
      const mockRide = {
        _id: testRideId,
        riderId: testRiderId,
        status: 'Pending',
        expiresAt: futureDate,
        counterOffers: [],
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };
      
      jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
      
      const payload = {
        requestId: testRideId,
        driverId: testDriverId,
        counterAmount: 150
      };
      
      await socketServer.onFareCounter(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'COUNTER_OFFER_FAILED',
        message: 'Failed to process counter-offer'
      }));
    });
  });

describe('SocketServer - onRideAccepted Event Handler', () => {
  const TEST_SECRET = 'test-secret-key-for-jwt';
  const mongoose = require('mongoose');
  const Ride = require('../models/Ride');
  const Driver = require('../models/Driver');
  const User = require('../models/User');
  
  let httpServer;
  let socketServer;
  let mockSocket;
  let mockTimeoutManager;
  const testRiderId = new mongoose.Types.ObjectId().toString();
  const testDriverId = new mongoose.Types.ObjectId().toString();
  const testRideId = new mongoose.Types.ObjectId().toString();
  
  beforeEach(() => {
    // Create HTTP server for Socket.IO
    httpServer = http.createServer();
    socketServer = new SocketServer(httpServer, TEST_SECRET);
    
    // Mock TimeoutManager
    mockTimeoutManager = {
      cancelTimeout: jest.fn()
    };
    socketServer.setTimeoutManager(mockTimeoutManager);
    
    // Create mock socket
    mockSocket = {
      id: 'socket-test',
      emit: jest.fn(),
      on: jest.fn(),
      userId: testRiderId,
      role: 'rider'
    };
    
    // Register socket
    socketServer.registerUser(mockSocket.id, testRiderId, 'rider');
  });
  
  afterEach(() => {
    // Clean up
    if (socketServer && socketServer.io) {
      socketServer.io.close();
    }
    jest.clearAllMocks();
  });
    
    describe('Authorization', () => {
      it('should reject request from unauthenticated user', async () => {
        const unauthSocket = {
          id: 'socket-unauth',
          emit: jest.fn()
        };
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(unauthSocket, payload);
        
        expect(unauthSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }));
      });
    });
    
    describe('Payload Validation', () => {
      it('should reject invalid payload', async () => {
        await socketServer.onRideAccepted(mockSocket, null);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'INVALID_PAYLOAD',
          message: 'Invalid ride acceptance payload'
        }));
      });
      
      it('should reject missing requestId', async () => {
        const payload = {
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'INVALID_REQUEST_ID',
          message: 'Request ID is required'
        }));
      });
      
      it('should reject missing driverId', async () => {
        const payload = {
          requestId: testRideId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'INVALID_DRIVER_ID',
          message: 'Driver ID is required'
        }));
      });
      
      it('should reject invalid acceptedFare (zero)', async () => {
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 0
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'INVALID_ACCEPTED_FARE',
          message: 'Accepted fare must be a positive number'
        }));
      });
      
      it('should reject invalid acceptedFare (negative)', async () => {
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: -50
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'INVALID_ACCEPTED_FARE',
          message: 'Accepted fare must be a positive number'
        }));
      });
    });
    
    describe('First-Acceptance-Wins Logic', () => {
      it('should reject acceptance for non-existent ride', async () => {
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(null);
        jest.spyOn(Ride, 'findById').mockResolvedValue(null);
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'RIDE_NOT_FOUND',
          message: 'Ride request not found'
        }));
      });
      
      it('should reject acceptance for already accepted ride', async () => {
        const mockRide = {
          _id: testRideId,
          riderId: testRiderId,
          status: 'Accepted',
          driverId: new mongoose.Types.ObjectId()
        };
        
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(null);
        jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'RIDE_ALREADY_ACCEPTED',
          message: 'This ride has already been accepted by another driver'
        }));
      });
      
      it('should reject acceptance for expired ride', async () => {
        const mockRide = {
          _id: testRideId,
          riderId: testRiderId,
          status: 'Expired'
        };
        
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(null);
        jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'RIDE_EXPIRED',
          message: 'This ride request has expired'
        }));
      });
      
      it('should reject acceptance for cancelled ride', async () => {
        const mockRide = {
          _id: testRideId,
          riderId: testRiderId,
          status: 'Cancelled'
        };
        
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(null);
        jest.spyOn(Ride, 'findById').mockResolvedValue(mockRide);
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'RIDE_CANCELLED',
          message: 'This ride request has been cancelled'
        }));
      });
    });
    
    describe('Successful Acceptance Processing', () => {
      it('should process valid ride acceptance successfully', async () => {
        const acceptedAt = new Date();
        const mockRide = {
          _id: testRideId,
          riderId: testRiderId,
          driverId: testDriverId,
          status: 'Accepted',
          proposedFare: 100,
          agreedFare: 150,
          acceptedAt,
          pickup: { lat: 34.5, lng: 69.2, landmarkName: 'Kabul' },
          destination: { lat: 34.6, lng: 69.3, landmarkName: 'Airport' },
          estimatedDistance: 5000,
          estimatedDuration: 600,
          counterOffers: []
        };
        
        const mockDriver = {
          _id: testDriverId,
          name: 'Test Driver',
          rating: 4.5,
          phoneNumber: '+93701234567',
          vehicleDetails: { make: 'Toyota', model: 'Corolla', color: 'White', plateNumber: 'KBL-123' }
        };
        
        const mockRider = {
          _id: testRiderId,
          name: 'Test Rider',
          rating: 4.8,
          phoneNumber: '+93709876543'
        };
        
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(mockRide);
        jest.spyOn(Driver, 'findById').mockResolvedValue(mockDriver);
        jest.spyOn(User, 'findById').mockResolvedValue(mockRider);
        
        // Register driver socket
        const driverSocket = {
          id: 'socket-driver',
          emit: jest.fn()
        };
        socketServer.registerUser(driverSocket.id, testDriverId, 'driver');
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        // Verify timeout was cancelled
        expect(mockTimeoutManager.cancelTimeout).toHaveBeenCalledWith(testRideId);
        
        // Verify success confirmation was sent to initiating socket
        expect(mockSocket.emit).toHaveBeenCalledWith('rideAcceptedSuccess', expect.objectContaining({
          requestId: testRideId,
          rideId: testRideId,
          acceptedFare: 150,
          message: 'Ride accepted successfully'
        }));
      });
      
      it('should cancel timeout when ride is accepted', async () => {
        const mockRide = {
          _id: testRideId,
          riderId: testRiderId,
          driverId: testDriverId,
          status: 'Accepted',
          agreedFare: 150,
          acceptedAt: new Date(),
          pickup: { lat: 34.5, lng: 69.2 },
          destination: { lat: 34.6, lng: 69.3 },
          estimatedDistance: 5000,
          estimatedDuration: 600,
          counterOffers: []
        };
        
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(mockRide);
        jest.spyOn(Driver, 'findById').mockResolvedValue(null);
        jest.spyOn(User, 'findById').mockResolvedValue(null);
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockTimeoutManager.cancelTimeout).toHaveBeenCalledWith(testRideId);
      });
      
      it('should emit rideAccepted to both rider and driver', async () => {
        const mockRide = {
          _id: testRideId,
          riderId: testRiderId,
          driverId: testDriverId,
          status: 'Accepted',
          agreedFare: 150,
          acceptedAt: new Date(),
          pickup: { lat: 34.5, lng: 69.2 },
          destination: { lat: 34.6, lng: 69.3 },
          estimatedDistance: 5000,
          estimatedDuration: 600,
          counterOffers: []
        };
        
        const mockDriver = {
          _id: testDriverId,
          name: 'Test Driver',
          rating: 4.5,
          phoneNumber: '+93701234567',
          vehicleDetails: {}
        };
        
        const mockRider = {
          _id: testRiderId,
          name: 'Test Rider',
          rating: 4.8,
          phoneNumber: '+93709876543'
        };
        
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(mockRide);
        jest.spyOn(Driver, 'findById').mockResolvedValue(mockDriver);
        jest.spyOn(User, 'findById').mockResolvedValue(mockRider);
        
        // Register driver socket
        const driverSocket = {
          id: 'socket-driver',
          emit: jest.fn()
        };
        socketServer.registerUser(driverSocket.id, testDriverId, 'driver');
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        // Verify rider received rideAccepted event
        expect(mockSocket.emit).toHaveBeenCalledWith('rideAccepted', expect.objectContaining({
          requestId: testRideId,
          driverId: testDriverId,
          riderId: testRiderId,
          acceptedFare: 150
        }));
        
        // Verify driver received rideAccepted event
        expect(driverSocket.emit).toHaveBeenCalledWith('rideAccepted', expect.objectContaining({
          requestId: testRideId,
          driverId: testDriverId,
          riderId: testRiderId,
          acceptedFare: 150
        }));
      });
      
      it('should emit requestFilled to other drivers who made counter-offers', async () => {
        const otherDriverId1 = new mongoose.Types.ObjectId().toString();
        const otherDriverId2 = new mongoose.Types.ObjectId().toString();
        
        const mockRide = {
          _id: testRideId,
          riderId: testRiderId,
          driverId: testDriverId,
          status: 'Accepted',
          agreedFare: 150,
          acceptedAt: new Date(),
          pickup: { lat: 34.5, lng: 69.2 },
          destination: { lat: 34.6, lng: 69.3 },
          estimatedDistance: 5000,
          estimatedDuration: 600,
          counterOffers: [
            { driverId: otherDriverId1, amount: 140, timestamp: new Date() },
            { driverId: otherDriverId2, amount: 145, timestamp: new Date() },
            { driverId: testDriverId, amount: 150, timestamp: new Date() }
          ]
        };
        
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(mockRide);
        jest.spyOn(Driver, 'findById').mockResolvedValue(null);
        jest.spyOn(User, 'findById').mockResolvedValue(null);
        
        // Register other driver sockets
        const otherDriver1Socket = {
          id: 'socket-driver1',
          emit: jest.fn()
        };
        const otherDriver2Socket = {
          id: 'socket-driver2',
          emit: jest.fn()
        };
        socketServer.registerUser(otherDriver1Socket.id, otherDriverId1, 'driver');
        socketServer.registerUser(otherDriver2Socket.id, otherDriverId2, 'driver');
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        // Verify other drivers received requestFilled event
        expect(otherDriver1Socket.emit).toHaveBeenCalledWith('requestFilled', expect.objectContaining({
          requestId: testRideId,
          rideId: testRideId
        }));
        
        expect(otherDriver2Socket.emit).toHaveBeenCalledWith('requestFilled', expect.objectContaining({
          requestId: testRideId,
          rideId: testRideId
        }));
      });
      
      it('should handle missing driver details gracefully', async () => {
        const mockRide = {
          _id: testRideId,
          riderId: testRiderId,
          driverId: testDriverId,
          status: 'Accepted',
          agreedFare: 150,
          acceptedAt: new Date(),
          pickup: { lat: 34.5, lng: 69.2 },
          destination: { lat: 34.6, lng: 69.3 },
          estimatedDistance: 5000,
          estimatedDuration: 600,
          counterOffers: []
        };
        
        jest.spyOn(Ride, 'findOneAndUpdate').mockResolvedValue(mockRide);
        jest.spyOn(Driver, 'findById').mockResolvedValue(null);
        jest.spyOn(User, 'findById').mockResolvedValue(null);
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        // Should still send success confirmation
        expect(mockSocket.emit).toHaveBeenCalledWith('rideAcceptedSuccess', expect.objectContaining({
          requestId: testRideId,
          acceptedFare: 150
        }));
      });
    });
    
    describe('Error Handling', () => {
      it('should handle database errors gracefully', async () => {
        jest.spyOn(Ride, 'findOneAndUpdate').mockRejectedValue(new Error('Database connection failed'));
        
        const payload = {
          requestId: testRideId,
          driverId: testDriverId,
          acceptedFare: 150
        };
        
        await socketServer.onRideAccepted(mockSocket, payload);
        
        expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
          code: 'ACCEPTANCE_FAILED',
          message: 'Failed to process ride acceptance'
        }));
      });
    });
  });
});

describe('SocketServer - onDriverStatusChange Event Handler', () => {
  const TEST_SECRET = 'test-secret-key-for-jwt';
  const mongoose = require('mongoose');
  const Driver = require('../models/Driver');
  
  let httpServer;
  let socketServer;
  let mockSocket;
  
  const testDriverId = new mongoose.Types.ObjectId().toString();
  
  beforeEach(() => {
    // Create HTTP server for Socket.IO
    httpServer = http.createServer();
    socketServer = new SocketServer(httpServer, TEST_SECRET);
    
    // Mock socket
    mockSocket = {
      id: 'socket123',
      emit: jest.fn()
    };
    
    // Register driver
    socketServer.registerUser('socket123', testDriverId, 'driver');
    
    // Mock Driver.findByIdAndUpdate
    jest.spyOn(Driver, 'findByIdAndUpdate').mockImplementation(() => null);
  });
  
  afterEach(() => {
    // Clean up
    if (socketServer && socketServer.io) {
      socketServer.io.close();
    }
    if (httpServer) {
      httpServer.close();
    }
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  
  describe('Validation', () => {
    it('should reject request from non-driver', async () => {
      // Register as rider instead
      const testRiderId = new mongoose.Types.ObjectId().toString();
      socketServer.registerUser('socket123', testRiderId, 'rider');
      
      const payload = {
        status: 'ONLINE',
        location: { lat: 34.5, lng: 69.2 }
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'UNAUTHORIZED',
        message: 'Only drivers can change status'
      });
    });
    
    it('should reject invalid payload', async () => {
      await socketServer.onDriverStatusChange(mockSocket, null);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid status change payload'
      });
    });
    
    it('should reject missing status field', async () => {
      const payload = {
        location: { lat: 34.5, lng: 69.2 }
        // Missing status
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_STATUS',
        message: 'Status is required'
      });
    });
    
    it('should reject invalid status value', async () => {
      const payload = {
        status: 'BUSY', // Invalid status
        location: { lat: 34.5, lng: 69.2 }
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_STATUS_VALUE',
        message: 'Status must be ONLINE or OFFLINE'
      });
    });
    
    it('should reject missing location field', async () => {
      const payload = {
        status: 'ONLINE'
        // Missing location
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_LOCATION',
        message: 'Location is required'
      });
    });
    
    it('should reject invalid location coordinates - latitude out of range', async () => {
      const payload = {
        status: 'ONLINE',
        location: { lat: 100, lng: 69.2 } // Invalid latitude
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_LOCATION_COORDINATES',
        message: 'Location coordinates must be valid latitude/longitude'
      });
    });
    
    it('should reject invalid location coordinates - longitude out of range', async () => {
      const payload = {
        status: 'ONLINE',
        location: { lat: 34.5, lng: 200 } // Invalid longitude
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'INVALID_LOCATION_COORDINATES',
        message: 'Location coordinates must be valid latitude/longitude'
      });
    });
  });
  
  describe('Successful Status Change', () => {
    it('should process valid status change to ONLINE successfully', async () => {
      const mockDriver = {
        _id: testDriverId,
        status: 'ONLINE',
        currentLocation: {
          type: 'Point',
          coordinates: [69.2, 34.5]
        },
        lastLocationUpdate: new Date()
      };
      
      Driver.findByIdAndUpdate.mockResolvedValue(mockDriver);
      
      const payload = {
        status: 'ONLINE',
        location: { lat: 34.5, lng: 69.2 }
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      // Verify Driver.findByIdAndUpdate was called with correct parameters
      expect(Driver.findByIdAndUpdate).toHaveBeenCalledWith(
        testDriverId,
        {
          $set: {
            status: 'ONLINE',
            currentLocation: {
              type: 'Point',
              coordinates: [69.2, 34.5] // GeoJSON format: [lng, lat]
            },
            lastLocationUpdate: expect.any(Date)
          }
        },
        { new: true, runValidators: true }
      );
      
      // Verify success response
      expect(mockSocket.emit).toHaveBeenCalledWith('driverStatusChangeSuccess', {
        status: 'ONLINE',
        location: { lat: 34.5, lng: 69.2 },
        lastLocationUpdate: expect.any(Date),
        message: 'Status changed to ONLINE successfully'
      });
    });
    
    it('should process valid status change to OFFLINE successfully', async () => {
      const mockDriver = {
        _id: testDriverId,
        status: 'OFFLINE',
        currentLocation: {
          type: 'Point',
          coordinates: [69.3, 34.6]
        },
        lastLocationUpdate: new Date()
      };
      
      Driver.findByIdAndUpdate.mockResolvedValue(mockDriver);
      
      const payload = {
        status: 'OFFLINE',
        location: { lat: 34.6, lng: 69.3 }
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      // Verify Driver.findByIdAndUpdate was called
      expect(Driver.findByIdAndUpdate).toHaveBeenCalledWith(
        testDriverId,
        {
          $set: {
            status: 'OFFLINE',
            currentLocation: {
              type: 'Point',
              coordinates: [69.3, 34.6]
            },
            lastLocationUpdate: expect.any(Date)
          }
        },
        { new: true, runValidators: true }
      );
      
      // Verify success response
      expect(mockSocket.emit).toHaveBeenCalledWith('driverStatusChangeSuccess', {
        status: 'OFFLINE',
        location: { lat: 34.6, lng: 69.3 },
        lastLocationUpdate: expect.any(Date),
        message: 'Status changed to OFFLINE successfully'
      });
    });
    
    it('should update lastLocationUpdate timestamp', async () => {
      const now = new Date();
      const mockDriver = {
        _id: testDriverId,
        status: 'ONLINE',
        currentLocation: {
          type: 'Point',
          coordinates: [69.2, 34.5]
        },
        lastLocationUpdate: now
      };
      
      Driver.findByIdAndUpdate.mockResolvedValue(mockDriver);
      
      const payload = {
        status: 'ONLINE',
        location: { lat: 34.5, lng: 69.2 }
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      // Verify lastLocationUpdate was set
      const updateCall = Driver.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.lastLocationUpdate).toBeInstanceOf(Date);
      
      // Verify it's included in the response
      expect(mockSocket.emit).toHaveBeenCalledWith('driverStatusChangeSuccess', 
        expect.objectContaining({
          lastLocationUpdate: expect.any(Date)
        })
      );
    });
    
    it('should handle location with valid coordinates at boundaries', async () => {
      const mockDriver = {
        _id: testDriverId,
        status: 'ONLINE',
        currentLocation: {
          type: 'Point',
          coordinates: [60, 29] // Afghanistan boundary
        },
        lastLocationUpdate: new Date()
      };
      
      Driver.findByIdAndUpdate.mockResolvedValue(mockDriver);
      
      const payload = {
        status: 'ONLINE',
        location: { lat: 29, lng: 60 } // Afghanistan boundary
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(Driver.findByIdAndUpdate).toHaveBeenCalled();
      expect(mockSocket.emit).toHaveBeenCalledWith('driverStatusChangeSuccess', 
        expect.objectContaining({
          status: 'ONLINE'
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    it('should handle driver not found in database', async () => {
      Driver.findByIdAndUpdate.mockResolvedValue(null);
      
      const payload = {
        status: 'ONLINE',
        location: { lat: 34.5, lng: 69.2 }
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        code: 'DRIVER_NOT_FOUND',
        message: 'Driver not found in database'
      });
    });
    
    it('should handle database errors gracefully', async () => {
      Driver.findByIdAndUpdate.mockRejectedValue(new Error('Database connection failed'));
      
      const payload = {
        status: 'ONLINE',
        location: { lat: 34.5, lng: 69.2 }
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', expect.objectContaining({
        code: 'STATUS_CHANGE_FAILED',
        message: 'Failed to process status change'
      }));
    });
  });
  
  describe('GeoJSON Format', () => {
    it('should convert lat/lng to GeoJSON coordinates format [lng, lat]', async () => {
      const mockDriver = {
        _id: testDriverId,
        status: 'ONLINE',
        currentLocation: {
          type: 'Point',
          coordinates: [69.2, 34.5]
        },
        lastLocationUpdate: new Date()
      };
      
      Driver.findByIdAndUpdate.mockResolvedValue(mockDriver);
      
      const payload = {
        status: 'ONLINE',
        location: { lat: 34.5, lng: 69.2 }
      };
      
      await socketServer.onDriverStatusChange(mockSocket, payload);
      
      // Verify coordinates are in GeoJSON format [longitude, latitude]
      const updateCall = Driver.findByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.currentLocation.coordinates).toEqual([69.2, 34.5]);
      expect(updateCall[1].$set.currentLocation.type).toBe('Point');
    });
  });
});
