import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const registrationMessage = (location.state as { message?: string } | null)?.message;

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-10">
      <section className="auth-card w-full max-w-md rounded-2xl border p-8 shadow-xl">
        <div className="mb-7">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-violet-700">
            AI College Companion
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-slate-600">Log in to continue to your dashboard.</p>
        </div>

        {registrationMessage && (
          <p role="status" className="mb-4 rounded-lg bg-violet-50 px-4 py-3 text-sm text-violet-900">
            {registrationMessage}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-sm font-medium text-slate-800">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium text-slate-800">
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border px-4 py-3"
            />
          </label>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-violet-100 py-3 font-semibold text-slate-900 hover:bg-violet-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-violet-700 hover:text-violet-900">
            Register
          </Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
