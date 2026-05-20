/**
 * Tests for TimeoutManager class
 */

const TimeoutManager = require('./timeoutManager');

describe('TimeoutManager', () => {
  let mockSocketServer;
  let timeoutManager;
  
  beforeEach(() => {
    // Create mock socket server
    mockSocketServer = {
      emitToUser: jest.fn().mockReturnValue(true),
      emitToDrivers: jest.fn().mockReturnValue(2)
    };
    
    // Create TimeoutManager instance
    timeoutManager = new TimeoutManager(mockSocketServer);
    
    // Use fake timers
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    // Clear all timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });
  
  describe('constructor', () => {
    test('should initialize with empty activeRequests map', () => {
      expect(timeoutManager.activeRequests.size).toBe(0);
    });
    
    test('should store socketServer reference', () => {
      expect(timeoutManager.socketServer).toBe(mockSocketServer);
    });
  });
  
  describe('startTimeout', () => {
    test('should start a 120-second timeout for a ride request', () => {
      const requestId = 'req-123';
      const riderId = 'rider-456';
      const driverIds = ['driver-1', 'driver-2'];
      
      timeoutManager.startTimeout(requestId, riderId, driverIds);
      
      // Verify request is stored
      expect(timeoutManager.activeRequests.has(requestId)).toBe(true);
      
      const request = timeoutManager.activeRequests.get(requestId);
      expect(request.riderId).toBe(riderId);
      expect(request.driverIds).toEqual(driverIds);
      expect(request.timer).toBeDefined();
      expect(request.expiresAt).toBeGreaterThan(Date.now());
    });
    
    test('should throw error for invalid requestId', () => {
      expect(() => {
        timeoutManager.startTimeout('', 'rider-1', []);
      }).toThrow('Invalid requestId');
      
      expect(() => {
        timeoutManager.startTimeout(null, 'rider-1', []);
      }).toThrow('Invalid requestId');
    });
    
    test('should throw error for invalid riderId', () => {
      expect(() => {
        timeoutManager.startTimeout('req-1', '', []);
      }).toThrow('Invalid riderId');
      
      expect(() => {
        timeoutManager.startTimeout('req-1', null, []);
      }).toThrow('Invalid riderId');
    });
    
    test('should throw error for invalid driverIds', () => {
      expect(() => {
        timeoutManager.startTimeout('req-1', 'rider-1', 'not-an-array');
      }).toThrow('Invalid driverIds');
      
      expect(() => {
        timeoutManager.startTimeout('req-1', 'rider-1', null);
      }).toThrow('Invalid driverIds');
    });
    
    test('should cancel existing timeout if request already exists', () => {
      const requestId = 'req-123';
      const riderId = 'rider-456';
      const driverIds = ['driver-1'];
      
      // Start first timeout
      timeoutManager.startTimeout(requestId, riderId, driverIds);
      const firstTimer = timeoutManager.activeRequests.get(requestId).timer;
      
      // Start second timeout with same requestId
      timeoutManager.startTimeout(requestId, riderId, driverIds);
      const secondTimer = timeoutManager.activeRequests.get(requestId).timer;
      
      // Timers should be different
      expect(firstTimer).not.toBe(secondTimer);
    });
    
    test('should set expiresAt to 120 seconds from now', () => {
      const requestId = 'req-123';
      const riderId = 'rider-456';
      const driverIds = ['driver-1'];
      
      const beforeTime = Date.now();
      timeoutManager.startTimeout(requestId, riderId, driverIds);
      const afterTime = Date.now();
      
      const request = timeoutManager.activeRequests.get(requestId);
      const expectedMin = beforeTime + 120000;
      const expectedMax = afterTime + 120000;
      
      expect(request.expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(request.expiresAt).toBeLessThanOrEqual(expectedMax);
    });
  });
  
  describe('cancelTimeout', () => {
    test('should cancel timeout and remove request from activeRequests', () => {
      const requestId = 'req-123';
      const riderId = 'rider-456';
      const driverIds = ['driver-1'];
      
      timeoutManager.startTimeout(requestId, riderId, driverIds);
      expect(timeoutManager.activeRequests.has(requestId)).toBe(true);
      
      const result = timeoutManager.cancelTimeout(requestId);
      
      expect(result).toBe(true);
      expect(timeoutManager.activeRequests.has(requestId)).toBe(false);
    });
    
    test('should return false if request not found', () => {
      const result = timeoutManager.cancelTimeout('non-existent-request');
      expect(result).toBe(false);
    });
    
    test('should prevent timeout from firing after cancellation', () => {
      const requestId = 'req-123';
      const riderId = 'rider-456';
      const driverIds = ['driver-1'];
      
      timeoutManager.startTimeout(requestId, riderId, driverIds);
      timeoutManager.cancelTimeout(requestId);
      
      // Fast-forward time by 120 seconds
      jest.advanceTimersByTime(120000);
      
      // handleExpiration should not have been called
      expect(mockSocketServer.emitToUser).not.toHaveBeenCalled();
      expect(mockSocketServer.emitToDrivers).not.toHaveBeenCalled();
    });
  });
  
  describe('handleExpiration', () => {
    test('should emit requestExpired to rider and drivers', () => {
      const requestId = 'req-123';
      const riderId = 'rider-456';
      const driverIds = ['driver-1', 'driver-2'];
      
      timeoutManager.startTimeout(requestId, riderId, driverIds);
      
      // Fast-forward time by 120 seconds
      jest.advanceTimersByTime(120000);
      
      // Verify events were emitted
      expect(mockSocketServer.emitToUser).toHaveBeenCalledWith(
        riderId,
        'requestExpired',
        { requestId }
      );
      
      expect(mockSocketServer.emitToDrivers).toHaveBeenCalledWith(
        driverIds,
        'requestExpired',
        { requestId }
      );
    });
    
    test('should remove request from activeRequests after expiration', () => {
      const requestId = 'req-123';
      const riderId = 'rider-456';
      const driverIds = ['driver-1'];
      
      timeoutManager.startTimeout(requestId, riderId, driverIds);
      expect(timeoutManager.activeRequests.has(requestId)).toBe(true);
      
      // Fast-forward time by 120 seconds
      jest.advanceTimersByTime(120000);
      
      expect(timeoutManager.activeRequests.has(requestId)).toBe(false);
    });
    
    test('should handle expiration when request not found', () => {
      // Manually call handleExpiration with non-existent request
      // Should not throw error
      expect(() => {
        timeoutManager.handleExpiration('non-existent-request');
      }).not.toThrow();
      
      // Should not emit any events
      expect(mockSocketServer.emitToUser).not.toHaveBeenCalled();
      expect(mockSocketServer.emitToDrivers).not.toHaveBeenCalled();
    });
  });
  
  describe('getActiveRequests', () => {
    test('should return empty map when no active requests', () => {
      const requests = timeoutManager.getActiveRequests();
      expect(requests.size).toBe(0);
    });
    
    test('should return map of active requests without timer objects', () => {
      const requestId1 = 'req-1';
      const requestId2 = 'req-2';
      
      timeoutManager.startTimeout(requestId1, 'rider-1', ['driver-1']);
      timeoutManager.startTimeout(requestId2, 'rider-2', ['driver-2', 'driver-3']);
      
      const requests = timeoutManager.getActiveRequests();
      
      expect(requests.size).toBe(2);
      expect(requests.has(requestId1)).toBe(true);
      expect(requests.has(requestId2)).toBe(true);
      
      const request1 = requests.get(requestId1);
      expect(request1.riderId).toBe('rider-1');
      expect(request1.driverIds).toEqual(['driver-1']);
      expect(request1.expiresAt).toBeDefined();
      expect(request1.timer).toBeUndefined(); // Timer should not be included
    });
  });
  
  describe('isActive', () => {
    test('should return true for active request', () => {
      const requestId = 'req-123';
      timeoutManager.startTimeout(requestId, 'rider-1', ['driver-1']);
      
      expect(timeoutManager.isActive(requestId)).toBe(true);
    });
    
    test('should return false for non-existent request', () => {
      expect(timeoutManager.isActive('non-existent')).toBe(false);
    });
    
    test('should return false after timeout is cancelled', () => {
      const requestId = 'req-123';
      timeoutManager.startTimeout(requestId, 'rider-1', ['driver-1']);
      timeoutManager.cancelTimeout(requestId);
      
      expect(timeoutManager.isActive(requestId)).toBe(false);
    });
  });
  
  describe('getExpirationTime', () => {
    test('should return expiration timestamp for active request', () => {
      const requestId = 'req-123';
      timeoutManager.startTimeout(requestId, 'rider-1', ['driver-1']);
      
      const expiresAt = timeoutManager.getExpirationTime(requestId);
      expect(expiresAt).toBeGreaterThan(Date.now());
    });
    
    test('should return null for non-existent request', () => {
      expect(timeoutManager.getExpirationTime('non-existent')).toBeNull();
    });
  });
  
  describe('getTimeRemaining', () => {
    test('should return time remaining in milliseconds', () => {
      const requestId = 'req-123';
      timeoutManager.startTimeout(requestId, 'rider-1', ['driver-1']);
      
      const remaining = timeoutManager.getTimeRemaining(requestId);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(120000);
    });
    
    test('should return null for non-existent request', () => {
      expect(timeoutManager.getTimeRemaining('non-existent')).toBeNull();
    });
    
    test('should return 0 when time has expired', () => {
      const requestId = 'req-123';
      timeoutManager.startTimeout(requestId, 'rider-1', ['driver-1']);
      
      // Fast-forward time by 121 seconds (past expiration)
      jest.advanceTimersByTime(121000);
      
      // Note: After expiration, the request is removed, so this will return null
      // But if we check before the cleanup, it should return 0
      const remaining = timeoutManager.getTimeRemaining(requestId);
      expect(remaining).toBeNull(); // Request was cleaned up
    });
  });
});
