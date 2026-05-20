import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RideRequest } from '../hooks/useDriverRequests';
import { formatCurrency, formatRating, formatDistance, formatLocation } from '../utils/formatters';

interface RideRequestCardProps {
  request: RideRequest;
  onAccept: (requestId: string, proposedFare: number) => Promise<void>;
  onCounterOffer: (requestId: string) => void;
  onReject: (requestId: string) => void;
  isSubmitting?: boolean;
}

export const RideRequestCard: React.FC<RideRequestCardProps> = ({
  request,
  onAccept,
  onCounterOffer,
  onReject,
  isSubmitting = false
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      await onAccept(request.requestId, request.proposedFare);
    } catch (error) {
      console.error('Failed to accept ride:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCounterOffer = () => {
    onCounterOffer(request.requestId);
  };

  const handleReject = () => {
    onReject(request.requestId);
  };

  return (
    <View style={styles.card}>
      {/* Header: Rider Info */}
      <View style={styles.header}>
        <Text style={styles.riderName}>{request.riderName}</Text>
        <Text style={styles.rating}>{formatRating(request.riderRating)}</Text>
      </View>

      {/* Pickup Location */}
      <View style={styles.locationRow}>
        <Text style={styles.locationLabel}>📍 Pickup:</Text>
        <Text style={styles.locationValue}>{formatLocation(request.pickup)}</Text>
      </View>

      {/* Destination Location */}
      <View style={styles.locationRow}>
        <Text style={styles.locationLabel}>🎯 Destination:</Text>
        <Text style={styles.locationValue}>{formatLocation(request.destination)}</Text>
      </View>

      {/* Distance */}
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Distance:</Text>
        <Text style={styles.infoValue}>{formatDistance(request.estimatedDistance)}</Text>
      </View>

      {/* Proposed Fare */}
      <View style={styles.fareRow}>
        <Text style={styles.fareLabel}>Proposed Fare:</Text>
        <Text style={styles.fareValue}>{formatCurrency(request.proposedFare)}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        {/* Accept Button */}
        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={handleAccept}
          disabled={isSubmitting || isAccepting}
        >
          {isAccepting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept</Text>
          )}
        </TouchableOpacity>

        {/* Counter-Offer Button */}
        <TouchableOpacity
          style={[styles.button, styles.counterButton]}
          onPress={handleCounterOffer}
          disabled={isSubmitting || isAccepting}
        >
          <Text style={styles.counterButtonText}>Counter-Offer</Text>
        </TouchableOpacity>

        {/* Reject Button */}
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={handleReject}
          disabled={isSubmitting || isAccepting}
        >
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  riderName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  rating: {
    fontSize: 14,
    color: '#666',
  },
  locationRow: {
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    marginLeft: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  fareLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fareValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  acceptButton: {
    backgroundColor: '#2e7d32',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  counterButton: {
    backgroundColor: '#1976d2',
  },
  counterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#d32f2f',
  },
  rejectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
