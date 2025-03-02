// Chat.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  FlatList,
  TextInput,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import Gun from "gun";
import { encryptMessage, decryptMessage } from "./utils/encrypt";
import { styles } from "./styles/chat";
import { User } from "firebase/auth";
import { useAuth } from "./utils/auth";

export const HOME_URL = "http://localhost:8081";

const gun = Gun([HOME_URL + "/gun"]);

interface Message {
  key: string;
  text: string;
  sender: string;
  decryptedText?: string;
}
export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const { handleGoogleSignIn, handleSignOut, subscribeToAuthChanges } =
    useAuth();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const messagesRef = gun.get("chat-messages");
    messagesRef.map().on(async (data, key) => {
      if (data && data.text && data.sender) {
        try {
          const decryptedText = await decryptMessage(data.text);
          setMessages((prev) => {
            const exists = prev.find((msg) => msg.key === key);
            return exists
              ? prev
              : [
                  ...prev,
                  {
                    key,
                    text: data.text,
                    decryptedText,
                    sender: data.sender,
                  },
                ];
          });
        } catch (error) {
          console.error("Decryption failed:", error);
        }
      }
    });
  }, [user]);

  const sendMessage = async () => {
    if (input.trim() === "" || !user) return;

    try {
      const encrypted = await encryptMessage(input);
      console.log("Encrypted in sendMessage ", encrypted);
      if (encrypted) {
        gun.get("chat-messages").set({
          text: encrypted,
          sender: user.displayName,
        });
        setInput("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

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
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.userLabel}>Logged in as: {user.displayName}</Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.key}
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
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
