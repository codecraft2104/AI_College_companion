import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Upload,
  FileText,
  Download,
  ExternalLink,
  Trash2,
  X,
  BookOpen,
} from "lucide-react";

import {
  getStudyMaterials,
  uploadStudyMaterial,
  deleteStudyMaterial,
} from "../services/studyMaterialsService";

import type { StudyMaterial } from "../services/studyMaterialsService";

const StudyMaterials = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  const [showUploadModal, setShowUploadModal] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ================================
     LOAD MATERIALS
  ================================= */

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getStudyMaterials();

      setMaterials(data);
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed to load study materials"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  /* ================================
     SUBJECT LIST
  ================================= */

  const subjects = useMemo(() => {
    const uniqueSubjects = Array.from(
      new Set(
        materials
          .map((material) => material.subject)
          .filter(Boolean)
      )
    );

    return ["All", ...uniqueSubjects];
  }, [materials]);

  /* ================================
     SEARCH + FILTER
  ================================= */

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        material.title
          .toLowerCase()
          .includes(searchText) ||
        material.description
          .toLowerCase()
          .includes(searchText) ||
        material.subject
          .toLowerCase()
          .includes(searchText);

      const matchesSubject =
        selectedSubject === "All" ||
        material.subject === selectedSubject;

      return matchesSearch && matchesSubject;
    });
  }, [materials, search, selectedSubject]);

  /* ================================
     UPLOAD
  ================================= */

  const handleUpload = async () => {
    setError("");
    setSuccess("");

    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    if (!subject.trim()) {
      setError("Please enter a subject");
      return;
    }

    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      setUploading(true);

      await uploadStudyMaterial(
        title,
        description,
        subject,
        file
      );

      setSuccess(
        "Study material uploaded successfully!"
      );

      /* Reset form */

      setTitle("");
      setDescription("");
      setSubject("");
      setFile(null);

      setShowUploadModal(false);

      /* Reload materials */

      await loadMaterials();
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed to upload study material"
      );
    } finally {
      setUploading(false);
    }
  };

  /* ================================
     DELETE
  ================================= */

  const handleDelete = async (
    material: StudyMaterial
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${material.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await deleteStudyMaterial(material);

      setMaterials((previous) =>
        previous.filter(
          (item) => item.id !== material.id
        )
      );

      setSuccess(
        "Study material deleted successfully!"
      );
    } catch (err: any) {
      console.error(err);

      setError(
        err.message || "Failed to delete material"
      );
    }
  };

  /* ================================
     OPEN
  ================================= */

  const handleOpen = (url: string) => {
    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* ================================
     DOWNLOAD
  ================================= */

  const handleDownload = (url: string) => {
    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /* ================================
     DATE FORMAT
  ================================= */

  const formatDate = (date?: string) => {
    if (!date) {
      return "";
    }

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  /* ================================
     UI
  ================================= */

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:px-8">

      {/* HEADER */}

      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div className="flex items-center gap-3">

          <div className="rounded-xl bg-blue-100 p-3">
            <BookOpen className="h-7 w-7 text-blue-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Study Materials
            </h1>

            <p className="text-sm text-gray-500">
              Store and manage your study resources
            </p>
          </div>

        </div>

        <button
          onClick={() => {
            setError("");
            setShowUploadModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          <Upload className="h-5 w-5" />
          Upload Material
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <span>{error}</span>

          <button onClick={() => setError("")}>
            <X className="h-4 w-4" />
          </button>

        </div>
      )}


      {/* SUCCESS */}

      {success && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <span>{success}</span>

          <button onClick={() => setSuccess("")}>
            <X className="h-4 w-4" />
          </button>

        </div>
      )}


      {/* SEARCH + FILTER */}

      <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-4 md:flex-row">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search study materials..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 outline-none transition focus:border-blue-500"
            />

          </div>


          {/* SUBJECT FILTER */}

          <select
            value={selectedSubject}
            onChange={(e) =>
              setSelectedSubject(e.target.value)
            }
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
          >

            {subjects.map((subjectName) => (
              <option
                key={subjectName}
                value={subjectName}
              >
                {subjectName === "All"
                  ? "All Subjects"
                  : subjectName}
              </option>
            ))}

          </select>

        </div>

      </div>


      {/* LOADING */}

      {loading && (
        <div className="py-16 text-center">

          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-gray-500">
            Loading study materials...
          </p>

        </div>
      )}


      {/* EMPTY */}

      {!loading &&
        filteredMaterials.length === 0 && (
          <div className="rounded-2xl bg-white px-6 py-16 text-center shadow-sm">

            <FileText className="mx-auto mb-4 h-14 w-14 text-gray-300" />

            <h2 className="mb-2 text-xl font-semibold text-gray-800">
              No study materials found
            </h2>

            <p className="mb-6 text-gray-500">
              Upload your first study material
              to get started.
            </p>

            <button
              onClick={() =>
                setShowUploadModal(true)
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Upload Material
            </button>

          </div>
        )}


      {/* MATERIAL CARDS */}

      {!loading &&
        filteredMaterials.length > 0 && (

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

            {filteredMaterials.map(
              (material) => (

                <div
                  key={material.id}
                  className="rounded-2xl bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >

                  {/* ICON */}

                  <div className="mb-4 flex items-start justify-between">

                    <div className="rounded-xl bg-blue-100 p-3">
                      <FileText className="h-7 w-7 text-blue-600" />
                    </div>

                    <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      {material.subject}
                    </span>

                  </div>


                  {/* TITLE */}

                  <h2 className="mb-2 text-lg font-semibold text-gray-900">
                    {material.title}
                  </h2>


                  {/* DESCRIPTION */}

                  <p className="mb-4 line-clamp-3 text-sm text-gray-500">
                    {material.description}
                  </p>


                  {/* DATE */}

                  <p className="mb-5 text-xs text-gray-400">
                    Added {formatDate(material.created_at)}
                  </p>


                  {/* ACTIONS */}

                  <div className="flex gap-2">

                    <button
                      onClick={() =>
                        handleOpen(
                          material.resource_url
                        )
                      }
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-100"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </button>


                    <button
                      onClick={() =>
                        handleDownload(
                          material.resource_url
                        )
                      }
                      className="flex items-center justify-center rounded-xl bg-green-50 px-3 py-2.5 text-green-600 transition hover:bg-green-100"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>


                    <button
                      onClick={() =>
                        handleDelete(material)
                      }
                      className="flex items-center justify-center rounded-xl bg-red-50 px-3 py-2.5 text-red-600 transition hover:bg-red-100"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>

                </div>

              )
            )}

          </div>
        )}


      {/* UPLOAD MODAL */}

      {showUploadModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">

            {/* MODAL HEADER */}

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Upload Study Material
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Add a new resource to your study library.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowUploadModal(false)
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>

            </div>


            {/* TITLE */}

            <div className="mb-4">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) =>
                  setTitle(e.target.value)
                }
                placeholder="Example: Data Structures Notes"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* DESCRIPTION */}

            <div className="mb-4">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Enter a short description"
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

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
                placeholder="Example: Data Structures"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500"
              />

            </div>


            {/* FILE */}

            <div className="mb-6">

              <label className="mb-2 block text-sm font-medium text-gray-700">
                File
              </label>

              <input
                type="file"
                onChange={(e) =>
                  setFile(
                    e.target.files?.[0] || null
                  )
                }
                className="w-full rounded-xl border border-gray-200 p-3 text-sm"
              />

              {file && (
                <p className="mt-2 truncate text-sm text-gray-500">
                  Selected: {file.name}
                </p>
              )}

            </div>


            {/* BUTTONS */}

            <div className="flex gap-3">

              <button
                onClick={() =>
                  setShowUploadModal(false)
                }
                disabled={uploading}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {uploading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    Upload
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

export default StudyMaterials;