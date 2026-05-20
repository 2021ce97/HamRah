# Requirements Document

## Introduction

This document specifies the requirements for the Real-Time Ride Matching feature in HamRah, an Afghan ride-hailing application. The feature enables real-time bidirectional communication between riders requesting rides and drivers offering counter-offers through Socket.IO, integrated with Google Maps route visualization and the existing backend infrastructure.

The system must handle Afghanistan's challenging network conditions (inconsistent connectivity, high latency) while providing a seamless InDrive-style fare negotiation experience.

## Glossary

- **Rider_App**: The React Native mobile application used by passengers to request rides
- **Driver_App**: The React Native mobile application used by drivers to receive and respond to ride requests
- **Socket_Server**: The Socket.IO server component running on the backend that manages real-time event routing
- **Route_Visualizer**: The component in Rider_App that displays route polylines on Google Maps
- **Directions_API**: The backend endpoint `/api/navigation/directions` that wraps Mapbox Directions API
- **Ride_Request**: A data structure containing pickup coordinates, destination coordinates, proposed fare, and rider profile information
- **Counter_Offer**: A fare amount proposed by a driver in response to a Ride_Request
- **Online_Driver**: A driver whose status is set to "ONLINE" and is eligible to receive Ride_Requests
- **Nearby_Driver**: An Online_Driver within a configurable radius of the pickup location
- **Connection_Manager**: The component responsible for Socket.IO connection lifecycle management
- **Request_Timeout**: A 120-second period after which a Ride_Request expires if no driver responds
- **AFN**: Afghan Afghani currency

## Requirements

### Requirement 1: Route Visualization

**User Story:** As a rider, I want to see the route drawn on the map before requesting a ride, so that I can verify the pickup and destination locations are correct.

#### Acceptance Criteria

1. WHEN the rider selects both pickup and destination coordinates, THE Route_Visualizer SHALL query the Directions_API with the coordinate pair
2. WHEN the Directions_API returns a valid route response, THE Route_Visualizer SHALL draw a polyline on the Google Maps view using the returned geometry
3. WHEN the Directions_API returns a valid route response, THE Route_Visualizer SHALL display the estimated distance in kilometers
4. WHEN the Directions_API returns a valid route response, THE Route_Visualizer SHALL display the estimated duration in minutes
5. IF the Directions_API returns an error response, THEN THE Route_Visualizer SHALL display an error message to the rider
6. WHEN the rider changes either pickup or destination coordinates, THE Route_Visualizer SHALL clear the previous polyline and query the Directions_API again
7. THE Route_Visualizer SHALL display a loading indicator while waiting for the Directions_API response

### Requirement 2: Socket.IO Connection Management

**User Story:** As a rider or driver, I want the app to maintain a stable connection to the server even with poor internet, so that I don't miss ride requests or counter-offers.

#### Acceptance Criteria

1. WHEN the Rider_App launches, THE Connection_Manager SHALL establish a Socket.IO connection to the Socket_Server
2. WHEN the Driver_App launches, THE Connection_Manager SHALL establish a Socket.IO connection to the Socket_Server
3. IF the Socket.IO connection is lost, THEN THE Connection_Manager SHALL attempt automatic reconnection with exponential backoff up to 30 seconds
4. WHEN the Socket.IO connection is reconnected after a disconnection, THE Connection_Manager SHALL re-subscribe to relevant event channels
5. WHILE the Socket.IO connection is disconnected, THE Connection_Manager SHALL display a connection status indicator to the user
6. WHEN the Socket.IO connection is established, THE Connection_Manager SHALL emit an authentication event with the user's JWT token
7. IF the Socket.IO connection fails authentication, THEN THE Connection_Manager SHALL redirect the user to the login screen

### Requirement 3: Ride Request Emission

**User Story:** As a rider, I want to send my ride request to nearby drivers in real-time, so that I can receive counter-offers quickly.

#### Acceptance Criteria

