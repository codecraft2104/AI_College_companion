import { supabase } from "../lib/supabase";

export interface Exam {
  id?: string;
  user_id?: string;
  subject: string;
  exam_date: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

/* =========================================
   GET ALL EXAMS
========================================= */

export const getExams = async (): Promise<Exam[]> => {
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
    .from("exams")
    .select("*")
    .eq("user_id", user.id)
    .order("exam_date", { ascending: true });

  if (error) {
    console.error("Error fetching exams:", error);
    throw error;
  }

  return data || [];
};


/* =========================================
   ADD EXAM
========================================= */

export const addExam = async (
  subject: string,
  examDate: string,
  description?: string
): Promise<Exam> => {
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
    .from("exams")
    .insert([
      {
        user_id: user.id,
        subject: subject.trim(),
        exam_date: examDate,
        description: description?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Error adding exam:", error);
    throw error;
  }

  return data;
};


/* =========================================
   UPDATE EXAM
========================================= */

export const updateExam = async (
  examId: string,
  subject: string,
  examDate: string,
  description?: string
): Promise<Exam> => {
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
    .from("exams")
    .update({
      subject: subject.trim(),
      exam_date: examDate,
      description: description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", examId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating exam:", error);
    throw error;
  }

  return data;
};


/* =========================================
   DELETE EXAM
========================================= */

export const deleteExam = async (
  examId: string
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
    .from("exams")
    .delete()
    .eq("id", examId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting exam:", error);
    throw error;
  }
};


/* =========================================
   COUNTDOWN CALCULATOR
========================================= */

export const getExamCountdown = (examDate: string) => {
  const now = new Date();
  const exam = new Date(examDate);

  const difference = exam.getTime() - now.getTime();

  // Exam has passed
  if (difference <= 0) {
    return {
      expired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(
    difference / 1000
  );

  const days = Math.floor(
    totalSeconds / (60 * 60 * 24)
  );

  const hours = Math.floor(
    (totalSeconds % (60 * 60 * 24)) /
      (60 * 60)
  );

  const minutes = Math.floor(
    (totalSeconds % (60 * 60)) / 60
  );

  const seconds =
    totalSeconds % 60;

  return {
    expired: false,
    days,
    hours,
    minutes,
    seconds,
  };
};