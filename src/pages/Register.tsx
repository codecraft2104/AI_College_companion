import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    // Basic validation
    if (
      !fullName ||
      !email ||
      !password ||
      !college ||
      !department ||
      !semester
    ) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (Number(semester) < 1 || Number(semester) > 10) {
      setErrorMessage("Please enter a valid semester.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,

      options: {
        data: {
          full_name: fullName,
          college: college,
          department: department,
          semester: Number(semester),
        },
      },
    });

    setLoading(false);

    if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setMessage(
        "Account created successfully! Please check your email to confirm your account, then log in."
    );

    // Clear form
    setFullName("");
    setEmail("");
    setPassword("");
    setCollege("");
    setDepartment("");
    setSemester("");
  };

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-8">
      <section className="auth-card w-full max-w-md rounded-2xl border p-8 shadow-xl">

        {/* Heading */}
        <h1 className="text-2xl font-bold text-slate-800">
          Create Account
        </h1>

        <p className="mt-2 text-slate-500">
          Start your academic journey with AI College Companion.
        </p>

        <form onSubmit={handleRegister} className="mt-6 space-y-4">

          {/* Full Name */}
          <input
            type="text"
            placeholder="Full Name"
            autoComplete="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* College */}
          <input
            type="text"
            placeholder="College"
            required
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Department */}
          <input
            type="text"
            placeholder="Department"
            required
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Semester */}
          <input
            type="number"
            placeholder="Semester"
            min="1"
            max="10"
            required
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {errorMessage}
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div role="status" className="bg-violet-50 border border-violet-200 text-violet-900 text-sm rounded-lg px-4 py-3">
              {message}
              <Link to="/login" className="ml-1 font-semibold underline">
                Go to login
              </Link>
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-100 py-3 font-medium text-slate-900 hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-violet-700 hover:text-violet-900">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Register;