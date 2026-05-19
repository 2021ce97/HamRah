import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleRequestOtp = async () => {
    if (!phoneNumber) return Alert.alert('Error', 'Please enter your phone number');
    try {
      const response = await fetch('http://localhost:5000/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('OTP Sent', `Mock OTP: ${data.mockOtp}`);
        setStep(2);
      } else {
        Alert.alert('Error', data.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Make sure backend is running.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return Alert.alert('Error', 'Please enter the OTP');
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Logged in successfully!');
        // Here you would save the JWT token (e.g., SecureStore)
        // router.replace('/'); // Navigate to main app
      } else {
        Alert.alert('Error', data.error || 'Invalid OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HamRah</Text>
      <Text style={styles.subtitle}>Companion for every journey</Text>

      {step === 1 ? (
        <View style={styles.form}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="07XX XXX XXX"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
          <TouchableOpacity style={styles.button} onPress={handleRequestOtp}>
            <Text style={styles.buttonText}>Send OTP</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Enter OTP</Text>
          <TextInput
            style={styles.input}
            placeholder="4-digit code"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={4}
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
            <Text style={styles.buttonText}>Verify & Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#D4AF37', // Gold color
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#D4AF37',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
