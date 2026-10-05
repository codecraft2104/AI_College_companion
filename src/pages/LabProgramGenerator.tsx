import { useState } from "react";
import {
  Code2,
  Sparkles,
  Loader2,
  AlertCircle,
  BookOpen,
  Terminal,
  Lightbulb,
  MessageCircleQuestion,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";

import {
  generateLabProgram,
} from "../services/labProgramService";

import type {
  LabProgram,
} from "../services/labProgramService";

const LabProgramGenerator = () => {
  const [language, setLanguage] =
    useState("Java");

  const [topic, setTopic] =
    useState("");

  const [question, setQuestion] =
    useState("");

  const [difficulty, setDifficulty] =
    useState("medium");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<LabProgram | null>(null);

  const [copied, setCopied] =
    useState(false);

  // =========================================
  // GENERATE PROGRAM
  // =========================================

  const handleGenerate = async () => {
    setError("");
    setResult(null);

    if (!language) {
      setError(
        "Please select a programming language."
      );
      return;
    }

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (!question.trim()) {
      setError(
        "Please enter the lab question."
      );
      return;
    }

    try {
      setLoading(true);

      const data =
        await generateLabProgram({
          language,
          topic,
          question,
          difficulty,
        });

      setResult(data);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate the program."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // COPY PROGRAM
  // =========================================

  const handleCopy = async () => {
    if (!result?.program) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        result.program
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );
    }
  };

  // =========================================
  // RESET
  // =========================================

  const handleReset = () => {
    setTopic("");
    setQuestion("");
    setDifficulty("medium");
    setResult(null);
    setError("");
    setCopied(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">

      <div className="mx-auto max-w-6xl">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-8">

          <div className="flex items-center gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">

              <Code2 className="h-7 w-7 text-purple-600" />

            </div>

            <div>

              <h1 className="text-3xl font-bold text-gray-900">
                AI Lab Program Generator
              </h1>

              <p className="mt-1 text-gray-500">
                Generate lab programs, algorithms,
                explanations and viva questions with AI.
              </p>

            </div>

          </div>

        </div>


        {/* =====================================
            INPUT CARD
        ===================================== */}

        <div className="rounded-2xl bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-2">

            <Sparkles className="h-5 w-5 text-purple-600" />

            <h2 className="text-xl font-bold text-gray-900">
              Create Lab Program
            </h2>

          </div>


          <div className="grid gap-5 md:grid-cols-2">

            {/* LANGUAGE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Programming Language
              </label>

              <select
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >
                <option value="Java">
                  Java
                </option>

                <option value="Python">
                  Python
                </option>

                <option value="C">
                  C
                </option>

                <option value="C++">
                  C++
                </option>

                <option value="JavaScript">
                  JavaScript
                </option>

                <option value="C#">
                  C#
                </option>

              </select>

            </div>


            {/* DIFFICULTY */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Difficulty
              </label>

              <select
                value={difficulty}
                onChange={(e) =>
                  setDifficulty(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 capitalize outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              >

                <option value="easy">
                  Easy
                </option>

                <option value="medium">
                  Medium
                </option>

                <option value="hard">
                  Hard
                </option>

              </select>

            </div>


            {/* TOPIC */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Topic
              </label>

              <input
                type="text"
                value={topic}
                onChange={(e) =>
                  setTopic(e.target.value)
                }
                placeholder="Example: Inheritance"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

            </div>


            {/* QUESTION */}

            <div className="md:col-span-2">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Lab Question
              </label>

              <textarea
                value={question}
                onChange={(e) =>
                  setQuestion(e.target.value)
                }
                rows={5}
                placeholder="Example: Write a Java program to demonstrate multilevel inheritance."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

            </div>

          </div>


          {/* ERROR */}

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />

              <span>
                {error}
              </span>

            </div>
          )}


          {/* BUTTONS */}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />

                  Generating Program...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />

                  Generate Lab Program
                </>
              )}

            </button>


            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 font-semibold text-gray-700 hover:bg-gray-50"
            >

              <RotateCcw className="h-5 w-5" />

              Reset

            </button>

          </div>

        </div>


        {/* =====================================
            RESULT
        ===================================== */}

        {result && (

          <div className="mt-8 space-y-6">

            {/* TITLE */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="mb-2 flex items-center gap-2">

                    <Check className="h-5 w-5 text-green-600" />

                    <span className="text-sm font-semibold text-green-600">
                      Program Generated Successfully
                    </span>

                  </div>

                  <h2 className="text-2xl font-bold text-gray-900">
                    {result.title}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {result.language} •{" "}
                    {result.topic}
                  </p>

                </div>

              </div>

            </div>


            {/* PROGRAM */}

            <div className="overflow-hidden rounded-2xl bg-gray-900 shadow-sm">

              <div className="flex items-center justify-between border-b border-gray-700 px-5 py-4">

                <div className="flex items-center gap-2 text-white">

                  <Terminal className="h-5 w-5" />

                  <span className="font-semibold">
                    Program
                  </span>

                </div>


                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-lg bg-gray-800 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-gray-700"
                >

                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />

                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />

                      Copy
                    </>
                  )}

                </button>

              </div>


              <pre className="max-h-[600px] overflow-auto p-5 text-sm leading-7 text-gray-100">

                <code>
                  {result.program}
                </code>

              </pre>

            </div>


            {/* ALGORITHM */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-5 flex items-center gap-3">

                <div className="rounded-xl bg-blue-100 p-3">

                  <BookOpen className="h-5 w-5 text-blue-600" />

                </div>

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Algorithm
                  </h2>

                  <p className="text-sm text-gray-500">
                    Follow these steps to understand the program.
                  </p>

                </div>

              </div>


              <ol className="space-y-3">

                {result.algorithm.map(
                  (step, index) => (

                    <li
                      key={index}
                      className="flex gap-3"
                    >

                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600">
                        {index + 1}
                      </span>

                      <p className="pt-1 text-gray-700">
                        {step}
                      </p>

                    </li>

                  )
                )}

              </ol>

            </div>


            {/* EXPLANATION */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-4 flex items-center gap-3">

                <div className="rounded-xl bg-yellow-100 p-3">

                  <Lightbulb className="h-5 w-5 text-yellow-600" />

                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  Simple Explanation
                </h2>

              </div>

              <p className="leading-7 text-gray-600">
                {result.explanation}
              </p>

            </div>


            {/* INPUT OUTPUT */}

            <div className="grid gap-6 md:grid-cols-2">

              <div className="rounded-2xl bg-white p-6 shadow-sm">

                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Sample Input
                </h2>

                <pre className="overflow-auto rounded-xl bg-gray-900 p-4 text-sm leading-6 text-gray-100">
                  {result.sample_input}
                </pre>

              </div>


              <div className="rounded-2xl bg-white p-6 shadow-sm">

                <h2 className="mb-4 text-lg font-bold text-gray-900">
                  Sample Output
                </h2>

                <pre className="overflow-auto rounded-xl bg-gray-900 p-4 text-sm leading-6 text-gray-100">
                  {result.sample_output}
                </pre>

              </div>

            </div>


            {/* IMPORTANT POINTS */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <h2 className="mb-5 text-xl font-bold text-gray-900">
                Important Points
              </h2>

              <div className="space-y-3">

                {result.important_points.map(
                  (point, index) => (

                    <div
                      key={index}
                      className="flex gap-3 rounded-xl bg-purple-50 p-4"
                    >

                      <span className="font-bold text-purple-600">
                        {index + 1}.
                      </span>

                      <p className="text-gray-700">
                        {point}
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* VIVA */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-center gap-3">

                <div className="rounded-xl bg-green-100 p-3">

                  <MessageCircleQuestion className="h-5 w-5 text-green-600" />

                </div>

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Viva Questions
                  </h2>

                  <p className="text-sm text-gray-500">
                    Prepare for your lab viva.
                  </p>

                </div>

              </div>


              <div className="space-y-4">

                {result.viva_questions.map(
                  (item, index) => (

                    <div
                      key={index}
                      className="rounded-xl border border-gray-100 p-5"
                    >

                      <p className="font-semibold text-gray-900">

                        {index + 1}.{" "}
                        {item.question}

                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-600">

                        <span className="font-semibold text-purple-600">
                          Answer:
                        </span>{" "}

                        {item.answer}

                      </p>

                    </div>

                  )
                )}

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default LabProgramGenerator;