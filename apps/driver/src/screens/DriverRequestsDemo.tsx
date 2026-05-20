import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useSocketConnection } from '../hooks/useSocketConnection';
import { useDriverRequests } from '../hooks/useDriverRequests';
import { RideRequestCard } from '../components/RideRequestCard';
import { CounterOfferModal } from '../components/CounterOfferModal';
import { LoadingIndicator } from '../components/LoadingIndicator';

export const DriverRequestsDemo: React.FC = () => {
  // Mock auth token (in production, get from auth context)
  const authToken = 'mock-driver-jwt-token';
  
  // Socket connection
  const socket = useSocketConnection(authToken);
  
  // Driver requests hook
  const driverRequests = useDriverRequests(socket);
  
  // Counter-offer modal state
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const handleAcceptRide = async (requestId: string, proposedFare: number) => {
    try {
      await driverRequests.acceptRide(requestId, proposedFare);
      Alert.alert('Success', 'Ride accepted!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to accept ride');
    }
  };

  const handleCounterOffer = (request: any) => {
    setSelectedRequest(request);
  };

  const handleSubmitCounterOffer = async (amount: number) => {
    if (!selectedRequest) return;
    
    try {
      await driverRequests.submitCounterOffer(selectedRequest.requestId, amount);
      setSelectedRequest(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit counter-offer');
    }
  };

  const handleRejectRide = (requestId: string) => {
    Alert.alert(
      'Reject Ride',
      'Are you sure you want to reject this ride request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => driverRequests.rejectRide(requestId)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🚕 Driver App Demo</Text>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, socket.isConnected && styles.statusDotConnected]} />
          <Text style={styles.statusText}>
            {socket.connectionStatus === 'connected' ? 'Connected' : 
             socket.connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
          </Text>
        </View>
        {socket.connectionStatus === 'reconnecting' && (
          <Text style={styles.reconnectText}>
            Attempt {socket.reconnectionAttempt}
          </Text>
        )}
      </View>

      {/* Active Requests Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          Active Requests: {driverRequests.activeRequests.length}
        </Text>
      </View>

      {/* Ride Requests List */}
      <ScrollView style={styles.scrollView}>
        {driverRequests.activeRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {socket.isConnected 
                ? '📭 No active ride requests\n\nWaiting for riders...' 
                : '🔌 Connecting to server...'}
            </Text>
          </View>
        ) : (
          driverRequests.activeRequests.map((request) => (
            <RideRequestCard
              key={request.requestId}
              request={request}
              onAccept={handleAcceptRide}
              onCounterOffer={() => handleCounterOffer(request)}
              onReject={handleRejectRide}
              isSubmitting={driverRequests.isSubmitting}
            />
          ))
        )}

        {/* Error Display */}
        {driverRequests.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {driverRequests.error}</Text>
          </View>
        )}
      </ScrollView>

      {/* Counter-Offer Modal */}
      <CounterOfferModal
        visible={!!selectedRequest}
        proposedFare={selectedRequest?.proposedFare || 0}
        onSubmit={handleSubmitCounterOffer}
        onCancel={() => setSelectedRequest(null)}
      />

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>💡 Instructions:</Text>
        <Text style={styles.instructionsText}>
          • Accept: Accept ride at proposed fare{'\n'}
          • Counter-Offer: Propose a different fare{'\n'}
          • Reject: Dismiss the request locally
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2e7d32',
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
  reconnectText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  countContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  countText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
    lineHeight: 28,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  instructionsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});
