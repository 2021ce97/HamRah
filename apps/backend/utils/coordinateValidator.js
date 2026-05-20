/**
 * CoordinateValidator Utility
 * 
 * Provides validation functions for geographic coordinates with special
 * handling for Afghanistan's geographic boundaries.
 * 
 * Requirements: 3.2, 3.3, 12.1, 12.2, 12.3, 12.4, 12.6
 */

/**
 * Validates if a latitude value is within valid range
 * @param {number} lat - Latitude value to validate
 * @returns {boolean} True if latitude is between -90 and 90 degrees
 */
function isValidLatitude(lat) {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validates if a longitude value is within valid range
 * @param {number} lng - Longitude value to validate
 * @returns {boolean} True if longitude is between -180 and 180 degrees
 */
function isValidLongitude(lng) {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180;
}

/**
 * Validates if a coordinate pair is valid
 * @param {number} lat - Latitude value
 * @param {number} lng - Longitude value
 * @returns {boolean} True if both latitude and longitude are valid
 */
function isValidCoordinatePair(lat, lng) {
  return isValidLatitude(lat) && isValidLongitude(lng);
}

/**
 * Checks if coordinates are within Afghanistan's geographic boundaries
 * Afghanistan boundaries: latitude 29-38°N, longitude 60-75°E
 * @param {number} lat - Latitude value
 * @param {number} lng - Longitude value
 * @returns {boolean} True if coordinates are within Afghanistan's boundaries
 */
function isWithinAfghanistan(lat, lng) {
  // First check if coordinates are valid
  if (!isValidCoordinatePair(lat, lng)) {
    return false;
  }
  
  // Check Afghanistan boundaries
  // Latitude: 29°N to 38°N
  // Longitude: 60°E to 75°E
  return lat >= 29 && lat <= 38 && lng >= 60 && lng <= 75;
}

/**
 * Sanitizes and converts a value to a valid coordinate number
 * @param {any} value - Value to sanitize and convert
 * @returns {number|null} Converted number or null if invalid
 */
function sanitizeCoordinate(value) {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  // Reject objects and arrays before conversion
  if (typeof value === 'object') {
    return null;
  }
  
  // Convert to number
  const num = Number(value);
  
  // Check if conversion resulted in valid number
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  return num;
}

module.exports = {
  isValidLatitude,
  isValidLongitude,
  isValidCoordinatePair,
  isWithinAfghanistan,
  sanitizeCoordinate
};
