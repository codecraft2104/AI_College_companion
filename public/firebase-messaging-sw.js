importScripts(
  "https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyA-NQ6Oq5CBY64H7_tDVohnk6Ov_7b-f1U",
  authDomain: "ai-college-companion-9d853.firebaseapp.com",
  projectId: "ai-college-companion-9d853",
  storageBucket: "ai-college-companion-9d853.firebasestorage.app",
  messagingSenderId: "765334403102",
  appId: "1:765334403102:web:a04f053a1e4b30a820d60f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    payload.notification?.title || "AI College Companion";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      "You have a new notification.",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: payload.data || {},
  };

  self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const requestedUrl = event.notification?.data?.url;
  const targetUrl =
    typeof requestedUrl === "string" &&
    requestedUrl.startsWith("/")
      ? requestedUrl
      : "/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true,
    }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});