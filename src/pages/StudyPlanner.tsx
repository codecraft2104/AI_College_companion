import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Circle,
  CalendarDays,
  Clock,
  BookOpen,
  Target,
  AlertCircle,
} from "lucide-react";

import {
  getStudyTasks,
  addStudyTask,
  updateStudyTask,
  toggleStudyTask,
  deleteStudyTask,
} from "../services/studyTaskService";

import type { StudyTask } from "../services/studyTaskService";

type Priority = "low" | "medium" | "high";
type FilterType = "all" | "pending" | "completed" | "overdue";

const StudyPlanner = () => {
  const [tasks, setTasks] = useState<StudyTask[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [filter, setFilter] = useState<FilterType>("all");

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] =
    useState<StudyTask | null>(null);

  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [studyDate, setStudyDate] = useState("");
  const [studyTime, setStudyTime] = useState("");
  const [priority, setPriority] =
    useState<Priority>("medium");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================
     LOAD TASKS
  ========================================= */

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStudyTasks();

      setTasks(data);
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed to load study tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  /* =========================================
     SUBJECTS
  ========================================= */

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(
      new Set(
        tasks
          .map((task) => task.subject)
          .filter(Boolean)
      )
    );

    return ["All", ...uniqueSubjects];
  }, [tasks]);

  /* =========================================
     DATE HELPERS
  ========================================= */

  const isOverdue = (task: StudyTask) => {
    if (task.completed) return false;

    const taskDateTime = task.study_time
      ? new Date(
          `${task.study_date}T${task.study_time}`
        )
      : new Date(
          `${task.study_date}T23:59:59`
        );

    return taskDateTime < new Date();
  };

  const isToday = (date: string) => {
    const today = new Date();

    const localDate = today
      .toISOString()
      .split("T")[0];

    return date === localDate;
  };

  /* =========================================
     FILTER TASKS
  ========================================= */

  const filteredTasks = useMemo(() => {
    const searchText =
      search.toLowerCase().trim();

    return tasks.filter((task) => {
      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(searchText) ||
        task.subject
          .toLowerCase()
          .includes(searchText) ||
        (task.description || "")
          .toLowerCase()
          .includes(searchText);

      const matchesSubject =
        selectedSubject === "All" ||
        task.subject === selectedSubject;

      let matchesFilter = true;

      if (filter === "pending") {
        matchesFilter = !task.completed;
      }

      if (filter === "completed") {
        matchesFilter = task.completed;
      }

      if (filter === "overdue") {
        matchesFilter = isOverdue(task);
      }

      return (
        matchesSearch &&
        matchesSubject &&
        matchesFilter
      );
    });
  }, [
    tasks,
    search,
    selectedSubject,
    filter,
  ]);

  /* =========================================
     SUMMARY
  ========================================= */

  const completedCount = tasks.filter(
    (task) => task.completed
  ).length;

  const pendingCount = tasks.filter(
    (task) => !task.completed
  ).length;

  const overdueCount = tasks.filter(
    (task) => isOverdue(task)
  ).length;

  const progress =
    tasks.length === 0
      ? 0
      : Math.round(
          (completedCount / tasks.length) * 100
        );

  /* =========================================
     MODAL
  ========================================= */

  const openAddModal = () => {
    setEditingTask(null);

    setSubject("");
    setTitle("");
    setDescription("");
    setStudyDate("");
    setStudyTime("");
    setPriority("medium");

    setError("");

    setShowModal(true);
  };

  const openEditModal = (
    task: StudyTask
  ) => {
    setEditingTask(task);

    setSubject(task.subject);
    setTitle(task.title);
    setDescription(task.description || "");
    setStudyDate(task.study_date);
    setStudyTime(task.study_time || "");
    setPriority(task.priority);

    setError("");

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingTask(null);

    setSubject("");
    setTitle("");
    setDescription("");
    setStudyDate("");
    setStudyTime("");
    setPriority("medium");
  };

  /* =========================================
     SAVE TASK
  ========================================= */

  const handleSaveTask = async () => {
    setError("");
    setSuccess("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a task title.");
      return;
    }

    if (!studyDate) {
      setError("Please select a study date.");
      return;
    }

    try {
      setSaving(true);

      if (editingTask?.id) {
        await updateStudyTask(
          editingTask.id,
          subject,
          title,
          description,
          studyDate,
          studyTime,
          priority,
          editingTask.completed
        );

        setSuccess(
          "Study task updated successfully!"
        );
      } else {
        await addStudyTask(
          subject,
          title,
          description,
          studyDate,
          studyTime,
          priority
        );

        setSuccess(
          "Study task added successfully!"
        );
      }

      closeModal();

      await loadTasks();
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Failed to save study task"
      );
    } finally {
      setSaving(false);
    }
  };

  /* =========================================
     TOGGLE TASK
  ========================================= */

  const handleToggle = async (
    task: StudyTask
  ) => {
    if (!task.id) return;

    try {
      const updatedTask =
        await toggleStudyTask(
          task.id,
          !task.completed
        );

      setTasks((previous) =>
        previous.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Failed to update task"
      );
    }
  };

  /* =========================================
     DELETE
  ========================================= */

  const handleDelete = async (
    task: StudyTask
  ) => {
    if (!task.id) return;

    const confirmed = window.confirm(
      `Delete "${task.title}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteStudyTask(task.id);

      setTasks((previous) =>
        previous.filter(
          (item) => item.id !== task.id
        )
      );

      setSuccess(
        "Study task deleted successfully!"
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err.message ||
          "Failed to delete study task"
      );
    }
  };

  /* =========================================
     DATE FORMAT
  ========================================= */

  const formatDate = (
    date: string
  ) => {
    return new Date(
      `${date}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /* =========================================
     PRIORITY STYLE
  ========================================= */

  const getPriorityStyle = (
    value: Priority
  ) => {
    if (value === "high") {
      return "bg-red-50 text-red-600";
    }

    if (value === "medium") {
      return "bg-yellow-50 text-yellow-600";
    }

    return "bg-green-50 text-green-600";
  };

  /* =========================================
     UI
  ========================================= */

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">

      {/* HEADER */}

      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">

        <div className="flex items-center gap-3">

          <div className="rounded-2xl bg-blue-100 p-3">
            <Target className="h-7 w-7 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Study Planner
            </h1>

            <p className="text-sm text-gray-500">
              Organize your daily study goals
            </p>
          </div>

        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add Task
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>

          <button
            onClick={() => setError("")}
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}


      {/* SUCCESS */}

      {success && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </div>

          <button
            onClick={() => setSuccess("")}
          >
            <X className="h-4 w-4" />
          </button>

        </div>
      )}


      {/* PROGRESS */}

      <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">

        <div className="mb-3 flex items-center justify-between">

          <div>
            <p className="text-sm text-gray-500">
              Overall Progress
            </p>

            <p className="text-2xl font-bold text-gray-900">
              {progress}%
            </p>
          </div>

          <div className="text-right text-sm text-gray-500">
            {completedCount} of{" "}
            {tasks.length} completed
          </div>

        </div>

        <div className="h-3 overflow-hidden rounded-full bg-gray-100">

          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />

        </div>

      </div>


      {/* SUMMARY */}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <div className="mb-3 flex justify-between">

            <span className="text-sm text-gray-500">
              Total Tasks
            </span>

            <BookOpen className="h-5 w-5 text-blue-500" />

          </div>

          <p className="text-3xl font-bold text-gray-900">
            {tasks.length}
          </p>

        </div>


        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <div className="mb-3 flex justify-between">

            <span className="text-sm text-gray-500">
              Pending
            </span>

            <Clock className="h-5 w-5 text-yellow-500" />

          </div>

          <p className="text-3xl font-bold text-gray-900">
            {pendingCount}
          </p>

        </div>


        <div className="rounded-2xl bg-white p-5 shadow-sm">

          <div className="mb-3 flex justify-between">

            <span className="text-sm text-gray-500">
              Overdue
            </span>

            <AlertCircle className="h-5 w-5 text-red-500" />

          </div>

          <p className="text-3xl font-bold text-gray-900">
            {overdueCount}
          </p>

        </div>

      </div>


      {/* SEARCH + FILTER */}

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-4 lg:flex-row">

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search study tasks..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
            />

          </div>


          <select
            value={selectedSubject}
            onChange={(e) =>
              setSelectedSubject(
                e.target.value
              )
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
          >

            {subjects.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item === "All"
                  ? "All Subjects"
                  : item}
              </option>
            ))}

          </select>

        </div>


        {/* FILTER BUTTONS */}

        <div className="mt-4 flex flex-wrap gap-2">

          {(
            [
              ["all", "All"],
              ["pending", "Pending"],
              ["completed", "Completed"],
              ["overdue", "Overdue"],
            ] as [FilterType, string][]
          ).map(([value, label]) => (

            <button
              key={value}
              onClick={() =>
                setFilter(value)
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filter === value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>

          ))}

        </div>

      </div>


      {/* LOADING */}

      {loading && (
        <div className="py-16 text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-500">
            Loading study planner...
          </p>

        </div>
      )}


      {/* EMPTY */}

      {!loading &&
        filteredTasks.length === 0 && (

          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

            <Target className="mx-auto mb-4 h-14 w-14 text-gray-300" />

            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              No study tasks found
            </h2>

            <p className="mb-6 text-gray-500">
              Create your first study task
              to start planning.
            </p>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Add Task
            </button>

          </div>
        )}


      {/* TASKS */}

      {!loading &&
        filteredTasks.length > 0 && (

          <div className="space-y-4">

            {filteredTasks.map(
              (task) => {

                const overdue =
                  isOverdue(task);

                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md ${
                      task.completed
                        ? "opacity-75"
                        : ""
                    }`}
                  >

                    <div className="flex items-start gap-4">

                      {/* CHECK */}

                      <button
                        onClick={() =>
                          handleToggle(task)
                        }
                        className="mt-1 flex-shrink-0"
                        title={
                          task.completed
                            ? "Mark incomplete"
                            : "Mark complete"
                        }
                      >

                        {task.completed ? (
                          <CheckCircle2 className="h-7 w-7 text-green-500" />
                        ) : (
                          <Circle className="h-7 w-7 text-gray-300 hover:text-blue-500" />
                        )}

                      </button>


                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">

                        <div className="mb-2 flex flex-wrap items-center gap-2">

                          <h2
                            className={`text-lg font-semibold ${
                              task.completed
                                ? "text-gray-400 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </h2>

                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize ${getPriorityStyle(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>

                        </div>


                        <div className="mb-2 flex flex-wrap gap-4 text-sm text-gray-500">

                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {task.subject}
                          </span>

                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(
                              task.study_date
                            )}
                          </span>

                          {task.study_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {task.study_time.slice(
                                0,
                                5
                              )}
                            </span>
                          )}

                        </div>


                        {task.description && (
                          <p className="mb-2 text-sm text-gray-500">
                            {task.description}
                          </p>
                        )}


                        {!task.completed &&
                          isToday(
                            task.study_date
                          ) && (
                            <span className="mr-2 inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                              Today
                            </span>
                          )}


                        {overdue && (
                          <span className="inline-flex rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                            Overdue
                          </span>
                        )}

                      </div>


                      {/* ACTIONS */}

                      <div className="flex flex-shrink-0 gap-1">

                        <button
                          onClick={() =>
                            openEditModal(task)
                          }
                          className="rounded-lg p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(task)
                          }
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>
        )}


      {/* =====================================
          ADD / EDIT MODAL
      ===================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">

            {/* HEADER */}

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-xl font-bold text-gray-900">
                  {editingTask
                    ? "Edit Study Task"
                    : "Add Study Task"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Plan what you want to study.
                </p>

              </div>

              <button
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            {/* SUBJECT */}

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
                placeholder="Example: Operating Systems"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* TASK TITLE */}

            <div className="mb-4">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Task
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Example: Revise Process Scheduling"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* DESCRIPTION */}

            <div className="mb-4">

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
                placeholder="Add study details..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* DATE */}

            <div className="mb-4">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Study Date
              </label>

              <input
                type="date"
                value={studyDate}
                onChange={(e) =>
                  setStudyDate(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* TIME */}

            <div className="mb-4">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Study Time
                <span className="ml-1 text-gray-400">
                  (Optional)
                </span>
              </label>

              <input
                type="time"
                value={studyTime}
                onChange={(e) =>
                  setStudyTime(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* PRIORITY */}

            <div className="mb-6">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Priority
              </label>

              <div className="grid grid-cols-3 gap-2">

                {(
                  [
                    "low",
                    "medium",
                    "high",
                  ] as Priority[]
                ).map((item) => (

                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setPriority(item)
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-medium capitalize ${
                      priority === item
                        ? getPriorityStyle(
                            item
                          ) +
                          " border-current"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {item}
                  </button>

                ))}

              </div>

            </div>


            {/* BUTTONS */}

            <div className="flex gap-3">

              <button
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveTask}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >

                {saving ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />

                    {editingTask
                      ? "Update Task"
                      : "Add Task"}
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

export default StudyPlanner;