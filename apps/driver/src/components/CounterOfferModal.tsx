import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';

interface CounterOfferModalProps {
  visible: boolean;
  proposedFare: number;
  onSubmit: (amount: number) => Promise<void>;
  onCancel: () => void;
}

export const CounterOfferModal: React.FC<CounterOfferModalProps> = ({
  visible,
  proposedFare,
  onSubmit,
  onCancel
}) => {
  const [counterAmount, setCounterAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setCounterAmount('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  const validateAmount = (amount: string): boolean => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      setError('Please enter a valid number');
      return false;
    }
    
    if (numAmount <= 0) {
      setError('Counter-offer must be greater than 0');
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateAmount(counterAmount)) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const amount = parseFloat(counterAmount);
      await onSubmit(amount);

      // Show success message
      Alert.alert(
        'Success',
        `Counter-offer of ${amount.toLocaleString()} AFN submitted successfully!`,
        [{ text: 'OK', onPress: onCancel }]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit counter-offer';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onCancel();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />
        
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <Text style={styles.title}>Counter-Offer</Text>
            
            {/* Proposed Fare Info */}
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Rider's Proposed Fare:</Text>
              <Text style={styles.infoValue}>{proposedFare.toLocaleString()} AFN</Text>
            </View>

            {/* Input Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Your Counter-Offer (AFN):</Text>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                value={counterAmount}
                onChangeText={setCounterAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                editable={!isSubmitting}
                autoFocus
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {/* Helper Text */}
            <Text style={styles.helperText}>
              You can submit multiple counter-offers for the same ride request.
            </Text>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
                disabled={isSubmitting || !counterAmount}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'transparent',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1976d2',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
