# Implementation Plan: Real-Time Ride Matching

## Overview

This implementation plan converts the Real-Time Ride Matching design into discrete coding tasks. The feature enables bidirectional Socket.IO communication between riders and drivers with InDrive-style fare negotiation, integrated with Google Maps route visualization and Mapbox Directions API.

**Technology Stack:**
- Backend: Node.js + Express + Socket.IO 4.8.3 (JavaScript)
- Frontend: React Native + Expo (TypeScript)
- Database: MongoDB with 2dsphere geospatial indexing
- Testing: Jest + fast-check for property-based testing

**Implementation Strategy:**
1. Backend infrastructure (Socket.IO server, authentication, database models) - COMPLETED
2. Core matching and timeout logic - COMPLETED
3. Frontend connection management and UI components - IN PROGRESS
4. Route visualization and ride request flow - PENDING
5. Counter-offer handling and acceptance flow - PENDING
6. Error handling, RTL support, and final integration - PENDING

## Tasks

- [x] 1. Set up backend Socket.IO infrastructure
  - [x] 1.1 Install Socket.IO dependencies and configure server
    - Install `socket.io@4.8.3` in backend package.json
    - Create `apps/backend/socket/socketServer.js` with Socket.IO server initialization
    - Integrate Socket.IO server with existing Express HTTP server in `apps/backend/server.js`
    - Configure CORS settings for React Native clients
    - _Requirements: 2.1, 2.2_

  - [x] 1.2 Implement JWT authentication for Socket.IO connections
    - Create `apps/backend/socket/connectionAuth.js` with `ConnectionAuthenticator` class
    - Implement `authenticate(token)` method to verify JWT and extract userId and role
    - Add Socket.IO middleware to authenticate connections on handshake
    - Handle authentication failures by disconnecting socket with error event
    - _Requirements: 2.6, 2.7_

  - [x] 1.3 Create socket-to-user mapping system
    - Implement in-memory Maps for `socketToUser` and `userToSocket` in `socketServer.js`
    - Add `handleConnection(socket)` to store socket-user mappings
    - Add `handleDisconnection(socket)` to clean up mappings
    - Implement `getUserSocket(userId)` and `emitToUser(userId, eventName, payload)` utility methods
    - _Requirements: 4.2, 7.1_

  - [ ]* 1.4 Write property test for JWT authentication
    - **Property 5: Authentication Event on Connection**
    - **Validates: Requirements 2.6**
    - Generate arbitrary valid JWT tokens with userId and role
    - Verify that connection with valid token succeeds and extracts correct userId
    - Verify that connection with invalid/expired token is rejected

- [x] 2. Extend database models for real-time matching
  - [x] 2.1 Extend Ride model schema
    - Modify `apps/backend/models/Ride.js` to add fields: `counterOffers`, `estimatedDistance`, `estimatedDuration`, `routeGeometry`, `expiresAt`, `acceptedAt`
    - Update status enum to include: 'Pending', 'Negotiating', 'Accepted', 'InProgress', 'Completed', 'Cancelled', 'Expired'
    - Add compound indexes: `{ riderId: 1, status: 1 }` and `{ driverId: 1, status: 1 }`
    - Add TTL index on `expiresAt` field for automatic cleanup
    - _Requirements: 3.1, 6.3, 8.1, 15.1_

  - [x] 2.2 Extend Driver model schema
    - Modify `apps/backend/models/Driver.js` to add fields: `status` (enum: ONLINE, OFFLINE, IN_RIDE), `currentLocation` (GeoJSON Point), `lastLocationUpdate`, `socketId`
    - Create 2dsphere geospatial index on `currentLocation` field
    - Create compound index: `{ status: 1, currentLocation: '2dsphere' }`
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

  - [x] 2.3 Extend User model schema
    - Modify `apps/backend/models/User.js` to add `socketId` field
    - Ensure existing fields support real-time matching: `name`, `rating`, `language`
    - _Requirements: 3.1, 4.3_

