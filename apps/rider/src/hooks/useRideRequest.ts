import { useState, useEffect, useCallback, useRef } from 'react';
import { ConnectionManager } from './useSocketConnection';

// Coordinate validation
const isValidLatitude = (lat: number): boolean => {
  return typeof lat === 'number' && lat >= -90 && lat <= 90;
};

const isValidLongitude = (lng: number): boolean => {
  return typeof lng === 'number' && lng >= -180 && lng <= 180;
};

const isValidCoordinatePair = (lat: number, lng: number): boolean => {
  return isValidLatitude(lat) && isValidLongitude(lng);
};

const isValidFare = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0;
};

export interface Coordinates {
  lat: number;
  lng: number;
  landmarkName?: string;
}

export interface RideRequestParams {
  pickup: Coordinates;
  destination: Coordinates;
  proposedFare: number;
  riderProfile: {
    name: string;
    rating: number;
  };
}

export interface CounterOffer {
  requestId: string;
  rideId: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  counterAmount: number;
  timestamp: Date;
}

export type RequestStatus = 'idle' | 'pending' | 'expired' | 'accepted';

export interface RideRequestManager {
  requestRide: (params: RideRequestParams) => Promise<void>;
  cancelRequest: () => void;
  acceptCounterOffer: (driverId: string, fare: number) => Promise<void>;
  counterOffers: CounterOffer[];
  requestStatus: RequestStatus;
  timeRemaining: number; // seconds
  currentRequestId: string | null;
  error: string | null;
}

