import { listenForForegroundMessages } from "./firebaseNotificationService";
import { registerFCMToken } from "./fcmService";

export const initializeFirebaseNotifications =
  async () => {
    try {
      const registration = await registerFCMToken();
      if (registration.status !== "registered") {
        return () => undefined;
      }

      const unsubscribe = await listenForForegroundMessages((payload) => {
        const title = payload.notification?.title || "AI College Companion";
        const body = payload.notification?.body || "You have a new notification.";

        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(title, {
            body,
            icon: "/favicon.ico",
            data: payload.data,
          });
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error(
        "❌ Firebase notification manager error:",
        error
      );

      return () => undefined;
    }
  };