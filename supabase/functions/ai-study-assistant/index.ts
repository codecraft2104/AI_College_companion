Deno.serve(async (req: Request) => {
  // CORS
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods":
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Read request body
    const body = await req.json();

    const question = body.question;
    const mode = body.mode || "explain";

    // Validate question
    if (
      !question ||
      typeof question !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error: "Question is required.",
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

    // Get Gemini API key
    const apiKey =
      Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "GEMINI_API_KEY is not configured.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // AI prompt
    const prompt = `
You are an AI Study Assistant for college students.

The student asked:

${question}

Study mode: ${mode}

Give a clear and helpful response.

Rules:
- Use simple language.
- Explain concepts step by step.
- Use headings and bullet points when useful.
- Give examples where appropriate.
- Make the response useful for exam preparation.

If the mode is "explain":
Explain the topic clearly.

If the mode is "summarize":
Give a short summary of the important points.

If the mode is "examples":
Focus on practical examples.

If the mode is "quiz":
Create quiz questions about the topic.
`;

    // Call Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
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
        }),
      }
    );

    const result = await response.json();

    // Gemini error
    if (!response.ok) {
      console.error(
        "Gemini error:",
        result
      );

      return new Response(
        JSON.stringify({
          error:
            "Gemini API request failed.",
          details: result,
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

    // Extract answer
    const answer =
      result?.candidates?.[0]?.content
        ?.parts?.[0]?.text;

    if (!answer) {
      return new Response(
        JSON.stringify({
          error:
            "Gemini returned no response.",
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

    // Success
    return new Response(
      JSON.stringify({
        answer,
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
    console.error(
      "Study assistant error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
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