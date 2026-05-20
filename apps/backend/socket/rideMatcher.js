const Driver = require('../models/Driver');

/**
 * RideMatcher class handles finding nearby drivers for ride requests
 * using MongoDB geospatial queries.
 */
class RideMatcher {
  /**
   * Creates a new RideMatcher instance
   * @param {mongoose.Model} driverModel - The Driver model (defaults to Driver)
   */
  constructor(driverModel = Driver) {
    this.driverModel = driverModel;
  }

  /**
   * Finds nearby drivers within a specified radius of the pickup location
   * @param {Object} pickupCoords - Pickup coordinates {lat: Number, lng: Number}
   * @param {Number} radiusKm - Search radius in kilometers (default: 5)
   * @returns {Promise<Array>} Array of driver objects with driverId, socketId, location, distance
   */
  async findNearbyDrivers(pickupCoords, radiusKm = 5) {
    // Validate input coordinates
    if (!pickupCoords || typeof pickupCoords.lat !== 'number' || typeof pickupCoords.lng !== 'number') {
      throw new Error('Invalid pickup coordinates: must provide {lat: Number, lng: Number}');
    }

    // Validate coordinates are within valid ranges
    if (!this.validateCoordinates(pickupCoords.lat, pickupCoords.lng)) {
      throw new Error('Invalid coordinate ranges: lat must be [-90, 90], lng must be [-180, 180]');
    }

    // Convert radius from kilometers to meters (MongoDB uses meters)
    const radiusMeters = radiusKm * 1000;

    try {
      // MongoDB geospatial query using $near
      // Note: GeoJSON uses [longitude, latitude] order
      const drivers = await this.driverModel.find({
        status: 'ONLINE', // Only online drivers
        currentLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [pickupCoords.lng, pickupCoords.lat] // [lng, lat] for GeoJSON
            },
            $maxDistance: radiusMeters
          }
        }
      }).select('_id socketId currentLocation name rating');

      // Transform results to match the required interface
      return drivers.map(driver => ({
        driverId: driver._id.toString(),
        socketId: driver.socketId,
        location: {
          lat: driver.currentLocation.coordinates[1], // Extract latitude
          lng: driver.currentLocation.coordinates[0]  // Extract longitude
        },
        // Calculate distance in kilometers (approximate)
        distance: this.calculateDistance(
          pickupCoords.lat,
          pickupCoords.lng,
          driver.currentLocation.coordinates[1],
          driver.currentLocation.coordinates[0]
        )
      }));
    } catch (error) {
      throw new Error(`Failed to find nearby drivers: ${error.message}`);
    }
  }

  /**
   * Validates that coordinates are within valid ranges
   * @param {Number} lat - Latitude
   * @param {Number} lng - Longitude
   * @returns {Boolean} True if coordinates are valid
   */
  validateCoordinates(lat, lng) {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  /**
   * Checks if coordinates are within Afghanistan's geographic boundaries
   * @param {Number} lat - Latitude
   * @param {Number} lng - Longitude
   * @returns {Boolean} True if coordinates are within Afghanistan
   */
  isWithinAfghanistan(lat, lng) {
    return (
      lat >= 29 &&
      lat <= 38 &&
      lng >= 60 &&
      lng <= 75
    );
  }

  /**
   * Calculates the distance between two coordinates using the Haversine formula
   * @param {Number} lat1 - First latitude
   * @param {Number} lng1 - First longitude
   * @param {Number} lat2 - Second latitude
   * @param {Number} lng2 - Second longitude
   * @returns {Number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Converts degrees to radians
   * @param {Number} degrees - Angle in degrees
   * @returns {Number} Angle in radians
   */
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Gets socket IDs for a list of driver IDs
   * @param {Array<String>} driverIds - Array of driver IDs
   * @returns {Promise<Array<String>>} Array of socket IDs
   */
  async getDriverSocketIds(driverIds) {
    if (!Array.isArray(driverIds) || driverIds.length === 0) {
      return [];
    }

    try {
      const drivers = await this.driverModel.find({
        _id: { $in: driverIds },
        socketId: { $ne: null } // Only drivers with active socket connections
      }).select('socketId');

      return drivers
        .map(driver => driver.socketId)
        .filter(socketId => socketId !== null);
    } catch (error) {
      throw new Error(`Failed to get driver socket IDs: ${error.message}`);
    }
  }
}

module.exports = RideMatcher;
