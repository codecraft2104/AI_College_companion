import { supabase } from "../lib/supabase";

export interface MCQAttempt {
  id?: string;
  user_id: string;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  created_at?: string;
}

// =========================================
// SAVE MCQ ATTEMPT
// =========================================

export const saveMCQAttempt = async ({
  subject,
  topic,
  difficulty,
  totalQuestions,
  correctAnswers,
}: {
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  totalQuestions: number;
  correctAnswers: number;
}) => {
  try {
    // Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "You must be logged in to save your MCQ result."
      );
    }

    // Calculate percentage
    const scorePercentage =
      totalQuestions > 0
        ? Number(
            (
              (correctAnswers / totalQuestions) *
              100
            ).toFixed(2)
          )
        : 0;

    // Insert attempt
    const { data, error } = await supabase
      .from("mcq_attempts")
      .insert({
        user_id: user.id,
        subject,
        topic,
        difficulty,
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        score_percentage: scorePercentage,
      })
      .select()
      .single();

    if (error) {
      console.error(
        "Error saving MCQ attempt:",
        error
      );

      throw error;
    }

    return data as MCQAttempt;
  } catch (error) {
    console.error(
      "MCQ attempt save error:",
      error
    );

    throw error;
  }
};

// =========================================
// GET MCQ HISTORY
// =========================================

export const getMCQHistory = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "You must be logged in to view MCQ history."
      );
    }

    const { data, error } = await supabase
      .from("mcq_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Error fetching MCQ history:",
        error
      );

      throw error;
    }

    return (data || []) as MCQAttempt[];
  } catch (error) {
    console.error(
      "MCQ history error:",
      error
    );

    throw error;
  }
};

// =========================================
// DELETE MCQ ATTEMPT
// =========================================

export const deleteMCQAttempt = async (
  id: string
) => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      throw new Error(
        "You must be logged in."
      );
    }

    const { error } = await supabase
      .from("mcq_attempts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error(
        "Error deleting MCQ attempt:",
        error
      );

      throw error;
    }
  } catch (error) {
    console.error(
      "MCQ attempt delete error:",
      error
    );

    throw error;
  }
};