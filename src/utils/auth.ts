import { User, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export const useAuth = () => {
  const handleGoogleSignIn = async (): Promise<User | null> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Google Sign-In Success:", result.user);
      return result.user;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      return null;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return auth.onAuthStateChanged(callback);
  };

  return {
    handleGoogleSignIn,
    handleSignOut,
    subscribeToAuthChanges,
  };
};
