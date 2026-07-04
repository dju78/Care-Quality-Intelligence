import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth, useFilters, useMeta } from "../store";
import type { Meta } from "../types";

const NAV = [
  { to: "/", label: "Overview", roles: ["Director", "Registered Manager", "Team Leader"] },
  { to: "/risk", label: "Staff risk board", roles: ["Director", "Registered Manager", "Team Leader"] },
  { to: "/cqc", label: "CQC evidence", roles: ["Director", "Registered Manager", "Team Leader"] },
  { to: "/data", label: "Data manager", roles: ["Director", "Registered Manager"] },
  { to: "/admin", label: "Admin", roles: ["Director", "Registered Manager"] },
  { to: "/gdpr", label: "Data protection", roles: ["Director", "Registered Manager", "Team Leader"] },
];

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-petrol text-white font-display font-bold text-sm" aria-hidden="true">
        AQ
      </span>
      <span className="leading-tight">
        <span className="block font-display font-semibold text-ink">Aldanat Quality</span>
        <span className="block text-[11px] uppercase tracking-widest text-petrol">Intelligence</span>
      </span>
    </div>
  );
}

export function FilterBar() {
  const { meta } = useMeta();
  const { team, months, setTeam, setMonths } = useFilters();
  const user = useAuth((s) => s.user);
  const isTeamLeader = user?.Role === "Team Leader";
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Global filters">
      <label className="sr-only" htmlFor="team-filter">Filter by service</label>
      <select
        id="team-filter"
        value={isTeamLeader ? user?.Team ?? "" : team}
        onChange={(e) => setTeam(e.target.value)}
        disabled={isTeamLeader}
        className="rounded-lg border border-ink/15 bg-white px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-70"
        title={isTeamLeader ? "Team Leaders see their own service only" : undefined}
      >
        {!isTeamLeader && <option value="All">All services</option>}
        {(isTeamLeader ? [user?.Team ?? ""] : meta?.teams ?? []).map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <div className="inline-flex rounded-lg border border-ink/15 bg-white p-0.5" role="radiogroup" aria-label="Reporting period">
        {[3, 6, 12].map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={months === m}
            onClick={() => setMonths(m as 3 | 6 | 12)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              months === m ? "bg-petrol text-white" : "text-ink/70 hover:bg-mist"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, token, clearAuth } = useAuth();
  const setMeta = useMeta((s) => s.setMeta);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (token) api.get<Meta>("/api/meta").then(setMeta).catch(() => {});
  }, [token, setMeta]);

  const signOut = async () => {
    try { await api.post("/api/logout"); } catch { /* session may already be gone */ }
    clearAuth();
    navigate("/login");
  };

  const links = NAV.filter((n) => user && n.roles.includes(user.Role));

  return (
    <div className="min-h-screen bg-mist lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded-lg focus:m-2">
        Skip to main content
      </a>
      {/* sidebar (desktop) / topbar (mobile) */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3">
        <Logo />
        <button
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-lg border border-ink/15 p-2"
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </header>
      {menuOpen && (
        <nav id="mobile-nav" className="lg:hidden border-b border-ink/10 bg-white px-4 py-2" aria-label="Main navigation">
          {links.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium ${isActive ? "bg-petrol-50 text-petrol-700" : "text-ink/75"}`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <button onClick={signOut} className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rust-700">
            Sign out {user?.DisplayName}
          </button>
        </nav>
      )}

      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:justify-between border-r border-ink/10 bg-white px-4 py-6 lg:sticky lg:top-0 lg:h-screen">
        <div>
          <Logo />
          <nav className="mt-8 flex flex-col gap-1" aria-label="Main navigation">
            {links.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-petrol text-white" : "text-ink/75 hover:bg-mist"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t border-ink/10 pt-4">
          <p className="text-sm font-semibold text-ink">{user?.DisplayName}</p>
          <p className="text-xs text-ink/60">
            {user?.Role}
            {user?.Team ? ` · ${user.Team}` : ""}
          </p>
          <button onClick={signOut} className="mt-2 rounded-lg border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink/75 hover:bg-mist">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <main id="main" className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <Outlet />
        </main>
        <footer className="mx-auto max-w-7xl px-4 pb-6 lg:px-8 text-xs text-ink/45">
          Aldanat Quality Intelligence · People are shown by ClientRef only · Quality data supports supervision conversations, it is not an automated judgement.
        </footer>
      </div>
    </div>
  );
}
