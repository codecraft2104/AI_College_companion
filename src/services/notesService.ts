import { supabase } from "../lib/supabase";

export interface Note {
  id?: string;
  user_id?: string;
  title: string;
  content: string;
  subject: string;
  created_at?: string;
  updated_at?: string;
}

// Get user's notes
export async function getNotes() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  const {
    data,
    error,
  } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data as Note[];
}

// Add note
export async function addNote(
  title: string,
  content: string,
  subject: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  const {
    data,
    error,
  } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title,
      content,
      subject,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Note;
}

// Update note
export async function updateNote(
  id: string,
  title: string,
  content: string,
  subject: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  const {
    data,
    error,
  } = await supabase
    .from("notes")
    .update({
      title,
      content,
      subject,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Note;
}

// Delete note
export async function deleteNote(
  id: string
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not logged in");
  }

  const {
    error,
  } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}