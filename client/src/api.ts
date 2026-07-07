import { useEffect, useState } from "react";
import { useAuth } from "./store";

// Same-origin by default (all-in-one deploy / Vite dev proxy). Set VITE_API_BASE
// to an absolute origin (e.g. https://cqi-api.onrender.com) when the API is
// hosted separately from the static client.
const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
export const apiUrl = (path: string) => (path.startsWith("/api") ? API_BASE + path : path);

/** A real HTTP response was received (e.g. 401 invalid credentials, 403, 404). */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** The request never reached the server — offline, DNS, CORS, or a cold-start
 * timeout on the free hosting tier. Distinct from ApiError so the UI can offer
 * a calm "waking up" state instead of a raw "Failed to fetch". */
export class NetworkError extends Error {
  constructor(message = "Couldn't reach the demo server — it may be waking up. Please try again in a moment.") {
    super(message);
    this.name = "NetworkError";
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { token, clearAuth } = useAuth.getState();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(apiUrl(path), { ...options, headers });
  } catch {
    // fetch() only rejects on network-level failures (never on HTTP status).
    throw new NetworkError();
  }

  // Only treat 401 as "session expired" for authenticated requests. During login
  // there is no token, so a 401 is invalid credentials and its body is surfaced.
  if (res.status === 401 && token) {
    clearAuth();
    throw new ApiError(401, "Your session has expired. Please sign in again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? `Request failed (${res.status})`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
};

// Silent auto-retries for a cold-starting free server before surfacing an error.
const COLD_START_RETRIES = 2;
const COLD_START_DELAY_MS = 10000;

/**
 * Data hook with cold-start handling. On a network failure it retries quietly a
 * couple of times (surfacing `waking` so the UI can show a calm message), then
 * exposes `isNetwork` + `retry()` for a friendly "Try again" state. HTTP errors
 * (auth/permission) are surfaced immediately with their curated message.
 */
export function useApi<T>(path: string | null, refreshKey = 0) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [waking, setWaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNetwork, setIsNetwork] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    setLoading(true);
    setWaking(false);
    setError(null);
    setIsNetwork(false);

    (async () => {
      for (let attempt = 0; attempt <= COLD_START_RETRIES; attempt++) {
        try {
          const d = await api.get<T>(path);
          if (!cancelled) {
            setData(d);
            setLoading(false);
          }
          return;
        } catch (e) {
          if (e instanceof NetworkError) {
            if (attempt < COLD_START_RETRIES) {
              if (!cancelled) setWaking(true); // keep the calm loading state, note we're waking the server
              await sleep(COLD_START_DELAY_MS);
              if (cancelled) return;
              continue;
            }
            if (!cancelled) {
              setError("The demo server is taking longer than expected to wake up.");
              setIsNetwork(true);
              setLoading(false);
            }
            return;
          }
          if (!cancelled) {
            setError((e as Error).message);
            setIsNetwork(false);
            setLoading(false);
          }
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [path, refreshKey, tick]);

  const retry = () => setTick((t) => t + 1);
  return { data, loading, waking, error, isNetwork, retry };
}

export const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
};

export const dateLabel = (iso: string | null | undefined) =>
  iso ? new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
