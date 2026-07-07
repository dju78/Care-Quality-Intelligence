import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, NetworkError, api, sleep } from "../api";
import { useAuth } from "../store";
import type { User } from "../types";

const MAX_RETRIES = 3;
// Randomised 8–12s delay between cold-start retries.
const retryDelay = () => 8000 + Math.floor(Math.random() * 4000);

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // hard errors (bad credentials, gave up)
  const [status, setStatus] = useState<string | null>(null); // transient progress (connecting / waking / retrying)
  const [busy, setBusy] = useState(false);
  const setAuth = useAuth((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStatus("Connecting to the demo server…");

    // attempt 0 is the initial try; attempts 1..MAX_RETRIES are cold-start retries.
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) setStatus(`Retrying connection ${attempt} of ${MAX_RETRIES}…`);
      try {
        const res = await api.post<{ token: string; user: User }>("/api/login", { username, password });
        setAuth(res.token, res.user);
        navigate("/");
        return;
      } catch (err) {
        if (err instanceof ApiError) {
          // A real HTTP response — authentication result, not a network problem. Don't retry.
          setStatus(null);
          setError(err.status === 401 ? "Invalid username or password." : err.message);
          setBusy(false);
          return;
        }
        if (err instanceof NetworkError) {
          if (attempt === 0) {
            setStatus("Waking the demo server — this can take up to a minute. Please keep this page open.");
          }
          if (attempt < MAX_RETRIES) {
            await sleep(retryDelay());
            continue;
          }
          setStatus(null);
          setError("The demo server is taking longer than expected. Please wait one minute and try again.");
          setBusy(false);
          return;
        }
        // Unknown error — treat conservatively as a hard failure.
        setStatus(null);
        setError("Something went wrong signing in. Please try again.");
        setBusy(false);
        return;
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-petrol font-display text-lg font-bold text-white">CQ</span>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">Care Quality Intelligence</h1>
          <p className="mt-1 text-sm text-ink/60">Quality monitoring and supervision evidence for your care services</p>
        </div>
        <form onSubmit={submit} className="rounded-2xl border border-petrol-100 bg-white p-6 shadow-card">
          <label htmlFor="username" className="block text-sm font-medium text-ink">Username</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm"
          />
          <label htmlFor="password" className="mt-4 block text-sm font-medium text-ink">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm"
          />
          {status && (
            <div role="status" aria-live="polite" className="mt-3 flex items-center gap-2 rounded-lg bg-petrol-50 px-3 py-2 text-sm text-petrol-700">
              <svg className="animate-spin shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span>{status}</span>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-rust-100 px-3 py-2 text-sm text-rust-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full rounded-lg bg-petrol px-4 py-2.5 font-medium text-white hover:bg-petrol-700 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <div className="mt-4 rounded-lg bg-mist px-3 py-2 text-xs text-ink/60">
            <p className="font-semibold text-ink/75">Demo accounts</p>
            <p>director / Director!2026 · manager / Manager!2026 · teamleader / TeamLead!2026</p>
          </div>
        </form>
        <p className="mt-4 px-2 text-center text-xs text-ink/50">
          Demo hosted on a free server. First load may take up to a minute after inactivity.
        </p>
      </div>
    </div>
  );
}
