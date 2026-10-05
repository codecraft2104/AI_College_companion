import { useEffect, useMemo, useState } from "react";
import {
  Brain,
  Trophy,
  Target,
  CheckCircle2,
  BarChart3,
  Loader2,
  AlertCircle,
  Calendar,
  Trash2,
  ArrowLeft,
  BookOpen,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  getMCQHistory,
  deleteMCQAttempt,
} from "../services/mcqHistoryService";

import type { MCQAttempt } from "../services/mcqHistoryService";

const MCQHistory = () => {
  const [attempts, setAttempts] = useState<MCQAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================
  // LOAD MCQ HISTORY
  // =========================================

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMCQHistory();

      setAttempts(data);
    } catch (err) {
      console.error("MCQ history loading error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load MCQ history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // =========================================
  // PERFORMANCE STATISTICS
  // =========================================

  const statistics = useMemo(() => {
    if (attempts.length === 0) {
      return {
        totalQuizzes: 0,
        averageScore: 0,
        bestScore: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        overallAccuracy: 0,
      };
    }

    const totalQuizzes = attempts.length;

    const totalScore = attempts.reduce(
      (sum, attempt) =>
        sum + Number(attempt.score_percentage),
      0
    );

    const averageScore =
      totalScore / totalQuizzes;

    const bestScore = Math.max(
      ...attempts.map((attempt) =>
        Number(attempt.score_percentage)
      )
    );

    const totalQuestions = attempts.reduce(
      (sum, attempt) =>
        sum + Number(attempt.total_questions),
      0
    );

    const totalCorrect = attempts.reduce(
      (sum, attempt) =>
        sum + Number(attempt.correct_answers),
      0
    );

    const overallAccuracy =
      totalQuestions > 0
        ? (totalCorrect / totalQuestions) * 100
        : 0;

    return {
      totalQuizzes,
      averageScore,
      bestScore,
      totalQuestions,
      totalCorrect,
      overallAccuracy,
    };
  }, [attempts]);

  // =========================================
  // SUBJECT PERFORMANCE
  // =========================================

  const subjectPerformance = useMemo(() => {
    const subjectMap: Record<
      string,
      {
        attempts: number;
        totalQuestions: number;
        correctAnswers: number;
      }
    > = {};

    attempts.forEach((attempt) => {
      if (!subjectMap[attempt.subject]) {
        subjectMap[attempt.subject] = {
          attempts: 0,
          totalQuestions: 0,
          correctAnswers: 0,
        };
      }

      subjectMap[attempt.subject].attempts += 1;

      subjectMap[attempt.subject].totalQuestions +=
        Number(attempt.total_questions);

      subjectMap[attempt.subject].correctAnswers +=
        Number(attempt.correct_answers);
    });

    return Object.entries(subjectMap)
      .map(([subject, data]) => ({
        subject,
        attempts: data.attempts,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        percentage:
          data.totalQuestions > 0
            ? (data.correctAnswers /
                data.totalQuestions) *
              100
            : 0,
      }))
      .sort(
        (a, b) =>
          b.percentage - a.percentage
      );
  }, [attempts]);

  // =========================================
  // DELETE ATTEMPT
  // =========================================

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this quiz attempt?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteMCQAttempt(id);

      setAttempts((previous) =>
        previous.filter(
          (attempt) => attempt.id !== id
        )
      );
    } catch (err) {
      console.error(
        "MCQ attempt deletion error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete quiz attempt."
      );
    }
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date?: string) => {
    if (!date) {
      return "Unknown date";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================
  // DIFFICULTY STYLE
  // =========================================

  const getDifficultyClass = (
    difficulty: string
  ) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-700";

      case "hard":
        return "bg-red-100 text-red-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  // =========================================
  // SCORE STYLE
  // =========================================

  const getScoreClass = (
    percentage: number
  ) => {
    if (percentage >= 80) {
      return "text-green-600";
    }

    if (percentage >= 50) {
      return "text-yellow-600";
    }

    return "text-red-600";
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-500">

            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />

            <p>
              Loading MCQ performance...
            </p>

          </div>
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN PAGE
  // =========================================

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">

      <div className="mx-auto max-w-6xl">

        {/* =====================================
            HEADER
        ===================================== */}

        <div className="mb-8">

          <Link
            to="/mcq-generator"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to MCQ Generator
          </Link>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100">

                <Brain className="h-7 w-7 text-purple-600" />

              </div>

              <div>

                <h1 className="text-3xl font-bold text-gray-900">
                  MCQ Performance & History
                </h1>

                <p className="mt-1 text-gray-500">
                  Track your quiz results and learning progress.
                </p>

              </div>

            </div>

            <Link
              to="/mcq-generator"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-purple-700"
            >
              <Plus className="h-5 w-5" />

              New Quiz
            </Link>

          </div>

        </div>


        {/* =====================================
            ERROR
        ===================================== */}

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            <AlertCircle className="h-5 w-5 flex-shrink-0" />

            <span>{error}</span>

          </div>
        )}


        {/* =====================================
            EMPTY STATE
        ===================================== */}

        {attempts.length === 0 ? (

          <div className="rounded-3xl bg-white p-10 text-center shadow-sm md:p-16">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">

              <Brain className="h-10 w-10 text-purple-600" />

            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              No Quiz Attempts Yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-gray-500">
              Complete your first AI-generated quiz
              to start tracking your performance.
            </p>

            <Link
              to="/mcq-generator"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700"
            >
              <Brain className="h-5 w-5" />

              Start Your First Quiz
            </Link>

          </div>

        ) : (

          <>

            {/* =====================================
                PERFORMANCE OVERVIEW
            ===================================== */}

            <div className="mb-8">

              <div className="mb-5">

                <h2 className="text-2xl font-bold text-gray-900">
                  Performance Overview
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  A quick look at your overall MCQ performance.
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                {/* TOTAL QUIZZES */}

                <div className="rounded-2xl bg-white p-5 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500">
                        Total Quizzes
                      </p>

                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {statistics.totalQuizzes}
                      </p>

                    </div>

                    <div className="rounded-xl bg-purple-100 p-3">

                      <Brain className="h-6 w-6 text-purple-600" />

                    </div>

                  </div>

                </div>


                {/* AVERAGE SCORE */}

                <div className="rounded-2xl bg-white p-5 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500">
                        Average Score
                      </p>

                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {statistics.averageScore.toFixed(
                          1
                        )}
                        %
                      </p>

                    </div>

                    <div className="rounded-xl bg-blue-100 p-3">

                      <BarChart3 className="h-6 w-6 text-blue-600" />

                    </div>

                  </div>

                </div>


                {/* BEST SCORE */}

                <div className="rounded-2xl bg-white p-5 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500">
                        Best Score
                      </p>

                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {statistics.bestScore.toFixed(
                          0
                        )}
                        %
                      </p>

                    </div>

                    <div className="rounded-xl bg-yellow-100 p-3">

                      <Trophy className="h-6 w-6 text-yellow-600" />

                    </div>

                  </div>

                </div>


                {/* ACCURACY */}

                <div className="rounded-2xl bg-white p-5 shadow-sm">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500">
                        Overall Accuracy
                      </p>

                      <p className="mt-2 text-3xl font-bold text-gray-900">
                        {statistics.overallAccuracy.toFixed(
                          1
                        )}
                        %
                      </p>

                    </div>

                    <div className="rounded-xl bg-green-100 p-3">

                      <CheckCircle2 className="h-6 w-6 text-green-600" />

                    </div>

                  </div>

                </div>

              </div>

            </div>


            {/* =====================================
                QUESTION SUMMARY
            ===================================== */}

            <div className="mb-8 grid gap-4 md:grid-cols-2">

              <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="flex items-center gap-4">

                  <div className="rounded-xl bg-indigo-100 p-3">

                    <Target className="h-6 w-6 text-indigo-600" />

                  </div>

                  <div>

                    <p className="text-sm text-gray-500">
                      Questions Attempted
                    </p>

                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.totalQuestions}
                    </p>

                  </div>

                </div>

              </div>


              <div className="rounded-2xl bg-white p-6 shadow-sm">

                <div className="flex items-center gap-4">

                  <div className="rounded-xl bg-green-100 p-3">

                    <CheckCircle2 className="h-6 w-6 text-green-600" />

                  </div>

                  <div>

                    <p className="text-sm text-gray-500">
                      Correct Answers
                    </p>

                    <p className="text-2xl font-bold text-gray-900">
                      {statistics.totalCorrect}
                    </p>

                  </div>

                </div>

              </div>

            </div>


            {/* =====================================
                SUBJECT PERFORMANCE
            ===================================== */}

            <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-6">

                <h2 className="text-xl font-bold text-gray-900">
                  Subject-wise Performance
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Compare your accuracy across different subjects.
                </p>

              </div>


              <div className="space-y-6">

                {subjectPerformance.map(
                  (subject) => (

                    <div
                      key={subject.subject}
                    >

                      <div className="mb-2 flex items-center justify-between gap-4">

                        <div className="min-w-0">

                          <p className="truncate font-semibold text-gray-800">
                            {subject.subject}
                          </p>

                          <p className="text-xs text-gray-500">
                            {subject.attempts}{" "}
                            {subject.attempts === 1
                              ? "quiz"
                              : "quizzes"}{" "}
                            •{" "}
                            {
                              subject.totalQuestions
                            }{" "}
                            questions •{" "}
                            {
                              subject.correctAnswers
                            }{" "}
                            correct
                          </p>

                        </div>

                        <span
                          className={`font-bold ${getScoreClass(
                            subject.percentage
                          )}`}
                        >
                          {subject.percentage.toFixed(
                            1
                          )}
                          %
                        </span>

                      </div>


                      <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                        <div
                          className="h-full rounded-full bg-purple-600 transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              subject.percentage,
                              100
                            )}%`,
                          }}
                        />

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* =====================================
                QUIZ HISTORY
            ===================================== */}

            <div className="rounded-2xl bg-white p-6 shadow-sm">

              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-900">
                    Quiz History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Your previous AI-generated quiz attempts.
                  </p>

                </div>

                <Link
                  to="/mcq-generator"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-700"
                >
                  <Plus className="h-4 w-4" />

                  Take New Quiz
                </Link>

              </div>


              <div className="space-y-4">

                {attempts.map((attempt) => {

                  const percentage = Number(
                    attempt.score_percentage
                  );

                  return (
                    <div
                      key={attempt.id}
                      className="rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:border-purple-100 hover:shadow-sm"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* QUIZ INFORMATION */}

                        <div className="flex min-w-0 items-start gap-4">

                          <div className="hidden h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100 sm:flex">

                            <BookOpen className="h-6 w-6 text-purple-600" />

                          </div>

                          <div className="min-w-0">

                            <h3 className="truncate text-lg font-bold text-gray-900">
                              {attempt.subject}
                            </h3>

                            <p className="mt-1 text-sm text-gray-500">
                              {attempt.topic}
                            </p>


                            <div className="mt-3 flex flex-wrap items-center gap-2">

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getDifficultyClass(
                                  attempt.difficulty
                                )}`}
                              >
                                {attempt.difficulty}
                              </span>


                              <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">

                                <Target className="h-3.5 w-3.5" />

                                {
                                  attempt.total_questions
                                }{" "}
                                Questions

                              </span>


                              <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600">

                                <Calendar className="h-3.5 w-3.5" />

                                {formatDate(
                                  attempt.created_at
                                )}

                              </span>

                            </div>

                          </div>

                        </div>


                        {/* SCORE */}

                        <div className="flex items-center justify-between gap-6 lg:justify-end">

                          <div className="text-center">

                            <div className="flex items-center justify-center gap-2">

                              <Trophy
                                className={`h-5 w-5 ${getScoreClass(
                                  percentage
                                )}`}
                              />

                              <span
                                className={`text-2xl font-bold ${getScoreClass(
                                  percentage
                                )}`}
                              >
                                {percentage.toFixed(
                                  0
                                )}
                                %
                              </span>

                            </div>

                            <p className="mt-1 text-xs text-gray-500">

                              {
                                attempt.correct_answers
                              }
                              /
                              {
                                attempt.total_questions
                              }{" "}
                              correct

                            </p>

                          </div>


                          {/* DELETE */}

                          {attempt.id && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  attempt.id!
                                )
                              }
                              className="rounded-lg p-2 text-gray-400 transition hover:bg-red-100 hover:text-red-600"
                              title="Delete quiz attempt"
                            >

                              <Trash2 className="h-5 w-5" />

                            </button>
                          )}

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>

            </div>

          </>
        )}

      </div>

    </div>
  );
};

export default MCQHistory;