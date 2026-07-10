import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { api } from "../api";
import { useAuth, useFilters, useMeta } from "../store";
import type { Meta } from "../types";
import { Avatar } from "./ui";

const NAV_MAIN = [
  { to: "/", label: "Overview", roles: ["Director", "Registered Manager", "Team Leader"] },
  { to: "/risk", label: "Staff risk board", roles: ["Director", "Registered Manager", "Team Leader"] },
  { to: "/cqc", label: "CQC evidence", roles: ["Director", "Registered Manager", "Team Leader"] },
  { to: "/data", label: "Data manager", roles: ["Director", "Registered Manager"] },
  { to: "/admin", label: "Admin", roles: ["Director", "Registered Manager"] },
];
const NAV_GOV = [{ to: "/gdpr", label: "Data protection", roles: ["Director", "Registered Manager", "Team Leader"] }];

/** Page title/subtitle + whether the global filters apply, keyed by route. */
function pageMeta(pathname: string, team: string): { title: string; sub: string; filters: boolean } {
  const scope = team === "All" ? "all services" : team;
  if (pathname === "/") return { title: "Quality overview", sub: `Incidents, complaints and feedback across ${scope}`, filters: true };
  if (pathname === "/risk") return { title: "Staff risk board", sub: "Quality Risk Index per carer, normalised per 100 completed support sessions", filters: true };
  if (pathname.startsWith("/staff/")) return { title: "Staff profile", sub: "Supervision view · figures normalised per 100 completed sessions", filters: true };
  if (pathname === "/cqc") return { title: "CQC evidence", sub: "Metrics mapped to the single assessment framework · inspection-ready evidence", filters: true };
  if (pathname === "/data") return { title: "Data manager", sub: "Import and validate Excel or CSV extracts against the CQI schema", filters: false };
  if (pathname === "/admin") return { title: "Admin", sub: "QRI configuration, user accounts and the audit trail", filters: false };
  if (pathname === "/gdpr") return { title: "Data protection & governance", sub: "How CQI handles personal data — written for managers and inspectors", filters: false };
  return { title: "Care Quality Intelligence", sub: "", filters: false };
}

function Logo() {
  return (
    <div className="flex items-center gap-3 px-1">
      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-petrol font-display text-sm font-bold tracking-wide text-white" aria-hidden="true">
        CQ
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[15px] font-semibold text-ink">Care Quality</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-petrol">Intelligence</span>
      </span>
    </div>
  );
}

function NavGroup({ heading, items, onNavigate }: { heading: string; items: typeof NAV_MAIN; onNavigate?: () => void }) {
  return (
    <>
      <p className="mb-2 mt-5 px-2 text-[10.5px] font-bold uppercase tracking-[0.12em] text-faint">{heading}</p>
      <nav className="flex flex-col gap-0.5" aria-label={heading}>
        {items.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors ${
                isActive ? "bg-petrol font-semibold text-white" : "font-medium text-moss hover:bg-mist"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`h-[7px] w-[7px] shrink-0 rounded-sm ${isActive ? "bg-avatar" : "bg-[#b9c8c3]"}`} aria-hidden="true" />
                <span>{n.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export function FilterBar() {
  const { meta } = useMeta();
  const { team, months, setTeam, setMonths } = useFilters();
  const user = useAuth((s) => s.user);
  const isTeamLeader = user?.Role === "Team Leader";
  return (
    <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Global filters">
      <label className="sr-only" htmlFor="team-filter">Filter by service</label>
      <div className="relative">
        <select
          id="team-filter"
          value={isTeamLeader ? user?.Team ?? "" : team}
          onChange={(e) => setTeam(e.target.value)}
          disabled={isTeamLeader}
          className="appearance-none rounded-lg border border-line bg-white py-2 pl-3 pr-8 text-[13px] font-medium text-ink disabled:opacity-70"
          title={isTeamLeader ? "Team Leaders see their own service only" : undefined}
        >
          {!isTeamLeader && <option value="All">All services</option>}
          {(isTeamLeader ? [user?.Team ?? ""] : meta?.teams ?? []).map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">▼</span>
      </div>
      <div className="inline-flex rounded-lg border border-line bg-white p-0.5" role="radiogroup" aria-label="Reporting period">
        {[3, 6, 12].map((m) => (
          <button
            key={m}
            role="radio"
            aria-checked={months === m}
            onClick={() => setMonths(m as 3 | 6 | 12)}
            className={`rounded-md px-3.5 py-1 text-[13px] font-medium transition-colors ${
              months === m ? "bg-petrol text-white" : "text-muted hover:bg-mist"
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
  const { team } = useFilters();
  const setMeta = useMeta((s) => s.setMeta);
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (token) api.get<Meta>("/api/meta").then(setMeta).catch(() => {});
  }, [token, setMeta]);

  const signOut = async () => {
    try { await api.post("/api/logout"); } catch { /* session may already be gone */ }
    clearAuth();
    navigate("/login");
  };

  const mainLinks = NAV_MAIN.filter((n) => user && n.roles.includes(user.Role));
  const govLinks = NAV_GOV.filter((n) => user && n.roles.includes(user.Role));
  const { title, sub, filters } = pageMeta(location.pathname, team);

  return (
    <div className="cqi-scroll min-h-screen bg-mist lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Skip to main content
      </a>

      {/* mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <Logo />
        <button
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          onClick={() => setMenuOpen((o) => !o)}
          className="rounded-lg border border-line p-2 text-ink"
        >
          <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
          </svg>
        </button>
      </header>
      {menuOpen && (
        <nav id="mobile-nav" className="border-b border-line bg-white px-3 py-2 lg:hidden" aria-label="Main navigation">
          {[...mainLinks, ...govLinks].map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? "bg-petroltint text-petrol-700" : "text-moss"}`}
            >
              {n.label}
            </NavLink>
          ))}
          <button onClick={signOut} className="mt-1 block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rust-700">
            Sign out {user?.DisplayName}
          </button>
        </nav>
      )}

      {/* desktop sidebar */}
      <aside className="hidden border-r border-line bg-white px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[264px] lg:flex-col lg:justify-between">
        <div>
          <Logo />
          <NavGroup heading="Quality monitoring" items={mainLinks} />
          {govLinks.length > 0 && <NavGroup heading="Governance" items={govLinks} />}
        </div>
        <div className="border-t border-line pt-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.DisplayName ?? "?"} size="sm" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[13px] font-semibold text-ink">{user?.DisplayName}</span>
              <span className="block truncate text-[11px] text-muted">{user?.Role}{user?.Team ? ` · ${user.Team}` : " · All services"}</span>
            </span>
          </div>
          <button onClick={signOut} className="mt-3 w-full rounded-lg border border-line bg-white py-2 text-[12.5px] font-medium text-muted hover:bg-mist">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* sticky translucent page header carrying title + filters */}
        <div className="sticky top-0 z-30 border-b border-line bg-mist/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-4 px-4 py-[18px] lg:px-8">
            <div className="min-w-0">
              <h1 className="font-display text-[23px] font-semibold tracking-[-0.3px] text-ink">{title}</h1>
              {sub && <p className="mt-1 max-w-2xl text-[13.5px] text-muted">{sub}</p>}
            </div>
            {filters && <FilterBar />}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            id="main"
            className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-7 lg:px-8"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
        <footer className="mx-auto max-w-[1240px] px-4 pb-7 text-[11.5px] text-faint lg:px-8">
          Care Quality Intelligence · People we support are shown by ClientRef only · Quality data supports supervision conversations, it is not an automated judgement.
        </footer>
      </div>
    </div>
  );
}
