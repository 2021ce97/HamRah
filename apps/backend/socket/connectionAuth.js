/**
 * Connection Authenticator for Socket.IO
 * 
 * Verifies JWT tokens on Socket.IO connection handshake and extracts user information.
 * Handles authentication failures by disconnecting sockets with error events.
 */

const jwt = require('jsonwebtoken');

class ConnectionAuthenticator {
  /**
   * Create a new ConnectionAuthenticator
   * 
   * @param {string} jwtSecret - JWT secret key for token verification
   */
  constructor(jwtSecret) {
    if (!jwtSecret) {
      throw new Error('JWT secret is required for ConnectionAuthenticator');
    }
    this.jwtSecret = jwtSecret;
  }
  
  /**
   * Authenticate a JWT token and extract user information
   * 
   * @param {string} token - JWT token to verify
   * @returns {Promise<{userId: string, role: string}>} User data with userId and role
   * @throws {Error} If token is invalid, expired, or missing required fields
   */
  async authenticate(token) {
    if (!token) {
      throw new Error('Authentication token is required');
    }
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret);
      
      // Extract user ID (handle both 'id' and '_id' fields for compatibility)
      const userId = decoded.id || decoded._id;
      if (!userId) {
        throw new Error('Token does not contain user ID');
      }
      
      // Extract role (default to 'rider' if not specified for backward compatibility)
      const role = decoded.role || 'rider';
      
      // Validate role
      if (role !== 'rider' && role !== 'driver') {
        throw new Error(`Invalid role: ${role}. Must be 'rider' or 'driver'`);
      }
      
      return {
        userId: userId.toString(),
        role
      };
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'TokenExpiredError') {
        throw new Error('Authentication token has expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid authentication token');
      } else if (error.name === 'NotBeforeError') {
        throw new Error('Authentication token not yet valid');
      }
      
      // Re-throw other errors
      throw error;
    }
  }
  
  /**
   * Generate a JWT token for a user (utility method for testing)
   * 
   * @param {string} userId - User ID
   * @param {string} role - User role ('rider' or 'driver')
   * @param {string} [expiresIn='30d'] - Token expiration time
   * @returns {string} JWT token
   */
  generateToken(userId, role, expiresIn = '30d') {
    if (!userId) {
      throw new Error('User ID is required to generate token');
    }
    
    if (role !== 'rider' && role !== 'driver') {
      throw new Error(`Invalid role: ${role}. Must be 'rider' or 'driver'`);
    }
    
    return jwt.sign(
      { id: userId, role },
      this.jwtSecret,
      { expiresIn }
    );
  }
  
  /**
   * Create Socket.IO middleware for authentication
   * This middleware authenticates connections during the handshake phase
   * 
   * @param {SocketServer} socketServer - SocketServer instance for user registration
   * @returns {Function} Socket.IO middleware function
   */
  createMiddleware(socketServer) {
    return async (socket, next) => {
      try {
        // Extract token from handshake auth or query parameters
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        
        if (!token) {
          const error = new Error('Authentication token is required');
          error.data = { code: 'AUTH_TOKEN_REQUIRED' };
          return next(error);
        }
        
        // Authenticate token
        const { userId, role } = await this.authenticate(token);
        
        // Store user data in socket for later use
        socket.userId = userId;
        socket.role = role;
        
        // Register user in SocketServer mappings
        socketServer.registerUser(socket.id, userId, role);
        
        console.log(`✅ Socket authenticated: userId=${userId}, role=${role}, socketId=${socket.id}`);
        
        // Allow connection
        next();
      } catch (error) {
        console.error(`❌ Socket authentication failed: ${error.message}`);
        
        // Create error with code for client handling
        const authError = new Error(error.message);
        authError.data = { code: 'AUTH_FAILED' };
        
        // Reject connection
        next(authError);
      }
    };
  }
}

module.exports = ConnectionAuthenticator;
