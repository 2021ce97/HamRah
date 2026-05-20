import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface Coordinates {
  lat: number;
  lng: number;
  landmarkName?: string;
}

export interface RouteData {
  distance: number; // meters
  duration: number; // seconds
  geometry: any; // GeoJSON LineString
}

interface RouteVisualizerProps {
  pickup: Coordinates | null;
  destination: Coordinates | null;
  onRouteCalculated?: (route: RouteData) => void;
}

type RouteState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: RouteData }
  | { status: 'error'; error: string };

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({
  pickup,
  destination,
  onRouteCalculated
}) => {
  const [routeState, setRouteState] = useState<RouteState>({ status: 'idle' });
  const [polylineCoords, setPolylineCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);

  // Query Directions API
  const fetchRoute = useCallback(async () => {
    if (!pickup || !destination) {
      setRouteState({ status: 'idle' });
      setPolylineCoords([]);
      return;
    }

    try {
      setRouteState({ status: 'loading' });
      setPolylineCoords([]); // Clear previous polyline

      const response = await fetch(`${BACKEND_URL}/api/navigation/directions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin: { lat: pickup.lat, lng: pickup.lng },
          destination: { lat: destination.lat, lng: destination.lng }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.route || !data.route.geometry) {
        throw new Error('Invalid route data received');
      }

      const routeData: RouteData = {
        distance: data.route.distance,
        duration: data.route.duration,
        geometry: data.route.geometry
      };

      // Parse GeoJSON LineString geometry to polyline coordinates
      const coordinates = data.route.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1], // GeoJSON is [lng, lat]
        longitude: coord[0]
      }));

      setPolylineCoords(coordinates);
      setRouteState({ status: 'success', data: routeData });

      if (onRouteCalculated) {
        onRouteCalculated(routeData);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch route';
      setRouteState({ status: 'error', error: errorMessage });
      console.error('Route fetch error:', error);
    }
  }, [pickup, destination, onRouteCalculated]);

  // Fetch route when coordinates change
  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Retry handler
  const handleRetry = () => {
    fetchRoute();
  };

  // Calculate map region to fit both markers
  const getMapRegion = () => {
    if (!pickup || !destination) {
      return {
        latitude: 34.5553,
        longitude: 69.2075,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
      };
    }

    const minLat = Math.min(pickup.lat, destination.lat);
    const maxLat = Math.max(pickup.lat, destination.lat);
    const minLng = Math.min(pickup.lng, destination.lng);
    const maxLng = Math.max(pickup.lng, destination.lng);

    const latDelta = (maxLat - minLat) * 1.5; // Add padding
    const lngDelta = (maxLng - minLng) * 1.5;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01)
    };
  };

  // Format distance
  const formatDistance = (meters: number): string => {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <View style={styles.container}>
      {/* Map View */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={getMapRegion()}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Pickup Marker */}
        {pickup && (
          <Marker
            coordinate={{ latitude: pickup.lat, longitude: pickup.lng }}
            title="Pickup"
            description={pickup.landmarkName || 'Pickup Location'}
            pinColor="green"
          />
        )}

        {/* Destination Marker */}
        {destination && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            title="Destination"
            description={destination.landmarkName || 'Destination'}
            pinColor="red"
          />
        )}

        {/* Route Polyline */}
        {polylineCoords.length > 0 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#1976d2"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Loading Overlay */}
      {routeState.status === 'loading' && (
        <View style={styles.overlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1976d2" />
            <Text style={styles.loadingText}>Calculating route...</Text>
          </View>
        </View>
      )}

      {/* Error Overlay */}
      {routeState.status === 'error' && (
        <View style={styles.overlay}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {routeState.error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Route Info */}
      {routeState.status === 'success' && (
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>{formatDistance(routeState.data.distance)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Duration:</Text>
            <Text style={styles.infoValue}>{formatDuration(routeState.data.duration)}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