1. WHEN the rider confirms a ride request, THE Rider_App SHALL emit a `requestRide` event to the Socket_Server containing pickup coordinates, destination coordinates, proposed fare in AFN, and rider profile information
2. THE Rider_App SHALL validate that pickup coordinates are valid latitude/longitude pairs before emitting the `requestRide` event
3. THE Rider_App SHALL validate that destination coordinates are valid latitude/longitude pairs before emitting the `requestRide` event
4. THE Rider_App SHALL validate that the proposed fare is a positive number before emitting the `requestRide` event
5. WHEN the `requestRide` event is emitted, THE Rider_App SHALL display a loading state indicating the request is being sent
6. WHEN the `requestRide` event is emitted, THE Rider_App SHALL start a Request_Timeout timer of 120 seconds
7. IF the Request_Timeout expires with no driver responses, THEN THE Rider_App SHALL display a "No drivers available" message and allow the rider to retry

### Requirement 4: Ride Request Distribution

**User Story:** As a driver, I want to receive ride requests from nearby riders when I'm online, so that I can choose which rides to accept.

#### Acceptance Criteria

1. WHEN the Socket_Server receives a `requestRide` event, THE Socket_Server SHALL identify all Nearby_Drivers within a 5-kilometer radius of the pickup location
2. WHEN the Socket_Server identifies Nearby_Drivers, THE Socket_Server SHALL emit the Ride_Request to each Nearby_Driver's socket connection
3. THE Socket_Server SHALL include the following fields in the emitted Ride_Request: pickup coordinates, destination coordinates, proposed fare, rider rating, estimated distance, and a unique request identifier
4. WHEN a driver's status changes from "ONLINE" to "OFFLINE", THE Socket_Server SHALL unsubscribe that driver from receiving new Ride_Requests
5. WHEN a driver's status changes from "OFFLINE" to "ONLINE", THE Socket_Server SHALL subscribe that driver to receive Ride_Requests
6. THE Socket_Server SHALL not emit Ride_Requests to drivers who are currently on an active ride

### Requirement 5: Ride Request Display

**User Story:** As a driver, I want to see ride request details clearly displayed, so that I can make informed decisions about accepting or counter-offering.

#### Acceptance Criteria

1. WHEN the Driver_App receives a Ride_Request event, THE Driver_App SHALL display a ride request card containing pickup location, destination location, proposed fare, rider rating, and estimated distance
2. THE Driver_App SHALL display the pickup location as a human-readable landmark name if available, otherwise as coordinates
3. THE Driver_App SHALL display the destination location as a human-readable landmark name if available, otherwise as coordinates
4. THE Driver_App SHALL display the proposed fare in AFN currency format
5. THE Driver_App SHALL display the rider rating as a star rating out of 5
6. THE Driver_App SHALL display the estimated distance in kilometers
7. WHILE the Driver_App status is "OFFLINE", THE Driver_App SHALL not display any ride request cards

### Requirement 6: Counter-Offer Emission

**User Story:** As a driver, I want to send a counter-offer to a rider, so that I can negotiate a fare that works for me.

#### Acceptance Criteria

1. WHEN the driver taps the counter-offer button on a ride request card, THE Driver_App SHALL display a fare input interface
2. WHEN the driver submits a counter-offer, THE Driver_App SHALL validate that the counter-offer amount is a positive number
3. WHEN the driver submits a valid counter-offer, THE Driver_App SHALL emit a `fareCounter` event to the Socket_Server containing the request identifier, driver identifier, and counter-offer amount in AFN
4. WHEN the `fareCounter` event is emitted, THE Driver_App SHALL display a confirmation message indicating the counter-offer was sent
5. THE Driver_App SHALL allow the driver to send multiple counter-offers for the same Ride_Request
6. WHEN the driver submits a counter-offer, THE Driver_App SHALL keep the ride request card visible until the rider responds or the request expires

### Requirement 7: Counter-Offer Reception

**User Story:** As a rider, I want to receive counter-offers from drivers in real-time, so that I can choose the best offer.

