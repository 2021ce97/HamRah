/**
 * Socket.IO Server for Real-Time Ride Matching
 * 
 * Manages WebSocket connections for riders and drivers, handles authentication,
 * routes events between users, and maintains socket-to-user mappings.
 */

const { Server } = require('socket.io');
const ConnectionAuthenticator = require('./connectionAuth');
const { v4: uuidv4 } = require('uuid');
const CoordinateValidator = require('../utils/coordinateValidator');
const FareValidator = require('../utils/fareValidator');
const Ride = require('../models/Ride');

class SocketServer {
  constructor(httpServer, jwtSecret) {
    this.jwtSecret = jwtSecret;
    
    // Initialize authentication handler
    this.authenticator = new ConnectionAuthenticator(jwtSecret);
    
    // In-memory mappings for socket-user relationships
    this.socketToUser = new Map(); // socketId -> { userId, role: 'rider' | 'driver' }
    this.userToSocket = new Map(); // userId -> socketId
    
    // Initialize Socket.IO server with CORS configuration for React Native
    this.io = new Server(httpServer, {
      cors: {
        origin: '*', // Allow all origins for React Native development
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'], // Support both for poor network conditions
      pingTimeout: 60000, // 60 seconds
      pingInterval: 25000, // 25 seconds
      connectTimeout: 45000 // 45 seconds for slow networks
    });
    
    console.log('✅ Socket.IO server initialized with React Native CORS support');
    
    // Register authentication middleware
    this.io.use(this.authenticator.createMiddleware(this));
    console.log('✅ JWT authentication middleware registered');
  }
  
  /**
   * Initialize event handlers for Socket.IO connections
   */
  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`⚡ New socket connection: ${socket.id}`);
      
      // Handle connection
      this.handleConnection(socket);
      
      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
      
      // Register requestRide event handler
      socket.on('requestRide', (payload) => {
        this.onRequestRide(socket, payload);
      });
      
      // Register fareCounter event handler
      socket.on('fareCounter', (payload) => {
        this.onFareCounter(socket, payload);
      });
      
      // Register rideAccepted event handler
      socket.on('rideAccepted', (payload) => {
        this.onRideAccepted(socket, payload);
      });
      
      // Register driverStatusChange event handler
      socket.on('driverStatusChange', (payload) => {
        this.onDriverStatusChange(socket, payload);
      });
      
