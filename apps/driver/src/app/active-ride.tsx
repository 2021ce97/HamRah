import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';

export default function DriverActiveRideScreen() {
  const router = useRouter();

  const handleFinishRide = () => {
    // In reality, this updates the ride status in the backend
    router.push('/payment');
  };

  const handleChat = () => {
    Alert.alert('Chat', 'Opening Chat Interface...');
  };

  const handleSOS = () => {
    Alert.alert(
      'EMERGENCY SOS',
      'Are you sure you want to trigger an SOS? This will alert authorities immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'TRIGGER SOS', style: 'destructive', onPress: () => Alert.alert('SOS Triggered', 'Safety team notified.') }
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
        
        <Text style={styles.mapText}>🗺️ Mapbox Navigation</Text>
        <Text style={styles.navText}>Turn right on Darulaman Road</Text>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.riderInfo}>
          <Text style={styles.riderName}>Rider: Mustafa (⭐ 4.9)</Text>
          <Text style={styles.destinationText}>To: Shar-e-Naw Park</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.btnChat]} onPress={handleChat}>
            <Text style={styles.actionBtnText}>💬 Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.btnNavigate]}>
            <Text style={styles.actionBtnText}>🧭 Navigate</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.finishBtn} onPress={handleFinishRide}>
          <Text style={styles.finishBtnText}>Finish Ride & Collect Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  mapPlaceholder: {
    flex: 1, backgroundColor: '#e0e0e0', alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  sosButton: {
    position: 'absolute', top: 50, right: 20, backgroundColor: '#E74C3C',
    width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8,
  },
  sosButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  mapText: { fontSize: 24, color: '#888', fontWeight: 'bold' },
  navText: { fontSize: 18, color: '#3498DB', marginTop: 10, fontWeight: 'bold' },
  bottomSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  riderInfo: { marginBottom: 20 },
  riderName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  destinationText: { fontSize: 16, color: '#666', marginTop: 5 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  actionBtn: { flex: 1, padding: 15, borderRadius: 12, alignItems: 'center', marginHorizontal: 5 },
  btnChat: { backgroundColor: '#3498DB' },
  btnNavigate: { backgroundColor: '#9B59B6' },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  finishBtn: { backgroundColor: '#27AE60', padding: 18, borderRadius: 12, alignItems: 'center' },
  finishBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
