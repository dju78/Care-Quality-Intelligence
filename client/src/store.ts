import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Meta, User } from "./types";

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  clearAuth: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    { name: "cqi-auth" }
  )
);

interface FilterState {
  team: string; // "All" or a service name
  months: 3 | 6 | 12;
  setTeam: (team: string) => void;
  setMonths: (months: 3 | 6 | 12) => void;
}

/** Global filters: every page reads these, so team + period drive the whole app. */
export const useFilters = create<FilterState>()(
  persist(
    (set) => ({
      team: "All",
      months: 12,
      setTeam: (team) => set({ team }),
      setMonths: (months) => set({ months }),
    }),
    { name: "cqi-filters" }
  )
);

interface MetaState {
  meta: Meta | null;
  setMeta: (meta: Meta) => void;
}

export const useMeta = create<MetaState>((set) => ({
  meta: null,
  setMeta: (meta) => set({ meta }),
}));
