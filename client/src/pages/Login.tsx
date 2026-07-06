import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../store";
import type { User } from "../types";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const setAuth = useAuth((s) => s.setAuth);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ token: string; user: User }>("/api/login", { username, password });
      setAuth(res.token, res.user);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
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
      </div>
    </div>
  );
}
