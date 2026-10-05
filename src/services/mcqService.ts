import { supabase } from "../lib/supabase";

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface MCQRequest {
  subject: string;
  topic: string;
  numberOfQuestions: number;
  difficulty: "easy" | "medium" | "hard";
}

export interface MCQResponse {
  questions: MCQ[];
}

export const generateMCQs = async (
  request: MCQRequest
): Promise<MCQ[]> => {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      throw new Error("User is not logged in");
    }

    const { data, error } =
      await supabase.functions.invoke(
        "ai-mcq-generator",
        {
          body: request,
        }
      );

    if (error) {
      console.error(
        "MCQ Edge Function error:",
        error
      );

      throw new Error(
        error.message ||
          "Failed to generate MCQs"
      );
    }

    if (!data) {
      throw new Error(
        "No response received from AI"
      );
    }

    if (
      !data.questions ||
      !Array.isArray(data.questions)
    ) {
      console.error(
        "Invalid MCQ response:",
        data
      );

      throw new Error(
        "AI returned an invalid MCQ format"
      );
    }

    return data.questions;
  } catch (error) {
    console.error(
      "MCQ generation error:",
      error
    );

    throw error;
  }
};