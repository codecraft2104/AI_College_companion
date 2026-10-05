import { useEffect, useMemo, useState } from "react";

import {
  getNotes,
  addNote,
  updateNote,
  deleteNote,
  type Note,
} from "../services/notesService";

import {
  askAIStudyAssistant,
  type AIStudyMode,
} from "../services/aiStudyService";

function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] =
    useState("all");

  const [showForm, setShowForm] =
    useState(false);

  const [editingNote, setEditingNote] =
    useState<Note | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] =
    useState("");
  const [subject, setSubject] =
    useState("");

  const [aiLoading, setAiLoading] = useState(false);

  const [aiResult, setAiResult] = useState("");

  const [aiError, setAiError] = useState("");

  const [aiNote, setAiNote] = useState<Note | null>(null);

  const [aiMode, setAiMode] =
    useState<AIStudyMode>("explain");

  const handleAI = async (
  note: Note,
  mode: AIStudyMode
) => {
  try {
    setAiLoading(true);
    setAiError("");
    setAiResult("");
    setAiNote(note);
    setAiMode(mode);

    const question = `
I have the following study note.

Title:
${note.title}

Subject:
${note.subject || "General"}

Note Content:
${note.content}

Please process this note according to the requested study mode.
`;

    const result =
      await askAIStudyAssistant(
        question,
        mode
      );

    setAiResult(result);
  } catch (error) {
    console.error(error);

    setAiError(
      error instanceof Error
        ? error.message
        : "Unable to process this note with AI."
    );
  } finally {
    setAiLoading(false);
  }
};
  // ===============================
  // LOAD NOTES
  // ===============================

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotes();

      setNotes(data);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load your notes."
      );
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // OPEN ADD FORM
  // ===============================

  const openAddForm = () => {
    setEditingNote(null);

    setTitle("");
    setContent("");
    setSubject("");

    setShowForm(true);
  };

  // ===============================
  // OPEN EDIT FORM
  // ===============================

  const openEditForm = (
    note: Note
  ) => {
    setEditingNote(note);

    setTitle(note.title);
    setContent(note.content);
    setSubject(note.subject || "");

    setShowForm(true);
  };

  // ===============================
  // SAVE NOTE
  // ===============================

  const handleSave = async () => {
    if (!title.trim()) {
      setError(
        "Please enter a note title."
      );

      return;
    }

    if (!content.trim()) {
      setError(
        "Please enter note content."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      if (editingNote?.id) {
        const updated =
          await updateNote(
            editingNote.id,
            title.trim(),
            content.trim(),
            subject.trim()
          );

        setNotes((current) =>
          current.map((note) =>
            note.id === updated.id
              ? updated
              : note
          )
        );
      } else {
        const created =
          await addNote(
            title.trim(),
            content.trim(),
            subject.trim()
          );

        setNotes((current) => [
          created,
          ...current,
        ]);
      }

      setShowForm(false);

      setTitle("");
      setContent("");
      setSubject("");
      setEditingNote(null);

    } catch (error) {
      console.error(error);

      setError(
        "Unable to save the note."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // DELETE NOTE
  // ===============================

  const handleDelete = async (
    id: string
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this note?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deleteNote(id);

      setNotes((current) =>
        current.filter(
          (note) => note.id !== id
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to delete the note."
      );
    }
  };

  // ===============================
  // SUBJECTS
  // ===============================

  const subjects = useMemo(() => {
    const uniqueSubjects =
      notes
        .map(
          (note) => note.subject
        )
        .filter(
          (subject) =>
            subject &&
            subject.trim() !== ""
        );

    return Array.from(
      new Set(uniqueSubjects)
    );
  }, [notes]);

  // ===============================
  // FILTER NOTES
  // ===============================

  const filteredNotes =
    useMemo(() => {
      return notes.filter((note) => {
        const searchText =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          note.title
            .toLowerCase()
            .includes(searchText) ||
          note.content
            .toLowerCase()
            .includes(searchText) ||
          (note.subject || "")
            .toLowerCase()
            .includes(searchText);

        const matchesSubject =
          subjectFilter === "all" ||
          note.subject ===
            subjectFilter;

        return (
          matchesSearch &&
          matchesSubject
        );
      });
    }, [
      notes,
      search,
      subjectFilter,
    ]);

  // ===============================
  // UI
  // ===============================

  return (
    <main className="flex-1 px-6 py-8">

      {/* HEADER */}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Notes
          </h1>

          <p className="mt-2 text-slate-500">
            Create and organize your study notes.
          </p>
        </div>

        <button
          onClick={openAddForm}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          + Add Note
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* SEARCH + FILTER */}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="md:col-span-2">

          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

        </div>

        <div>

          <select
            value={subjectFilter}
            onChange={(e) =>
              setSubjectFilter(
                e.target.value
              )
            }
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >

            <option value="all">
              All Subjects
            </option>

            {subjects.map(
              (subject) => (
                <option
                  key={subject}
                  value={subject}
                >
                  {subject}
                </option>
              )
            )}

          </select>

        </div>

      </div>

      {/* NOTE FORM */}

      {showForm && (
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">

          <div className="flex items-center justify-between">

            <h2 className="text-xl font-semibold text-slate-800">
              {editingNote
                ? "Edit Note"
                : "Create Note"}
            </h2>

            <button
              onClick={() =>
                setShowForm(false)
              }
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>

          </div>

          <div className="mt-6 space-y-5">

            {/* TITLE */}

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Title
              </label>

              <input
                type="text"
                placeholder="Enter note title"
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

            </div>

            {/* SUBJECT */}

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject
              </label>

              <input
                type="text"
                placeholder="Example: Data Structures"
                value={subject}
                onChange={(e) =>
                  setSubject(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

            </div>

            {/* CONTENT */}

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Content
              </label>

              <textarea
                rows={8}
                placeholder="Write your notes here..."
                value={content}
                onChange={(e) =>
                  setContent(
                    e.target.value
                  )
                }
                className="w-full border rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />

            </div>

            {/* ACTIONS */}

            <div className="flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowForm(false)
                }
                className="px-5 py-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
              >
                {saving
                  ? "Saving..."
                  : editingNote
                  ? "Update Note"
                  : "Save Note"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* NOTES */}

      <div className="mt-8">

        {loading ? (

          <div className="bg-white rounded-2xl p-10 text-center">

            <p className="text-slate-500">
              Loading your notes...
            </p>

          </div>

        ) : filteredNotes.length === 0 ? (

          <div className="bg-white rounded-2xl p-10 text-center">

            <div className="text-4xl">
              📚
            </div>

            <h2 className="mt-4 text-xl font-semibold text-slate-800">
              No notes found
            </h2>

            <p className="mt-2 text-slate-500">
              {notes.length === 0
                ? "Create your first study note."
                : "Try changing your search or subject filter."}
            </p>

            {notes.length === 0 && (
              <button
                onClick={openAddForm}
                className="mt-5 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700"
              >
                + Create Note
              </button>
            )}

          </div>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

            {filteredNotes.map(
              (note) => (

                <div
                  key={note.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="min-w-0">

                      <h2 className="text-lg font-semibold text-slate-800 truncate">
                        {note.title}
                      </h2>

                      {note.subject && (
                        <span className="inline-block mt-2 text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full">
                          {note.subject}
                        </span>
                      )}

                    </div>
                    {/* AI STUDY TOOLS */}

                    

                    <div className="flex gap-1">

                      <button
                        onClick={() =>
                          openEditForm(
                            note
                          )
                        }
                        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                        title="Edit"
                      >
                        ✏️
                      </button>

                      <button
                        onClick={() =>
                          note.id &&
                          handleDelete(
                            note.id
                          )
                        }
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                        title="Delete"
                      >
                        🗑️
                      </button>

                    </div>

                  </div>

                  <p className="mt-4 text-sm text-slate-600 whitespace-pre-line line-clamp-6">
                    {note.content}
                  </p>

                  <div className="mt-5 pt-5 border-t border-slate-100">

                      <p className="text-sm font-semibold text-slate-700 mb-3">
                        🤖 AI Study Tools
                      </p>

                      <div className="flex flex-wrap gap-2">

                        <button
                          onClick={() =>
                            handleAI(note, "explain")
                          }
                          className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          🤖 Explain
                        </button>

                        <button
                          onClick={() =>
                            handleAI(note, "summarize")
                          }
                          className="px-3 py-2 text-sm rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100"
                        >
                          📝 Summarize
                        </button>

                        <button
                          onClick={() =>
                            handleAI(note, "examples")
                          }
                          className="px-3 py-2 text-sm rounded-lg bg-green-50 text-green-600 hover:bg-green-100"
                        >
                          💡 Examples
                        </button>

                        <button
                          onClick={() =>
                            handleAI(note, "quiz")
                          }
                          className="px-3 py-2 text-sm rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100"
                        >
                          ❓ Generate Quiz
                        </button>

                      </div>

                    </div>

                  {note.updated_at && (
                    <p className="mt-5 text-xs text-slate-400">
                      Updated{" "}
                      {new Date(
                        note.updated_at
                      ).toLocaleDateString()}
                    </p>
                  )}

                </div>

              )
            )}

          </div>

        )}

      </div>
      {/* ================= AI RESULT MODAL ================= */}

{aiNote && (
  <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden">

      {/* HEADER */}

      <div className="flex items-center justify-between px-6 py-5 border-b">

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            🤖 AI Study Assistant
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {aiNote.title}
          </p>
        </div>

        <button
          onClick={() => {
            setAiNote(null);
            setAiResult("");
            setAiError("");
          }}
          className="text-slate-400 hover:text-slate-700 text-xl"
        >
          ✕
        </button>

      </div>

      {/* CONTENT */}

      <div className="p-6 overflow-y-auto max-h-[65vh]">

        {aiLoading ? (

          <div className="py-12 text-center">

            <div className="text-4xl mb-4">
              🤖
            </div>

            <p className="text-slate-600 font-medium">
              AI is working on your note...
            </p>

            <p className="text-sm text-slate-400 mt-2">
              Please wait a moment.
            </p>

          </div>

        ) : aiError ? (

          <div className="bg-red-50 border border-red-200 rounded-xl p-5">

            <p className="font-semibold text-red-700">
              AI Error
            </p>

            <p className="text-red-600 mt-2">
              {aiError}
            </p>

          </div>

        ) : (

          <div>

            <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium mb-5">
              {aiMode === "explain" &&
                "🤖 Explanation"}

              {aiMode === "summarize" &&
                "📝 Summary"}

              {aiMode === "examples" &&
                "💡 Examples"}

              {aiMode === "quiz" &&
                "❓ Quiz"}
            </div>

            <div className="whitespace-pre-wrap text-slate-700 leading-7">
              {aiResult}
            </div>

          </div>

        )}

      </div>

      {/* FOOTER */}

      <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">

        <button
          onClick={() => {
            setAiNote(null);
            setAiResult("");
            setAiError("");
          }}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Close
        </button>

      </div>

    </div>

  </div>
)}
    </main>
  );
}

export default Notes;