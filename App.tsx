import React, { useState, useEffect, useRef } from 'react';
import {
  FlatList,
  TextInput,
  Button,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Gun from 'gun';

const HOME_URL = 'http://localhost:3000';

const gun = Gun([HOME_URL + '/gun']); // Connect to GunDB

// Simulating two users (User A and User B)
const USER_A = 'userA';
const USER_B = 'userB';

const encryptMessgae = async (message: string) => {
  try {
    console.log('Encrypting message:', message);
    const res = await fetch(HOME_URL + '/encrypt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.encryptedRSA;
    }
  } catch (error) {
    console.error(error);
  }
};

export default function App() {
  const [messages, setMessages] = useState<
    { key: string; text: string; sender: string }[]
  >([]);
  const [input, setInput] = useState('');
  const [currentUser, setCurrentUser] = useState(USER_A); // Toggle between User A & User B
  const flatListRef = useRef<FlatList>(null); // For auto-scrolling

  useEffect(() => {
    const messagesRef = gun.get('chat-messages');

    messagesRef.map().on(async (data, key) => {
      const encryptedMessage = await encryptMessgae(data.text);

      if (data && data.text && data.sender) {
        setMessages(prevMessages => {
          const exists = prevMessages.find(msg => msg.key === key);
          if (!exists) {
            return [
              ...prevMessages,
              { key, text: encryptedMessage, sender: data.sender },
            ];
          }
          return prevMessages;
        });
      }
    });
  }, []);

  const sendMessage = () => {
    if (input.trim() === '') return;

    gun.get('chat-messages').set({
      text: input,
      sender: currentUser,
    });

    setInput('');
  };

  // Toggle between User A & User B (simulating two users)
  const switchUser = () => {
    setCurrentUser(prevUser => (prevUser === USER_A ? USER_B : USER_A));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>💬 GunDB Chat</Text>
      <Text style={styles.userLabel}>
        Current User: {currentUser === USER_A ? 'User A (🔵)' : 'User B (🟢)'}
      </Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.key}
        renderItem={({ item }) => {
          const isCurrentUser = item.sender === currentUser;

          return (
            <View
              style={[
                styles.messageBubble,
                isCurrentUser ? styles.senderBubble : styles.receiverBubble,
              ]}
            >
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          );
        }}
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
        <Button
          title="Send"
          onPress={sendMessage}
        />
      </View>

      <Button
        title="Switch User"
        onPress={switchUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 10,
    justifyContent: 'space-between',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  userLabel: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
    maxWidth: '75%',
  },
  senderBubble: {
    backgroundColor: '#2196F3',
    alignSelf: 'flex-end',
  },
  receiverBubble: {
    backgroundColor: '#4CAF50',
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
  },
});
