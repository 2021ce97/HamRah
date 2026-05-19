import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';

export default function ChatScreen() {
  const [messages, setMessages] = useState([
    { id: '1', text: 'Salam, I am waiting near the red building.', sender: 'rider', time: '10:00 AM' },
    { id: '2', text: 'Waleikum Salam, I see you. Coming in 1 minute.', sender: 'driver', time: '10:01 AM' },
  ]);
  const [inputText, setInputText] = useState('');

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const newMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'rider', // or driver depending on the app
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMessage]);
    setInputText('');
    // In reality, emit via Socket.IO
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === 'rider';
    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat with Driver</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    padding: 20, paddingTop: 50, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  chatContainer: { padding: 15 },
  messageBubble: {
    maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end', backgroundColor: '#D4AF37',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start', backgroundColor: '#fff',
    borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#eee',
  },
  messageText: { fontSize: 16 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#333' },
  timeText: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 4 },
  inputContainer: {
    flexDirection: 'row', padding: 10, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center',
  },
  input: {
    flex: 1, backgroundColor: '#f9f9f9', borderRadius: 20,
    paddingHorizontal: 15, paddingVertical: 10, fontSize: 16,
  },
  sendButton: {
    marginLeft: 10, backgroundColor: '#D4AF37', borderRadius: 20,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});
