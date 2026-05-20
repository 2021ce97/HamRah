const RideMatcher = require('./rideMatcher');

describe('RideMatcher', () => {
  let rideMatcher;
  let mockDriverModel;

  beforeEach(() => {
    // Create a mock driver model
    mockDriverModel = {
      find: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue([])
    };
    rideMatcher = new RideMatcher(mockDriverModel);
  });

  describe('findNearbyDrivers', () => {
    it('should find nearby ONLINE drivers within radius', async () => {
      const pickupCoords = { lat: 34.5553, lng: 69.2075 }; // Kabul coordinates
      const mockDrivers = [
        {
          _id: 'driver1',
          socketId: 'socket1',
          currentLocation: {
            coordinates: [69.2075, 34.5553] // [lng, lat]
          },
          name: 'Driver One',
          rating: 4.5
        },
        {
          _id: 'driver2',
          socketId: 'socket2',
          currentLocation: {
            coordinates: [69.2100, 34.5600] // [lng, lat]
          },
          name: 'Driver Two',
          rating: 4.8
        }
      ];

      mockDriverModel.select.mockResolvedValue(mockDrivers);

      const result = await rideMatcher.findNearbyDrivers(pickupCoords, 5);

      // Verify the query was called with correct parameters
      expect(mockDriverModel.find).toHaveBeenCalledWith({
        status: 'ONLINE',
        currentLocation: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [69.2075, 34.5553] // [lng, lat]
            },
            $maxDistance: 5000 // 5km in meters
          }
        }
      });

      // Verify the result structure
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        driverId: 'driver1',
        socketId: 'socket1',
        location: { lat: 34.5553, lng: 69.2075 },
        distance: expect.any(Number)
      });
    });

    it('should throw error for invalid pickup coordinates', async () => {
      await expect(
        rideMatcher.findNearbyDrivers({ lat: 'invalid', lng: 69.2075 })
      ).rejects.toThrow('Invalid pickup coordinates');
    });

    it('should throw error for coordinates outside valid ranges', async () => {
      await expect(
        rideMatcher.findNearbyDrivers({ lat: 91, lng: 69.2075 })
      ).rejects.toThrow('Invalid coordinate ranges');
    });

    it('should use default radius of 5km when not specified', async () => {
      const pickupCoords = { lat: 34.5553, lng: 69.2075 };
      mockDriverModel.select.mockResolvedValue([]);

      await rideMatcher.findNearbyDrivers(pickupCoords);

      expect(mockDriverModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          currentLocation: expect.objectContaining({
            $near: expect.objectContaining({
              $maxDistance: 5000 // Default 5km
            })
          })
        })
      );
    });

    it('should filter by ONLINE status only', async () => {
      const pickupCoords = { lat: 34.5553, lng: 69.2075 };
      mockDriverModel.select.mockResolvedValue([]);

      await rideMatcher.findNearbyDrivers(pickupCoords);

      expect(mockDriverModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'ONLINE'
        })
      );
    });
  });

  describe('validateCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(rideMatcher.validateCoordinates(34.5553, 69.2075)).toBe(true);
      expect(rideMatcher.validateCoordinates(0, 0)).toBe(true);
      expect(rideMatcher.validateCoordinates(-90, -180)).toBe(true);
      expect(rideMatcher.validateCoordinates(90, 180)).toBe(true);
    });

    it('should return false for invalid latitude', () => {
      expect(rideMatcher.validateCoordinates(91, 69.2075)).toBe(false);
      expect(rideMatcher.validateCoordinates(-91, 69.2075)).toBe(false);
    });

    it('should return false for invalid longitude', () => {
      expect(rideMatcher.validateCoordinates(34.5553, 181)).toBe(false);
      expect(rideMatcher.validateCoordinates(34.5553, -181)).toBe(false);
    });

    it('should return false for non-numeric values', () => {
      expect(rideMatcher.validateCoordinates('34.5553', 69.2075)).toBe(false);
      expect(rideMatcher.validateCoordinates(34.5553, '69.2075')).toBe(false);
    });
  });

  describe('isWithinAfghanistan', () => {
    it('should return true for coordinates within Afghanistan', () => {
      expect(rideMatcher.isWithinAfghanistan(34.5553, 69.2075)).toBe(true); // Kabul
      expect(rideMatcher.isWithinAfghanistan(31.6, 65.7)).toBe(true); // Kandahar
      expect(rideMatcher.isWithinAfghanistan(36.7, 67.1)).toBe(true); // Mazar-i-Sharif
    });

    it('should return false for coordinates outside Afghanistan', () => {
      expect(rideMatcher.isWithinAfghanistan(28, 69)).toBe(false); // South of Afghanistan
      expect(rideMatcher.isWithinAfghanistan(39, 69)).toBe(false); // North of Afghanistan
      expect(rideMatcher.isWithinAfghanistan(34, 59)).toBe(false); // West of Afghanistan
      expect(rideMatcher.isWithinAfghanistan(34, 76)).toBe(false); // East of Afghanistan
    });

    it('should return true for boundary coordinates', () => {
      expect(rideMatcher.isWithinAfghanistan(29, 60)).toBe(true);
      expect(rideMatcher.isWithinAfghanistan(38, 75)).toBe(true);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Distance between Kabul (34.5553, 69.2075) and a nearby point
      const distance = rideMatcher.calculateDistance(
        34.5553, 69.2075,
        34.5600, 69.2100
      );
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1); // Should be less than 1km
    });

    it('should return 0 for same coordinates', () => {
      const distance = rideMatcher.calculateDistance(
        34.5553, 69.2075,
        34.5553, 69.2075
      );
      
      expect(distance).toBe(0);
    });

    it('should return distance rounded to 2 decimal places', () => {
      const distance = rideMatcher.calculateDistance(
        34.5553, 69.2075,
        34.6000, 69.3000
      );
      
      // Check that it has at most 2 decimal places
      expect(distance).toBe(Math.round(distance * 100) / 100);
    });
  });

  describe('getDriverSocketIds', () => {
    it('should return socket IDs for given driver IDs', async () => {
      const driverIds = ['driver1', 'driver2', 'driver3'];
      const mockDrivers = [
        { socketId: 'socket1' },
        { socketId: 'socket2' },
        { socketId: 'socket3' }
      ];

      mockDriverModel.select.mockResolvedValue(mockDrivers);

      const result = await rideMatcher.getDriverSocketIds(driverIds);

      expect(mockDriverModel.find).toHaveBeenCalledWith({
        _id: { $in: driverIds },
        socketId: { $ne: null }
      });
      expect(result).toEqual(['socket1', 'socket2', 'socket3']);
    });

    it('should filter out null socket IDs', async () => {
      const driverIds = ['driver1', 'driver2'];
      const mockDrivers = [
        { socketId: 'socket1' },
        { socketId: null }
      ];

      mockDriverModel.select.mockResolvedValue(mockDrivers);

      const result = await rideMatcher.getDriverSocketIds(driverIds);

      expect(result).toEqual(['socket1']);
    });

    it('should return empty array for empty input', async () => {
      const result = await rideMatcher.getDriverSocketIds([]);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-array input', async () => {
      const result = await rideMatcher.getDriverSocketIds(null);
      expect(result).toEqual([]);
    });
  });

  describe('toRadians', () => {
    it('should convert degrees to radians', () => {
      expect(rideMatcher.toRadians(0)).toBe(0);
      expect(rideMatcher.toRadians(180)).toBeCloseTo(Math.PI);
      expect(rideMatcher.toRadians(90)).toBeCloseTo(Math.PI / 2);
      expect(rideMatcher.toRadians(360)).toBeCloseTo(2 * Math.PI);
    });
  });
});