- [x] 3. Implement ride matching logic
  - [x] 3.1 Create RideMatcher class
    - Create `apps/backend/socket/rideMatcher.js` with `RideMatcher` class
    - Implement `findNearbyDrivers(pickupCoords, radiusKm = 5)` using MongoDB geospatial query
    - Filter drivers by status: ONLINE only, exclude IN_RIDE drivers
    - Return array of driver objects with: driverId, socketId, location, distance
    - _Requirements: 4.1, 4.6_

  - [ ]* 3.2 Write property test for nearby driver radius filtering
    - **Property 10: Nearby Driver Radius Filtering**
    - **Validates: Requirements 4.1**
    - Generate arbitrary pickup coordinates and driver positions
    - Verify that all returned drivers are within 5km radius
    - Verify that drivers beyond 5km are excluded

  - [x] 3.3 Implement coordinate validation in RideMatcher
    - Add `validateCoordinates(lat, lng)` method to check lat/lng ranges
    - Add `isWithinAfghanistan(lat, lng)` method to check Afghanistan boundaries (lat: 29-38, lng: 60-75)
    - _Requirements: 3.2, 3.3, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 3.4 Write property test for coordinate validation
    - **Property 7: Coordinate Pair Validation**
    - **Validates: Requirements 3.2, 3.3, 12.1, 12.2**
    - Generate arbitrary coordinate pairs including edge cases
    - Verify validation returns true only for lat in [-90, 90] and lng in [-180, 180]
    - Verify Afghanistan boundary check for coordinates in range (29-38, 60-75)

- [x] 4. Implement timeout management
  - [x] 4.1 Create TimeoutManager class
    - Create `apps/backend/socket/timeoutManager.js` with `TimeoutManager` class
    - Implement `startTimeout(requestId, riderId, driverIds)` to start 120-second timer
    - Implement `cancelTimeout(requestId)` to cancel timer and clean up
    - Implement `handleExpiration(requestId)` to emit `requestExpired` events
    - Use Map to track active requests: requestId -> { riderId, driverIds, timer, expiresAt }
    - _Requirements: 3.6, 15.1, 15.2, 15.3_

  - [ ]* 4.2 Write property test for timeout initialization
    - **Property 9: Request Timeout Initialization**
    - **Validates: Requirements 3.6, 15.1**
    - Generate arbitrary ride requests
    - Verify that timeout timer is started with exactly 120 seconds duration
    - Verify that timer is stored in activeRequests Map

  - [ ]* 4.3 Write property test for timeout cancellation
    - **Property 30: Timeout Cancellation on Acceptance**
    - **Validates: Requirements 8.4, 9.5, 15.6**
    - Generate arbitrary ride acceptance events
    - Verify that associated timeout timer is cancelled
    - Verify that request is removed from activeRequests Map

- [x] 5. Checkpoint - Backend infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Socket.IO event handlers
  - [x] 6.1 Implement requestRide event handler
    - Add `onRequestRide(socket, payload)` method in `socketServer.js`
    - Validate payload fields: pickup, destination, proposedFare, riderProfile
    - Call RideMatcher to find nearby drivers
    - Generate unique requestId using UUID
    - Emit `rideRequest` event to all nearby driver sockets
    - Start timeout using TimeoutManager
    - Save ride record to database with status 'Pending'
    - _Requirements: 3.1, 4.1, 4.2, 4.3_

  - [ ]* 6.2 Write property test for ride request event completeness
    - **Property 6: Ride Request Event Completeness**
    - **Validates: Requirements 3.1**
    - Generate arbitrary ride request payloads
    - Verify emitted event contains all required fields: pickup, destination, proposedFare, riderProfile

  - [ ]* 6.3 Write property test for ride request broadcast completeness
    - **Property 11: Ride Request Broadcast Completeness**
    - **Validates: Requirements 4.2**
    - Generate arbitrary lists of nearby drivers
    - Verify that ride request event is emitted to all drivers in the list

  - [x] 6.4 Implement fareCounter event handler
    - Add `onFareCounter(socket, payload)` method in `socketServer.js`
    - Validate payload fields: requestId, driverId, counterAmount
    - Validate counterAmount is positive using fare validator
    - Look up ride record and verify it's still active (not expired/accepted)
    - Add counter-offer to ride's counterOffers array in database
    - Route `fareCounter` event to rider socket using requestId -> riderId mapping
    - _Requirements: 6.2, 6.3, 6.5, 7.1_

  - [ ]* 6.5 Write property test for counter-offer routing
    - **Property 23: Counter-Offer Routing Correctness**
    - **Validates: Requirements 7.1**
    - Generate arbitrary counter-offer events with requestId
    - Verify event is routed to the rider who created the corresponding ride request

  - [x] 6.6 Implement rideAccepted event handler
    - Add `onRideAccepted(socket, payload)` method in `socketServer.js`
    - Validate payload fields: requestId, driverId, acceptedFare
    - Implement first-acceptance-wins logic using database atomic update
    - Cancel timeout using TimeoutManager
    - Update ride status to 'Accepted' and set agreedFare, acceptedAt, driverId
    - Emit `rideAccepted` confirmation to both rider and driver sockets
    - Emit `requestFilled` event to all other drivers who received the request
    - _Requirements: 8.1, 8.4, 8.5, 9.1, 15.6, 15.7_

  - [ ]* 6.7 Write property test for single acceptance enforcement
    - **Property 31: Single Acceptance Enforcement**
    - **Validates: Requirements 8.5**
    - Simulate concurrent acceptance attempts for same ride request
    - Verify only first acceptance succeeds
    - Verify subsequent attempts are rejected

  - [x] 6.8 Implement driverStatusChange event handler
    - Add `onDriverStatusChange(socket, payload)` method in `socketServer.js`
    - Validate payload fields: status (ONLINE/OFFLINE), location
    - Update driver's status and currentLocation in database
    - Update lastLocationUpdate timestamp
    - _Requirements: 4.4, 4.5_

  - [ ]* 6.9 Write property test for driver subscription status consistency
    - **Property 13: Driver Subscription Status Consistency**
    - **Validates: Requirements 4.4, 4.5**
    - Generate arbitrary driver status changes
    - Verify driver is subscribed to ride requests if and only if status is ONLINE

