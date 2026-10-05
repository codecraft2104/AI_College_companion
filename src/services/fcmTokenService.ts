import { supabase } from "../lib/supabase";

export const saveFCMToken = async (
  token: string
): Promise<boolean> => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      console.warn(
        "⚠️ Cannot save FCM token: no authenticated user."
      );

      return false;
    }

    if (!token.trim()) {
      console.warn("⚠️ Empty FCM token.");
      return false;
    }

    const { error } = await supabase
      .from("fcm_tokens")
      .upsert(
        {
          user_id: user.id,
          token,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,token",
        }
      );

    if (error) {
      console.error(
        "Supabase FCM token error:",
        error
      );

      throw error;
    }

    return true;
  } catch (error) {
    console.error(
      "❌ Failed to save FCM token:",
      error
    );

    return false;
  }
};

export const deleteFCMToken = async (
  token: string
) => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("fcm_tokens")
      .delete()
      .eq("user_id", user.id)
      .eq("token", token);

    if (error) {
      throw error;
    }

  } catch (error) {
    console.error(
      "Failed to delete FCM token:",
      error
    );
  }
};