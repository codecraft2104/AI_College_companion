import { listenForForegroundMessages } from "./firebaseNotificationService";
import { registerFCMToken } from "./fcmService";

// Get the base URL for assets, accounting for GitHub Pages subpath
const getAssetBase = () => {
  if (import.meta.env.PROD) {
    return '/AI_College_companion/';
  }
  return '/';
};

export const initializeFirebaseNotifications =
  async () => {
    try {
      const registration = await registerFCMToken();
      if (registration.status !== "registered") {
        return () => undefined;
      }

      const assetBase = getAssetBase();

      const unsubscribe = await listenForForegroundMessages((payload) => {
        const title = payload.notification?.title || "AI College Companion";
        const body = payload.notification?.body || "You have a new notification.";

        if (
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification(title, {
            body,
            icon: `${assetBase}favicon.ico`,
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
