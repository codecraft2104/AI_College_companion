import { useState } from "react";
import { askAIStudyAssistant } from "../services/aiStudyService";

type StudyMode =
  | "explain"
  | "summarize"
  | "examples"
  | "quiz";

function AIStudyAssistant() {
  const [question, setQuestion] =
    useState("");

  const [mode, setMode] =
    useState<StudyMode>("explain");

  const [answer, setAnswer] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const handleAskAI = async () => {
    if (!question.trim()) {
      setError(
        "Please enter a topic or question."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnswer("");

      const result =
        await askAIStudyAssistant(
          question,
          mode
        );

      setAnswer(result);

    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (
    example: string
  ) => {
    setQuestion(example);
  };

  return (
    <main className="flex-1 px-6 py-8">

      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          AI Study Assistant
        </h1>

        <p className="mt-2 text-slate-500">
          Learn difficult topics with the help of AI.
        </p>
      </div>

      {/* QUESTION CARD */}

      <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">

        <h2 className="text-xl font-semibold text-slate-800">
          What do you want to learn?
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Ask a question, enter a topic, or paste a concept you don't understand.
        </p>

        <textarea
          rows={6}
          value={question}
          onChange={(e) =>
            setQuestion(
              e.target.value
            )
          }
          placeholder="Example: Explain process scheduling in Operating Systems in simple words..."
          className="mt-6 w-full border rounded-xl px-4 py-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* EXAMPLES */}

        <div className="mt-4">

          <p className="text-sm font-medium text-slate-700">
            Try asking:
          </p>

          <div className="mt-3 flex flex-wrap gap-2">

            <button
              onClick={() =>
                handleExample(
                  "Explain process scheduling in Operating Systems in simple words."
                )
              }
              className="px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Process Scheduling
            </button>

            <button
              onClick={() =>
                handleExample(
                  "Explain binary search with a simple example."
                )
              }
              className="px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              Binary Search
            </button>

            <button
              onClick={() =>
                handleExample(
                  "Explain normalization in DBMS with examples."
                )
              }
              className="px-3 py-2 text-sm rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              DBMS Normalization
            </button>

          </div>

        </div>

        {/* MODES */}

        <div className="mt-6">

          <p className="text-sm font-medium text-slate-700">
            Study Mode
          </p>

          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">

            <button
              onClick={() =>
                setMode("explain")
              }
              className={`px-4 py-3 rounded-lg border font-medium ${
                mode === "explain"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Explain
            </button>

            <button
              onClick={() =>
                setMode("summarize")
              }
              className={`px-4 py-3 rounded-lg border font-medium ${
                mode === "summarize"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Summarize
            </button>

            <button
              onClick={() =>
                setMode("examples")
              }
              className={`px-4 py-3 rounded-lg border font-medium ${
                mode === "examples"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Examples
            </button>

            <button
              onClick={() =>
                setMode("quiz")
              }
              className={`px-4 py-3 rounded-lg border font-medium ${
                mode === "quiz"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Quiz Me
            </button>

          </div>

        </div>

        {/* ASK BUTTON */}

        <div className="mt-6 flex justify-end">

          <button
            onClick={handleAskAI}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading
              ? "Thinking..."
              : "✨ Ask AI"}
          </button>

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* AI RESPONSE */}

      {answer && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              🤖
            </div>

            <div>

              <h2 className="text-xl font-semibold text-slate-800">
                AI Response
              </h2>

              <p className="text-sm text-slate-500">
                Generated for your study question
              </p>

            </div>

          </div>

          <div className="mt-6 border-t pt-6">

            <div className="whitespace-pre-wrap text-slate-700 leading-7">
              {answer}
            </div>

          </div>

        </div>
      )}

      {/* EMPTY STATE */}

      {!answer &&
        !loading &&
        !error && (
          <div className="mt-8 bg-slate-50 rounded-2xl p-10 text-center">

            <div className="text-5xl">
              🤖
            </div>

            <h2 className="mt-4 text-xl font-semibold text-slate-800">
              Your AI Study Partner
            </h2>

            <p className="mt-2 text-slate-500 max-w-lg mx-auto">
              Ask questions about your subjects and get explanations, summaries, examples, or quiz questions.
            </p>

          </div>
        )}

    </main>
  );
}

export default AIStudyAssistant;