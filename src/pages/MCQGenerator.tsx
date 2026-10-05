import { useState } from "react";
import {
  Brain,
  Sparkles,
  BookOpen,
  Target,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  saveMCQAttempt,
} from "../services/mcqHistoryService";


import {
  generateMCQs,
} from "../services/mcqService";

import type { MCQ } from "../services/mcqService";

type Difficulty = "easy" | "medium" | "hard";

const MCQGenerator = () => {
  // =========================================
  // GENERATOR STATE
  // =========================================

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");

  const [numberOfQuestions, setNumberOfQuestions] =
    useState(10);

  const [difficulty, setDifficulty] =
    useState<Difficulty>("medium");

  // =========================================
  // QUIZ STATE
  // =========================================

  const [questions, setQuestions] =
    useState<MCQ[]>([]);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [selectedAnswer, setSelectedAnswer] =
    useState<number | null>(null);

  const [score, setScore] = useState(0);

  const [quizFinished, setQuizFinished] =
    useState(false);

  const [showExplanation, setShowExplanation] =
    useState(false);

  // =========================================
  // UI STATE
  // =========================================

  const [loading, setLoading] =
    useState(false);

  const [savingResult, setSavingResult] =
    useState(false);

  const [saveError, setSaveError] =
    useState("");

  const [error, setError] =
    useState("");

  // =========================================
  // GENERATE QUESTIONS
  // =========================================

  const handleGenerate = async () => {
    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (
      numberOfQuestions < 1 ||
      numberOfQuestions > 20
    ) {
      setError(
        "Please choose between 1 and 20 questions."
      );
      return;
    }

    try {
      setLoading(true);

      const generatedQuestions =
        await generateMCQs({
          subject: subject.trim(),
          topic: topic.trim(),
          numberOfQuestions,
          difficulty,
        });

      if (
        !generatedQuestions ||
        generatedQuestions.length === 0
      ) {
        throw new Error(
          "No questions were generated."
        );
      }

      setQuestions(generatedQuestions);

      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setScore(0);
      setQuizFinished(false);
      setShowExplanation(false);
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Failed to generate questions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // SELECT ANSWER
  // =========================================

  const handleSelectAnswer = (
    answerIndex: number
  ) => {
    if (
      selectedAnswer !== null ||
      showExplanation
    ) {
      return;
    }

    setSelectedAnswer(answerIndex);

    const question =
      questions[currentQuestion];

    if (
      answerIndex ===
      question.correctAnswer
    ) {
      setScore((previous) => previous + 1);
    }

    setShowExplanation(true);
  };

  // =========================================
  // NEXT QUESTION
  // =========================================

  const handleNextQuestion = async () => {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) => previous + 1
      );

      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      // =========================================
      // QUIZ FINISHED
      // =========================================

      try {
        setSavingResult(true);
        setSaveError("");

        await saveMCQAttempt({
          subject,
          topic,
          difficulty,
          totalQuestions:
            questions.length,
          correctAnswers: score,
        });

        setQuizFinished(true);
      } catch (error) {
        console.error(
          "Failed to save MCQ result:",
          error
        );

        setSaveError(
          error instanceof Error
            ? error.message
            : "Failed to save quiz result."
        );

        // Still show the result even if saving fails
        setQuizFinished(true);
      } finally {
        setSavingResult(false);
      }
    }
  };

  // =========================================
  // RETRY QUIZ
  // =========================================

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setShowExplanation(false);
  };

  // =========================================
  // BACK TO GENERATOR
  // =========================================

  const handleBackToGenerator = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setQuizFinished(false);
    setShowExplanation(false);
    setError("");
  };

  // =========================================
  // SCORE MESSAGE
  // =========================================

  const getScoreMessage = () => {
    const percentage =
      (score / questions.length) * 100;

    if (percentage >= 90) {
      return "Excellent work! 🎉";
    }

    if (percentage >= 75) {
      return "Great job! 👏";
    }

    if (percentage >= 50) {
      return "Good effort! Keep practicing. 💪";
    }

    return "Keep learning and try again! 📚";
  };

  // =========================================
  // GENERATOR SCREEN
  // =========================================

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">

        {/* HEADER */}

        <div className="mx-auto max-w-4xl">

          <div className="mb-8 text-center">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100">
              <Brain className="h-9 w-9 text-purple-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
              AI MCQ Generator
            </h1>

            <p className="mt-2 text-gray-500">
              Generate personalized multiple-choice
              questions using AI.
            </p>

          </div>


          {/* ERROR */}

          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              <AlertCircle className="h-5 w-5 flex-shrink-0" />

              <span>{error}</span>

            </div>
          )}


          {/* FORM */}

          <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">

            <div className="mb-7 flex items-center gap-3">

              <div className="rounded-xl bg-purple-100 p-3">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>

              <div>

                <h2 className="font-semibold text-gray-900">
                  Create Your Quiz
                </h2>

                <p className="text-sm text-gray-500">
                  Choose what you want to practice.
                </p>

              </div>

            </div>


            {/* SUBJECT */}

            <div className="mb-5">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subject
              </label>

              <div className="relative">

                <BookOpen className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

                <input
                  type="text"
                  value={subject}
                  onChange={(e) =>
                    setSubject(e.target.value)
                  }
                  placeholder="Example: Data Structures"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />

              </div>

            </div>


            {/* TOPIC */}

            <div className="mb-5">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Topic
              </label>

              <input
                type="text"
                value={topic}
                onChange={(e) =>
                  setTopic(e.target.value)
                }
                placeholder="Example: Binary Trees"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

            </div>


            {/* QUESTIONS + DIFFICULTY */}

            <div className="mb-7 grid gap-5 md:grid-cols-2">

              {/* NUMBER */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Number of Questions
                </label>

                <select
                  value={numberOfQuestions}
                  onChange={(e) =>
                    setNumberOfQuestions(
                      Number(e.target.value)
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-purple-500"
                >

                  <option value={5}>
                    5 Questions
                  </option>

                  <option value={10}>
                    10 Questions
                  </option>

                  <option value={15}>
                    15 Questions
                  </option>

                  <option value={20}>
                    20 Questions
                  </option>

                </select>

              </div>


              {/* DIFFICULTY */}

              <div>

                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Difficulty
                </label>

                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(
                      e.target.value as Difficulty
                    )
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 capitalize outline-none focus:border-purple-500"
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

            </div>


            {/* GENERATE BUTTON */}

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />

                  Generating Questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />

                  Generate MCQs
                </>
              )}

            </button>


            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">

              <Target className="h-4 w-4" />

              AI-generated questions for your
              learning practice

            </div>

          </div>

        </div>

      </div>
    );
  }


  // =========================================
  // QUIZ FINISHED SCREEN
  // =========================================

  if (quizFinished) {
    const percentage = Math.round(
      (score / questions.length) * 100
    );

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">

        <div className="mx-auto max-w-2xl">

          <div className="rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">

            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-purple-100">

              <CheckCircle2 className="h-12 w-12 text-purple-600" />

            </div>


            <h1 className="text-3xl font-bold text-gray-900">
              Quiz Completed!
            </h1>

            <p className="mt-3 text-gray-500">
              {getScoreMessage()}
            </p>

            {saveError && (
              <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                Your quiz is complete, but the result could not
                be saved.
                <br />
                {saveError}
              </div>
            )}

            {/* SCORE */}

            <div className="my-8 rounded-2xl bg-gray-50 p-6">

              <p className="text-sm text-gray-500">
                Your Score
              </p>

              <p className="mt-2 text-5xl font-bold text-purple-600">
                {score}/{questions.length}
              </p>

              <p className="mt-2 text-lg font-medium text-gray-700">
                {percentage}%
              </p>

            </div>


            {/* BUTTONS */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <button
                onClick={handleRetry}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
              >

                <RotateCcw className="h-5 w-5" />

                Retry Quiz

              </button>


              <button
                onClick={
                  handleBackToGenerator
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
              >

                <ArrowLeft className="h-5 w-5" />

                New Quiz

              </button>

            </div>

          </div>

        </div>

      </div>
    );
  }


  // =========================================
  // QUIZ SCREEN
  // =========================================

  const question =
    questions[currentQuestion];

  const progress =
    ((currentQuestion + 1) /
      questions.length) *
    100;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 md:px-8">

      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between">

          <button
            onClick={
              handleBackToGenerator
            }
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          >

            <ArrowLeft className="h-4 w-4" />

            Exit Quiz

          </button>


          <span className="rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">

            Question {currentQuestion + 1}{" "}
            / {questions.length}

          </span>

        </div>


        {/* PROGRESS */}

        <div className="mb-8 h-2 overflow-hidden rounded-full bg-gray-200">

          <div
            className="h-full rounded-full bg-purple-600 transition-all duration-300"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>


        {/* QUESTION CARD */}

        <div className="rounded-3xl bg-white p-6 shadow-sm md:p-8">

          {/* TOPIC */}

          <div className="mb-6 flex items-center gap-2 text-sm text-purple-600">

            <Brain className="h-5 w-5" />

            {subject} • {topic}

          </div>


          {/* QUESTION */}

          <h1 className="mb-8 text-xl font-bold leading-relaxed text-gray-900 md:text-2xl">

            {question.question}

          </h1>


          {/* OPTIONS */}

          <div className="space-y-3">

            {question.options.map(
              (option, index) => {

                const isSelected =
                  selectedAnswer === index;

                const isCorrect =
                  index ===
                  question.correctAnswer;

                let optionClass =
                  "border-gray-200 hover:border-purple-400 hover:bg-purple-50";

                if (showExplanation) {

                  if (isCorrect) {
                    optionClass =
                      "border-green-400 bg-green-50 text-green-800";
                  } else if (
                    isSelected &&
                    !isCorrect
                  ) {
                    optionClass =
                      "border-red-400 bg-red-50 text-red-800";
                  } else {
                    optionClass =
                      "border-gray-200 bg-gray-50 text-gray-500";
                  }

                } else if (isSelected) {
                  optionClass =
                    "border-purple-500 bg-purple-50";
                }

                return (
                  <button
                    key={index}
                    onClick={() =>
                      handleSelectAnswer(
                        index
                      )
                    }
                    disabled={
                      showExplanation
                    }
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition ${optionClass}`}
                  >

                    {/* OPTION LETTER */}

                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">

                      {String.fromCharCode(
                        65 + index
                      )}

                    </span>


                    <span className="flex-1 font-medium">
                      {option}
                    </span>


                    {/* RESULT ICON */}

                    {showExplanation &&
                      isCorrect && (
                        <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                      )}

                    {showExplanation &&
                      isSelected &&
                      !isCorrect && (
                        <XCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                      )}

                  </button>
                );
              }
            )}

          </div>


          {/* EXPLANATION */}

          {showExplanation && (
            <div
              className={`mt-6 rounded-xl p-4 ${
                selectedAnswer ===
                question.correctAnswer
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >

              <div className="mb-2 flex items-center gap-2">

                {selectedAnswer ===
                question.correctAnswer ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />

                    <span className="font-semibold text-green-700">
                      Correct Answer!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />

                    <span className="font-semibold text-red-700">
                      Incorrect Answer
                    </span>
                  </>
                )}

              </div>

              <p className="text-sm leading-relaxed text-gray-600">
                {question.explanation}
              </p>

            </div>
          )}


          {/* NEXT BUTTON */}

          {showExplanation && (

            <button
              onClick={handleNextQuestion}
              disabled={savingResult}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-semibold text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingResult ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving Result...
                </>
              ) : (
                <>
                  {currentQuestion ===
                  questions.length - 1
                    ? "Finish Quiz"
                    : "Next Question"}

                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          )}

        </div>

      </div>

    </div>
  );
};

export default MCQGenerator;