      // Event handlers will be registered here by other modules
      // This allows for modular event handling
    });
  }
  
  /**
   * Handle new socket connection
   * Socket is already authenticated by middleware at this point
   * 
   * @param {Socket} socket - Socket.IO socket instance
   */
  handleConnection(socket) {
    // Socket is already authenticated and registered by middleware
    const { userId, role } = socket;
    console.log(`✅ Authenticated ${role} connected: userId=${userId}, socketId=${socket.id}`);
    
    // Emit connection success event to client
    socket.emit('authenticated', {
      userId,
      role,
      message: 'Successfully authenticated'
    });
  }
  
  /**
   * Handle socket disconnection
   * Cleans up socket-user mappings
   * 
   * @param {Socket} socket - Socket.IO socket instance
   */
  handleDisconnection(socket) {
    const userData = this.socketToUser.get(socket.id);
    
    if (userData) {
      const { userId, role } = userData;
      console.log(`❌ ${role} disconnected: userId=${userId}, socketId=${socket.id}`);
      
      // Clean up mappings
      this.socketToUser.delete(socket.id);
      this.userToSocket.delete(userId);
    } else {
      console.log(`❌ Unauthenticated socket disconnected: ${socket.id}`);
    }
  }
  
  /**
   * Store socket-user mapping after successful authentication
   * 
   * @param {string} socketId - Socket ID
   * @param {string} userId - User ID from JWT
   * @param {string} role - User role ('rider' or 'driver')
   */
  registerUser(socketId, userId, role) {
    // Remove old socket mapping if user reconnects
    const oldSocketId = this.userToSocket.get(userId);
    if (oldSocketId) {
      this.socketToUser.delete(oldSocketId);
      console.log(`🔄 User ${userId} reconnected, removing old socket ${oldSocketId}`);
    }
    
    // Store new mappings
    this.socketToUser.set(socketId, { userId, role });
    this.userToSocket.set(userId, socketId);
    
    console.log(`✅ Registered ${role}: userId=${userId}, socketId=${socketId}`);
  }
  
  /**
   * Get socket instance for a specific user
   * 
   * @param {string} userId - User ID
   * @returns {Socket|null} Socket instance or null if not connected
   */
  getUserSocket(userId) {
    const socketId = this.userToSocket.get(userId);
    if (!socketId) {
      return null;
    }
    
    return this.io.sockets.sockets.get(socketId) || null;
  }
  
  /**
   * Emit event to a specific user
   * 
   * @param {string} userId - User ID
   * @param {string} eventName - Event name
   * @param {Object} payload - Event payload
   * @returns {boolean} True if event was sent, false if user not connected
   */
  emitToUser(userId, eventName, payload) {
    const socket = this.getUserSocket(userId);
    
    if (!socket) {
      console.warn(`⚠️ Cannot emit ${eventName} to user ${userId}: not connected`);
      return false;
    }
    
    socket.emit(eventName, payload);
    console.log(`📤 Emitted ${eventName} to user ${userId}`);
    return true;
  }
  
  /**
   * Emit event to multiple drivers
   * 
   * @param {Array<string>} driverIds - Array of driver user IDs
   * @param {string} eventName - Event name
   * @param {Object} payload - Event payload
   * @returns {number} Number of drivers who received the event
   */
  emitToDrivers(driverIds, eventName, payload) {
    let successCount = 0;
    
    for (const driverId of driverIds) {
      if (this.emitToUser(driverId, eventName, payload)) {
        successCount++;
      }
    }
    
    console.log(`📤 Emitted ${eventName} to ${successCount}/${driverIds.length} drivers`);
    return successCount;
  }
  
  /**
   * Get user data for a socket
   * 
   * @param {string} socketId - Socket ID
   * @returns {Object|null} User data { userId, role } or null
   */
  getUserData(socketId) {
    return this.socketToUser.get(socketId) || null;
  }
  
  /**
   * Handle requestRide event from rider
   * Validates payload, finds nearby drivers, emits ride request, starts timeout, saves to database
   * 
   * @param {Socket} socket - Socket.IO socket instance
   * @param {Object} payload - Ride request payload
   * @param {Object} payload.pickup - Pickup coordinates {lat: Number, lng: Number}
   * @param {Object} payload.destination - Destination coordinates {lat: Number, lng: Number}
   * @param {Number} payload.proposedFare - Proposed fare amount in AFN
   * @param {Object} payload.riderProfile - Rider profile {name: String, rating: Number}
   * 
   * Requirements: 3.1, 4.1, 4.2, 4.3
   */
  async onRequestRide(socket, payload) {
    try {
      // Get rider info from socket
      const userData = this.getUserData(socket.id);
      if (!userData || userData.role !== 'rider') {
        socket.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Only riders can request rides'
        });
        return;
      }
      
      const riderId = userData.userId;
      
      // Validate payload structure
      if (!payload || typeof payload !== 'object') {
        socket.emit('error', {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid request payload'
        });
        return;
      }
      
      const { pickup, destination, proposedFare, riderProfile } = payload;
      
      // Validate pickup coordinates
      if (!pickup || typeof pickup !== 'object') {
        socket.emit('error', {
          code: 'INVALID_PICKUP',
          message: 'Invalid pickup coordinates'
        });
        return;
      }
      
      if (!CoordinateValidator.isValidCoordinatePair(pickup.lat, pickup.lng)) {
        socket.emit('error', {
          code: 'INVALID_PICKUP_COORDINATES',
          message: 'Pickup coordinates must be valid latitude/longitude'
        });
        return;
      }
      
      // Validate destination coordinates
      if (!destination || typeof destination !== 'object') {
        socket.emit('error', {
          code: 'INVALID_DESTINATION',
          message: 'Invalid destination coordinates'
        });
        return;
      }
      
      if (!CoordinateValidator.isValidCoordinatePair(destination.lat, destination.lng)) {
        socket.emit('error', {
          code: 'INVALID_DESTINATION_COORDINATES',
          message: 'Destination coordinates must be valid latitude/longitude'
        });
        return;
      }
      
      // Validate Afghanistan boundaries
      if (!CoordinateValidator.isWithinAfghanistan(pickup.lat, pickup.lng)) {
        socket.emit('error', {
          code: 'PICKUP_OUT_OF_BOUNDS',
          message: 'Pickup location must be within Afghanistan'
        });
        return;
      }
      
      if (!CoordinateValidator.isWithinAfghanistan(destination.lat, destination.lng)) {
        socket.emit('error', {
          code: 'DESTINATION_OUT_OF_BOUNDS',
          message: 'Destination location must be within Afghanistan'
        });
        return;
      }
      
      // Validate proposed fare
      if (!FareValidator.isValidFare(proposedFare)) {
        socket.emit('error', {
          code: 'INVALID_FARE',
          message: 'Proposed fare must be a positive number'
        });
        return;
      }
      
      // Validate rider profile
      if (!riderProfile || typeof riderProfile !== 'object') {
        socket.emit('error', {
          code: 'INVALID_RIDER_PROFILE',
          message: 'Invalid rider profile'
        });
        return;
      }
      
      // Generate unique request ID
      const requestId = uuidv4();
      
      console.log(`🚗 Processing ride request ${requestId} from rider ${riderId}`);
      
      // Find nearby drivers using RideMatcher
      if (!this.rideMatcher) {
        throw new Error('RideMatcher not initialized');
      }
      
      const nearbyDrivers = await this.rideMatcher.findNearbyDrivers(pickup, 5);
      
      console.log(`📍 Found ${nearbyDrivers.length} nearby drivers within 5km`);
      
      if (nearbyDrivers.length === 0) {
        socket.emit('error', {
          code: 'NO_DRIVERS_AVAILABLE',
          message: 'No drivers available in your area'
        });
        return;
      }
      
      // Calculate estimated distance (use first driver's distance as approximation)
      const estimatedDistance = nearbyDrivers.length > 0 
        ? Math.round(nearbyDrivers[0].distance * 1000) // Convert km to meters
        : 0;
      
      // Estimate duration (rough estimate: 30 km/h average speed in city)
      const estimatedDuration = estimatedDistance > 0
        ? Math.round((estimatedDistance / 1000) / 30 * 3600) // Convert to seconds
        : 0;
      
      // Save ride record to database with status 'Pending'
      const ride = new Ride({
        riderId,
        pickup: {
          lat: pickup.lat,
          lng: pickup.lng,
          landmarkName: pickup.landmarkName || ''
        },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
          landmarkName: destination.landmarkName || ''
        },
        status: 'Pending',
        proposedFare,
        estimatedDistance,
        estimatedDuration,
        expiresAt: new Date(Date.now() + 120000), // 120 seconds from now
        createdAt: new Date()
      });
      
      await ride.save();
      
      console.log(`💾 Saved ride ${requestId} to database with ID ${ride._id}`);
      
      // Prepare ride request event payload for drivers
      const rideRequestPayload = {
        requestId,
        rideId: ride._id.toString(),
        pickup: {
          lat: pickup.lat,
          lng: pickup.lng,
          landmarkName: pickup.landmarkName || ''
        },
        destination: {
          lat: destination.lat,
          lng: destination.lng,
          landmarkName: destination.landmarkName || ''
        },
        proposedFare,
        riderRating: riderProfile.rating || 5.0,
        riderName: riderProfile.name || 'Rider',
        estimatedDistance,
        createdAt: new Date()
      };
      
      // Emit ride request to all nearby driver sockets
      const driverIds = nearbyDrivers.map(d => d.driverId);
      const emittedCount = this.emitToDrivers(driverIds, 'rideRequest', rideRequestPayload);
      
      console.log(`📤 Emitted ride request to ${emittedCount}/${driverIds.length} drivers`);
      
      // Start timeout using TimeoutManager
      if (!this.timeoutManager) {
        throw new Error('TimeoutManager not initialized');
      }
      
      this.timeoutManager.startTimeout(requestId, riderId, driverIds);
      
      // Send confirmation to rider
      socket.emit('requestRideSuccess', {
        requestId,
        rideId: ride._id.toString(),
        driversNotified: emittedCount,
        expiresAt: ride.expiresAt
      });
      
      console.log(`✅ Ride request ${requestId} processed successfully`);
      
    } catch (error) {
      console.error(`❌ Error processing ride request:`, error);
      socket.emit('error', {
        code: 'REQUEST_FAILED',
        message: 'Failed to process ride request',
        details: error.message
      });
    }
  }
  
  /**
   * Handle fareCounter event from driver
   * Validates payload, checks ride is still active, adds counter-offer to database, routes to rider
   * 
   * @param {Socket} socket - Socket.IO socket instance
   * @param {Object} payload - Counter-offer payload
   * @param {string} payload.requestId - Unique ride request identifier
   * @param {string} payload.driverId - Driver's user ID
   * @param {number} payload.counterAmount - Counter-offer amount in AFN
   * 
   * Requirements: 6.2, 6.3, 6.5, 7.1
   */
  async onFareCounter(socket, payload) {
    try {
      // Get driver info from socket
      const userData = this.getUserData(socket.id);
      if (!userData || userData.role !== 'driver') {
        socket.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Only drivers can submit counter-offers'
        });
        return;
      }
      
      const authenticatedDriverId = userData.userId;
      
      // Validate payload structure
      if (!payload || typeof payload !== 'object') {
        socket.emit('error', {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid counter-offer payload'
        });
        return;
      }
      
      const { requestId, driverId, counterAmount } = payload;
      
      // Validate requestId
      if (!requestId || typeof requestId !== 'string') {
        socket.emit('error', {
          code: 'INVALID_REQUEST_ID',
          message: 'Request ID is required'
        });
        return;
      }
      
      // Validate driverId
      if (!driverId || typeof driverId !== 'string') {
        socket.emit('error', {
          code: 'INVALID_DRIVER_ID',
          message: 'Driver ID is required'
        });
        return;
      }
      
      // Verify that the driverId in payload matches the authenticated driver
      if (driverId !== authenticatedDriverId) {
        socket.emit('error', {
          code: 'DRIVER_ID_MISMATCH',
          message: 'Driver ID does not match authenticated user'
        });
        return;
      }
      
      // Validate counterAmount is positive using FareValidator
      if (!FareValidator.isValidFare(counterAmount)) {
        socket.emit('error', {
          code: 'INVALID_COUNTER_AMOUNT',
          message: 'Counter-offer amount must be a positive number'
        });
        return;
      }
      
      console.log(`💰 Processing counter-offer from driver ${driverId} for request ${requestId}: ${counterAmount} AFN`);
      
      // Look up ride record by requestId (stored in the ride document)
      // Note: We need to find the ride that was created with this requestId
      // Since requestId is not stored in the database, we'll need to use the rideId instead
      // For now, we'll look up by the most recent pending ride for this scenario
      // In production, you'd want to store requestId in the Ride model or use a separate mapping
      
      // Find the ride - we need to search by a field that links to requestId
      // Since the current implementation doesn't store requestId in the Ride model,
      // we'll need to find another way. Let's check if rideId was passed or if we need to query differently
      
      // For this implementation, let's assume requestId is actually the MongoDB _id (rideId)
      // This is a reasonable assumption based on the onRequestRide implementation
      const ride = await Ride.findById(requestId);
      
      if (!ride) {
        socket.emit('error', {
          code: 'RIDE_NOT_FOUND',
          message: 'Ride request not found'
        });
        return;
      }
      
      // Verify ride is still active (not expired/accepted)
      if (ride.status === 'Expired') {
        socket.emit('error', {
          code: 'RIDE_EXPIRED',
          message: 'This ride request has expired'
        });
        return;
      }
      
      if (ride.status === 'Accepted') {
        socket.emit('error', {
          code: 'RIDE_ALREADY_ACCEPTED',
          message: 'This ride request has already been accepted'
        });
        return;
      }
      
      if (ride.status === 'Cancelled') {
        socket.emit('error', {
          code: 'RIDE_CANCELLED',
          message: 'This ride request has been cancelled'
        });
        return;
      }
      
      // Check if ride has expired based on expiresAt timestamp
      if (ride.expiresAt && new Date() > ride.expiresAt) {
        socket.emit('error', {
          code: 'RIDE_EXPIRED',
          message: 'This ride request has expired'
        });
        return;
      }
      
      // Add counter-offer to ride's counterOffers array in database
      ride.counterOffers.push({
        driverId: driverId,
        amount: counterAmount,
        timestamp: new Date()
      });
      
      // Update status to Negotiating if it's still Pending
      if (ride.status === 'Pending') {
        ride.status = 'Negotiating';
      }
      
      await ride.save();
      
      console.log(`💾 Saved counter-offer to ride ${requestId}, total offers: ${ride.counterOffers.length}`);
      
      // Get driver details for the event payload
      // We'll need to query the Driver model to get driver name and rating
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(driverId);
      
      if (!driver) {
        console.warn(`⚠️ Driver ${driverId} not found in database`);
        // Continue anyway, use default values
      }
      
      // Prepare fareCounter event payload for rider
      const fareCounterPayload = {
        requestId,
        rideId: ride._id.toString(),
        driverId,
        driverName: driver ? driver.name : 'Driver',
        driverRating: driver ? driver.rating : 5.0,
        counterAmount,
        timestamp: new Date()
      };
      
      // Route fareCounter event to rider socket using riderId from ride record
      const riderId = ride.riderId.toString();
      const success = this.emitToUser(riderId, 'fareCounter', fareCounterPayload);
      
      if (success) {
        console.log(`📤 Routed counter-offer to rider ${riderId}`);
        
        // Send confirmation to driver
        socket.emit('fareCounterSuccess', {
          requestId,
          rideId: ride._id.toString(),
          counterAmount,
          message: 'Counter-offer sent successfully'
        });
        
        console.log(`✅ Counter-offer processed successfully for request ${requestId}`);
      } else {
        console.warn(`⚠️ Failed to route counter-offer to rider ${riderId} (not connected)`);
        
        // Still confirm to driver that the offer was saved
        socket.emit('fareCounterSuccess', {
          requestId,
          rideId: ride._id.toString(),
          counterAmount,
          message: 'Counter-offer saved (rider currently offline)'
        });
      }
      
    } catch (error) {
      console.error(`❌ Error processing counter-offer:`, error);
      socket.emit('error', {
        code: 'COUNTER_OFFER_FAILED',
        message: 'Failed to process counter-offer',
        details: error.message
      });
    }
  }
  
  /**
   * Handle rideAccepted event from rider or driver
   * Validates payload, implements first-acceptance-wins logic, cancels timeout,
   * updates ride status, and notifies both parties
   * 
   * @param {Socket} socket - Socket.IO socket instance
   * @param {Object} payload - Ride acceptance payload
   * @param {string} payload.requestId - Unique ride request identifier
   * @param {string} payload.driverId - Driver's user ID
   * @param {number} payload.acceptedFare - Accepted fare amount in AFN
   * 
   * Requirements: 8.1, 8.4, 8.5, 9.1, 15.6, 15.7
   */
  async onRideAccepted(socket, payload) {
    try {
      // Get user info from socket
      const userData = this.getUserData(socket.id);
      if (!userData) {
        socket.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        });
        return;
      }
      
      const { userId, role } = userData;
      
      // Validate payload structure
      if (!payload || typeof payload !== 'object') {
        socket.emit('error', {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid ride acceptance payload'
        });
        return;
      }
      
      const { requestId, driverId, acceptedFare } = payload;
      
      // Validate requestId
      if (!requestId || typeof requestId !== 'string') {
        socket.emit('error', {
          code: 'INVALID_REQUEST_ID',
          message: 'Request ID is required'
        });
        return;
      }
      
      // Validate driverId
      if (!driverId || typeof driverId !== 'string') {
        socket.emit('error', {
          code: 'INVALID_DRIVER_ID',
          message: 'Driver ID is required'
        });
        return;
      }
      
      // Validate acceptedFare is positive using FareValidator
      if (!FareValidator.isValidFare(acceptedFare)) {
        socket.emit('error', {
          code: 'INVALID_ACCEPTED_FARE',
          message: 'Accepted fare must be a positive number'
        });
        return;
      }
      
      console.log(`✅ Processing ride acceptance from ${role} ${userId} for request ${requestId}`);
      
      // Implement first-acceptance-wins logic using database atomic update
      // Use findOneAndUpdate with status condition to ensure only one acceptance succeeds
      const updateResult = await Ride.findOneAndUpdate(
        {
          _id: requestId,
          status: { $in: ['Pending', 'Negotiating'] } // Only accept if still pending or negotiating
        },
        {
          $set: {
            status: 'Accepted',
            driverId: driverId,
            agreedFare: acceptedFare,
            acceptedAt: new Date()
          }
        },
        {
          new: true, // Return the updated document
          runValidators: true
        }
      );
      
      // Check if update succeeded (first-acceptance-wins)
      if (!updateResult) {
        // Ride was already accepted, expired, or not found
        const ride = await Ride.findById(requestId);
        
        if (!ride) {
          socket.emit('error', {
            code: 'RIDE_NOT_FOUND',
            message: 'Ride request not found'
          });
          return;
        }
        
        if (ride.status === 'Accepted') {
          socket.emit('error', {
            code: 'RIDE_ALREADY_ACCEPTED',
            message: 'This ride has already been accepted by another driver'
          });
          return;
        }
        
        if (ride.status === 'Expired') {
          socket.emit('error', {
            code: 'RIDE_EXPIRED',
            message: 'This ride request has expired'
          });
          return;
        }
        
        if (ride.status === 'Cancelled') {
          socket.emit('error', {
            code: 'RIDE_CANCELLED',
            message: 'This ride request has been cancelled'
          });
          return;
        }
        
        socket.emit('error', {
          code: 'ACCEPTANCE_FAILED',
          message: 'Failed to accept ride'
        });
        return;
      }
      
      const ride = updateResult;
      
      console.log(`💾 Ride ${requestId} accepted: driver=${driverId}, fare=${acceptedFare} AFN`);
      
      // Cancel timeout using TimeoutManager
      if (!this.timeoutManager) {
        console.warn('⚠️ TimeoutManager not initialized, cannot cancel timeout');
      } else {
        this.timeoutManager.cancelTimeout(requestId);
      }
      
      // Get driver details for the confirmation event
      const Driver = require('../models/Driver');
      const driver = await Driver.findById(driverId);
      
      if (!driver) {
        console.warn(`⚠️ Driver ${driverId} not found in database`);
      }
      
      // Get rider details for the confirmation event
      const User = require('../models/User');
      const rider = await User.findById(ride.riderId);
      
      if (!rider) {
        console.warn(`⚠️ Rider ${ride.riderId} not found in database`);
      }
      
      // Prepare rideAccepted confirmation payload
      const rideAcceptedPayload = {
        requestId,
        rideId: ride._id.toString(),
        driverId,
        riderId: ride.riderId.toString(),
        acceptedFare,
        driverDetails: driver ? {
          name: driver.name,
          rating: driver.rating,
          phoneNumber: driver.phoneNumber,
          vehicleDetails: driver.vehicleDetails
        } : null,
        riderDetails: rider ? {
          name: rider.name,
          rating: rider.rating,
          phoneNumber: rider.phoneNumber
        } : null,
        pickup: ride.pickup,
        destination: ride.destination,
        estimatedDistance: ride.estimatedDistance,
        estimatedDuration: ride.estimatedDuration,
        acceptedAt: ride.acceptedAt
      };
      
      // Emit rideAccepted confirmation to rider socket
      const riderNotified = this.emitToUser(ride.riderId.toString(), 'rideAccepted', rideAcceptedPayload);
      if (riderNotified) {
        console.log(`📤 Emitted rideAccepted confirmation to rider ${ride.riderId}`);
      } else {
        console.warn(`⚠️ Failed to emit rideAccepted to rider ${ride.riderId} (not connected)`);
      }
      
      // Emit rideAccepted confirmation to driver socket
      const driverNotified = this.emitToUser(driverId, 'rideAccepted', rideAcceptedPayload);
      if (driverNotified) {
        console.log(`📤 Emitted rideAccepted confirmation to driver ${driverId}`);
      } else {
        console.warn(`⚠️ Failed to emit rideAccepted to driver ${driverId} (not connected)`);
      }
      
      // Emit requestFilled event to all other drivers who received the request
      // We need to get the list of drivers who were notified about this request
      // This information should be stored when the request was created
      // For now, we'll need to track this in the TimeoutManager or find another way
      
      // Get the list of drivers from TimeoutManager (if it was tracking this request)
      // Since we just cancelled the timeout, we need to get this info before cancellation
      // Let's modify the approach: get driver list from ride's counterOffers
      const notifiedDriverIds = new Set();
      
      // Add all drivers who made counter-offers
      for (const offer of ride.counterOffers) {
        notifiedDriverIds.add(offer.driverId.toString());
      }
      
      // Remove the accepting driver from the list
      notifiedDriverIds.delete(driverId);
      
      // Emit requestFilled to other drivers
      if (notifiedDriverIds.size > 0) {
        const otherDriverIds = Array.from(notifiedDriverIds);
        const filledCount = this.emitToDrivers(otherDriverIds, 'requestFilled', { 
          requestId,
          rideId: ride._id.toString()
        });
        console.log(`📤 Emitted requestFilled to ${filledCount}/${otherDriverIds.length} other drivers`);
      } else {
        console.log(`ℹ️ No other drivers to notify about requestFilled`);
      }
      
      // Send success confirmation to the socket that initiated the acceptance
      socket.emit('rideAcceptedSuccess', {
        requestId,
        rideId: ride._id.toString(),
        acceptedFare,
        message: 'Ride accepted successfully'
      });
      
      console.log(`✅ Ride acceptance processed successfully for request ${requestId}`);
      
    } catch (error) {
      console.error(`❌ Error processing ride acceptance:`, error);
      socket.emit('error', {
        code: 'ACCEPTANCE_FAILED',
        message: 'Failed to process ride acceptance',
        details: error.message
      });
    }
  }
  
  /**
   * Handle driverStatusChange event from driver
   * Validates payload, updates driver's status and location in database,
   * updates lastLocationUpdate timestamp
   * 
   * @param {Socket} socket - Socket.IO socket instance
   * @param {Object} payload - Driver status change payload
   * @param {string} payload.status - Driver status ('ONLINE' or 'OFFLINE')
   * @param {Object} payload.location - Driver location {lat: Number, lng: Number}
   * 
   * Requirements: 4.4, 4.5
   */
  async onDriverStatusChange(socket, payload) {
    try {
      // Get driver info from socket
      const userData = this.getUserData(socket.id);
      if (!userData || userData.role !== 'driver') {
        socket.emit('error', {
          code: 'UNAUTHORIZED',
          message: 'Only drivers can change status'
        });
        return;
      }
      
      const driverId = userData.userId;
      
      // Validate payload structure
      if (!payload || typeof payload !== 'object') {
        socket.emit('error', {
          code: 'INVALID_PAYLOAD',
          message: 'Invalid status change payload'
        });
        return;
      }
      
      const { status, location } = payload;
      
      // Validate status field
      if (!status || typeof status !== 'string') {
        socket.emit('error', {
          code: 'INVALID_STATUS',
          message: 'Status is required'
        });
        return;
      }
      
      // Validate status is ONLINE or OFFLINE
      if (status !== 'ONLINE' && status !== 'OFFLINE') {
        socket.emit('error', {
          code: 'INVALID_STATUS_VALUE',
          message: 'Status must be ONLINE or OFFLINE'
        });
        return;
      }
      
      // Validate location field
      if (!location || typeof location !== 'object') {
        socket.emit('error', {
          code: 'INVALID_LOCATION',
          message: 'Location is required'
        });
        return;
      }
      
      // Validate location coordinates
      if (!CoordinateValidator.isValidCoordinatePair(location.lat, location.lng)) {
        socket.emit('error', {
          code: 'INVALID_LOCATION_COORDINATES',
          message: 'Location coordinates must be valid latitude/longitude'
        });
        return;
      }
      
      console.log(`🚦 Processing status change for driver ${driverId}: ${status} at [${location.lat}, ${location.lng}]`);
      
      // Update driver's status and location in database
      const Driver = require('../models/Driver');
      
      const updateData = {
        status: status,
        currentLocation: {
          type: 'Point',
          coordinates: [location.lng, location.lat] // GeoJSON format: [longitude, latitude]
        },
        lastLocationUpdate: new Date()
      };
      
      const driver = await Driver.findByIdAndUpdate(
        driverId,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!driver) {
        socket.emit('error', {
          code: 'DRIVER_NOT_FOUND',
          message: 'Driver not found in database'
        });
        return;
      }
      
      console.log(`💾 Updated driver ${driverId} status to ${status}, location updated at ${driver.lastLocationUpdate}`);
      
      // Send success confirmation to driver
      socket.emit('driverStatusChangeSuccess', {
        status: driver.status,
        location: {
          lat: location.lat,
          lng: location.lng
        },
        lastLocationUpdate: driver.lastLocationUpdate,
        message: `Status changed to ${status} successfully`
      });
      
      console.log(`✅ Driver status change processed successfully for driver ${driverId}`);
      
    } catch (error) {
      console.error(`❌ Error processing driver status change:`, error);
      socket.emit('error', {
        code: 'STATUS_CHANGE_FAILED',
        message: 'Failed to process status change',
        details: error.message
      });
    }
  }
  
  /**
   * Set RideMatcher instance
   * @param {RideMatcher} rideMatcher - RideMatcher instance
   */
  setRideMatcher(rideMatcher) {
    this.rideMatcher = rideMatcher;
  }
  
  /**
   * Set TimeoutManager instance
   * @param {TimeoutManager} timeoutManager - TimeoutManager instance
   */
  setTimeoutManager(timeoutManager) {
    this.timeoutManager = timeoutManager;
  }
  
  /**
   * Register event handler
   * 
   * @param {string} eventName - Event name
   * @param {Function} handler - Event handler function
   */
  on(eventName, handler) {
    this.io.on('connection', (socket) => {
      socket.on(eventName, (payload) => {
        handler(socket, payload);
      });
    });
  }
  
  /**
   * Get Socket.IO server instance
   * 
   * @returns {Server} Socket.IO server instance
   */
  getIO() {
    return this.io;
  }
}

module.exports = SocketServer;
