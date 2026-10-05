import { supabase } from "../lib/supabase";

export async function getSubjects(userId: string) {
  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data;
}

export async function addSubject(
  userId: string,
  name: string,
  code: string
) {
  const { data, error } = await supabase
    .from("subjects")
    .insert({
      user_id: userId,
      name,
      code,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAttendance(
  userId: string,
  subjectId: string
) {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", userId)
    .eq("subject_id", subjectId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export function calculateAttendancePercentage(
  attended: number,
  total: number
) {
  if (total === 0) {
    return 0;
  }

  return Math.round((attended / total) * 100);
}

export async function recordAttendance(
  userId: string,
  subjectId: string,
  present: boolean
) {
  const existingAttendance = await getAttendance(
    userId,
    subjectId
  );

  if (!existingAttendance) {
    const { data, error } = await supabase
      .from("attendance")
      .insert({
        user_id: userId,
        subject_id: subjectId,
        attended_classes: present ? 1 : 0,
        total_classes: 1,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const attended = existingAttendance.attended_classes;
  const total = existingAttendance.total_classes;

  const { data, error } = await supabase
    .from("attendance")
    .update({
      attended_classes: present
        ? attended + 1
        : attended,
      total_classes: total + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingAttendance.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function getAttendanceStatus(percentage: number) {
  if (percentage >= 85) {
    return {
      label: "Excellent attendance",
      type: "excellent",
    };
  }

  if (percentage >= 75) {
    return {
      label: "Good attendance",
      type: "good",
    };
  }

  return {
    label: "Low attendance",
    type: "warning",
  };
}


export function calculateOverallAttendance(
  attendanceRecords: any[]
) {
  if (attendanceRecords.length === 0) {
    return 0;
  }

  let totalAttended = 0;
  let totalClasses = 0;

  attendanceRecords.forEach((record) => {
    totalAttended += record.attended_classes || 0;
    totalClasses += record.total_classes || 0;
  });

  if (totalClasses === 0) {
    return 0;
  }

  return Math.round(
    (totalAttended / totalClasses) * 100
  );
}


export function getClassesNeededFor75(
  attended: number,
  total: number
) {
  if (total === 0 || attended / total >= 0.75) {
    return 0;
  }

  let classesNeeded = 0;

  while (
    (attended + classesNeeded) /
      (total + classesNeeded) <
    0.75
  ) {
    classesNeeded++;
  }

  return classesNeeded;
}

export function getClassesCanMiss(
  attended: number,
  total: number
) {
  if (total === 0 || attended / total < 0.75) {
    return 0;
  }

  let classesCanMiss = 0;

  while (
    attended /
      (total + classesCanMiss + 1) >=
    0.75
  ) {
    classesCanMiss++;
  }

  return classesCanMiss;
}