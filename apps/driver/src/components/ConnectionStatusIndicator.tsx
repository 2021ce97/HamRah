import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConnectionStatus } from '../hooks/useSocketConnection';

interface ConnectionStatusIndicatorProps {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  reconnectionAttempt: number;
  style?: any;
}

/**
 * ConnectionStatusIndicator Component
 * 
 * Displays the current Socket.IO connection status with visual indicators.
 * Shows connection state (connected/disconnected/reconnecting) and reconnection attempt count.
 * 
 * Requirements: 2.3, 2.5
 * - Displays connection status indicator to user
 * - Shows reconnection attempt count during reconnection
 */
export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  connectionStatus,
  isConnected,
  reconnectionAttempt,
  style,
}) => {
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#4caf50'; // Green
      case 'reconnecting':
        return '#ff9800'; // Orange
      case 'disconnected':
        return '#d32f2f'; // Red
      default:
        return '#9e9e9e'; // Gray
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusBadge}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>
      {connectionStatus === 'reconnecting' && reconnectionAttempt > 0 && (
        <Text style={styles.reconnectText}>
          Attempt {reconnectionAttempt}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
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
});
