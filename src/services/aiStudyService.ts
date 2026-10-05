import { supabase } from "../lib/supabase";

export type AIStudyMode =
  | "explain"
  | "summarize"
  | "examples"
  | "quiz";

interface AIStudyResponse {
  answer: string;
}

export async function askAIStudyAssistant(
  question: string,
  mode: AIStudyMode = "explain"
): Promise<string> {
  const {
    data,
    error,
  } = await supabase.functions.invoke<AIStudyResponse>(
    "ai-study-assistant",
    {
      body: {
        question,
        mode,
      },
    }
  );

  console.log("AI function data:", data);
  console.log("AI function error:", error);

  if (error) {
    console.error(
      "Full AI function error:",
      error
    );

    throw new Error(
      error.message ||
        "Failed to connect to AI Study Assistant."
    );
  }

  if (!data?.answer) {
    throw new Error(
      "AI returned an empty response."
    );
  }

  return data.answer;
}