#### Acceptance Criteria

1. WHEN the Socket_Server receives a `fareCounter` event, THE Socket_Server SHALL route the Counter_Offer to the specific rider who created the Ride_Request
2. WHEN the Rider_App receives a `fareCounter` event, THE Rider_App SHALL display the Counter_Offer in a list showing driver name, driver rating, and counter-offer amount
3. THE Rider_App SHALL sort the Counter_Offer list by counter-offer amount in ascending order
4. THE Rider_App SHALL display each Counter_Offer with an "Accept" button
5. WHEN a new Counter_Offer arrives, THE Rider_App SHALL play a notification sound
6. WHEN a new Counter_Offer arrives, THE Rider_App SHALL display a visual notification indicator
7. THE Rider_App SHALL display the time elapsed since each Counter_Offer was received

### Requirement 8: Ride Acceptance by Rider

**User Story:** As a rider, I want to accept a counter-offer from a driver, so that I can confirm my ride at an agreed fare.

#### Acceptance Criteria

1. WHEN the rider taps the "Accept" button on a Counter_Offer, THE Rider_App SHALL emit a `rideAccepted` event to the Socket_Server containing the request identifier, driver identifier, and accepted fare amount
2. WHEN the `rideAccepted` event is emitted, THE Rider_App SHALL dismiss all other Counter_Offers for that Ride_Request
3. WHEN the `rideAccepted` event is emitted, THE Rider_App SHALL display a confirmation screen showing driver details and estimated arrival time
4. WHEN the `rideAccepted` event is emitted, THE Rider_App SHALL cancel the Request_Timeout timer
5. THE Rider_App SHALL prevent the rider from accepting multiple Counter_Offers for the same Ride_Request

### Requirement 9: Ride Acceptance by Driver

**User Story:** As a driver, I want to accept a ride request at the proposed fare without counter-offering, so that I can quickly confirm rides when the fare is acceptable.

#### Acceptance Criteria

1. WHEN the driver taps the "Accept" button on a ride request card, THE Driver_App SHALL emit a `rideAccepted` event to the Socket_Server containing the request identifier, driver identifier, and the original proposed fare amount
2. WHEN the `rideAccepted` event is emitted, THE Driver_App SHALL dismiss the ride request card
3. WHEN the `rideAccepted` event is emitted, THE Driver_App SHALL navigate to the active ride screen showing pickup location and rider details
4. WHEN the Rider_App receives a `rideAccepted` event from a driver, THE Rider_App SHALL display a confirmation screen showing driver details and estimated arrival time
5. WHEN the Rider_App receives a `rideAccepted` event, THE Rider_App SHALL cancel the Request_Timeout timer

### Requirement 10: Ride Rejection

**User Story:** As a driver, I want to reject a ride request, so that I can decline rides that don't work for me without affecting my status.

#### Acceptance Criteria

1. WHEN the driver taps the "Reject" button on a ride request card, THE Driver_App SHALL dismiss the ride request card without emitting any events
2. THE Driver_App SHALL not penalize the driver for rejecting a Ride_Request
3. WHEN the driver rejects a Ride_Request, THE Driver_App SHALL remain subscribed to receive new Ride_Requests
4. THE Driver_App SHALL allow the driver to reject multiple Ride_Requests without limit

### Requirement 11: Error Handling and Network Resilience

**User Story:** As a rider or driver, I want the app to handle network errors gracefully, so that I can continue using the app even with poor connectivity.

#### Acceptance Criteria

1. IF the Directions_API request fails due to network error, THEN THE Route_Visualizer SHALL display a retry button
2. IF a Socket.IO event emission fails due to disconnection, THEN THE Connection_Manager SHALL queue the event and retry when connection is restored
3. WHEN the Connection_Manager queues an event, THE Connection_Manager SHALL display a "Sending..." indicator to the user
4. IF the Socket.IO connection is lost during an active Ride_Request, THEN THE Rider_App SHALL display a warning message but keep the request active
5. IF the Socket.IO connection is lost during an active Ride_Request, THEN THE Driver_App SHALL display a warning message but keep received ride request cards visible
6. WHEN the Socket.IO connection is restored, THE Connection_Manager SHALL synchronize the current state with the Socket_Server
7. IF a critical Socket.IO event fails to send after 3 retry attempts, THEN THE app SHALL display an error message and allow the user to manually retry

