import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';

export default function ActiveRideScreen() {
  const router = useRouter();
  
  // Mock Driver Data
  const driver = {
    name: 'Ahmad Farid',
    vehicle: 'Toyota Corolla 2012',
    color: 'White',
    plate: 'KBL 12345',
    rating: 4.8,
  };

  const handleCall = () => {
    Alert.alert('Calling Driver', `Dialing ${driver.name}...`);
  };

  const handleChat = () => {
    router.push('/chat');
  };

  const handleSOS = () => {
    Alert.alert(
      'EMERGENCY SOS',
      'Are you sure you want to trigger an SOS? This will alert the local authorities and HamRah safety team immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'TRIGGER SOS', style: 'destructive', onPress: () => Alert.alert('SOS Triggered', 'Safety team has been notified.') }
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Ride?',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', onPress: () => router.replace('/') }
      ]
    );
  };

  const isRTL = I18nManager.isRTL;

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <View style={styles.mapPlaceholder}>
        <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
          <Text style={styles.sosButtonText}>SOS</Text>
        </TouchableOpacity>
        
        <Text style={styles.mapText}>🗺️ Live Map Tracking</Text>
        <Text style={styles.etaText}>Driver arriving in 4 mins</Text>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.driverInfoContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{driver.name.charAt(0)}</Text>
          </View>
          <View style={styles.driverDetails}>
            <Text style={styles.driverName}>{driver.name} ⭐ {driver.rating}</Text>
            <Text style={styles.vehicleText}>{driver.color} {driver.vehicle}</Text>
            <Text style={styles.plateText}>{driver.plate}</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.btnCall]} onPress={handleCall}>
            <Text style={styles.actionBtnText}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnChat]} onPress={handleChat}>
            <Text style={styles.actionBtnText}>💬 Chat</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sosButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#E74C3C',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  sosButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapText: { fontSize: 24, color: '#888', fontWeight: 'bold' },
  etaText: { fontSize: 18, color: '#27AE60', marginTop: 10, fontWeight: 'bold' },
  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  driverInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#D4AF37',
    alignItems: 'center', justifyContent: 'center', marginRight: 15,
  },
  avatarText: { fontSize: 24, color: '#fff', fontWeight: 'bold' },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  vehicleText: { fontSize: 14, color: '#666', marginTop: 2 },
  plateText: { fontSize: 14, fontWeight: 'bold', color: '#555', marginTop: 2 },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5,
  },
  btnCall: { backgroundColor: '#27AE60' },
  btnChat: { backgroundColor: '#3498DB' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelBtn: {
    padding: 15, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E74C3C',
  },
  cancelBtnText: { color: '#E74C3C', fontSize: 16, fontWeight: 'bold' },
});
