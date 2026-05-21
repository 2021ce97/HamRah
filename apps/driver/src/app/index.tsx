import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, FlatList, TouchableOpacity, Alert } from 'react-native';

const MOCK_REQUESTS = [
  { id: '1', pickup: 'Pul-e-Sorkh Square', destination: 'Shar-e-Naw Park', proposedFare: 150, distance: '3.2 km' },
  { id: '2', pickup: 'Kabul University', destination: 'Kota-e-Sangi', proposedFare: 80, distance: '1.5 km' },
];

export default function DriverHomeScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [requests, setRequests] = useState(MOCK_REQUESTS);

  const toggleSwitch = () => setIsOnline(previousState => !previousState);

  const handleAccept = (id) => {
    Alert.alert('Ride Accepted', 'Navigating to pickup location...');
    setRequests(requests.filter(r => r.id !== id));
  };

  const handleCounter = (id) => {
    Alert.prompt('Counter Offer', 'Enter your counter fare (AFN):', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send', onPress: (val) => Alert.alert('Sent', `Counter offer of ${val} AFN sent to rider.`) }
    ]);
  };

  const handleReject = (id) => {
    setRequests(requests.filter(r => r.id !== id));
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.routeText}>{item.pickup} ➡️ {item.destination}</Text>
        <Text style={styles.distanceText}>{item.distance}</Text>
      </View>
      <View style={styles.fareContainer}>
        <Text style={styles.fareText}>Proposed: {item.proposedFare} ؋</Text>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={() => handleReject(item.id)}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnCounter]} onPress={() => handleCounter(item.id)}>
          <Text style={styles.btnText}>Counter</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.btnAccept]} onPress={() => handleAccept(item.id)}>
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HamRah Driver</Text>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          <Switch
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isOnline ? '#D4AF37' : '#f4f3f4'}
            onValueChange={toggleSwitch}
            value={isOnline}
          />
        </View>
      </View>

      {/* MAP PLACEHOLDER */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🚗</Text>
        <Text style={styles.mapLabel}>Driver Location</Text>
        <Text style={styles.mapSubLabel}>Kabul, Afghanistan</Text>
      </View>

      <View style={styles.bottomSheet}>
        <Text style={styles.sectionTitle}>
          {isOnline ? 'Nearby Ride Requests' : 'Go Online to receive rides'}
        </Text>

        {isOnline ? (
          <FlatList
            data={requests}
            keyExtractor={item => item.id}
            renderItem={renderRequest}
            ListEmptyComponent={<Text style={styles.emptyText}>Looking for rides...</Text>}
          />
        ) : (
          <View style={styles.offlineContainer}>
            <Text style={styles.offlineText}>You are currently offline.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleLabel: {
    marginRight: 10,
    fontWeight: 'bold',
    color: '#666',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    fontSize: 80,
    marginBottom: 16,
  },
  mapLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  mapSubLabel: {
    fontSize: 16,
    color: '#666',
  },
  bottomSheet: {
    height: '45%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  requestCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  routeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  distanceText: {
    fontSize: 14,
    color: '#666',
  },
  fareContainer: {
    marginBottom: 15,
  },
  fareText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  btnReject: {
    backgroundColor: '#E74C3C',
  },
  btnCounter: {
    backgroundColor: '#F39C12',
  },
  btnAccept: {
    backgroundColor: '#27AE60',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 16,
    color: '#999',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
  }
});