### Requirement 12: Coordinate Validation

**User Story:** As a system administrator, I want all coordinates to be validated before processing, so that invalid data doesn't cause system errors.

#### Acceptance Criteria

1. THE Rider_App SHALL validate that latitude values are between -90 and 90 degrees before emitting a `requestRide` event
2. THE Rider_App SHALL validate that longitude values are between -180 and 180 degrees before emitting a `requestRide` event
3. THE Socket_Server SHALL validate that received pickup coordinates are within Afghanistan's geographic boundaries (latitude 29-38°N, longitude 60-75°E)
4. THE Socket_Server SHALL validate that received destination coordinates are within Afghanistan's geographic boundaries (latitude 29-38°N, longitude 60-75°E)
5. IF the Socket_Server receives invalid coordinates, THEN THE Socket_Server SHALL emit an error event back to the sender
6. THE Route_Visualizer SHALL validate coordinates before querying the Directions_API

### Requirement 13: RTL UI Support

**User Story:** As a Dari or Pashto speaker, I want the ride matching interface to display correctly in right-to-left layout, so that I can use the app in my native language.

#### Acceptance Criteria

1. WHEN the app language is set to Dari or Pashto, THE Rider_App SHALL display all ride request UI elements in right-to-left layout
2. WHEN the app language is set to Dari or Pashto, THE Driver_App SHALL display all ride request cards in right-to-left layout
3. THE Rider_App SHALL display fare amounts with AFN currency symbol positioned according to RTL conventions
4. THE Driver_App SHALL display fare amounts with AFN currency symbol positioned according to RTL conventions
5. THE Rider_App SHALL display counter-offer lists with alignment appropriate for RTL layout
6. THE Driver_App SHALL display ride request card buttons with alignment appropriate for RTL layout

### Requirement 14: Loading States and User Feedback

**User Story:** As a rider or driver, I want to see clear loading indicators during network operations, so that I know the app is working.

#### Acceptance Criteria

1. WHILE the Route_Visualizer is querying the Directions_API, THE Rider_App SHALL display a loading spinner on the map
2. WHILE the Rider_App is emitting a `requestRide` event, THE Rider_App SHALL display a loading indicator on the confirm button
3. WHILE the Driver_App is emitting a `fareCounter` event, THE Driver_App SHALL display a loading indicator on the counter-offer button
4. WHILE the Driver_App is emitting a `rideAccepted` event, THE Driver_App SHALL display a loading indicator on the accept button
5. WHEN any Socket.IO event completes successfully, THE app SHALL provide visual feedback (checkmark, success message, or screen transition)
6. WHEN any Socket.IO event fails, THE app SHALL display an error message with a retry option

### Requirement 15: Request Timeout and Cleanup

**User Story:** As a rider, I want expired ride requests to be automatically cleaned up, so that I'm not waiting indefinitely for responses.

#### Acceptance Criteria

1. WHEN a Ride_Request is created, THE Socket_Server SHALL set a Request_Timeout of 120 seconds
2. WHEN the Request_Timeout expires, THE Socket_Server SHALL emit a `requestExpired` event to the rider
3. WHEN the Request_Timeout expires, THE Socket_Server SHALL emit a `requestExpired` event to all drivers who received the Ride_Request
4. WHEN the Rider_App receives a `requestExpired` event, THE Rider_App SHALL display a "No drivers available" message
5. WHEN the Driver_App receives a `requestExpired` event, THE Driver_App SHALL dismiss the corresponding ride request card
6. WHEN a ride is accepted by any driver, THE Socket_Server SHALL cancel the Request_Timeout
7. WHEN a ride is accepted by any driver, THE Socket_Server SHALL emit a `requestFilled` event to all other drivers who received the Ride_Request, causing them to dismiss the card

