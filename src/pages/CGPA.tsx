import { useEffect, useState } from "react";
import {
  getSemesterResults,
  saveSemesterResult,
  deleteSemesterResult,
  type SemesterResult,
} from "../services/cgpaService";

function CGPA() {
  const [semesters, setSemesters] = useState<SemesterResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSemester, setSavingSemester] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Load saved semester results
  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getSemesterResults();

      setSemesters(data);
    } catch (err) {
      console.error("Error loading semester results:", err);
      setError("Unable to load your semester results.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate CGPA
  const calculateCGPA = () => {
    if (semesters.length === 0) {
      return 0;
    }

    let totalCredits = 0;
    let totalWeightedPoints = 0;

    semesters.forEach((semester) => {
      totalCredits += Number(semester.credits);

      totalWeightedPoints +=
        Number(semester.sgpa) * Number(semester.credits);
    });

    if (totalCredits === 0) {
      return 0;
    }

    return Number(
      (totalWeightedPoints / totalCredits).toFixed(2)
    );
  };

  const cgpa = calculateCGPA();

  // Add new semester
  const addSemester = () => {
    if (semesters.length >= 8) {
      return;
    }

    const existingSemesters = semesters.map(
      (semester) => semester.semester
    );

    let nextSemester = 1;

    while (existingSemesters.includes(nextSemester)) {
      nextSemester++;
    }

    setSemesters([
      ...semesters,
      {
        semester: nextSemester,
        sgpa: 0,
        credits: 0,
      },
    ].sort((a, b) => a.semester - b.semester));
  };

  // Update semester locally
  const updateSemester = (
    semesterNumber: number,
    field: "sgpa" | "credits",
    value: number
  ) => {
    setSemesters(
      semesters.map((semester) =>
        semester.semester === semesterNumber
          ? {
              ...semester,
              [field]: value,
            }
          : semester
      )
    );
  };

  // Save semester to Supabase
  const handleSaveSemester = async (
    semester: SemesterResult
  ) => {
    try {
      setSavingSemester(semester.semester);
      setError("");

      const savedSemester = await saveSemesterResult(
        semester.semester,
        Number(semester.sgpa),
        Number(semester.credits)
      );

      setSemesters((current) =>
        current.map((item) =>
          item.semester === semester.semester
            ? savedSemester
            : item
        )
      );
    } catch (err) {
      console.error("Error saving semester:", err);
      setError("Unable to save semester result.");
    } finally {
      setSavingSemester(null);
    }
  };

  // Delete semester
  const handleDeleteSemester = async (
    semesterNumber: number
  ) => {
    try {
      setError("");

      await deleteSemesterResult(semesterNumber);

      setSemesters((current) =>
        current.filter(
          (semester) =>
            semester.semester !== semesterNumber
        )
      );
    } catch (err) {
      console.error("Error deleting semester:", err);
      setError("Unable to delete semester.");
    }
  };

  return (
    <main className="flex-1 px-6 py-8">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            CGPA Calculator
          </h1>

          <p className="mt-2 text-slate-500">
            Calculate your overall cumulative grade point average.
          </p>
        </div>

        <button
          onClick={addSemester}
          disabled={semesters.length >= 8}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          + Add Semester
        </button>

      </div>

      {/* Error */}

      {error && (
        <div className="mt-6 max-w-xl bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Loading */}

      {loading ? (
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">
          <p className="text-slate-500">
            Loading your semester results...
          </p>
        </div>
      ) : (
        <>
          {/* CGPA Result */}

          <div className="mt-8 bg-white rounded-2xl shadow-sm p-8 max-w-xl">

            <p className="text-sm text-slate-500">
              Current CGPA
            </p>

            <h2 className="mt-2 text-5xl font-bold text-blue-600">
              {cgpa.toFixed(2)}
            </h2>

            <p className="mt-3 text-slate-500">
              Based on your semester results.
            </p>

          </div>

          {/* Semester Results */}

          <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">

            <h2 className="text-xl font-semibold text-slate-800">
              Semester Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter your SGPA and total credits for each semester.
            </p>

            {semesters.length === 0 ? (
              <div className="mt-6 text-center py-10">
                <p className="text-slate-500">
                  No semester results added yet.
                </p>

                <button
                  onClick={addSemester}
                  className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Semester 1
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">

                {semesters.map((semester) => (

                  <div
                    key={semester.semester}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border rounded-xl p-4"
                  >

                    {/* Semester */}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Semester
                      </label>

                      <div className="border rounded-lg px-4 py-3 bg-slate-50">
                        Semester {semester.semester}
                      </div>
                    </div>

                    {/* SGPA */}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        SGPA
                      </label>

                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.01"
                        value={semester.sgpa}
                        onChange={(e) =>
                          updateSemester(
                            semester.semester,
                            "sgpa",
                            Number(e.target.value)
                          )
                        }
                        className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Credits */}

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Total Credits
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={semester.credits}
                        onChange={(e) =>
                          updateSemester(
                            semester.semester,
                            "credits",
                            Number(e.target.value)
                          )
                        }
                        className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Actions */}

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          handleSaveSemester(semester)
                        }
                        disabled={
                          savingSemester === semester.semester
                        }
                        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
                      >
                        {savingSemester === semester.semester
                          ? "Saving..."
                          : "Save"}
                      </button>

                      <button
                        onClick={() =>
                          handleDeleteSemester(
                            semester.semester
                          )
                        }
                        className="px-4 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                ))}

              </div>
            )}

          </div>
        </>
      )}

    </main>
  );
}

export default CGPA;