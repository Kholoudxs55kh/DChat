// Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  TextInput,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import Gun from 'gun';
import { styles } from './styles/chat';
import { User } from 'firebase/auth';
import { useAuth } from './utils/auth';

export const HOME_URL = 'http://localhost:3000';

const gun = Gun([HOME_URL + '/gun']);

interface Message {
  key: string;
  text: string;
  sender: string;
  decryptedText?: string;
}
export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { handleGoogleSignIn, handleSignOut, subscribeToAuthChanges } =
    useAuth();

  if (!user) {
    return (
      <View style={styles.authContainer}>
        <Text style={styles.title}>Welcome to DChat</Text>
        <Text style={styles.subtitle}>Secure Decentralized Messaging App</Text>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleSignIn}
        >
          <Text style={styles.googleButtonText}>Sign In with Google</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>💬 DChat</Text>
        <TouchableOpacity
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.userLabel}>Logged in as: {user.displayName}</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.key}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === user.email
                ? styles.senderBubble
                : styles.receiverBubble,
            ]}
          >
            <Text style={styles.messageText}>
              {item.decryptedText || item.text}
            </Text>
            <Text style={styles.senderText}>{item.sender}</Text>
          </View>
        )}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