- [x] 7. Implement backend validation utilities
  - [x] 7.1 Create CoordinateValidator utility
    - Create `apps/backend/utils/coordinateValidator.js` with validation functions
    - Implement `isValidLatitude(lat)`, `isValidLongitude(lng)`, `isValidCoordinatePair(lat, lng)`
    - Implement `isWithinAfghanistan(lat, lng)` for boundary checking
    - Implement `sanitizeCoordinate(value)` to convert and validate inputs
    - _Requirements: 3.2, 3.3, 12.1, 12.2, 12.3, 12.4, 12.6_

  - [x] 7.2 Create FareValidator utility
    - Create `apps/backend/utils/fareValidator.js` with validation functions
    - Implement `isValidFare(amount)` to check amount > 0
    - Implement `formatFare(amount, locale)` for display formatting with AFN symbol
    - _Requirements: 3.4, 6.2, 5.4_

  - [ ]* 7.3 Write property test for fare positivity validation
    - **Property 8: Fare Positivity Validation**
    - **Validates: Requirements 3.4, 6.2**
    - Generate arbitrary fare amounts including negative, zero, and positive values
    - Verify validation returns true if and only if amount > 0

- [x] 8. Checkpoint - Backend event handling complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement frontend connection management
  - [x] 9.1 Create useSocketConnection hook
    - Create `apps/driver/hooks/useSocketConnection.ts` and `apps/rider/hooks/useSocketConnection.ts` (shared implementation)
    - Install `socket.io-client` dependency in both apps
    - Implement connection lifecycle: connect(), disconnect()
    - Configure Socket.IO client with auth token, reconnection settings, transports
    - Implement event emitter: emit(eventName, payload)
    - Implement event listeners: on(eventName, handler), off(eventName, handler)
    - Track connection status: 'connected' | 'disconnected' | 'reconnecting'
    - _Requirements: 2.1, 2.2, 2.6_

  - [x] 9.2 Implement exponential backoff reconnection
    - Add reconnection logic with delays: [1000, 2000, 5000, 10000, 30000] ms
    - Track reconnection attempt count
    - Display connection status indicator to user
    - _Requirements: 2.3, 2.5_

  - [ ]* 9.3 Write property test for exponential backoff calculation
    - **Property 3: Exponential Backoff Calculation**
    - **Validates: Requirements 2.3**
    - Generate arbitrary sequences of reconnection attempts
    - Verify backoff delays follow exponential pattern with 30s max cap

  - [x] 9.4 Implement event queue for offline events
    - Create event queue to store events during disconnection
    - Implement queue flushing on reconnection
    - Display "Sending..." indicator while events are queued
    - _Requirements: 11.2, 11.3_

  - [ ]* 9.5 Write property test for subscription restoration
    - **Property 4: Subscription Restoration on Reconnection**
    - **Validates: Requirements 2.4**
    - Track active subscriptions before disconnection
    - Verify all subscriptions are restored after reconnection

