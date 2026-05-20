/**
 * TimeoutManager class handles ride request timeouts
 * 
 * Manages 120-second timers for ride requests, emits expiration events,
 * and tracks active requests with their associated riders and drivers.
 */

class TimeoutManager {
  /**
   * Creates a new TimeoutManager instance
   * @param {SocketServer} socketServer - The Socket.IO server instance
   */
  constructor(socketServer) {
    this.socketServer = socketServer;
    
    // Map to track active requests: requestId -> { riderId, driverIds, timer, expiresAt }
    this.activeRequests = new Map();
    
    console.log('✅ TimeoutManager initialized');
  }
  
  /**
   * Starts a 120-second timeout timer for a ride request
   * @param {string} requestId - Unique ride request identifier
   * @param {string} riderId - Rider user ID
   * @param {Array<string>} driverIds - Array of driver user IDs who received the request
   */
  startTimeout(requestId, riderId, driverIds) {
    // Validate inputs
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Invalid requestId: must be a non-empty string');
    }
    
    if (!riderId || typeof riderId !== 'string') {
      throw new Error('Invalid riderId: must be a non-empty string');
    }
    
    if (!Array.isArray(driverIds)) {
      throw new Error('Invalid driverIds: must be an array');
    }
    
    // Cancel existing timeout if present (shouldn't happen, but defensive)
    if (this.activeRequests.has(requestId)) {
      console.warn(`⚠️ Request ${requestId} already has a timeout, cancelling old one`);
      this.cancelTimeout(requestId);
    }
    
    // Create 120-second timer
    const timer = setTimeout(() => {
      this.handleExpiration(requestId);
    }, 120000); // 120 seconds = 120,000 milliseconds
    
    // Store request data
    const expiresAt = Date.now() + 120000;
    this.activeRequests.set(requestId, {
      riderId,
      driverIds,
      timer,
      expiresAt
    });
    
    console.log(`⏱️ Started 120s timeout for request ${requestId} (rider: ${riderId}, drivers: ${driverIds.length})`);
  }
  
  /**
   * Cancels a timeout timer and cleans up request data
   * @param {string} requestId - Unique ride request identifier
   * @returns {boolean} True if timeout was cancelled, false if request not found
   */
  cancelTimeout(requestId) {
    const request = this.activeRequests.get(requestId);
    
    if (!request) {
      console.warn(`⚠️ Cannot cancel timeout for request ${requestId}: not found`);
      return false;
    }
    
    // Clear the timer
    clearTimeout(request.timer);
    
    // Remove from active requests
    this.activeRequests.delete(requestId);
    
    console.log(`✅ Cancelled timeout for request ${requestId}`);
    return true;
  }
  
  /**
   * Handles timeout expiration by emitting requestExpired events
   * @param {string} requestId - Unique ride request identifier
   */
  handleExpiration(requestId) {
    const request = this.activeRequests.get(requestId);
    
    if (!request) {
      // Request was already cancelled or expired
      console.warn(`⚠️ Timeout expired for request ${requestId} but request not found (likely already cancelled)`);
      return;
    }
    
    const { riderId, driverIds } = request;
    
    console.log(`⏰ Request ${requestId} expired after 120 seconds`);
    
    // Emit requestExpired event to the rider
    const riderEmitted = this.socketServer.emitToUser(riderId, 'requestExpired', { requestId });
    if (riderEmitted) {
      console.log(`📤 Emitted requestExpired to rider ${riderId}`);
    } else {
      console.warn(`⚠️ Failed to emit requestExpired to rider ${riderId} (not connected)`);
    }
    
    // Emit requestExpired event to all drivers who received the request
    const driversNotified = this.socketServer.emitToDrivers(driverIds, 'requestExpired', { requestId });
    console.log(`📤 Emitted requestExpired to ${driversNotified}/${driverIds.length} drivers`);
    
    // Clean up the request
    this.activeRequests.delete(requestId);
  }
  
  /**
   * Gets all active requests
   * @returns {Map<string, Object>} Map of requestId -> { riderId, driverIds, expiresAt }
   */
  getActiveRequests() {
    // Return a copy of the map without the timer objects (for inspection/debugging)
    const requests = new Map();
    
    for (const [requestId, data] of this.activeRequests.entries()) {
      requests.set(requestId, {
        riderId: data.riderId,
        driverIds: data.driverIds,
        expiresAt: data.expiresAt
      });
    }
    
    return requests;
  }
  
  /**
   * Checks if a request is active
   * @param {string} requestId - Unique ride request identifier
   * @returns {boolean} True if request has an active timeout
   */
  isActive(requestId) {
    return this.activeRequests.has(requestId);
  }
  
  /**
   * Gets the expiration time for a request
   * @param {string} requestId - Unique ride request identifier
   * @returns {number|null} Expiration timestamp or null if not found
   */
  getExpirationTime(requestId) {
    const request = this.activeRequests.get(requestId);
    return request ? request.expiresAt : null;
  }
  
  /**
   * Gets the time remaining for a request in milliseconds
   * @param {string} requestId - Unique ride request identifier
   * @returns {number|null} Time remaining in milliseconds or null if not found
   */
  getTimeRemaining(requestId) {
    const expiresAt = this.getExpirationTime(requestId);
    if (!expiresAt) {
      return null;
    }
    
    const remaining = expiresAt - Date.now();
    return Math.max(0, remaining); // Never return negative values
  }
}

module.exports = TimeoutManager;
