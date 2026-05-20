/**
 * Unit tests for CoordinateValidator utility
 * 
 * Tests validation functions for geographic coordinates
 */

const {
  isValidLatitude,
  isValidLongitude,
  isValidCoordinatePair,
  isWithinAfghanistan,
  sanitizeCoordinate
} = require('./coordinateValidator');

describe('CoordinateValidator', () => {
  describe('isValidLatitude', () => {
    test('should return true for valid latitude values', () => {
      expect(isValidLatitude(0)).toBe(true);
      expect(isValidLatitude(45)).toBe(true);
      expect(isValidLatitude(-45)).toBe(true);
      expect(isValidLatitude(90)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
      expect(isValidLatitude(34.5)).toBe(true);
    });

    test('should return false for latitude values outside valid range', () => {
      expect(isValidLatitude(91)).toBe(false);
      expect(isValidLatitude(-91)).toBe(false);
      expect(isValidLatitude(100)).toBe(false);
      expect(isValidLatitude(-100)).toBe(false);
    });

    test('should return false for non-numeric values', () => {
      expect(isValidLatitude('45')).toBe(false);
      expect(isValidLatitude(null)).toBe(false);
      expect(isValidLatitude(undefined)).toBe(false);
      expect(isValidLatitude(NaN)).toBe(false);
      expect(isValidLatitude({})).toBe(false);
      expect(isValidLatitude([])).toBe(false);
    });
  });

  describe('isValidLongitude', () => {
    test('should return true for valid longitude values', () => {
      expect(isValidLongitude(0)).toBe(true);
      expect(isValidLongitude(90)).toBe(true);
      expect(isValidLongitude(-90)).toBe(true);
      expect(isValidLongitude(180)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
      expect(isValidLongitude(69.2)).toBe(true);
    });

    test('should return false for longitude values outside valid range', () => {
      expect(isValidLongitude(181)).toBe(false);
      expect(isValidLongitude(-181)).toBe(false);
      expect(isValidLongitude(200)).toBe(false);
      expect(isValidLongitude(-200)).toBe(false);
    });

    test('should return false for non-numeric values', () => {
      expect(isValidLongitude('90')).toBe(false);
      expect(isValidLongitude(null)).toBe(false);
      expect(isValidLongitude(undefined)).toBe(false);
      expect(isValidLongitude(NaN)).toBe(false);
      expect(isValidLongitude({})).toBe(false);
      expect(isValidLongitude([])).toBe(false);
    });
  });

  describe('isValidCoordinatePair', () => {
    test('should return true for valid coordinate pairs', () => {
      expect(isValidCoordinatePair(0, 0)).toBe(true);
      expect(isValidCoordinatePair(34.5, 69.2)).toBe(true); // Kabul
      expect(isValidCoordinatePair(90, 180)).toBe(true);
      expect(isValidCoordinatePair(-90, -180)).toBe(true);
      expect(isValidCoordinatePair(45.5, -122.6)).toBe(true);
    });

    test('should return false if latitude is invalid', () => {
      expect(isValidCoordinatePair(91, 0)).toBe(false);
      expect(isValidCoordinatePair(-91, 0)).toBe(false);
      expect(isValidCoordinatePair(100, 69.2)).toBe(false);
    });

    test('should return false if longitude is invalid', () => {
      expect(isValidCoordinatePair(0, 181)).toBe(false);
      expect(isValidCoordinatePair(0, -181)).toBe(false);
      expect(isValidCoordinatePair(34.5, 200)).toBe(false);
    });

    test('should return false if both are invalid', () => {
      expect(isValidCoordinatePair(91, 181)).toBe(false);
      expect(isValidCoordinatePair(-91, -181)).toBe(false);
    });

    test('should return false for non-numeric values', () => {
      expect(isValidCoordinatePair('34.5', 69.2)).toBe(false);
      expect(isValidCoordinatePair(34.5, '69.2')).toBe(false);
      expect(isValidCoordinatePair(null, null)).toBe(false);
      expect(isValidCoordinatePair(undefined, undefined)).toBe(false);
    });
  });

  describe('isWithinAfghanistan', () => {
    test('should return true for coordinates within Afghanistan boundaries', () => {
      // Kabul
      expect(isWithinAfghanistan(34.5553, 69.2075)).toBe(true);
      
      // Herat
      expect(isWithinAfghanistan(34.3482, 62.1997)).toBe(true);
      
      // Kandahar
      expect(isWithinAfghanistan(31.6089, 65.7372)).toBe(true);
      
      // Mazar-i-Sharif
      expect(isWithinAfghanistan(36.7069, 67.1108)).toBe(true);
      
      // Boundary edges
      expect(isWithinAfghanistan(29, 60)).toBe(true);
      expect(isWithinAfghanistan(38, 75)).toBe(true);
      expect(isWithinAfghanistan(33.5, 67.5)).toBe(true);
    });

    test('should return false for coordinates outside Afghanistan boundaries', () => {
      // Pakistan (Karachi - south of Afghanistan)
      expect(isWithinAfghanistan(24.8607, 67.0011)).toBe(false);
      
      // Iran (Tehran - west of Afghanistan)
      expect(isWithinAfghanistan(35.6892, 51.3890)).toBe(false);
      
      // Uzbekistan (Tashkent - north of Afghanistan)
      expect(isWithinAfghanistan(41.2995, 69.2401)).toBe(false);
      
      // China (Kashgar - east of Afghanistan)
      expect(isWithinAfghanistan(39.4704, 76.0400)).toBe(false);
      
      // Just outside boundaries
      expect(isWithinAfghanistan(28.9, 65)).toBe(false); // South of boundary
      expect(isWithinAfghanistan(38.1, 65)).toBe(false); // North of boundary
      expect(isWithinAfghanistan(33, 59.9)).toBe(false); // West of boundary
      expect(isWithinAfghanistan(33, 75.1)).toBe(false); // East of boundary
    });

    test('should return false for invalid coordinates', () => {
      expect(isWithinAfghanistan(91, 65)).toBe(false);
      expect(isWithinAfghanistan(33, 181)).toBe(false);
      expect(isWithinAfghanistan('34.5', 69.2)).toBe(false);
      expect(isWithinAfghanistan(null, null)).toBe(false);
    });
  });

  describe('sanitizeCoordinate', () => {
    test('should convert valid numeric strings to numbers', () => {
      expect(sanitizeCoordinate('34.5')).toBe(34.5);
      expect(sanitizeCoordinate('69.2')).toBe(69.2);
      expect(sanitizeCoordinate('-45.5')).toBe(-45.5);
      expect(sanitizeCoordinate('0')).toBe(0);
      expect(sanitizeCoordinate('180')).toBe(180);
    });

    test('should return the number for valid numeric inputs', () => {
      expect(sanitizeCoordinate(34.5)).toBe(34.5);
      expect(sanitizeCoordinate(69.2)).toBe(69.2);
      expect(sanitizeCoordinate(-45.5)).toBe(-45.5);
      expect(sanitizeCoordinate(0)).toBe(0);
    });

    test('should return null for invalid inputs', () => {
      expect(sanitizeCoordinate(null)).toBe(null);
      expect(sanitizeCoordinate(undefined)).toBe(null);
      expect(sanitizeCoordinate('')).toBe(null);
      expect(sanitizeCoordinate('abc')).toBe(null);
      expect(sanitizeCoordinate('34.5.6')).toBe(null);
      expect(sanitizeCoordinate({})).toBe(null);
      expect(sanitizeCoordinate([])).toBe(null);
      expect(sanitizeCoordinate(NaN)).toBe(null);
      expect(sanitizeCoordinate(Infinity)).toBe(null);
      expect(sanitizeCoordinate(-Infinity)).toBe(null);
    });

    test('should handle edge cases', () => {
      expect(sanitizeCoordinate('  34.5  ')).toBe(34.5); // Whitespace
      expect(sanitizeCoordinate('+34.5')).toBe(34.5); // Plus sign
      expect(sanitizeCoordinate('1e2')).toBe(100); // Scientific notation
    });
  });
});
