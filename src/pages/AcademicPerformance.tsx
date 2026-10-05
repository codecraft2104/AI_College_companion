import { useEffect, useState } from "react";

import {
  calculateSGPA,
  getGradePoint,
  getSGPASubjects,
  addSGPASubject,
  updateSGPASubject,
  deleteSGPASubject,
  getSemesterSGPA,
  type Subject,
} from "../services/sgpaService";

import {
  getSemesterResults,
  saveSemesterResult,
  deleteSemesterResult,
  calculateCGPA,
  type SemesterResult,
} from "../services/cgpaService";

function AcademicPerformance() {
  const [activeTab, setActiveTab] = useState<
    "sgpa" | "cgpa"
  >("sgpa");

  // =====================================================
  // SGPA
  // =====================================================

  const [selectedSemester, setSelectedSemester] =
    useState("1");

  const [subjects, setSubjects] = useState<
    Subject[]
  >([]);

  const [loadingSubjects, setLoadingSubjects] =
    useState(false);

  const [savingSubject, setSavingSubject] =
    useState<number | null>(null);

  // =====================================================
  // CGPA
  // =====================================================

  const [semesters, setSemesters] = useState<
    SemesterResult[]
  >([]);

  const [loadingSemesters, setLoadingSemesters] =
    useState(false);

  const [savingSemester, setSavingSemester] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const [targetCGPA, setTargetCGPA] = useState(8);

  const [remainingCredits, setRemainingCredits] =
    useState(66);

  // =====================================================
  // LOAD SGPA SUBJECTS
  // =====================================================

  useEffect(() => {
    if (activeTab === "sgpa") {
      loadSubjects();
    }
  }, [activeTab, selectedSemester]);

  const loadSubjects = async () => {
    try {
      setLoadingSubjects(true);
      setError("");

      const data = await getSGPASubjects(
        Number(selectedSemester)
      );

      setSubjects(data);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load your subjects."
      );
    } finally {
      setLoadingSubjects(false);
    }
  };

  // =====================================================
  // ADD SGPA SUBJECT
  // =====================================================

  const addSubject = () => {
    const newSubject: Subject = {
      semester: Number(selectedSemester),
      subject_name: "",
      credits: 0,
      grade: "",
      grade_point: 0,
    };

    setSubjects((current) => [
      ...current,
      newSubject,
    ]);
  };

  // =====================================================
  // UPDATE SGPA SUBJECT
  // =====================================================

  const updateSubject = (
    index: number,
    field: keyof Subject,
    value: string | number
  ) => {
    setSubjects((current) =>
      current.map((subject, i) => {
        if (i !== index) {
          return subject;
        }

        if (field === "grade") {
          return {
            ...subject,
            grade: value as string,
            grade_point: getGradePoint(
              value as string
            ),
          };
        }

        return {
          ...subject,
          [field]: value,
        };
      })
    );
  };

  // =====================================================
  // SAVE SGPA SUBJECT
  // =====================================================

  const handleSaveSubject = async (
    subject: Subject,
    index: number
  ) => {
    try {
      setError("");
      setSavingSubject(index);

      if (!subject.subject_name.trim()) {
        setError(
          "Please enter the subject name."
        );
        return;
      }

      if (Number(subject.credits) <= 0) {
        setError(
          "Please enter valid credits."
        );
        return;
      }

      if (!subject.grade) {
        setError(
          "Please select a grade."
        );
        return;
      }

      if (subject.id) {
        // UPDATE EXISTING SUBJECT

        const updated =
          await updateSGPASubject(
            subject.id,
            subject.subject_name,
            Number(subject.credits),
            subject.grade
          );

        setSubjects((current) =>
          current.map((item, i) =>
            i === index ? updated : item
          )
        );

        await syncSemesterWithCGPA(
            Number(selectedSemester)
            );
      } else {
        // ADD NEW SUBJECT

        const saved =
          await addSGPASubject(
            Number(selectedSemester),
            subject.subject_name,
            Number(subject.credits),
            subject.grade
          );

        setSubjects((current) =>
          current.map((item, i) =>
            i === index ? saved : item
          )
        );

        await syncSemesterWithCGPA(
            Number(selectedSemester)
            );
      }
    } catch (error) {
      console.error(error);

      setError(
        "Unable to save subject."
      );
    } finally {
      setSavingSubject(null);
    }
  };

  // =====================================================
  // DELETE SGPA SUBJECT
  // =====================================================

  const handleDeleteSubject = async (
    subject: Subject,
    index: number
  ) => {
    try {
      setError("");

      // Subject hasn't been saved yet
      if (!subject.id) {
        setSubjects((current) =>
          current.filter(
            (_, i) => i !== index
          )
        );

        return;
      }

      await deleteSGPASubject(
        subject.id
      );

      await syncSemesterWithCGPA(
        Number(selectedSemester)
        );

      setSubjects((current) =>
        current.filter(
          (_, i) => i !== index
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to delete subject."
      );
    }
  };

  // =====================================================
  // CALCULATE SGPA
  // =====================================================

  const sgpa = calculateSGPA(
    subjects
      .filter(
        (subject) =>
          Number(subject.credits) > 0 &&
          subject.grade !== ""
      )
      .map((subject) => ({
        credits: Number(subject.credits),
        gradePoint: Number(
          subject.grade_point
        ),
      }))
  );

  // =====================================================
  // LOAD CGPA SEMESTERS
  // =====================================================

  useEffect(() => {
    if (activeTab === "cgpa") {
      loadSemesters();
    }
  }, [activeTab]);

  const loadSemesters = async () => {
    try {
      setLoadingSemesters(true);
      setError("");

      const data =
        await getSemesterResults();

      setSemesters(data);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load your semester results."
      );
    } finally {
      setLoadingSemesters(false);
    }
  };

  // =====================================================
  // CALCULATE CGPA
  // =====================================================

  const cgpa = calculateCGPA(
    semesters
  );

  // =====================================================
