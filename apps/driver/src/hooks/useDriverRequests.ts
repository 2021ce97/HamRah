import { useState, useEffect, useCallback } from 'react';
import { ConnectionManager } from './useSocketConnection';

// Fare validation
const isValidFare = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0;
};

export interface LocationData {
  lat: number;
  lng: number;
  landmarkName?: string;
}

export interface RideRequest {
  requestId: string;
  rideId: string;
  pickup: LocationData;
  destination: LocationData;
  proposedFare: number;
  riderRating: number;
  riderName: string;
  estimatedDistance: number;
  receivedAt: Date;
  createdAt: Date;
}

export interface DriverRequestHandler {
  activeRequests: RideRequest[];
  submitCounterOffer: (requestId: string, amount: number) => Promise<void>;
  acceptRide: (requestId: string, proposedFare: number) => Promise<void>;
  rejectRide: (requestId: string) => void;
  error: string | null;
  isSubmitting: boolean;
}

export function useDriverRequests(socket: ConnectionManager): DriverRequestHandler {
  const [activeRequests, setActiveRequests] = useState<RideRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Submit a counter-offer
  const submitCounterOffer = useCallback(async (requestId: string, amount: number): Promise<void> => {
    try {
      setError(null);
      setIsSubmitting(true);

      // Validate counter-offer amount
      if (!isValidFare(amount)) {
        throw new Error('Counter-offer amount must be a positive number.');
      }

      // Find the request to get driverId (we'll need to pass this from context/auth)
      const request = activeRequests.find(r => r.requestId === requestId || r.rideId === requestId);
      if (!request) {
        throw new Error('Ride request not found.');
      }

      // Note: driverId should come from authenticated user context
      // For now, we'll emit without it and let the server extract it from the socket
      await socket.emit('fareCounter', {
        requestId: request.rideId, // Use rideId as the backend expects it
        driverId: '', // Server will extract from authenticated socket
        counterAmount: amount
      });

      console.log('✅ Counter-offer submitted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit counter-offer';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [socket, activeRequests]);

  // Accept a ride at the proposed fare
  const acceptRide = useCallback(async (requestId: string, proposedFare: number): Promise<void> => {
    try {
      setError(null);
      setIsSubmitting(true);

      // Validate fare
      if (!isValidFare(proposedFare)) {
        throw new Error('Proposed fare must be a positive number.');
      }

      // Find the request
      const request = activeRequests.find(r => r.requestId === requestId || r.rideId === requestId);
      if (!request) {
        throw new Error('Ride request not found.');
      }

      // Emit rideAccepted event with proposed fare
      await socket.emit('rideAccepted', {
        requestId: request.rideId, // Use rideId as the backend expects it
        driverId: '', // Server will extract from authenticated socket
        acceptedFare: proposedFare
      });

      // Remove the request from active requests (will be confirmed by server event)
      setActiveRequests(prev => prev.filter(r => r.requestId !== requestId && r.rideId !== requestId));

      console.log('✅ Ride accepted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept ride';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [socket, activeRequests]);

  // Reject a ride (local only, no server event)
  const rejectRide = useCallback((requestId: string) => {
    // Simply remove from local state without emitting any event
    setActiveRequests(prev => prev.filter(r => r.requestId !== requestId && r.rideId !== requestId));
    console.log('🚫 Ride rejected locally');
  }, []);

  // Handle incoming ride requests
  useEffect(() => {
    const handleRideRequest = (data: any) => {
      console.log('📥 Received ride request:', data);

      const rideRequest: RideRequest = {
        requestId: data.requestId,
        rideId: data.rideId,
        pickup: {
          lat: data.pickup.lat,
          lng: data.pickup.lng,
          landmarkName: data.pickup.landmarkName
        },
        destination: {
          lat: data.destination.lat,
          lng: data.destination.lng,
          landmarkName: data.destination.landmarkName
        },
        proposedFare: data.proposedFare,
        riderRating: data.riderRating,
        riderName: data.riderName || 'Rider',
        estimatedDistance: data.estimatedDistance,
        receivedAt: new Date(),
        createdAt: new Date(data.createdAt)
      };

      // Add to active requests (avoid duplicates)
      setActiveRequests(prev => {
        const exists = prev.some(r => r.requestId === rideRequest.requestId || r.rideId === rideRequest.rideId);
        if (exists) {
          return prev;
        }
        return [...prev, rideRequest];
      });
    };

    socket.on('rideRequest', handleRideRequest);

    return () => {
      socket.off('rideRequest', handleRideRequest);
    };
  }, [socket]);

  // Handle request expiration
  useEffect(() => {
    const handleRequestExpired = (data: any) => {
      console.log('⏰ Received requestExpired:', data);

      // Remove expired request from active requests
      setActiveRequests(prev => prev.filter(r => 
        r.requestId !== data.requestId && r.rideId !== data.requestId
      ));
    };

    socket.on('requestExpired', handleRequestExpired);

    return () => {
      socket.off('requestExpired', handleRequestExpired);
    };
  }, [socket]);

  // Handle request filled (another driver accepted)
  useEffect(() => {
    const handleRequestFilled = (data: any) => {
      console.log('✅ Received requestFilled:', data);

      // Remove filled request from active requests
      setActiveRequests(prev => prev.filter(r => 
        r.requestId !== data.requestId && r.rideId !== data.requestId
      ));
    };

    socket.on('requestFilled', handleRequestFilled);

    return () => {
      socket.off('requestFilled', handleRequestFilled);
    };
  }, [socket]);

  // Handle fareCounterSuccess confirmation
  useEffect(() => {
    const handleFareCounterSuccess = (data: any) => {
      console.log('✅ Received fareCounterSuccess:', data);
      // Counter-offer was successfully submitted
      // Keep the request visible until rider responds or request expires
    };

    socket.on('fareCounterSuccess', handleFareCounterSuccess);

    return () => {
      socket.off('fareCounterSuccess', handleFareCounterSuccess);
    };
  }, [socket]);

  // Handle rideAccepted confirmation
  useEffect(() => {
    const handleRideAccepted = (data: any) => {
      console.log('✅ Received rideAccepted confirmation:', data);

      // Remove the accepted request from active requests
      setActiveRequests(prev => prev.filter(r => 
        r.requestId !== data.requestId && r.rideId !== data.rideId
      ));
    };

    socket.on('rideAccepted', handleRideAccepted);

    return () => {
      socket.off('rideAccepted', handleRideAccepted);
    };
  }, [socket]);

  // Handle error events from server
  useEffect(() => {
    const handleError = (data: any) => {
      console.error('❌ Received error from server:', data);
      
      const errorMessage = data.message || 'An error occurred';
      setError(errorMessage);
      setIsSubmitting(false);
    };

    socket.on('error', handleError);

    return () => {
      socket.off('error', handleError);
    };
  }, [socket]);

  return {
    activeRequests,
    submitCounterOffer,
    acceptRide,
    rejectRide,
    error,
    isSubmitting
  };
}
