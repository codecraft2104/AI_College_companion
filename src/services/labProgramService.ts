import { supabase } from "../lib/supabase";

export interface VivaQuestion {
  question: string;
  answer: string;
}

export interface LabProgram {
  title: string;
  language: string;
  topic: string;
  program: string;
  algorithm: string[];
  explanation: string;
  sample_input: string;
  sample_output: string;
  important_points: string[];
  viva_questions: VivaQuestion[];
}

// =========================================
// GENERATE LAB PROGRAM
// =========================================

export const generateLabProgram = async ({
  language,
  topic,
  question,
  difficulty,
}: {
  language: string;
  topic: string;
  question: string;
  difficulty: string;
}): Promise<LabProgram> => {
  try {
    const { data, error } =
      await supabase.functions.invoke(
        "ai-lab-program-generator",
        {
          body: {
            language,
            topic,
            question,
            difficulty,
          },
        }
      );

    if (error) {
      console.error(
        "Lab Program Edge Function error:",
        error
      );

      throw new Error(
        "Failed to connect to the AI Lab Program Generator."
      );
    }

    if (!data) {
      throw new Error(
        "No response received from the AI."
      );
    }

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.data) {
      throw new Error(
        "AI did not return a valid lab program."
      );
    }

    return data.data as LabProgram;
  } catch (error) {
    console.error(
      "Lab Program generation error:",
      error
    );

    throw error instanceof Error
      ? error
      : new Error(
          "Failed to generate lab program."
        );
  }
};