import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import { FilterBar } from "../components/Layout";
import { EmptyState, ErrorNote, RagBadge, SmallSampleTag, Spinner, StrongReporterBadge } from "../components/ui";
import { useFilters, useMeta } from "../store";
import type { Period, StaffMetrics } from "../types";

const BAND_ORDER = { Red: 0, Amber: 1, Green: 2 } as const;
const BAND_BORDER: Record<string, string> = {
  Red: "border-l-rust",
  Amber: "border-l-amber",
  Green: "border-l-sage",
  none: "border-l-ink/20",
};

export default function RiskBoard() {
  const { team, months } = useFilters();
  const { meta } = useMeta();
  const [bandFilter, setBandFilter] = useState<string>("All");
  const { data, loading, error } = useApi<{ period: Period; staff: StaffMetrics[] }>(
    `/api/staff?months=${months}&team=${encodeURIComponent(team)}`
  );

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data.staff]
      .filter((s) => {
        if (bandFilter === "All") return true;
        if (bandFilter === "Not rated") return s.band === null;
        return s.band === bandFilter;
      })
      .sort((a, b) => {
        const ba = a.band ? BAND_ORDER[a.band] : 3;
        const bb = b.band ? BAND_ORDER[b.band] : 3;
        if (ba !== bb) return ba - bb;
        return (b.qri ?? -1) - (a.qri ?? -1);
      });
  }, [data, bandFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Staff risk board</h1>
          <p className="text-sm text-ink/60">
            Quality Risk Index per carer, normalised per 100 completed support sessions · last {months} months
          </p>
        </div>
        <FilterBar />
      </div>

      {/* Interpretation note - a governance requirement, always visible */}
      <div role="note" className="rounded-xl border border-petrol/25 bg-petrol-50 px-4 py-3 text-sm text-petrol-800">
        <strong className="font-semibold">How to read this board.</strong> The QRI prioritises who to have a supervision
        conversation with first - it is <em>not</em> an automated performance judgement. Rates are normalised per 100
        completed sessions so busier staff are not penalised, frequent low-severity reporters with strong feedback are
        flagged as <StrongReporterBadge className="mx-0.5 align-middle" /> rather than as risks, and RAG colouring is
        withheld where the sample is too small to be fair
        {meta ? ` (fewer than ${meta.smallSample.minVisits} sessions or ${meta.smallSample.minFeedback} feedback responses)` : ""}.
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by RAG band">
        {["All", "Red", "Amber", "Green", "Not rated"].map((b) => (
          <button
            key={b}
            onClick={() => setBandFilter(b)}
            aria-pressed={bandFilter === b}
            className={`rounded-full px-3 py-1 text-sm font-medium border ${
              bandFilter === b ? "border-petrol bg-petrol text-white" : "border-ink/15 bg-white text-ink/70 hover:bg-mist"
            }`}
          >
            {b}
            {data && b !== "All" && (
              <span className="ml-1 tabular opacity-75">
                {data.staff.filter((s) => (b === "Not rated" ? s.band === null : s.band === b)).length}
              </span>
            )}
          </button>
        ))}
        {meta && (
          <span className="ml-auto text-xs text-ink/55">
            Red ≥ {meta.ragBands.red} · Amber {meta.ragBands.amber}–{meta.ragBands.red} · Green &lt; {meta.ragBands.amber}
          </span>
        )}
      </div>

      {error && <ErrorNote message={error} />}
      {loading && <Spinner label="Ranking staff" />}

      {data && sorted.length === 0 && (
        <EmptyState
          title="No staff match this view"
          hint="Try another RAG band or widen the service and period filters above."
        />
      )}

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((s) => (
          <li key={s.StaffID}>
            <Link
              to={`/staff/${s.StaffID}`}
              className={`block h-full rounded-xl border border-ink/10 border-l-4 bg-white p-4 shadow-card transition-shadow hover:shadow-lg focus-visible:shadow-lg ${BAND_BORDER[s.band ?? "none"]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold text-ink">{s.StaffName}</p>
                  <p className="text-xs text-ink/60">{s.Role} · {s.Team}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-display text-2xl font-bold tabular text-ink">{s.qri ?? "—"}</p>
                  <p className="text-[10px] uppercase tracking-wide text-ink/50">QRI</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <RagBadge band={s.band} />
                {s.strongReporter && <StrongReporterBadge />}
                {s.smallSample.visits && meta && <SmallSampleTag what="sessions" min={meta.smallSample.minVisits} />}
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-ink/55">Incidents</dt>
                  <dd className="font-semibold tabular text-ink">
                    {s.incidents.count}
                    <span className="font-normal text-ink/55"> · {s.incidents.per100 ?? "—"}/100</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-ink/55">Upheld compl.</dt>
                  <dd className="font-semibold tabular text-ink">{s.complaints.upheld}<span className="font-normal text-ink/55"> of {s.complaints.count}</span></dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-ink/55">Feedback</dt>
                  <dd className="font-semibold tabular text-ink">
                    {s.feedback.avg ?? "—"}
                    <span className="font-normal text-ink/55"> ({s.feedback.count})</span>
                    {s.smallSample.feedback && !s.smallSample.visits && meta && (
                      <span className="ml-1 align-middle"><SmallSampleTag what="feedback responses" min={meta.smallSample.minFeedback} /></span>
                    )}
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
