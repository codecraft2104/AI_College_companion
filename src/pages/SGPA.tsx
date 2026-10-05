import { useState } from "react";

function SGPA() {
  const [selectedSemester, setSelectedSemester] = useState("1");

  return (
    <main className="flex-1 px-6 py-8">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            SGPA Calculator
          </h1>

          <p className="mt-2 text-slate-500">
            Calculate your semester grade point average.
          </p>
        </div>

        <button
          className="bg-blue-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          + Add Subject
        </button>

      </div>

      <div className="mt-8 max-w-sm">

        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Semester
        </label>

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              Semester {i + 1}
            </option>
          ))}
        </select>

      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-sm p-8 max-w-xl">

        <p className="text-sm text-slate-500">
          Current SGPA
        </p>

        <h2 className="mt-2 text-5xl font-bold text-blue-600">
          0.00
        </h2>

        <p className="mt-3 text-slate-500">
          Add subjects to calculate your SGPA.
        </p>

      </div>

      <div className="mt-8 bg-white rounded-2xl shadow-sm p-8 text-center">

        <p className="text-slate-500">
          No subjects added for Semester {selectedSemester}.
        </p>

      </div>

    </main>
  );
}

export default SGPA;