## Property-Based Testing Guidance

### Testable Properties

#### Round-Trip Properties
1. **Coordinate Serialization**: FOR ALL valid coordinate pairs (lat, lng), serializing to JSON and deserializing SHALL produce equivalent coordinates within 0.000001 degree precision
2. **Ride Request Serialization**: FOR ALL valid Ride_Requests, serializing to Socket.IO event payload and deserializing SHALL produce an equivalent Ride_Request object

#### Invariant Properties
3. **Fare Positivity**: FOR ALL Ride_Requests and Counter_Offers, the fare amount SHALL be greater than zero
4. **Coordinate Bounds**: FOR ALL coordinates processed by the system, latitude SHALL be between -90 and 90, and longitude SHALL be between -180 and 180
5. **Afghanistan Geographic Bounds**: FOR ALL coordinates accepted by Socket_Server, latitude SHALL be between 29 and 38, and longitude SHALL be between 60 and 75
6. **Request Timeout Invariant**: FOR ALL active Ride_Requests, the elapsed time SHALL be less than or equal to 120 seconds OR the request SHALL be in expired state

#### Metamorphic Properties
7. **Distance Monotonicity**: FOR ALL route queries, if destination moves farther from pickup, the returned distance SHALL be greater than or equal to the original distance
8. **Counter-Offer Ordering**: FOR ALL Counter_Offer lists, sorting by amount in ascending order and then sorting again SHALL produce the same list

#### Idempotence Properties
9. **Connection Resubscription**: FOR ALL drivers, setting status to "ONLINE" multiple times SHALL result in the same subscription state as setting it once
10. **Ride Request Dismissal**: FOR ALL ride request cards, dismissing a card multiple times SHALL have the same effect as dismissing it once

#### Error Condition Properties
11. **Invalid Coordinate Rejection**: FOR ALL coordinate pairs where latitude is outside [-90, 90] OR longitude is outside [-180, 180], the validation function SHALL return false
12. **Invalid Fare Rejection**: FOR ALL fare amounts less than or equal to zero, the validation function SHALL return false
13. **Network Failure Recovery**: FOR ALL Socket.IO disconnection events, the Connection_Manager SHALL attempt reconnection at least once

#### State Machine Properties
14. **Ride Request Lifecycle**: FOR ALL Ride_Requests, the state SHALL transition from "pending" → "accepted" OR "pending" → "expired", never from "accepted" → "pending" or "expired" → "pending"
15. **Driver Status Transitions**: FOR ALL drivers, status SHALL transition between "ONLINE" and "OFFLINE" only, never to any other state

### Integration Test Scenarios (Not Property-Based)

The following scenarios should use integration tests with 1-3 representative examples:

1. **Socket.IO Server Connection**: Verify that apps can connect to the Socket_Server (infrastructure test)
2. **Directions API Integration**: Verify that the backend can query Mapbox and return route data (external service test)
3. **JWT Authentication**: Verify that Socket.IO connections authenticate with valid JWT tokens (configuration test)
4. **End-to-End Ride Flow**: Verify complete flow from ride request to acceptance with 2-3 example scenarios (high-cost operation)

## Notes

- All fare amounts are in AFN (Afghan Afghani) currency
- The 5-kilometer radius for Nearby_Drivers is configurable and may be adjusted based on city density
- The 120-second Request_Timeout is configurable and may be adjusted based on user feedback
- Socket.IO event names (`requestRide`, `fareCounter`, `rideAccepted`, `requestExpired`, `requestFilled`) are part of the API contract and must remain consistent
- The system must handle concurrent ride requests from the same rider (e.g., if rider accidentally taps confirm twice)
- The system must handle concurrent ride acceptances from multiple drivers for the same request (first acceptance wins)
