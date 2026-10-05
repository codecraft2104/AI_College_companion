import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

interface MCQRequest {
  subject: string;
  topic: string;
  numberOfQuestions: number;
  difficulty: "easy" | "medium" | "hard";
}

serve(async (req) => {
  // =========================================
  // CORS PREFLIGHT
  // =========================================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // =========================================
  // MAIN FUNCTION
  // =========================================

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          error: "Only POST requests are allowed",
        }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body: MCQRequest = await req.json();

    const {
      subject,
      topic,
      numberOfQuestions,
      difficulty,
    } = body;

    // =========================================
    // VALIDATION
    // =========================================

    if (!subject?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Subject is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!topic?.trim()) {
      return new Response(
        JSON.stringify({
          error: "Topic is required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (
      !numberOfQuestions ||
      numberOfQuestions < 1 ||
      numberOfQuestions > 20
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Number of questions must be between 1 and 20",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // =========================================
    // GEMINI API KEY
    // =========================================

    const GEMINI_API_KEY =
      Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is not configured in Supabase secrets"
      );
    }

    // =========================================
    // AI PROMPT
    // =========================================

    const prompt = `
You are an expert college-level teacher.

Generate ${numberOfQuestions} multiple-choice questions.

Subject: ${subject}
Topic: ${topic}
Difficulty: ${difficulty}

Requirements:

1. Generate exactly ${numberOfQuestions} questions.
2. Each question must have exactly 4 options.
3. Only one option must be correct.
4. Include the correct answer as a numeric index.
5. Include a short explanation.
6. Questions should test understanding.
7. Avoid duplicate questions.
8. Use clear language suitable for college students.

Return ONLY valid JSON.

Use exactly this structure:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": 0,
      "explanation": "Short explanation"
    }
  ]
}

Important:

- Option A = 0
- Option B = 1
- Option C = 2
- Option D = 3
- correctAnswer must be a number.
- Do not use Markdown.
- Do not use code fences.
- Return only JSON.
`;

    // =========================================
    // CALL GEMINI
    // =========================================

const geminiResponse = await fetch(
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
        {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    // =========================================
    // GEMINI ERROR
    // =========================================

    if (!geminiResponse.ok) {
      const errorText =
        await geminiResponse.text();

      console.error(
        "Gemini API Error:",
        errorText
      );

      return new Response(
        JSON.stringify({
          error:
            "Gemini API request failed",
          details: errorText,
        }),
        {
          status: geminiResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }

    // =========================================
    // READ GEMINI RESPONSE
    // =========================================

    const geminiData =
      await geminiResponse.json();

    const generatedText =
      geminiData?.candidates?.[0]
        ?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error(
        "Gemini returned an empty response"
      );
    }

    // =========================================
    // PARSE JSON
    // =========================================

    let mcqData;

    try {
      mcqData = JSON.parse(
        generatedText
      );
    } catch (error) {
      console.error(
        "Failed to parse Gemini JSON:",
        generatedText
      );

      throw new Error(
        "AI returned invalid JSON"
      );
    }

    // =========================================
    // VALIDATE RESPONSE
    // =========================================

    if (
      !mcqData ||
      !Array.isArray(
        mcqData.questions
      )
    ) {
      throw new Error(
        "Invalid MCQ response format"
      );
    }

    if (
      mcqData.questions.length === 0
    ) {
      throw new Error(
        "AI did not generate any questions"
      );
    }

    // =========================================
    // RETURN RESPONSE
    // =========================================

    return new Response(
      JSON.stringify({
        questions:
          mcqData.questions,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  } catch (error) {
    // =========================================
    // ERROR HANDLER
    // =========================================

    console.error(
      "MCQ Generator Error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      }
    );
  }
});