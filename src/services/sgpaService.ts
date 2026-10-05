import { supabase } from "../lib/supabase";

export const gradePoints: Record<string, number> = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  P: 4,
  F: 0,
};

export interface Subject {
  id?: string;
  user_id?: string;
  semester: number;
  subject_name: string;
  credits: number;
  grade: string;
  grade_point: number;
  created_at?: string;
}

export function calculateSGPA(
  subjects: {
    credits: number;
    gradePoint: number;
  }[]
) {
  if (subjects.length === 0) {
    return 0;
  }

  let totalCredits = 0;
  let totalPoints = 0;

  subjects.forEach((subject) => {
    totalCredits += Number(subject.credits);

    totalPoints +=
      Number(subject.credits) *
      Number(subject.gradePoint);
  });

  if (totalCredits === 0) {
    return 0;
  }

  return Number(
    (totalPoints / totalCredits).toFixed(2)
  );
}

export function getGradePoint(
  grade: string
) {
  return gradePoints[grade] ?? 0;
}

export async function getSGPASubjects(
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

  const { data, error } = await supabase
    .from("sgpa_subjects")
    .select("*")
    .eq("user_id", user.id)
    .eq("semester", semester)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data as Subject[];
}

export async function addSGPASubject(
  semester: number,
  subjectName: string,
  credits: number,
  grade: string
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

  const gradePoint = getGradePoint(grade);

  const { data, error } = await supabase
    .from("sgpa_subjects")
    .insert({
      user_id: user.id,
      semester,
      subject_name: subjectName,
      credits,
      grade,
      grade_point: gradePoint,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Subject;
}

export async function updateSGPASubject(
  id: string,
  subjectName: string,
  credits: number,
  grade: string
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

  const gradePoint = getGradePoint(grade);

  const { data, error } = await supabase
    .from("sgpa_subjects")
    .update({
      subject_name: subjectName,
      credits,
      grade,
      grade_point: gradePoint,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Subject;
}

export async function deleteSGPASubject(
  id: string
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
    .from("sgpa_subjects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }
}


export async function getSemesterSGPA(
  semester: number
) {
  const subjects = await getSGPASubjects(
    semester
  );

  const validSubjects = subjects.filter(
    (subject) =>
      Number(subject.credits) > 0 &&
      subject.grade !== ""
  );

  const sgpa = calculateSGPA(
    validSubjects.map((subject) => ({
      credits: Number(subject.credits),
      gradePoint: Number(
        subject.grade_point
      ),
    }))
  );

  const totalCredits =
    validSubjects.reduce(
      (total, subject) =>
        total + Number(subject.credits),
      0
    );

  return {
    sgpa,
    credits: totalCredits,
  };
}