import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function PaymentScreen() {
  const router = useRouter();
  const [agreedFare] = useState(150); // AFN
  const commissionRate = 0.08; // 8%
  const commissionAmount = Math.round(agreedFare * commissionRate);

  const handleConfirmPayment = () => {
    Alert.alert(
      'Payment Received',
      `You received ${agreedFare} AFN.\n${commissionAmount} AFN has been deducted from your wallet.`,
      [{ text: 'OK', onPress: () => router.replace('/') }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ride Completed</Text>
        <Text style={styles.subtitle}>Please collect cash from rider.</Text>

        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Total Fare (Cash)</Text>
          <Text style={styles.amountValue}>{agreedFare} ؋</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.commissionRow}>
          <Text style={styles.commissionLabel}>Platform Commission (8%)</Text>
          <Text style={styles.commissionValue}>- {commissionAmount} ؋</Text>
        </View>

        <Text style={styles.walletNote}>
          This commission will be deducted from your HamRah Wallet.
        </Text>

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPayment}>
          <Text style={styles.confirmBtnText}>Confirm Cash Received</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 8, marginBottom: 30 },
  amountContainer: { alignItems: 'center', marginBottom: 20 },
  amountLabel: { fontSize: 14, color: '#888', marginBottom: 5 },
  amountValue: { fontSize: 48, fontWeight: 'bold', color: '#27AE60' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  commissionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  commissionLabel: { fontSize: 16, color: '#555' },
  commissionValue: { fontSize: 16, fontWeight: 'bold', color: '#E74C3C' },
  walletNote: { fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 30 },
  confirmBtn: { backgroundColor: '#D4AF37', padding: 18, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
