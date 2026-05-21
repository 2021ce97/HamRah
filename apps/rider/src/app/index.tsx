import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeMapScreen() {
  const router = useRouter();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [proposedFare, setProposedFare] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleRequestRide = () => {
    if (!pickup || !destination || !proposedFare) {
      Alert.alert('Missing Information', 'Please fill all fields');
      return;
    }
    
    setIsSearching(true);
    // In reality, this would emit a Socket.IO event to the backend
    setTimeout(() => {
      Alert.alert('Success', `Request sent! Looking for drivers near ${pickup} willing to go to ${destination} for ${proposedFare} AFN.`);
      setIsSearching(false);
    }, 2000);
  };

  return (
    <View style={styles.container}>
      {/* MAP PLACEHOLDER */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>🗺️</Text>
        <Text style={styles.mapLabel}>Kabul, Afghanistan</Text>
        <Text style={styles.mapSubLabel}>Map will load here</Text>
      </View>

      {/* RIDE PROPOSAL BOTTOM SHEET */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.bottomSheet}
      >
        <ScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Where to, HamRah?</Text>
          
          <View style={styles.inputGroup}>
            <View style={[styles.dot, { backgroundColor: '#D4AF37' }]} />
            <TextInput
              style={styles.input}
              placeholder="Pickup Landmark (e.g. Pul-e-Sorkh Square)"
              value={pickup}
              onChangeText={setPickup}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.dot, { backgroundColor: '#E74C3C' }]} />
            <TextInput
              style={styles.input}
              placeholder="Destination Landmark (e.g. Shar-e-Naw Park)"
              value={destination}
              onChangeText={setDestination}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Propose Fare (AFN)</Text>
            <View style={styles.fareInputWrapper}>
              <Text style={styles.currencySymbol}>؋</Text>
              <TextInput
                style={styles.fareInput}
                placeholder="0"
                keyboardType="number-pad"
                value={proposedFare}
                onChangeText={setProposedFare}
              />
            </View>
            <Text style={styles.suggestedFare}>Suggested: 120 - 160 AFN</Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, isSearching && styles.buttonDisabled]} 
            onPress={handleRequestRide}
            disabled={isSearching}
          >
            <Text style={styles.buttonText}>
              {isSearching ? 'Finding Drivers...' : 'Request Ride'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F5E9',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    maxHeight: '60%',
  },
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  fareContainer: {
    marginTop: 10,
    marginBottom: 24,
  },
  fareLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  fareInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#D4AF37',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginRight: 8,
  },
  fareInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  suggestedFare: {
    fontSize: 12,
    color: '#27AE60',
    marginTop: 6,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
