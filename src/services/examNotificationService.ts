import { supabase } from "../lib/supabase";

export const runExamNotificationCheck =
  async () => {
    try {
      const { data, error } =
        await supabase.functions.invoke(
          "send-exam-push-notifications",
          {
            body: {},
          }
        );

      if (error) {
        console.error(
          "❌ Exam notification function error:",
          error
        );

        return null;
      }

      console.log(
        "✅ Exam notification function result:",
        data
      );

      return data;
    } catch (error) {
      console.error(
        "❌ Exam notification check failed:",
        error
      );

      return null;
    }
  };