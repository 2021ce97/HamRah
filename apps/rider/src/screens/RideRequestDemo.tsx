import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { useSocketConnection } from '../hooks/useSocketConnection';
import { useRideRequest } from '../hooks/useRideRequest';
import { RouteVisualizer } from '../components/RouteVisualizer';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { formatCurrency, formatRating, formatElapsedTime } from '../utils/formatters';

export const RideRequestDemo: React.FC = () => {
  // Mock auth token (in production, get from auth context)
  const authToken = 'mock-jwt-token';
  
  // Socket connection
  const socket = useSocketConnection(authToken);
  
  // Ride request hook
  const rideRequest = useRideRequest(socket);
  
  // Form state
  const [pickupLat, setPickupLat] = useState('34.5553');
  const [pickupLng, setPickupLng] = useState('69.2075');
  const [destLat, setDestLat] = useState('34.5200');
  const [destLng, setDestLng] = useState('69.1800');
  const [fare, setFare] = useState('500');
  const [riderName, setRiderName] = useState('Ahmad');

  const handleRequestRide = async () => {
    try {
      await rideRequest.requestRide({
        pickup: {
          lat: parseFloat(pickupLat),
          lng: parseFloat(pickupLng),
          landmarkName: 'Kabul Airport'
        },
        destination: {
          lat: parseFloat(destLat),
          lng: parseFloat(destLng),
          landmarkName: 'City Center'
        },
        proposedFare: parseFloat(fare),
        riderProfile: {
          name: riderName,
          rating: 4.8
        }
      });
      Alert.alert('Success', 'Ride request sent!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to request ride');
    }
  };

  const handleAcceptOffer = async (driverId: string, amount: number) => {
    try {
      await rideRequest.acceptCounterOffer(driverId, amount);
      Alert.alert('Success', 'Counter-offer accepted!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept offer');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚗 Rider App Demo</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, socket.isConnected && styles.statusDotConnected]} />
          <Text style={styles.statusText}>
            {socket.connectionStatus === 'connected' ? 'Connected' : 
             socket.connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
          </Text>
        </View>
      </View>

      {/* Route Visualizer */}
      <View style={styles.mapContainer}>
        <RouteVisualizer
          pickup={pickupLat && pickupLng ? {
            lat: parseFloat(pickupLat),
            lng: parseFloat(pickupLng),
            landmarkName: 'Kabul Airport'
          } : null}
          destination={destLat && destLng ? {
            lat: parseFloat(destLat),
            lng: parseFloat(destLng),
            landmarkName: 'City Center'
          } : null}
        />
      </View>

      {/* Request Form */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Ride Request</Text>
        
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Pickup Lat"
            value={pickupLat}
            onChangeText={setPickupLat}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Pickup Lng"
            value={pickupLng}
            onChangeText={setPickupLng}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Dest Lat"
            value={destLat}
            onChangeText={setDestLat}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Dest Lng"
            value={destLng}
            onChangeText={setDestLng}
            keyboardType="numeric"
          />
        </View>

        <TextInput
          style={styles.inputFull}
          placeholder="Proposed Fare (AFN)"
          value={fare}
          onChangeText={setFare}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.inputFull}
          placeholder="Your Name"
          value={riderName}
          onChangeText={setRiderName}
        />

        <TouchableOpacity
          style={[styles.button, styles.requestButton]}
          onPress={handleRequestRide}
          disabled={rideRequest.requestStatus === 'pending'}
        >
          <Text style={styles.buttonText}>
            {rideRequest.requestStatus === 'pending' ? 'Requesting...' : 'Request Ride'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Request Status */}
      {rideRequest.requestStatus !== 'idle' && (
        <View style={styles.statusContainer}>
          <Text style={styles.sectionTitle}>Request Status</Text>
          <Text style={styles.statusValue}>
            Status: {rideRequest.requestStatus.toUpperCase()}
          </Text>
          {rideRequest.requestStatus === 'pending' && (
            <Text style={styles.timerText}>
              ⏱️ Time Remaining: {rideRequest.timeRemaining}s
            </Text>
          )}
        </View>
      )}

      {/* Counter-Offers */}
      {rideRequest.counterOffers.length > 0 && (
        <View style={styles.offersContainer}>
          <Text style={styles.sectionTitle}>Counter-Offers ({rideRequest.counterOffers.length})</Text>
          {rideRequest.counterOffers.map((offer) => (
            <View key={offer.driverId} style={styles.offerCard}>
              <View style={styles.offerHeader}>
                <Text style={styles.driverName}>{offer.driverName}</Text>
                <Text style={styles.driverRating}>{formatRating(offer.driverRating)}</Text>
              </View>
              <View style={styles.offerBody}>
                <Text style={styles.offerAmount}>{formatCurrency(offer.counterAmount)}</Text>
                <Text style={styles.offerTime}>{formatElapsedTime(offer.timestamp)}</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.acceptButton]}
                onPress={() => handleAcceptOffer(offer.driverId, offer.counterAmount)}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Error Display */}
      {rideRequest.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ {rideRequest.error}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d32f2f',
    marginRight: 8,
  },
  statusDotConnected: {
    backgroundColor: '#4caf50',
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
  },
  mapContainer: {
    height: 300,
  },
  formContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  inputFull: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  requestButton: {
    backgroundColor: '#1976d2',
  },
  acceptButton: {
    backgroundColor: '#2e7d32',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusValue: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  offersContainer: {
    padding: 16,
    paddingTop: 0,
  },
  offerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  driverRating: {
    fontSize: 14,
    color: '#666',
  },
  offerBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  offerAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  offerTime: {
    fontSize: 12,
    color: '#999',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
});
