import { User, signInWithPopup, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";
import Gun, { IGunUserInstance } from "gun";
import { HOME_URL } from "../chat";
import "gun/sea";

// Initialize Gun with explicit options
const gun = Gun({
  peers: ["http://localhost:8081/gun"],
  localStorage: false,
  retry: 2500, // Wait longer between retries
  connect: true // Force connection attempt
});


// Set up better logging
const log = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || "");
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error || "");
  },
  success: (message: string, data?: any) => {
    console.log(`[SUCCESS] ${message}`, data || "");
  },
};

gun.get("users").put({ initialized: true });
gun.on("hi", (peer) => console.log("Connected to peer:", peer));
gun.on("bye", (peer) => console.log("Disconnected from peer:", peer));

export const useAuth = () => {
  const subscriptions: any[] = [];

  const handleGoogleSignIn = async (): Promise<User | null> => {
    try {
      log.info("Starting Google Sign-In process");
      const result = await signInWithPopup(auth, googleProvider);
      log.success("Google Sign-In Success", {
        uid: result.user.uid,
        email: result.user.email,
      });

      log.info("Directly storing user in GunDB", { uid: result.user.uid });
      storeUserDirectly(result.user);

      return result.user;
    } catch (error) {
      log.error("Google Sign-In Error", error);
      return null;
    }
  };

  function storeUserDirectly(userProfile: User): void {
    gun.get("users").once((data) => {
      console.log("All users data:", data);
    });

    const userData = {
      uid: userProfile.uid,
      email: userProfile.email,
      displayName: userProfile.displayName,
      photoURL: userProfile.photoURL,
      lastSeen: Date.now(),
    };

    log.info("Storing user data directly", userData);

    const userNode = gun.get("users").get(userProfile.uid);

    console.log("User node before update:", userNode);

    console.log("About to put user data");
    userNode.put(userData, (ack) => {
      console.log("Put callback received:", ack);
      if ("err" in ack) {
        log.error("Error storing user data", ack.err);
      } else {
        log.success("User data stored successfully");

        userNode.once((data) => {
          console.log("Retrieved user data after storage:", data);
        });
      }
    });

    tryCreateGunUser(userProfile);
  }

  function tryCreateGunUser(userProfile: User): void {
    log.info("Attempting to create Gun user", { uid: userProfile.uid });

    const securePassword = `${userProfile.uid}-${Date.now()}`;

    const user = gun.user();
    console.log("Gun user instance:", user);

    user.create(userProfile.uid, securePassword, (ack) => {
      console.log("User creation result:", ack);

      user.auth(userProfile.uid, securePassword, (authAck) => {
        console.log("Auth result:", authAck);
        if ("err" in authAck) {
          log.error("Non-fatal: Error authenticating with GunDB", authAck.err);
        } else {
          log.success("User authenticated with GunDB");

          if (user.is?.pub) {
            gun
              .get("users")
              .get(userProfile.uid)
              .get("gunPub")
              .put(user.is.pub);
          }
        }
      });
    });
  }

  const subscribeToUsers = (callback: (data: any, key: string) => void) => {
    log.info("Setting up subscription to users");
    console.log("Setting up users subscription");

    try {
      gun.get("users").once((data) => {
        console.log("Users graph data when subscribing:", data);
      });

      const subscription = gun
        .get("users")
        .map()
        .on((data, key) => {
          console.log("Map/on callback received:", { key, data });
          if (data) {
            log.info("User data changed", { key });
            callback(data, key);
          }
        });

      console.log("Subscription created:", subscription);

      subscriptions.push(subscription);
      return subscription;
    } catch (error) {
      console.error("Subscription error:", error);
      log.error("Error setting up user subscription", error);
      return null;
    }
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      log.info("Signing out user");

      for (const sub of subscriptions) {
        if (sub && typeof sub.off === "function") {
          try {
            sub.off();
          } catch (e) {
            log.error("Error unsubscribing", e);
          }
        }
      }

      try {
        const user = gun.user();
        if (user && user.is) {
          user.leave();
          log.info("Signed out from GunDB");
        }
      } catch (e) {
        log.error("Error signing out from GunDB", e);
      }

      await signOut(auth);
      log.success("Successfully signed out from Firebase");
    } catch (error) {
      log.error("Sign Out Error", error);
    }
  };

  const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    log.info("Setting up subscription to auth changes");
    return auth.onAuthStateChanged((user) => {
      log.info(
        "Auth state changed",
        user ? { uid: user.uid } : "User signed out"
      );
      callback(user);
    });
  };

  const getCurrentUserData = (
    uid: string,
    callback: (data: any) => void
  ): void => {
    log.info("Getting current user data", { uid });
    console.log("About to get user data for:", uid);

    let callbackFired = false;

    const timeoutId = setTimeout(() => {
      if (!callbackFired) {
        console.log("Once callback never fired, using timeout");
        callback(null);
      }
    }, 2000);

    gun
      .get("users")
      .get(uid)
      .once((data) => {
        console.log("Once callback fired with data:", data);
        callbackFired = true;
        clearTimeout(timeoutId);
        log.info("Retrieved current user data", data);
        callback(data);
      });
  };

  return {
    handleGoogleSignIn,
    handleSignOut,
    subscribeToAuthChanges,
    subscribeToUsers,
    getCurrentUserData,
  };
};
