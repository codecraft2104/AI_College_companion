import { supabase } from "../lib/supabase";

export interface Notification {
  id?: string;
  user_id?: string;
  title: string;
  message: string;
  type?: string;
  is_read?: boolean;
  related_exam_id?: string;
  created_at?: string;
}

// ==========================================
// GET ALL NOTIFICATIONS
// ==========================================

export const getNotifications = async (): Promise<Notification[]> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

// ==========================================
// GET UNREAD COUNT
// ==========================================

export const getUnreadNotificationCount = async (): Promise<number> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from("notifications")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw error;
  }

  return count || 0;
};

// ==========================================
// CREATE NOTIFICATION
// ==========================================

export const createNotification = async (
  notification: Omit<
    Notification,
    "id" | "user_id" | "created_at"
  >
) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User not logged in");
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: user.id,
      title: notification.title,
      message: notification.message,
      type: notification.type || "general",
      is_read: false,
      related_exam_id:
        notification.related_exam_id || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// ==========================================
// MARK ONE AS READ
// ==========================================

export const markNotificationAsRead = async (
  id: string
) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User not logged in");
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================

export const markAllNotificationsAsRead = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return;
  }

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw error;
  }
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================

export const deleteNotification = async (
  id: string
) => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User not logged in");
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
};