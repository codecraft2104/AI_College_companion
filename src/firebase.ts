import { initializeApp } from "firebase/app";
import {
  getMessaging,
  isSupported,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
];

export const isFirebaseConfigured = requiredConfig.every(
  (value): value is string => Boolean(value)
);

export const firebaseApp = isFirebaseConfigured
  ? initializeApp(firebaseConfig)
  : null;

export const getFirebaseMessaging =
  async () => {
    if (!firebaseApp || typeof window === "undefined") {
      return null;
    }

    let supported: boolean;
    try {
      supported = await isSupported();
    } catch (error) {
      console.error("Unable to check Firebase Messaging support:", error);
      return null;
    }

    if (!supported) {
      console.warn(
        "Firebase Messaging is not supported in this browser."
      );

      return null;
    }

    try {
      return getMessaging(firebaseApp);
    } catch (error) {
      console.error("Unable to initialize Firebase Messaging:", error);
      return null;
    }
  };