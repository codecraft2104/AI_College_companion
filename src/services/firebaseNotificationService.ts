import {
  getToken,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";

import { getFirebaseMessaging } from "../firebase";

const VAPID_KEY =
  import.meta.env.VITE_FIREBASE_VAPID_KEY;

export type NotificationRegistrationResult =
  | { status: "registered"; token: string }
  | { status: "denied" | "unsupported" | "unconfigured" | "unavailable" };

export const requestNotificationPermission =
  async (): Promise<NotificationRegistrationResult> => {
    try {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator)
      ) {
        console.warn(
          "❌ This browser does not support notifications."
        );

        return { status: "unsupported" };
      }

      if (!VAPID_KEY) {
        console.error(
          "❌ VITE_FIREBASE_VAPID_KEY is missing."
        );

        return { status: "unconfigured" };
      }

      const messaging =
        await getFirebaseMessaging();

      if (!messaging) {
        return { status: "unsupported" };
      }

      let permission =
        Notification.permission;

      if (permission === "default") {
        permission =
          await Notification.requestPermission();
      }

      if (permission !== "granted") {
        return { status: "denied" };
      }

      const registration =
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );

      const token = await getToken(
        messaging,
        {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration:
            registration,
        }
      );

      if (!token) {
        console.warn(
          "⚠️ Firebase did not return an FCM token."
        );

        return { status: "unavailable" };
      }

      return { status: "registered", token };
    } catch (error) {
      console.error(
        "❌ FCM initialization error:",
        error
      );

      return { status: "unavailable" };
    }
  };

export const listenForForegroundMessages =
  async (
    callback: (payload: MessagePayload) => void
  ) => {
    try {
      const messaging =
        await getFirebaseMessaging();

      if (!messaging) {
        return () => {};
      }

      return onMessage(
        messaging,
        (payload) => {
          callback(payload);
        }
      );
    } catch (error) {
      console.error(
        "❌ Foreground FCM listener error:",
        error
      );

      return () => {};
    }
  };