- [x] 10. Implement Rider App route visualization
  - [x] 10.1 Create RouteVisualizer component
    - Create `apps/rider/components/RouteVisualizer.tsx`
    - Accept props: pickup, destination, onRouteCalculated callback
    - Query `/api/navigation/directions` endpoint when coordinates change
    - Parse GeoJSON LineString geometry from response
    - Render polyline on Google Maps using react-native-maps Polyline component
    - Display distance (in km) and duration (in minutes)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 10.2 Write property test for route data display completeness
    - **Property 1: Route Data Display Completeness**
    - **Validates: Requirements 1.3, 1.4**
    - Generate arbitrary valid route responses
    - Verify both distance and duration are displayed

  - [x] 10.3 Implement loading and error states
    - Add loading spinner while querying Directions API
    - Display error message with retry button on API failure
    - Clear previous polyline when coordinates change
    - _Requirements: 1.5, 1.6, 1.7, 11.1_

  - [ ]* 10.4 Write property test for coordinate change triggers re-query
    - **Property 2: Coordinate Change Triggers Re-query**
    - **Validates: Requirements 1.6**
    - Generate arbitrary coordinate changes
    - Verify previous polyline is cleared and new query is initiated

- [x] 11. Implement Rider App ride request flow
  - [x] 11.1 Create useRideRequest hook
    - Create `apps/rider/hooks/useRideRequest.ts`
    - Implement `requestRide(params)` to emit `requestRide` event via socket
    - Validate coordinates and fare before emitting
    - Start 120-second countdown timer
    - Track request status: 'idle' | 'pending' | 'expired' | 'accepted'
    - Manage counter-offers array
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 11.2 Implement counter-offer reception and display
    - Listen for `fareCounter` events from socket
    - Add received counter-offers to state array
    - Sort counter-offers by amount in ascending order
    - Display counter-offer list with driver name, rating, amount, elapsed time
    - Play notification sound and show visual indicator on new counter-offer
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_

  - [ ]* 11.3 Write property test for counter-offer list sorting
    - **Property 25: Counter-Offer List Sorting Idempotence**
    - **Validates: Requirements 7.3**
    - Generate arbitrary lists of counter-offers
    - Sort by amount ascending, then sort again
    - Verify both sorts produce identical lists (idempotence)

  - [x] 11.4 Implement ride acceptance by rider
    - Implement `acceptCounterOffer(driverId, fare)` to emit `rideAccepted` event
    - Dismiss all other counter-offers from UI
    - Cancel countdown timer
    - Navigate to confirmation screen with driver details
    - Prevent multiple acceptances for same request
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 11.5 Handle request expiration
    - Listen for `requestExpired` event from socket
    - Display "No drivers available" message
    - Allow rider to retry request
    - _Requirements: 3.7, 15.2, 15.4_

  - [ ]* 11.6 Write property test for counter-offer dismissal on acceptance
    - **Property 29: Counter-Offer Dismissal on Acceptance**
    - **Validates: Requirements 8.2**
    - Generate arbitrary ride acceptance with multiple counter-offers
    - Verify all other counter-offers are dismissed from UI

