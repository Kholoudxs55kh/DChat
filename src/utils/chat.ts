import { User } from "firebase/auth";
import Gun, { IGunUserInstance, SEA } from "gun";
import { HOME_URL } from "../chat";

const gun = Gun({
  peers: [{ HOME_URL } + "/gun"],
  localStorage: false,
});

export const useChat = () => {
  const setUpSecureChat = async (user: User) => {
    const pair = await SEA.pair();
    gun.get("users").get(user.uid).get("publicKey").put(pair.pub);

    const encryptedPrivateKey = await SEA.encrypt(pair.priv, user.uid);
    gun.user().get("privateKeys").get(user.uid).put(encryptedPrivateKey);

    return pair;
  };

  const getPublicKey = async (uid: string) => {
    return gun.get("users").get(uid).get("publicKey");
  };

  const createChatRoom = async (roomId: string, participants: User[]) => {
    gun.get("chatRooms").get(roomId).put({
      created: Date.now(),
      participants: participants,
      lastActivity: Date.now(),
    });
  };

  const sendMessage = async (
    roomId: string,
    message: string,
    currentUser: User
  ) => {
    const messageData = {
      sender: currentUser.uid,
      text: message,
      timestamp: Date.now(),
      id: generateUniqueId(),
    };

    gun
      .get("chatRooms")
      .get(roomId)
      .get("messages")
      .get(messageData.id)
      .put(messageData);
  };

  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

  return { setUpSecureChat, getPublicKey, sendMessage, createChatRoom };
};
