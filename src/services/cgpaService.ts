import { supabase } from "../lib/supabase";

export interface SemesterResult {
  id?: string;
  user_id?: string;
  semester: number;
  sgpa: number;
  credits: number;
  created_at?: string;
}

export async function getSemesterResults() {
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
    .from("semester_results")
    .select("*")
    .eq("user_id", user.id)
    .order("semester", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data as SemesterResult[];
}

export async function saveSemesterResult(
  semester: number,
  sgpa: number,
  credits: number
) {
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
    .from("semester_results")
    .upsert(
      {
        user_id: user.id,
        semester,
        sgpa,
        credits,
      },
      {
        onConflict: "user_id,semester",
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SemesterResult;
}

export async function deleteSemesterResult(
  semester: number
) {
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
    .from("semester_results")
    .delete()
    .eq("user_id", user.id)
    .eq("semester", semester);

  if (error) {
    throw error;
  }
}

export function calculateCGPA(
  semesters: {
    sgpa: number;
    credits: number;
  }[]
) {
  if (semesters.length === 0) {
    return 0;
  }

  let totalCredits = 0;
  let totalWeightedPoints = 0;

  semesters.forEach((semester) => {
    totalCredits += Number(semester.credits);

    totalWeightedPoints +=
      Number(semester.sgpa) *
      Number(semester.credits);
  });

  if (totalCredits === 0) {
    return 0;
  }

  return Number(
    (totalWeightedPoints / totalCredits).toFixed(2)
  );
}