- [x] 12. Implement Driver App ride request handling
  - [x] 12.1 Create useDriverRequests hook
    - Create `apps/driver/hooks/useDriverRequests.ts`
    - Listen for `rideRequest` events from socket
    - Store active requests in state array
    - Implement `submitCounterOffer(requestId, amount)` to emit `fareCounter` event
    - Implement `acceptRide(requestId)` to emit `rideAccepted` event with proposed fare
    - Implement `rejectRide(requestId)` to dismiss card locally without emitting event
    - _Requirements: 5.1, 6.1, 6.3, 6.4, 9.1, 9.2, 10.1_

  - [ ]* 12.2 Write property test for active ride exclusion
    - **Property 14: Active Ride Exclusion**
    - **Validates: Requirements 4.6**
    - Generate ride request distribution scenarios
    - Verify drivers with status IN_RIDE do not receive requests

  - [x] 12.3 Create RideRequestCard component
    - Create `apps/driver/components/RideRequestCard.tsx`
    - Display pickup location (landmark name or coordinates)
    - Display destination location (landmark name or coordinates)
    - Display proposed fare in AFN format
    - Display rider rating as stars out of 5
    - Display estimated distance in kilometers
    - Add "Accept", "Counter-Offer", and "Reject" buttons
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 12.4 Write property test for ride request card display completeness
    - **Property 15: Ride Request Card Display Completeness**
    - **Validates: Requirements 5.1**
    - Generate arbitrary ride request events
    - Verify displayed card contains all required fields

  - [ ]* 12.5 Write property test for location display conditional formatting
    - **Property 16: Location Display Conditional Formatting**
    - **Validates: Requirements 5.2, 5.3**
    - Generate location data with and without landmark names
    - Verify landmark name is shown when available, otherwise coordinates

  - [x] 12.6 Implement counter-offer input UI
    - Create modal/bottom sheet for fare input
    - Validate counter-offer amount is positive
    - Display confirmation message after submission
    - Allow multiple counter-offers for same request
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

  - [x] 12.7 Handle request expiration and filled events
    - Listen for `requestExpired` event to dismiss expired cards
    - Listen for `requestFilled` event to dismiss cards when another driver accepts
    - _Requirements: 15.3, 15.5, 15.7_

  - [ ]* 12.8 Write property test for rejection side-effect freedom
    - **Property 32: Rejection Side-Effect Freedom**
    - **Validates: Requirements 10.1, 10.2**
    - Generate arbitrary ride rejections
    - Verify no events are emitted and driver state remains unchanged

- [x] 13. Implement display formatting utilities
  - [x] 13.1 Create currency formatting utility
    - Create `apps/driver/utils/formatters.ts` and `apps/rider/utils/formatters.ts`
    - Implement `formatCurrency(amount, locale)` to format with AFN symbol
    - Support RTL formatting for Dari/Pashto locales
    - _Requirements: 5.4, 13.3, 13.4_

  - [ ]* 13.2 Write property test for currency formatting
    - **Property 17: Currency Formatting**
    - **Validates: Requirements 5.4**
    - Generate arbitrary fare amounts
    - Verify display includes AFN symbol and proper number formatting

  - [x] 13.3 Create rating display utility
    - Implement `formatRating(rating)` to convert 0-5 number to star display
    - _Requirements: 5.5_

  - [ ]* 13.4 Write property test for rating display range
    - **Property 18: Rating Display Range**
    - **Validates: Requirements 5.5**
    - Generate arbitrary rating values between 0 and 5
    - Verify display shows rating as stars out of 5

  - [x] 13.4 Create distance formatting utility
    - Implement `formatDistance(meters)` to convert meters to kilometers
    - _Requirements: 5.6_

  - [ ]* 13.5 Write property test for distance display formatting
    - **Property 19: Distance Display Formatting**
    - **Validates: Requirements 5.6**
    - Generate arbitrary distance values in meters
    - Verify display converts and shows value in kilometers

- [x] 14. Implement RTL UI support
  - [x] 14.1 Configure RTL layout for Rider App
    - Update `apps/rider/app.json` to enable RTL support
    - Wrap ride request UI components with RTL-aware layout containers
    - Test layout with Dari/Pashto language settings
    - _Requirements: 13.1, 13.3, 13.5_

  - [x] 14.2 Configure RTL layout for Driver App
    - Update `apps/driver/app.json` to enable RTL support
    - Wrap ride request card components with RTL-aware layout containers
    - Align buttons appropriately for RTL layout
    - Test layout with Dari/Pashto language settings
    - _Requirements: 13.2, 13.4, 13.6_

- [x] 15. Implement loading states and user feedback
  - [x] 15.1 Add loading indicators to Rider App
    - Display loading spinner on map while querying Directions API
    - Display loading indicator on confirm button while emitting requestRide
    - Display success feedback (checkmark/message) on successful event emission
    - Display error message with retry option on event failure
    - _Requirements: 14.1, 14.2, 14.5, 14.6_

  - [x] 15.2 Add loading indicators to Driver App
    - Display loading indicator on counter-offer button while emitting fareCounter
    - Display loading indicator on accept button while emitting rideAccepted
    - Display success feedback on successful event emission
    - Display error message with retry option on event failure
    - _Requirements: 14.3, 14.4, 14.5, 14.6_

