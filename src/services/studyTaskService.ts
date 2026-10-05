import { supabase } from "../lib/supabase";

export interface StudyTask {
  id?: string;
  user_id?: string;
  subject: string;
  title: string;
  description?: string;
  study_date: string;
  study_time?: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  created_at?: string;
  updated_at?: string;
}

/* =========================================
   GET ALL STUDY TASKS
========================================= */

export const getStudyTasks = async (): Promise<StudyTask[]> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in");
  }

  const { data, error } = await supabase
    .from("study_tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("study_date", { ascending: true })
    .order("study_time", { ascending: true });

  if (error) {
    console.error("Error fetching study tasks:", error);
    throw error;
  }

  return data || [];
};


/* =========================================
   ADD STUDY TASK
========================================= */

export const addStudyTask = async (
  subject: string,
  title: string,
  description: string,
  studyDate: string,
  studyTime: string,
  priority: "low" | "medium" | "high"
): Promise<StudyTask> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in");
  }

  const { data, error } = await supabase
    .from("study_tasks")
    .insert([
      {
        user_id: user.id,
        subject: subject.trim(),
        title: title.trim(),
        description: description.trim() || null,
        study_date: studyDate,
        study_time: studyTime || null,
        priority,
        completed: false,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding study task:", error);
    throw error;
  }

  return data;
};


/* =========================================
   UPDATE STUDY TASK
========================================= */

export const updateStudyTask = async (
  taskId: string,
  subject: string,
  title: string,
  description: string,
  studyDate: string,
  studyTime: string,
  priority: "low" | "medium" | "high",
  completed: boolean
): Promise<StudyTask> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in");
  }

  const { data, error } = await supabase
    .from("study_tasks")
    .update({
      subject: subject.trim(),
      title: title.trim(),
      description: description.trim() || null,
      study_date: studyDate,
      study_time: studyTime || null,
      priority,
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating study task:", error);
    throw error;
  }

  return data;
};


/* =========================================
   TOGGLE COMPLETED
========================================= */

export const toggleStudyTask = async (
  taskId: string,
  completed: boolean
): Promise<StudyTask> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in");
  }

  const { data, error } = await supabase
    .from("study_tasks")
    .update({
      completed,
      updated_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating task status:", error);
    throw error;
  }

  return data;
};


/* =========================================
   DELETE STUDY TASK
========================================= */

export const deleteStudyTask = async (
  taskId: string
): Promise<void> => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User is not logged in");
  }

  const { error } = await supabase
    .from("study_tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting study task:", error);
    throw error;
  }
};