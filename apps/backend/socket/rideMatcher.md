# RideMatcher Class Documentation

## Overview

The `RideMatcher` class handles finding nearby drivers for ride requests using MongoDB geospatial queries. It filters drivers by their online status and excludes drivers currently on rides.

## Usage

```javascript
const RideMatcher = require('./rideMatcher');
const rideMatcher = new RideMatcher();

// Find nearby drivers within 5km radius
const pickupCoords = { lat: 34.5553, lng: 69.2075 }; // Kabul
const nearbyDrivers = await rideMatcher.findNearbyDrivers(pickupCoords, 5);

console.log(nearbyDrivers);
// [
//   {
//     driverId: '507f1f77bcf86cd799439011',
//     socketId: 'abc123',
//     location: { lat: 34.5553, lng: 69.2075 },
//     distance: 2.45 // km
//   },
//   ...
// ]
```

## API Reference

### Constructor

```javascript
new RideMatcher(driverModel)
```

- **driverModel** (optional): Mongoose Driver model. Defaults to the Driver model from `../models/Driver.js`

### Methods

#### `findNearbyDrivers(pickupCoords, radiusKm)`

Finds nearby drivers within a specified radius of the pickup location.

**Parameters:**
- `pickupCoords` (Object): Pickup coordinates `{lat: Number, lng: Number}`
- `radiusKm` (Number, optional): Search radius in kilometers. Default: 5

**Returns:** `Promise<Array>` - Array of driver objects with:
- `driverId` (String): Driver's MongoDB ObjectId
- `socketId` (String): Driver's current socket connection ID
- `location` (Object): Driver's location `{lat: Number, lng: Number}`
- `distance` (Number): Distance from pickup in kilometers (rounded to 2 decimals)

**Filters:**
- Only drivers with status `ONLINE`
- Excludes drivers with status `IN_RIDE` or `OFFLINE`
- Only drivers within the specified radius

**Throws:**
- Error if coordinates are invalid or outside valid ranges

#### `validateCoordinates(lat, lng)`

Validates that coordinates are within valid ranges.

**Parameters:**
- `lat` (Number): Latitude
- `lng` (Number): Longitude

**Returns:** `Boolean` - True if coordinates are valid

**Valid Ranges:**
- Latitude: -90 to 90
- Longitude: -180 to 180

#### `isWithinAfghanistan(lat, lng)`

Checks if coordinates are within Afghanistan's geographic boundaries.

**Parameters:**
- `lat` (Number): Latitude
- `lng` (Number): Longitude

**Returns:** `Boolean` - True if coordinates are within Afghanistan

**Afghanistan Boundaries:**
- Latitude: 29 to 38
- Longitude: 60 to 75

#### `getDriverSocketIds(driverIds)`

Gets socket IDs for a list of driver IDs.

**Parameters:**
- `driverIds` (Array<String>): Array of driver MongoDB ObjectIds

**Returns:** `Promise<Array<String>>` - Array of socket IDs (filters out null values)

#### `calculateDistance(lat1, lng1, lat2, lng2)`

Calculates the distance between two coordinates using the Haversine formula.

**Parameters:**
- `lat1` (Number): First latitude
- `lng1` (Number): First longitude
- `lat2` (Number): Second latitude
- `lng2` (Number): Second longitude

**Returns:** `Number` - Distance in kilometers (rounded to 2 decimals)

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 4.1**: Identifies all nearby drivers within 5km radius using geospatial query
- **Requirement 4.6**: Excludes drivers with status `IN_RIDE` by filtering for `ONLINE` status only

## Database Dependencies

The RideMatcher relies on the Driver model having:
- A `status` field with enum values: `ONLINE`, `OFFLINE`, `IN_RIDE`
- A `currentLocation` field with GeoJSON Point structure
- A 2dsphere geospatial index on `currentLocation`
- A compound index on `{ status: 1, currentLocation: '2dsphere' }`

## Testing

Run the unit tests:

```bash
npm test -- rideMatcher.test.js
```

The test suite covers:
- Finding nearby drivers with correct filtering
- Coordinate validation
- Afghanistan boundary checking
- Distance calculation
- Socket ID retrieval
- Error handling for invalid inputs