- [x] 16. Implement error handling and network resilience
  - [x] 16.1 Add retry logic for failed Directions API requests
    - Display retry button on Directions API network errors
    - Implement exponential backoff for retries
    - _Requirements: 11.1_

  - [x] 16.2 Add Socket.IO event retry logic
    - Queue failed events during disconnection
    - Retry queued events when connection is restored
    - Display warning messages during disconnection but keep UI active
    - Synchronize state with server on reconnection
    - Fail after 3 retry attempts and allow manual retry
    - _Requirements: 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 16.3 Add server-side error event handling
    - Emit error events for invalid coordinates received by Socket Server
    - Emit error events for invalid fare amounts
    - Emit error events for expired/filled ride requests
    - _Requirements: 12.5_

- [x] 17. Checkpoint - Core functionality complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Integration and wiring
  - [x] 18.1 Wire Socket.IO server to Express app
    - Import and initialize Socket.IO server in `apps/backend/server.js`
    - Pass HTTP server instance to Socket.IO
    - Register all event handlers (requestRide, fareCounter, rideAccepted, driverStatusChange)
    - Initialize RideMatcher, TimeoutManager, and ConnectionAuthenticator
    - _Requirements: 2.1, 2.2_

  - [x] 18.2 Wire connection management to Rider App
    - Initialize useSocketConnection hook in Rider App main screen
    - Pass socket instance to useRideRequest hook
    - Connect RouteVisualizer to ride request flow
    - Wire counter-offer list to acceptance handler
    - _Requirements: 2.1, 3.1, 7.1, 8.1_

  - [x] 18.3 Wire connection management to Driver App
    - Initialize useSocketConnection hook in Driver App main screen
    - Pass socket instance to useDriverRequests hook
    - Wire RideRequestCard components to event handlers
    - Implement driver status toggle to emit driverStatusChange events
    - _Requirements: 2.2, 4.4, 5.1, 6.1, 9.1_

  - [ ]* 18.4 Write integration tests for end-to-end ride flow
    - Test complete flow: ride request → counter-offer → acceptance
    - Test timeout expiration scenario
    - Test concurrent acceptance scenario (first wins)
    - _Requirements: All_

- [x] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties using fast-check library
- Unit tests validate specific examples and edge cases
- Backend uses JavaScript (Node.js), frontend uses TypeScript (React Native)
- Socket.IO event names are part of the API contract and must remain consistent
- All fare amounts are in AFN (Afghan Afghani) currency
- The 5km radius and 120s timeout are configurable values
- System must handle concurrent operations (multiple ride requests, concurrent acceptances)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2", "2.3"] },
    { "id": 1, "tasks": ["1.2", "1.3", "3.1", "4.1", "7.1", "7.2"] },
    { "id": 2, "tasks": ["1.4", "3.2", "3.3", "4.2", "4.3", "7.3"] },
    { "id": 3, "tasks": ["3.4", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "6.8"] },
    { "id": 5, "tasks": ["6.5", "6.6", "6.9"] },
    { "id": 6, "tasks": ["6.7", "9.1"] },
    { "id": 7, "tasks": ["9.2", "9.4"] },
    { "id": 8, "tasks": ["9.3", "9.5", "10.1"] },
    { "id": 9, "tasks": ["10.2", "10.3", "11.1"] },
    { "id": 10, "tasks": ["10.4", "11.2", "12.1"] },
    { "id": 11, "tasks": ["11.3", "11.4", "12.2", "12.3", "13.1"] },
    { "id": 12, "tasks": ["11.5", "11.6", "12.4", "12.5", "12.6", "13.2", "13.3"] },
    { "id": 13, "tasks": ["12.7", "12.8", "13.4", "13.5", "14.1", "14.2"] },
    { "id": 14, "tasks": ["15.1", "15.2", "16.1"] },
    { "id": 15, "tasks": ["16.2", "16.3"] },
    { "id": 16, "tasks": ["18.1", "18.2", "18.3"] },
    { "id": 17, "tasks": ["18.4"] }
  ]
}
```
