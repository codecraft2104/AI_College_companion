import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  X,
} from "lucide-react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  type Notification,
} from "../services/notificationService";
import { useAuth } from "../context/AuthContext";


const NotificationBell = () => {
  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [count, setCount] = useState(0);

  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    try {
      console.log("🔔 Loading notifications...");

      const data = await getNotifications();

      const unread =
        await getUnreadNotificationCount();

      setNotifications(data);
      setCount(unread);

      console.log("✅ Notifications:", data);
      console.log("🔴 Unread notifications:", unread);
    } catch (error) {
      console.error(
        "❌ Notification loading error:",
        error
      );
    }
  };

  useEffect(() => {
    if (!user) return;

    const initialLoad = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const interval = setInterval(
      () => void loadNotifications(),
      60000
    );

    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  if (!user) return null;

  const handleMarkRead = async (
    notification: Notification
  ) => {
    if (!notification.id) return;

    try {
      await markNotificationAsRead(notification.id);

      await loadNotifications();
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  const handleDelete = async (
    notification: Notification
  ) => {
    if (!notification.id) return;

    try {
      await deleteNotification(notification.id);

      await loadNotifications();
    } catch (error) {
      console.error(
        "Failed to delete notification:",
        error
      );
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();

      await loadNotifications();
    } catch (error) {
      console.error(
        "Failed to mark all notifications:",
        error
      );
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-slate-100"
      >
        <Bell className="h-5 w-5 text-slate-700" />

        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div>
              <h3 className="font-semibold text-slate-800">
                Notifications
              </h3>

              <p className="text-xs text-slate-500">
                {count} unread
              </p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {notifications.length > 0 && (
            <div className="flex justify-end border-b px-4 py-2">
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-slate-300" />

                <p className="font-medium text-slate-600">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  You're all caught up.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b px-4 py-4 ${
                    notification.is_read
                      ? "bg-white"
                      : "bg-blue-50/60"
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      <span className="text-lg">
                        {notification.type === "exam"
                          ? "📚"
                          : "🔔"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-800">
                          {notification.title}
                        </h4>

                        {!notification.is_read && (
                          <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {notification.message}
                      </p>

                      {notification.created_at && (
                        <p className="mt-2 text-xs text-slate-400">
                          {new Date(
                            notification.created_at
                          ).toLocaleString()}
                        </p>
                      )}

                      <div className="mt-3 flex gap-3">
                        {!notification.is_read && (
                          <button
                            onClick={() =>
                              handleMarkRead(
                                notification
                              )
                            }
                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Mark as read
                          </button>
                        )}

                        <button
                          onClick={() =>
                            handleDelete(notification)
                          }
                          className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;