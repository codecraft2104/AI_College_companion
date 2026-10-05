import {
  requestNotificationPermission,
  type NotificationRegistrationResult,
} from "./firebaseNotificationService";
import { saveFCMToken } from "./fcmTokenService";

export const registerFCMToken =
  async (): Promise<NotificationRegistrationResult> => {
    try {
      const result = await requestNotificationPermission();
      if (result.status !== "registered") return result;

      if (!(await saveFCMToken(result.token))) {
        return { status: "unavailable" };
      }

      return result;
    } catch (error) {
      console.error("FCM registration error:", error);
      return { status: "unavailable" };
    }
  };