export function useRideRequest(socket: ConnectionManager): RideRequestManager {
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [counterOffers, setCounterOffers] = useState<CounterOffer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const requestStartTimeRef = useRef<number | null>(null);

  // Cleanup timers
  const clearTimers = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Start 120-second countdown timer
  const startCountdown = useCallback(() => {
    clearTimers();
    
    const TIMEOUT_DURATION = 120; // 120 seconds
    requestStartTimeRef.current = Date.now();
    setTimeRemaining(TIMEOUT_DURATION);

    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      if (requestStartTimeRef.current) {
        const elapsed = Math.floor((Date.now() - requestStartTimeRef.current) / 1000);
        const remaining = Math.max(0, TIMEOUT_DURATION - elapsed);
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearTimers();
        }
      }
    }, 1000);

    // Set timeout for 120 seconds
    timeoutTimerRef.current = setTimeout(() => {
      // Timeout will be handled by requestExpired event from server
      clearTimers();
    }, TIMEOUT_DURATION * 1000);
  }, [clearTimers]);

  // Request a ride
  const requestRide = useCallback(async (params: RideRequestParams): Promise<void> => {
    try {
      setError(null);

      // Validate pickup coordinates
      if (!isValidCoordinatePair(params.pickup.lat, params.pickup.lng)) {
        throw new Error('Invalid pickup coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
      }

      // Validate destination coordinates
      if (!isValidCoordinatePair(params.destination.lat, params.destination.lng)) {
        throw new Error('Invalid destination coordinates. Latitude must be between -90 and 90, longitude between -180 and 180.');
      }

      // Validate proposed fare
      if (!isValidFare(params.proposedFare)) {
        throw new Error('Proposed fare must be a positive number.');
      }

      // Validate rider profile
      if (!params.riderProfile || !params.riderProfile.name) {
        throw new Error('Rider profile with name is required.');
      }

      // Reset state
      setCounterOffers([]);
      setRequestStatus('pending');
      setCurrentRequestId(null);

      // Emit requestRide event
      await socket.emit('requestRide', {
        pickup: params.pickup,
        destination: params.destination,
        proposedFare: params.proposedFare,
        riderProfile: params.riderProfile
      });

      // Start countdown timer
      startCountdown();

      console.log('✅ Ride request sent successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request ride';
      setError(errorMessage);
      setRequestStatus('idle');
      clearTimers();
      throw err;
    }
  }, [socket, startCountdown, clearTimers]);

  // Cancel current request
  const cancelRequest = useCallback(() => {
    clearTimers();
    setRequestStatus('idle');
    setCounterOffers([]);
    setCurrentRequestId(null);
    setTimeRemaining(0);
    setError(null);
    requestStartTimeRef.current = null;
  }, [clearTimers]);

  // Accept a counter-offer
  const acceptCounterOffer = useCallback(async (driverId: string, fare: number): Promise<void> => {
    try {
      setError(null);

      if (!currentRequestId) {
        throw new Error('No active ride request to accept.');
      }

      if (requestStatus !== 'pending') {
        throw new Error('Cannot accept counter-offer: request is not pending.');
      }

      // Validate fare
      if (!isValidFare(fare)) {
        throw new Error('Accepted fare must be a positive number.');
      }

      // Emit rideAccepted event
      await socket.emit('rideAccepted', {
        requestId: currentRequestId,
        driverId,
        acceptedFare: fare
      });

      // Update status
      setRequestStatus('accepted');
      
      // Cancel countdown timer
      clearTimers();

      // Dismiss all other counter-offers (keep only the accepted one)
      setCounterOffers(prev => prev.filter(offer => offer.driverId === driverId));

      console.log('✅ Counter-offer accepted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept counter-offer';
      setError(errorMessage);
      throw err;
    }
  }, [socket, currentRequestId, requestStatus, clearTimers]);

  // Handle requestRideSuccess event
  useEffect(() => {
    const handleRequestRideSuccess = (data: any) => {
      console.log('📥 Received requestRideSuccess:', data);
      setCurrentRequestId(data.requestId || data.rideId);
    };

    socket.on('requestRideSuccess', handleRequestRideSuccess);

    return () => {
      socket.off('requestRideSuccess', handleRequestRideSuccess);
    };
  }, [socket]);

  // Handle fareCounter event (counter-offer reception)
  useEffect(() => {
    const handleFareCounter = (data: any) => {
      console.log('📥 Received fareCounter:', data);

      const counterOffer: CounterOffer = {
        requestId: data.requestId,
        rideId: data.rideId,
        driverId: data.driverId,
        driverName: data.driverName,
        driverRating: data.driverRating,
        counterAmount: data.counterAmount,
        timestamp: new Date(data.timestamp)
      };

      // Add counter-offer to list and sort by amount (ascending)
      setCounterOffers(prev => {
        const updated = [...prev, counterOffer];
        return updated.sort((a, b) => a.counterAmount - b.counterAmount);
      });

      // Play notification sound (TODO: implement sound)
      console.log('🔔 New counter-offer received!');
    };

    socket.on('fareCounter', handleFareCounter);

    return () => {
      socket.off('fareCounter', handleFareCounter);
    };
  }, [socket]);

  // Handle requestExpired event
  useEffect(() => {
    const handleRequestExpired = (data: any) => {
      console.log('⏰ Received requestExpired:', data);

      if (data.requestId === currentRequestId) {
        setRequestStatus('expired');
        clearTimers();
        setTimeRemaining(0);
      }
    };

    socket.on('requestExpired', handleRequestExpired);

    return () => {
      socket.off('requestExpired', handleRequestExpired);
    };
  }, [socket, currentRequestId, clearTimers]);

  // Handle rideAccepted event (confirmation from server)
  useEffect(() => {
    const handleRideAccepted = (data: any) => {
      console.log('✅ Received rideAccepted confirmation:', data);

      if (data.requestId === currentRequestId || data.rideId === currentRequestId) {
        setRequestStatus('accepted');
        clearTimers();
        setTimeRemaining(0);
        
        // Dismiss all counter-offers
        setCounterOffers([]);
      }
    };

    socket.on('rideAccepted', handleRideAccepted);

    return () => {
      socket.off('rideAccepted', handleRideAccepted);
    };
  }, [socket, currentRequestId, clearTimers]);

  // Handle error events from server
  useEffect(() => {
    const handleError = (data: any) => {
      console.error('❌ Received error from server:', data);
      
      const errorMessage = data.message || 'An error occurred';
      setError(errorMessage);

      // If error is related to ride request, reset status
      if (data.code === 'NO_DRIVERS_AVAILABLE' || 
          data.code === 'REQUEST_FAILED' ||
          data.code === 'INVALID_PICKUP_COORDINATES' ||
          data.code === 'INVALID_DESTINATION_COORDINATES' ||
          data.code === 'INVALID_FARE') {
        setRequestStatus('idle');
        clearTimers();
      }
    };

    socket.on('error', handleError);

    return () => {
      socket.off('error', handleError);
    };
  }, [socket, clearTimers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    requestRide,
    cancelRequest,
    acceptCounterOffer,
    counterOffers,
    requestStatus,
    timeRemaining,
    currentRequestId,
    error
  };
}
