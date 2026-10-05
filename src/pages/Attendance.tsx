import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getSubjects,
  addSubject,
  getAttendance,
  recordAttendance,
  getAttendanceStatus,
  calculateOverallAttendance,
  getClassesNeededFor75,
  getClassesCanMiss,
} from "../services/attendanceService";

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  subject_id: string;
  attended_classes: number;
  total_classes: number;
  created_at: string;
  updated_at: string;
}

function Attendance() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [adding, setAdding] = useState(false);

  const [attendanceData, setAttendanceData] = useState<
    Record<string, AttendanceRecord | null>
  >({});

  /*
   * Load subjects and attendance
   */
  useEffect(() => {
    const loadSubjects = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getSubjects(user.id);

        setSubjects(data || []);

        const attendanceResults: Record<
          string,
          AttendanceRecord | null
        > = {};

        for (const subject of data || []) {
          const attendance = await getAttendance(
            user.id,
            subject.id
          );

          attendanceResults[subject.id] = attendance;
        }

        setAttendanceData(attendanceResults);
      } catch (error) {
        console.error("Error loading subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [user]);

  /*
   * Add a new subject
   */
  const handleAddSubject = async () => {
    if (!user) return;

    if (!subjectName.trim()) {
      return;
    }

    setAdding(true);

    try {
      const newSubject = await addSubject(
        user.id,
        subjectName.trim(),
        subjectCode.trim()
      );

      setSubjects((currentSubjects) => [
        ...currentSubjects,
        newSubject,
      ]);

      setSubjectName("");
      setSubjectCode("");
      setShowForm(false);
    } catch (error) {
      console.error("Error adding subject:", error);
    } finally {
      setAdding(false);
    }
  };

  /*
   * Record Present / Absent
   */
  const handleAttendance = async (
    subjectId: string,
    present: boolean
  ) => {
    if (!user) return;

    try {
      const updatedAttendance = await recordAttendance(
        user.id,
        subjectId,
        present
      );

      setAttendanceData((current) => ({
        ...current,
        [subjectId]: updatedAttendance,
      }));
    } catch (error) {
      console.error("Error recording attendance:", error);
    }
  };

  /*
   * Loading screen
   */
  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">
          Loading attendance...
        </p>
      </main>
    );
  }

  /*
   * Overall attendance calculation
   */
  const attendanceRecords = Object.values(
    attendanceData
  ).filter(
    (record): record is AttendanceRecord =>
      record !== null
  );

  const overallAttendance =
    calculateOverallAttendance(attendanceRecords);

  /*
   * Find subjects below 75%
   */
  const lowAttendanceSubjects = subjects.filter(
    (subject) => {
      const attendance = attendanceData[subject.id];

      if (
        !attendance ||
        attendance.total_classes === 0
      ) {
        return false;
      }

      const percentage =
        (attendance.attended_classes /
          attendance.total_classes) *
        100;

      return percentage < 75;
    }
  );

  return (
    <main className="flex-1 px-6 py-8">

      {/* ================= HEADER ================= */}

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Attendance
          </h1>

          <p className="mt-2 text-slate-500">
            Track your attendance for every subject.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          {showForm ? "Close" : "+ Add Subject"}
        </button>

      </div>

      {/* ================= ADD SUBJECT FORM ================= */}

      {showForm && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6 max-w-xl">

          <h2 className="text-xl font-semibold text-slate-800">
            Add Subject
          </h2>

          <div className="mt-4 space-y-4">

            <input
              type="text"
              placeholder="Subject Name"
              value={subjectName}
              onChange={(e) =>
                setSubjectName(e.target.value)
              }
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="text"
              placeholder="Subject Code (optional)"
              value={subjectCode}
              onChange={(e) =>
                setSubjectCode(e.target.value)
              }
              className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={handleAddSubject}
              disabled={adding}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add Subject"}
            </button>

          </div>

        </div>
      )}

      {/* ================= OVERVIEW ================= */}

      <div className="mt-8 grid gap-4 md:grid-cols-3">

        {/* Total Subjects */}

        <div className="bg-white rounded-2xl shadow-sm p-6">

          <p className="text-sm text-slate-500">
            Total Subjects
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-800">
            {subjects.length}
          </p>

        </div>

        {/* Overall Attendance */}

        <div className="bg-white rounded-2xl shadow-sm p-6">

          <p className="text-sm text-slate-500">
            Overall Attendance
          </p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {overallAttendance}%
          </p>

        </div>

        {/* Needs Attention */}

        <div className="bg-white rounded-2xl shadow-sm p-6">

          <p className="text-sm text-slate-500">
            Needs Attention
          </p>

          <p className="mt-2 text-3xl font-bold text-red-500">
            {lowAttendanceSubjects.length}
          </p>

        </div>

      </div>

      {/* ================= WARNING ================= */}

      {lowAttendanceSubjects.length > 0 && (
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-5">

          <h3 className="font-semibold text-red-700">
            ⚠️ Attendance Warning
          </h3>

          <p className="mt-1 text-sm text-red-600">
            {lowAttendanceSubjects.length === 1
              ? "You have 1 subject below 75% attendance."
              : `You have ${lowAttendanceSubjects.length} subjects below 75% attendance.`}
          </p>

        </div>
      )}

      {/* ================= SUBJECTS ================= */}

      {subjects.length === 0 ? (

        <div className="mt-8 bg-white rounded-2xl p-8 text-center shadow-sm">

          <p className="text-slate-500">
            No subjects added yet.
          </p>

        </div>

      ) : (

        <div className="mt-8 grid gap-4 md:grid-cols-2">

          {subjects.map((subject) => (

            <div
              key={subject.id}
              className="bg-white rounded-2xl p-6 shadow-sm"
            >

              {/* Subject Name */}

              <h2 className="text-xl font-semibold text-slate-800">
                {subject.name}
              </h2>

              {/* Subject Code */}

              {subject.code && (
                <p className="mt-1 text-sm text-slate-500">
                  {subject.code}
                </p>
              )}

              {/* Attendance Information */}

              <div className="mt-6">

                <p className="text-sm text-slate-500">
                  Attendance
                </p>

                {(() => {

                  const attendance =
                    attendanceData[subject.id];

                  const attended =
                    attendance?.attended_classes ?? 0;

                  const total =
                    attendance?.total_classes ?? 0;

                  const percentage =
                    total === 0
                      ? 0
                      : Math.round(
                          (attended / total) * 100
                        );

                  const status =
                    getAttendanceStatus(
                      percentage
                    );

                  const classesNeeded =
                    getClassesNeededFor75(
                      attended,
                      total
                    );

                  const classesCanMiss =
                    getClassesCanMiss(
                      attended,
                      total
                    );

                  return (
                    <>

                      {/* Percentage */}

                      <p className="mt-1 text-3xl font-bold text-blue-600">
                        {percentage}%
                      </p>

                      {/* Classes */}

                      <p className="mt-1 text-sm text-slate-500">
                        {attended} / {total} classes
                      </p>

                      {/* Status */}

                      <p
                        className={`mt-2 text-sm font-medium ${
                          status.type === "warning"
                            ? "text-red-600"
                            : status.type ===
                              "excellent"
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        {status.type ===
                        "warning"
                          ? "⚠️ "
                          : "✓ "}

                        {status.label}
                      </p>

                      {/* Smart Attendance Advice */}

                      {total > 0 &&
                        percentage < 75 && (
                          <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">

                            <p className="text-sm text-orange-700">
                              📚 Attend the next{" "}
                              <span className="font-bold">
                                {classesNeeded}
                              </span>{" "}
                              {classesNeeded === 1
                                ? "class"
                                : "classes"}{" "}
                              to reach 75%.
                            </p>

                          </div>
                        )}

                      {total > 0 &&
                        percentage >= 75 &&
                        classesCanMiss > 0 && (
                          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">

                            <p className="text-sm text-green-700">
                              ✅ You can miss{" "}
                              <span className="font-bold">
                                {classesCanMiss}
                              </span>{" "}
                              {classesCanMiss === 1
                                ? "class"
                                : "classes"}{" "}
                              and stay at 75%.
                            </p>

                          </div>
                        )}

                      {/* Attendance Buttons */}

                      <div className="mt-5 flex gap-3">

                        <button
                          onClick={() =>
                            handleAttendance(
                              subject.id,
                              true
                            )
                          }
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition"
                        >
                          Present
                        </button>

                        <button
                          onClick={() =>
                            handleAttendance(
                              subject.id,
                              false
                            )
                          }
                          className="flex-1 bg-red-500 text-white py-2 rounded-lg font-medium hover:bg-red-600 transition"
                        >
                          Absent
                        </button>

                      </div>

                    </>
                  );

                })()}

              </div>

            </div>

          ))}

        </div>

      )}

    </main>
  );
}

export default Attendance;