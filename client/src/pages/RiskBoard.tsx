import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../api";
import { EmptyState, ErrorNote, NetworkNote, Note, RagBadge, SmallSampleTag, Spinner, StrongReporterBadge } from "../components/ui";
import { useFilters, useMeta } from "../store";
import type { Period, StaffMetrics } from "../types";

const BAND_ORDER = { Red: 0, Amber: 1, Green: 2 } as const;
const BAND_EDGE: Record<string, string> = { Red: "#BF4A36", Amber: "#D9A441", Green: "#5F9678", none: "#c2cec9" };
// Filter chips use the softened, supervision-first language.
const CHIPS = [
  { key: "All", label: "All" },
  { key: "Red", label: "Priority attention" },
  { key: "Amber", label: "Review in supervision" },
  { key: "Green", label: "Within expected range" },
  { key: "Not rated", label: "Insufficient sample" },
];
const LEGEND = [
  { edge: "#BF4A36", label: "Priority attention", note: "QRI ≥ 25" },
  { edge: "#D9A441", label: "Review in supervision", note: "QRI 12–25" },
  { edge: "#5F9678", label: "Within expected range", note: "QRI < 12" },
  { edge: "#c2cec9", label: "Insufficient sample", note: "too few sessions or responses" },
];

export default function RiskBoard() {
  const { team, months } = useFilters();
  const { meta } = useMeta();
  const [bandFilter, setBandFilter] = useState<string>("All");
  const { data, loading, waking, error, isNetwork, retry } = useApi<{ period: Period; staff: StaffMetrics[] }>(
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

  const countFor = (key: string) =>
    data ? data.staff.filter((s) => (key === "Not rated" ? s.band === null : s.band === key)).length : 0;

  return (
    <div className="space-y-4">
      {/* Interpretation note - a governance requirement, always visible */}
      <Note title="How to read this board">
        The Quality Risk Index prioritises who to have a supervision conversation with first — it is <em>not</em> an
        automated performance judgement. Rates are normalised per 100 completed sessions so busier staff are not
        penalised, and conscientious frequent reporters with strong feedback are flagged as a{" "}
        <StrongReporterBadge className="mx-0.5 align-middle" /> rather than a risk. Banding is withheld where the sample
        is too small
        {meta ? ` (fewer than ${meta.smallSample.minVisits} completed sessions or ${meta.smallSample.minFeedback} feedback responses)` : ""}.
        Review the available evidence with caution and avoid drawing performance conclusions from limited data.
      </Note>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by band">
        {CHIPS.map((c) => (
          <button
            key={c.key}
            onClick={() => setBandFilter(c.key)}
            aria-pressed={bandFilter === c.key}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${
              bandFilter === c.key ? "border-petrol bg-petrol text-white" : "border-line bg-white text-moss hover:bg-mist"
            }`}
          >
            <span>{c.label}</span>
            {c.key !== "All" && <span className={`tabular text-[11.5px] font-semibold ${bandFilter === c.key ? "opacity-85" : "opacity-55"}`}>{countFor(c.key)}</span>}
          </button>
        ))}
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-line bg-white px-4 py-3">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-2 text-[11.5px] text-muted">
            <span className="h-[11px] w-[11px] rounded-sm" style={{ background: l.edge }} aria-hidden="true" />
            <strong className="font-semibold text-moss">{l.label}</strong> {l.note}
          </span>
        ))}
      </div>

      {loading && <Spinner label={waking ? "Waking the demo server and loading synthetic data" : "Ranking staff"} />}
      {error && (isNetwork ? <NetworkNote onRetry={retry} /> : <ErrorNote message={error} />)}

      {data && sorted.length === 0 && (
        <EmptyState title="No staff match this view" hint="Try another band or widen the service and period filters above." />
      )}

      <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {sorted.map((s) => (
          <li key={s.StaffID}>
            <Link
              to={`/staff/${s.StaffID}`}
              className="block h-full rounded-xl border border-line bg-white p-4 shadow-card transition-shadow hover:shadow-cardhover focus-visible:shadow-cardhover"
              style={{ borderLeft: `4px solid ${BAND_EDGE[s.band ?? "none"]}` }}
            >
              <div className="flex items-start justify-between gap-2.5">
                <div className="min-w-0">
                  <p className="truncate font-display text-[14.5px] font-semibold text-ink">{s.StaffName}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">{s.Role} · {s.Team}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-[26px] font-bold leading-none tabular" style={{ color: s.band === null ? "#9fb0ab" : "#12333A" }}>{s.qri ?? "—"}</p>
                  <p className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-faint">QRI</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <RagBadge band={s.band} />
                {s.strongReporter && <StrongReporterBadge />}
                {s.smallSample.visits && meta && <SmallSampleTag what="sessions" min={meta.smallSample.minVisits} />}
              </div>
              <dl className="mt-3.5 grid grid-cols-3 gap-2">
                <div>
                  <dt className="mb-0.5 text-[10.5px] text-faint">Incidents</dt>
                  <dd className="text-[13px] font-semibold tabular text-ink">
                    {s.incidents.count}<span className="text-[11px] font-normal text-faint"> · {s.incidents.per100 ?? "—"}/100</span>
                  </dd>
                </div>
                <div>
                  <dt className="mb-0.5 text-[10.5px] text-faint">Upheld compl.</dt>
                  <dd className="text-[13px] font-semibold tabular text-ink">{s.complaints.upheld}<span className="text-[11px] font-normal text-faint"> of {s.complaints.count}</span></dd>
                </div>
                <div>
                  <dt className="mb-0.5 text-[10.5px] text-faint">Feedback</dt>
                  <dd className="text-[13px] font-semibold tabular text-ink">
                    {s.feedback.avg ?? "—"}<span className="text-[11px] font-normal text-faint"> ({s.feedback.count})</span>
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