// TARGET CGPA CALCULATOR
// =====================================================

const completedCredits =
  semesters.reduce(
    (total, semester) =>
      total + Number(semester.credits),
    0
  );

const currentWeightedPoints =
  semesters.reduce(
    (total, semester) =>
      total +
      Number(semester.sgpa) *
        Number(semester.credits),
    0
  );

const requiredSGPA =
  remainingCredits > 0
    ? Number(
        (
          (Number(targetCGPA) *
            (completedCredits +
              Number(remainingCredits)) -
            currentWeightedPoints) /
          Number(remainingCredits)
        ).toFixed(2)
      )
    : 0;

const targetAlreadyReached =
  Number(cgpa) >=
  Number(targetCGPA);

  // =====================================================
// PERFORMANCE OVERVIEW
// =====================================================

const totalCredits = semesters.reduce(
  (total, semester) =>
    total + Number(semester.credits),
  0
);

const bestSemester =
  semesters.length > 0
    ? Math.max(
        ...semesters.map((semester) =>
          Number(semester.sgpa)
        )
      )
    : 0;

const bestSemesterNumber =
  semesters.find(
    (semester) =>
      Number(semester.sgpa) ===
      bestSemester
  )?.semester ?? null;
  // =====================================================
  // ADD SEMESTER
  // =====================================================

  const addSemester = () => {
    if (semesters.length >= 8) {
      return;
    }

    const usedSemesters =
      semesters.map(
        (semester) =>
          semester.semester
      );

    let nextSemester = 1;

    while (
      usedSemesters.includes(
        nextSemester
      )
    ) {
      nextSemester++;
    }

    const newSemester: SemesterResult =
      {
        semester: nextSemester,
        sgpa: 0,
        credits: 0,
      };

    setSemesters((current) =>
      [...current, newSemester].sort(
        (a, b) =>
          a.semester - b.semester
      )
    );
  };

  // =====================================================
  // UPDATE SEMESTER
  // =====================================================

  const updateSemester = (
    semesterNumber: number,
    field: "sgpa" | "credits",
    value: number
  ) => {
    setSemesters((current) =>
      current.map((semester) =>
        semester.semester ===
        semesterNumber
          ? {
              ...semester,
              [field]: value,
            }
          : semester
      )
    );
  };

  // =====================================================
  // SAVE SEMESTER
  // =====================================================

  const handleSaveSemester = async (
    semester: SemesterResult
  ) => {
    try {
      setSavingSemester(
        semester.semester
      );

      setError("");

      const saved =
        await saveSemesterResult(
          semester.semester,
          Number(semester.sgpa),
          Number(semester.credits)
        );

      setSemesters((current) =>
        current.map((item) =>
          item.semester ===
          semester.semester
            ? saved
            : item
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to save semester result."
      );
    } finally {
      setSavingSemester(null);
    }
  };

  // =====================================================
  // DELETE SEMESTER
  // =====================================================

  const handleDeleteSemester = async (
    semesterNumber: number
  ) => {
    try {
      setError("");

      await deleteSemesterResult(
        semesterNumber
      );

      setSemesters((current) =>
        current.filter(
          (semester) =>
            semester.semester !==
            semesterNumber
        )
      );
    } catch (error) {
      console.error(error);

      setError(
        "Unable to delete semester."
      );
    }
  };

  const syncSemesterWithCGPA =
  async (semesterNumber: number) => {
    try {
      const result =
        await getSemesterSGPA(
          semesterNumber
        );

      await saveSemesterResult(
        semesterNumber,
        result.sgpa,
        result.credits
      );

      const updatedSemesters =
        await getSemesterResults();

      setSemesters(updatedSemesters);
    } catch (error) {
      console.error(
        "Unable to sync CGPA:",
        error
      );
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="flex-1 px-6 py-8">

      {/* =================================================
          HEADER
      ================================================= */}

      <div>
        <h1 className="text-3xl font-bold text-slate-800">
          Academic Performance
        </h1>

        <p className="mt-2 text-slate-500">
          Track your SGPA and CGPA in one place.
        </p>
      </div>

      {/* =================================================
          TABS
      ================================================= */}

      <div className="mt-8 flex gap-3 border-b">

        <button
          onClick={() =>
            setActiveTab("sgpa")
          }
          className={`px-6 py-3 font-medium border-b-2 ${
            activeTab === "sgpa"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500"
          }`}
        >
          SGPA Calculator
        </button>

        <button
          onClick={() =>
            setActiveTab("cgpa")
          }
          className={`px-6 py-3 font-medium border-b-2 ${
            activeTab === "cgpa"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500"
          }`}
        >
          CGPA Calculator
        </button>

      </div>


       {/* =================================================
    PERFORMANCE OVERVIEW
================================================= */}

{activeTab === "cgpa" &&
  semesters.length > 0 && (
    <section className="mt-8">

      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Performance Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          A quick look at your academic performance.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* =================================================
    SGPA TREND
================================================= */}

{activeTab === "cgpa" &&
  semesters.length > 0 && (
    <section className="mt-8">

      <div className="bg-white rounded-2xl shadow-sm p-8">

        <h2 className="text-xl font-semibold text-slate-800">
          SGPA Trend
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Track how your semester performance changes over time.
        </p>

        <div className="mt-6">
          <div className="flex items-end gap-4 h-64 border-b border-l border-slate-200 px-4">

            {[...semesters]
              .sort(
                (a, b) =>
                  a.semester -
                  b.semester
              )
              .map((semester) => {

                const height = Math.max(
                  5,
                  (Number(
                    semester.sgpa
                  ) /
                    10) *
                    100
                );

                return (
                  <div
                    key={
                      semester.semester
                    }
                    className="flex-1 h-full flex flex-col justify-end items-center"
                  >

                    {/* SGPA VALUE */}

                    <span className="mb-2 text-sm font-semibold text-slate-700">
                      {Number(
                        semester.sgpa
                      ).toFixed(2)}
                    </span>

                    {/* BAR */}

                    <div
                      className="w-full max-w-16 bg-blue-500 rounded-t-lg hover:bg-blue-600 transition-all"
                      style={{
                        height: `${height}%`,
                      }}
                    />

                    {/* SEMESTER */}

                    <span className="mt-3 text-xs text-slate-500">
                      Sem{" "}
                      {
                        semester.semester
                      }
                    </span>

                  </div>
                );
              })}

          </div>

          <div className="mt-3 text-center text-xs text-slate-400">
            SGPA scale: 0 – 10
          </div>

        </div>

      </div>

    </section>
  )}

        {/* SGPA */}

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">

          <p className="text-sm text-slate-500">
            Current SGPA
          </p>

          <h3 className="mt-2 text-3xl font-bold text-blue-600">
            {sgpa.toFixed(2)}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            Semester {selectedSemester}
          </p>

        </div>

        {/* CGPA */}

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">

          <p className="text-sm text-slate-500">
            Current CGPA
          </p>

          <h3 className="mt-2 text-3xl font-bold text-emerald-600">
            {cgpa.toFixed(2)}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            Overall performance
          </p>

        </div>

        {/* CREDITS */}

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">

          <p className="text-sm text-slate-500">
            Total Credits
          </p>

          <h3 className="mt-2 text-3xl font-bold text-purple-600">
            {totalCredits}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            Credits completed
          </p>

        </div>

        {/* BEST SEMESTER */}

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100">

          <p className="text-sm text-slate-500">
            Best Semester
          </p>

          <h3 className="mt-2 text-3xl font-bold text-orange-500">
            {bestSemester.toFixed(2)}
          </h3>

          <p className="mt-2 text-xs text-slate-400">
            {bestSemesterNumber
              ? `Semester ${bestSemesterNumber}`
              : "No data"}
          </p>

        </div>

      </div>

    </section>
  )}

{/* =================================================
    TARGET CGPA CALCULATOR
================================================= */}

{activeTab === "cgpa" && (
  <section className="mt-8">

    <div className="bg-white rounded-2xl shadow-sm p-8">

      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Target CGPA Calculator
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Find the average SGPA you need in your remaining semesters to reach your target CGPA.
        </p>
      </div>

      {/* INPUTS */}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* TARGET CGPA */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Target CGPA
          </label>

          <input
            type="number"
            min="0"
            max="10"
            step="0.01"
            value={targetCGPA}
            onChange={(e) =>
              setTargetCGPA(
                Number(e.target.value)
              )
            }
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

        </div>

        {/* REMAINING CREDITS */}

        <div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Remaining Credits
          </label>

          <input
            type="number"
            min="1"
            value={remainingCredits}
            onChange={(e) =>
              setRemainingCredits(
                Number(e.target.value)
              )
            }
            className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

        </div>

      </div>

      {/* CURRENT DETAILS */}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* CURRENT CGPA */}

        <div className="rounded-xl bg-slate-50 p-5">

          <p className="text-sm text-slate-500">
            Current CGPA
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {cgpa.toFixed(2)}
          </p>

        </div>

        {/* COMPLETED CREDITS */}

        <div className="rounded-xl bg-slate-50 p-5">

          <p className="text-sm text-slate-500">
            Completed Credits
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-800">
            {completedCredits}
          </p>

        </div>

        {/* TARGET */}

        <div className="rounded-xl bg-slate-50 p-5">

          <p className="text-sm text-slate-500">
            Target CGPA
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {Number(targetCGPA).toFixed(2)}
          </p>

        </div>

      </div>

      {/* RESULT */}

      <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">

        {targetAlreadyReached ? (

          <div>

            <p className="text-sm font-medium text-green-600">
              Target achieved 🎉
            </p>

            <h3 className="mt-2 text-3xl font-bold text-green-600">
              {cgpa.toFixed(2)} CGPA
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Your current CGPA is already at or above your target.
            </p>

          </div>

        ) : requiredSGPA > 10 ? (

          <div>

            <p className="text-sm font-medium text-red-600">
              Target not achievable
            </p>

            <h3 className="mt-2 text-3xl font-bold text-red-600">
              {requiredSGPA.toFixed(2)}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              You would need an average SGPA above 10.00,
              which is not possible on a 10-point scale.
            </p>

          </div>

        ) : (

          <div>

            <p className="text-sm font-medium text-blue-600">
              Required Average SGPA
            </p>

            <h3 className="mt-2 text-5xl font-bold text-blue-600">
              {requiredSGPA.toFixed(2)}
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              You need an average SGPA of{" "}
              <span className="font-semibold">
                {requiredSGPA.toFixed(2)}
              </span>{" "}
              across your remaining{" "}
              <span className="font-semibold">
                {remainingCredits}
              </span>{" "}
              credits to reach a CGPA of{" "}
              <span className="font-semibold">
                {Number(targetCGPA).toFixed(2)}
              </span>.
            </p>

          </div>

        )}

      </div>

    </div>

  </section>
)}

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="mt-6 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* =================================================
          SGPA SECTION
      ================================================= */}

      {activeTab === "sgpa" && (
        <section>

          {/* SGPA HEADER */}

          <div className="mt-8 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                SGPA Calculator
              </h2>

              <p className="mt-1 text-slate-500">
                Calculate your semester grade point average.
              </p>
            </div>

            <button
              onClick={addSubject}
              className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              + Add Subject
            </button>

          </div>

          {/* SEMESTER SELECT */}

          <div className="mt-8 max-w-sm">

            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Semester
            </label>

            <select
              value={selectedSemester}
              onChange={(e) =>
                setSelectedSemester(
                  e.target.value
                )
              }
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
            >
              {Array.from(
                { length: 8 },
                (_, i) => (
                  <option
                    key={i + 1}
                    value={String(i + 1)}
                  >
                    Semester {i + 1}
                  </option>
                )
              )}
            </select>

          </div>

          {/* SGPA RESULT */}

          <div className="mt-8 bg-white rounded-2xl shadow-sm p-8 max-w-xl">

            <p className="text-sm text-slate-500">
              Current SGPA
            </p>

            <h2 className="mt-2 text-5xl font-bold text-blue-600">
              {sgpa.toFixed(2)}
            </h2>

            <p className="mt-3 text-slate-500">
              {subjects.length === 0
                ? "Add subjects to calculate your SGPA."
                : "Calculated from your subject credits and grades."}
            </p>

          </div>

          {/* SUBJECTS */}

          <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">

            <h2 className="text-xl font-semibold text-slate-800">
              Subjects
            </h2>

            {loadingSubjects ? (
              <p className="mt-6 text-slate-500">
                Loading subjects...
              </p>
            ) : subjects.length === 0 ? (

              <div className="py-10 text-center">

                <p className="text-slate-500">
                  No subjects added for Semester{" "}
                  {selectedSemester}.
                </p>

                <button
                  onClick={addSubject}
                  className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
                >
                  Add Subject
                </button>

              </div>

            ) : (

              <div className="mt-6 space-y-4">

                {subjects.map(
                  (subject, index) => (

                    <div
                      key={
                        subject.id ??
                        `new-${index}`
                      }
                      className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end border rounded-xl p-4"
                    >

                      {/* SUBJECT */}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Subject
                        </label>

                        <input
                          type="text"
                          placeholder="Subject name"
                          value={
                            subject.subject_name
                          }
                          onChange={(e) =>
                            updateSubject(
                              index,
                              "subject_name",
                              e.target.value
                            )
                          }
                          className="w-full border rounded-lg px-4 py-3"
                        />
                      </div>

                      {/* CREDITS */}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Credits
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            subject.credits
                          }
                          onChange={(e) =>
                            updateSubject(
                              index,
                              "credits",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full border rounded-lg px-4 py-3"
                        />
                      </div>

                      {/* GRADE */}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Grade
                        </label>

                        <select
                          value={
                            subject.grade
                          }
                          onChange={(e) =>
                            updateSubject(
                              index,
                              "grade",
                              e.target.value
                            )
                          }
                          className="w-full border rounded-lg px-4 py-3"
                        >
                          <option value="">
                            Select Grade
                          </option>

                          {[
                            "O",
                            "A+",
                            "A",
                            "B+",
                            "B",
                            "C",
                            "P",
                            "F",
                          ].map(
                            (grade) => (
                              <option
                                key={grade}
                                value={grade}
                              >
                                {grade}
                              </option>
                            )
                          )}

                        </select>
                      </div>

                      {/* GRADE POINT */}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Grade Point
                        </label>

                        <div className="border rounded-lg px-4 py-3 bg-slate-50">
                          {subject.grade
                            ? getGradePoint(
                                subject.grade
                              )
                            : "-"}
                        </div>
                      </div>

                      {/* ACTIONS */}

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleSaveSubject(
                              subject,
                              index
                            )
                          }
                          disabled={
                            savingSubject ===
                            index
                          }
                          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          {savingSubject ===
                          index
                            ? "Saving..."
                            : "Save"}
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteSubject(
                              subject,
                              index
                            )
                          }
                          className="px-4 py-3 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </section>
      )}

      {/* =================================================
          CGPA SECTION
      ================================================= */}

      {activeTab === "cgpa" && (
        <section>

          {/* CGPA HEADER */}

          <div className="mt-8 flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                CGPA Calculator
              </h2>

              <p className="mt-1 text-slate-500">
                Calculate your overall cumulative grade point average.
              </p>
            </div>

            <button
              onClick={addSemester}
              disabled={
                semesters.length >= 8
              }
              className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-300"
            >
              + Add Semester
            </button>

          </div>

          {/* CGPA RESULT */}

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

          {/* SEMESTER RESULTS */}

          <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">

            <h2 className="text-xl font-semibold text-slate-800">
              Semester Results
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter your SGPA and total credits for each semester.
            </p>

            {loadingSemesters ? (

              <p className="mt-6 text-slate-500">
                Loading semester results...
              </p>

            ) : semesters.length === 0 ? (

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

                {semesters.map(
                  (semester) => (

                    <div
                      key={
                        semester.semester
                      }
                      className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border rounded-xl p-4"
                    >

                      {/* SEMESTER */}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Semester
                        </label>

                        <div className="border rounded-lg px-4 py-3 bg-slate-50">
                          Semester{" "}
                          {
                            semester.semester
                          }
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
                          value={
                            semester.sgpa
                          }
                          onChange={(e) =>
                            updateSemester(
                              semester.semester,
                              "sgpa",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* CREDITS */}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Total Credits
                        </label>

                        <input
                          type="number"
                          min="0"
                          value={
                            semester.credits
                          }
                          onChange={(e) =>
                            updateSemester(
                              semester.semester,
                              "credits",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* ACTIONS */}

                      <div className="flex gap-2">

                        <button
                          onClick={() =>
                            handleSaveSemester(
                              semester
                            )
                          }
                          disabled={
                            savingSemester ===
                            semester.semester
                          }
                          className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          {savingSemester ===
                          semester.semester
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

                  )
                )}

              </div>

            )}

          </div>

        </section>
      )}

    </main>
  );
}

export default AcademicPerformance;