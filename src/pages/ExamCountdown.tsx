import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  BookOpen,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import {
  getExams,
  addExam,
  updateExam,
  deleteExam,
  getExamCountdown,
} from "../services/examService";


import type { Exam } from "../services/examService";

type FilterType = "all" | "upcoming" | "passed";

const ExamCountdown = () => {
  const [exams, setExams] = useState<Exam[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const [showModal, setShowModal] = useState(false);

  const [editingExam, setEditingExam] =
    useState<Exam | null>(null);

  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [description, setDescription] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * This state is used to refresh the countdown
   * every second.
   */
  const [, setCurrentTime] = useState(new Date());

  /* =========================================
     LOAD EXAMS
  ========================================= */

  const loadExams = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getExams();

      setExams(data);
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed to load exams"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  /* =========================================
     COUNTDOWN REFRESH
  ========================================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* =========================================
     OPEN ADD MODAL
  ========================================= */

  const openAddModal = () => {
    setEditingExam(null);

    setSubject("");
    setExamDate("");
    setDescription("");

    setError("");

    setShowModal(true);
  };

  /* =========================================
     OPEN EDIT MODAL
  ========================================= */

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);

    setSubject(exam.subject);

    /*
     * Convert ISO date into datetime-local format
     */

    const date = new Date(exam.exam_date);

    const localDate = new Date(
      date.getTime() -
        date.getTimezoneOffset() * 60000
    )
      .toISOString()
      .slice(0, 16);

    setExamDate(localDate);

    setDescription(
      exam.description || ""
    );

    setError("");

    setShowModal(true);
  };

  /* =========================================
     CLOSE MODAL
  ========================================= */

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);

    setEditingExam(null);

    setSubject("");
    setExamDate("");
    setDescription("");
  };

  /* =========================================
     SAVE EXAM
  ========================================= */

  const handleSaveExam = async () => {
    setError("");
    setSuccess("");

    if (!subject.trim()) {
      setError("Please enter the subject.");
      return;
    }

    if (!examDate) {
      setError("Please select the exam date.");
      return;
    }

    const selectedDate = new Date(examDate);

    if (selectedDate <= new Date()) {
      setError(
        "Exam date must be in the future."
      );
      return;
    }

    try {
      setSaving(true);

      if (editingExam?.id) {
        await updateExam(
          editingExam.id,
          subject,
          selectedDate.toISOString(),
          description
        );

        setSuccess(
          "Exam updated successfully!"
        );
      } else {
        await addExam(
          subject,
          selectedDate.toISOString(),
          description
        );

        setSuccess(
          "Exam added successfully!"
        );
      }

      closeModal();

      await loadExams();
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed to save exam"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     DELETE EXAM
  ========================================= */

  const handleDeleteExam = async (
    exam: Exam
  ) => {
    if (!exam.id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the ${exam.subject} exam?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteExam(exam.id);

      setExams((previous) =>
        previous.filter(
          (item) => item.id !== exam.id
        )
      );

      setSuccess(
        "Exam deleted successfully!"
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed to delete exam"
      );
    }
  };

  /* =========================================
     FILTER EXAMS
  ========================================= */

  const filteredExams = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return exams.filter((exam) => {
      const countdown = getExamCountdown(
        exam.exam_date
      );

      const matchesSearch =
        exam.subject
          .toLowerCase()
          .includes(searchText) ||
        (exam.description || "")
          .toLowerCase()
          .includes(searchText);

      let matchesFilter = true;

      if (filter === "upcoming") {
        matchesFilter = !countdown.expired;
      }

      if (filter === "passed") {
        matchesFilter = countdown.expired;
      }

      return (
        matchesSearch && matchesFilter
      );
    });
  }, [exams, search, filter]);

  /* =========================================
     FORMAT DATE
  ========================================= */

  const formatExamDate = (
    date?: string
  ) => {
    if (!date) return "";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  /* =========================================
     COUNTDOWN DISPLAY
  ========================================= */

  const CountdownBox = ({
    value,
    label,
  }: {
    value: number;
    label: string;
  }) => {
    return (
      <div className="min-w-[58px] rounded-xl bg-gray-50 px-2 py-3 text-center">
        <div className="text-xl font-bold text-gray-900">
          {String(value).padStart(2, "0")}
        </div>

        <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
          {label}
        </div>
      </div>
    );
  };

  /* =========================================
     SUMMARY
  ========================================= */

  const upcomingCount = exams.filter(
    (exam) =>
      !getExamCountdown(exam.exam_date)
        .expired
  ).length;

  const passedCount = exams.filter(
    (exam) =>
      getExamCountdown(exam.exam_date)
        .expired
  ).length;

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">

        <div className="flex items-center gap-3">

          <div className="rounded-2xl bg-blue-100 p-3">
            <CalendarDays className="h-7 w-7 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Exam Countdown
            </h1>

            <p className="text-sm text-gray-500">
              Keep track of your upcoming exams
            </p>
          </div>

        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add Exam
        </button>

      </div>


      {/* =====================================
          ALERTS
      ===================================== */}

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>

          <button
            onClick={() => setError("")}
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}


      {success && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>{success}</span>
          </div>

          <button
            onClick={() => setSuccess("")}
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}


      {/* =====================================
          SUMMARY CARDS
      ===================================== */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <div className="mb-3 flex items-center justify-between">

            <span className="text-sm text-gray-500">
              Total Exams
            </span>

            <BookOpen className="h-5 w-5 text-blue-500" />

          </div>

          <p className="text-3xl font-bold text-gray-900">
            {exams.length}
          </p>

        </div>


        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <div className="mb-3 flex items-center justify-between">

            <span className="text-sm text-gray-500">
              Upcoming
            </span>

            <Clock className="h-5 w-5 text-green-500" />

          </div>

          <p className="text-3xl font-bold text-gray-900">
            {upcomingCount}
          </p>

        </div>


        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <div className="mb-3 flex items-center justify-between">

            <span className="text-sm text-gray-500">
              Completed
            </span>

            <CheckCircle2 className="h-5 w-5 text-gray-400" />

          </div>

          <p className="text-3xl font-bold text-gray-900">
            {passedCount}
          </p>

        </div>

      </div>


      {/* =====================================
          SEARCH + FILTER
      ===================================== */}

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row">

          {/* Search */}

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search by subject..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500"
            />

          </div>


          {/* Filter */}

          <div className="flex gap-2">

            <button
              onClick={() =>
                setFilter("all")
              }
              className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All
            </button>

            <button
              onClick={() =>
                setFilter("upcoming")
              }
              className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                filter === "upcoming"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Upcoming
            </button>

            <button
              onClick={() =>
                setFilter("passed")
              }
              className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                filter === "passed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Completed
            </button>

          </div>

        </div>

      </div>


      {/* =====================================
          LOADING
      ===================================== */}

      {loading && (
        <div className="py-16 text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-500">
            Loading exams...
          </p>

        </div>
      )}


      {/* =====================================
          EMPTY
      ===================================== */}

      {!loading &&
        filteredExams.length === 0 && (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

            <CalendarDays className="mx-auto mb-4 h-14 w-14 text-gray-300" />

            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              No exams found
            </h2>

            <p className="mb-6 text-gray-500">
              Add your upcoming exams to start
              your countdown.
            </p>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Exam
            </button>

          </div>
        )}


      {/* =====================================
          EXAM CARDS
      ===================================== */}

      {!loading &&
        filteredExams.length > 0 && (

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            {filteredExams.map((exam) => {

              const countdown =
                getExamCountdown(
                  exam.exam_date
                );

              return (
                <div
                  key={exam.id}
                  className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  {/* Card Header */}

                  <div className="mb-5 flex items-start justify-between">

                    <div className="flex items-start gap-3">

                      <div className="rounded-xl bg-blue-100 p-3">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>

                      <div>

                        <h2 className="text-lg font-bold text-gray-900">
                          {exam.subject}
                        </h2>

                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <CalendarDays className="h-4 w-4" />
                          {formatExamDate(
                            exam.exam_date
                          )}
                        </div>

                      </div>

                    </div>


                    {/* Actions */}

                    <div className="flex gap-1">

                      <button
                        onClick={() =>
                          openEditModal(exam)
                        }
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteExam(
                            exam
                          )
                        }
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                    </div>

                  </div>


                  {/* Description */}

                  {exam.description && (
                    <p className="mb-5 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                      {exam.description}
                    </p>
                  )}


                  {/* Countdown */}

                  {countdown.expired ? (

                    <div className="rounded-xl bg-gray-100 p-4 text-center">

                      <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-gray-500" />

                      <p className="font-semibold text-gray-600">
                        Exam Completed
                      </p>

                    </div>

                  ) : (

                    <div>

                      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-600">

                        <Clock className="h-4 w-4" />

                        Time Remaining

                      </div>

                      <div className="grid grid-cols-4 gap-2">

                        <CountdownBox
                          value={
                            countdown.days
                          }
                          label="Days"
                        />

                        <CountdownBox
                          value={
                            countdown.hours
                          }
                          label="Hours"
                        />

                        <CountdownBox
                          value={
                            countdown.minutes
                          }
                          label="Minutes"
                        />

                        <CountdownBox
                          value={
                            countdown.seconds
                          }
                          label="Seconds"
                        />

                      </div>

                    </div>

                  )}

                </div>
              );
            })}

          </div>
        )}


      {/* =====================================
          ADD / EDIT MODAL
      ===================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            {/* Modal Header */}

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  {editingExam
                    ? "Edit Exam"
                    : "Add Exam"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {editingExam
                    ? "Update your exam details."
                    : "Add an upcoming exam to your schedule."}
                </p>

              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            {/* Subject */}

            <div className="mb-4">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(e) =>
                  setSubject(e.target.value)
                }
                placeholder="Example: Data Structures"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* Exam Date */}

            <div className="mb-4">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Exam Date & Time
              </label>

              <input
                type="datetime-local"
                value={examDate}
                onChange={(e) =>
                  setExamDate(e.target.value)
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* Description */}

            <div className="mb-6">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
                <span className="ml-1 text-gray-400">
                  (Optional)
                </span>
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                rows={3}
                placeholder="Example: Prepare Unit 1, 2 and 3"
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* Buttons */}

            <div className="flex gap-3">

              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveExam}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {saving ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />

                    {editingExam
                      ? "Update Exam"
                      : "Add Exam"}
                  </>
                )}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};

export default ExamCountdown;