import { createClient } from "npm:@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "npm:jose@6";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const firebaseProjectId = Deno.env.get("FIREBASE_PROJECT_ID") ?? "";
const firebaseClientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL") ?? "";
const firebasePrivateKey = (Deno.env.get("FIREBASE_PRIVATE_KEY") ?? "").replace(/\\n/g, "\n");
const cronSecret = Deno.env.get("EXAM_NOTIFICATION_CRON_SECRET") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey);
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

async function getFirebaseAccessToken(): Promise<string> {
  if (!firebasePrivateKey || !firebaseProjectId || !firebaseClientEmail) {
    throw new Error("Firebase Admin secrets are not configured.");
  }

  const privateKey = await importPKCS8(firebasePrivateKey, "RS256");
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(firebaseClientEmail)
    .setSubject(firebaseClientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await response.json();
  if (!response.ok || typeof data.access_token !== "string") {
    console.error("Firebase OAuth request failed:", response.status);
    throw new Error("Failed to get Firebase access token.");
  }
  return data.access_token;
}

async function sendFirebaseNotification(
  token: string,
  title: string,
  body: string,
  examId: string,
  accessToken: string,
) {
  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { type: "exam", examId, url: "/exam-countdown" },
          webpush: { fcmOptions: { link: "/exam-countdown" } },
        },
      }),
    },
  );
  const result = await response.json();
  return { success: response.ok, error: response.ok ? undefined : result };
}

function isInvalidTokenError(error: unknown): boolean {
  const text = JSON.stringify(error);
  return text.includes("UNREGISTERED") ||
    text.includes("registration-token-not-registered") ||
    text.includes("INVALID_ARGUMENT");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const today = new Date();
    const todayString = dateOnly(today);
    const maxDateString = dateOnly(addDays(today, 7));
    const { data: exams, error: examsError } = await supabase
      .from("exams")
      .select("id,user_id,subject,exam_date")
      .gte("exam_date", `${todayString}T00:00:00.000Z`)
      .lte("exam_date", `${maxDateString}T23:59:59.999Z`);
    if (examsError) throw examsError;

    let notificationsCreated = 0;
    let notificationsSent = 0;
    let invalidTokensRemoved = 0;
    let accessToken: string | undefined;

    for (const exam of exams ?? []) {
      const examDateString = String(exam.exam_date).slice(0, 10);
      const daysRemaining = Math.round(
        (Date.parse(`${examDateString}T00:00:00.000Z`) -
          Date.parse(`${todayString}T00:00:00.000Z`)) / 86400000,
      );
      const reminder = {
        7: ["Exam in 1 Week", `${exam.subject} exam is one week away. Plan your preparation!`],
        3: ["Exam in 3 Days", `${exam.subject} exam is coming up in 3 days. Start your revision!`],
        1: ["Exam Tomorrow", `${exam.subject} exam is tomorrow. Make sure you are prepared!`],
      }[daysRemaining];
      if (!reminder) continue;

      const [title, message] = reminder;
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: exam.user_id,
          title,
          message,
          type: "exam",
          related_exam_id: exam.id,
          is_read: false,
        });
      if (notificationError) {
        if (notificationError.code === "23505") continue;
        console.error("Notification insert failed:", notificationError);
        continue;
      }
      notificationsCreated++;

      const { data: tokens, error: tokenError } = await supabase
        .from("fcm_tokens")
        .select("id,token")
        .eq("user_id", exam.user_id);
      if (tokenError) {
        console.error("FCM token query failed:", tokenError);
        continue;
      }

      for (const tokenRecord of tokens ?? []) {
        try {
          accessToken ??= await getFirebaseAccessToken();
          const result = await sendFirebaseNotification(
            tokenRecord.token,
            title,
            message,
            exam.id,
            accessToken,
          );
          if (result.success) {
            notificationsSent++;
          } else if (isInvalidTokenError(result.error)) {
            const { error: deleteError } = await supabase
              .from("fcm_tokens")
              .delete()
              .eq("id", tokenRecord.id);
            if (!deleteError) invalidTokensRemoved++;
            console.error("Removed invalid FCM token:", tokenRecord.id);
          } else {
            console.error("FCM delivery failed:", result.error);
          }
        } catch (error) {
          console.error("FCM delivery attempt failed:", error);
        }
      }
    }

    return jsonResponse({
      success: true,
      examsChecked: exams?.length ?? 0,
      notificationsCreated,
      notificationsSent,
      invalidTokensRemoved,
    });
  } catch (error) {
    console.error("Exam notification function failed:", error);
    return jsonResponse({ success: false, error: "Notification job failed." }, 500);
  }
});
