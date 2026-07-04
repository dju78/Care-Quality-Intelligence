import { Link, useParams, useSearchParams } from "react-router-dom";
import { dateLabel, useApi } from "../api";
import { ErrorNote, Spinner } from "../components/ui";
import type { StaffProfile as Profile } from "../types";

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`border-b-2 border-ink/60 px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`border-b border-ink/15 px-2 py-1.5 align-top text-xs ${className}`}>{children}</td>;
}

export default function SupervisionPack() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const months = params.get("months") ?? "12";
  const { data, loading, error } = useApi<Profile>(id ? `/api/staff/${id}/pack?months=${months}` : null);

  if (loading) return <Spinner label="Preparing supervision pack" />;
  if (error) return <div className="p-8"><ErrorNote message={error} /></div>;
  if (!data) return null;

  const m = data.metrics;
  const fmt = (d: string) => dateLabel(d);

  return (
    <div className="min-h-screen bg-mist print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-ink/10 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to={`/staff/${id}`} className="text-sm font-medium text-petrol hover:underline">← Back to profile</Link>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs text-ink/55 sm:block">Use "Save as PDF" in the print dialog to export</p>
            <button onClick={() => window.print()} className="rounded-lg bg-petrol px-4 py-2 text-sm font-semibold text-white hover:bg-petrol-700">
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      <article className="print-page mx-auto my-6 max-w-4xl rounded-xl bg-white p-8 shadow-card print:my-0">
        {/* header */}
        <header className="flex items-start justify-between border-b-4 border-petrol pb-4">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-widest text-petrol">Aldanat Care · Confidential</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink">Supervision pack: {data.staff.StaffName}</h1>
            <p className="mt-1 text-sm text-ink/70">
              {data.staff.Role} · {data.staff.Team} · Staff ID {data.staff.StaffID} · started {fmt(data.staff.StartDate)}
            </p>
          </div>
          <div className="text-right text-xs text-ink/60">
            <p>Period: {fmt(data.period.start)} – {fmt(data.period.end)}</p>
            <p>Generated {data.generatedAt ? dateLabel(data.generatedAt.slice(0, 10)) : ""} by {data.generatedBy}</p>
          </div>
        </header>

        <p className="mt-3 rounded bg-mist px-3 py-2 text-[11px] leading-snug text-ink/70 print:bg-transparent print:border print:border-ink/20">
          This pack supports a supervision conversation. Metrics are normalised per 100 completed support sessions and
          must be read alongside professional judgement - they are not an automated performance measure. People we
          support are identified by reference code only.
        </p>

        {/* 1. period summary */}
        <section className="avoid-break mt-6">
          <h2 className="font-display text-base font-semibold text-ink">1 · Period summary</h2>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Support sessions delivered", m.visits.completed.toLocaleString(), `${m.visits.latePct}% late · ${m.visits.missedPct}% missed`],
              ["Incidents", `${m.incidents.count} (${m.incidents.per100 ?? "—"}/100)`, `${m.incidents.high} high severity · ${m.incidents.notifiable} notifiable`],
              ["Complaints", `${m.complaints.count}`, `${m.complaints.upheld} upheld or partially upheld`],
              ["Feedback average", m.feedback.avg !== null ? `${m.feedback.avg}/5` : "—", `${m.feedback.count} responses · ${m.feedback.low} low (1-2)`],
            ].map(([label, value, sub]) => (
              <div key={label as string} className="rounded-lg border border-ink/15 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink/55">{label}</p>
                <p className="font-display text-xl font-bold tabular text-ink">{value}</p>
                <p className="text-[11px] text-ink/60">{sub}</p>
              </div>
            ))}
          </div>
          {(m.smallSample.visits || m.smallSample.feedback) && (
            <p className="mt-2 text-[11px] italic text-amber-700">
              Small sample warning: {m.smallSample.visits ? "fewer than 50 completed sessions" : ""}
              {m.smallSample.visits && m.smallSample.feedback ? " and " : ""}
              {m.smallSample.feedback ? "fewer than 10 feedback responses" : ""} in this period - treat comparisons with caution.
            </p>
          )}
          {m.strongReporter && (
            <p className="mt-2 rounded border border-petrol/30 bg-petrol-50 px-3 py-2 text-[11px] text-petrol-800 print:bg-transparent">
              <strong>Strong reporter flag.</strong> High incident volume with a low-severity mix and feedback of {m.feedback.avg}/5.
              Interpret the volume as healthy reporting culture; consider recognising it in this supervision.
            </p>
          )}
        </section>

        {/* 2. QRI breakdown */}
        <section className="avoid-break mt-6">
          <h2 className="font-display text-base font-semibold text-ink">
            2 · Quality Risk Index: {m.qri ?? "—"} {m.band ? `(${m.band})` : "(not rated - small sample)"}
          </h2>
          <table className="mt-2 w-full border-collapse">
            <thead>
              <tr><Th>Component</Th><Th>How it is calculated</Th><Th className="text-right">Points</Th></tr>
            </thead>
            <tbody>
              {(m.qriBreakdown ?? []).map((b) => (
                <tr key={b.label}>
                  <Td className="font-medium">{b.label}</Td>
                  <Td>{b.detail}</Td>
                  <Td className="text-right tabular font-semibold">{b.value}</Td>
                </tr>
              ))}
              <tr>
                <Td className="font-bold">Total QRI</Td>
                <Td>{""}</Td>
                <Td className="text-right tabular font-bold">{m.qri ?? "—"}</Td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. event log */}
        <section className="mt-6">
          <h2 className="font-display text-base font-semibold text-ink">3 · Event log ({data.events.length})</h2>
          {data.events.length === 0 ? (
            <p className="mt-2 text-xs text-ink/60">No incidents, complaints or low feedback scores in this period.</p>
          ) : (
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr><Th>Date</Th><Th>Type</Th><Th>Detail</Th><Th>Person</Th><Th>Status / outcome</Th></tr>
              </thead>
              <tbody>
                {data.events.map((e) => (
                  <tr key={`${e.type}-${e.id}`}>
                    <Td className="whitespace-nowrap">{fmt(e.date)}</Td>
                    <Td>{e.type}</Td>
                    <Td>
                      {e.type === "Incident" && `${e.Category} - ${e.Severity}${e.CQCNotifiable ? " (CQC notifiable)" : ""}${e.ReportedWithin24h ? "" : " - reported late"}`}
                      {e.type === "Complaint" && `${e.Category} (${e.Source})`}
                      {e.type === "Low feedback" && `Score ${e.Score}/5 - ${e.Theme} (${e.Method})`}
                    </Td>
                    <Td>{e.ClientRef}</Td>
                    <Td>{e.type === "Complaint" ? e.Outcome : e.Status ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 4. feedback themes */}
        <section className="avoid-break mt-6">
          <h2 className="font-display text-base font-semibold text-ink">4 · Feedback themes (verbatim)</h2>
          {data.feedbackThemes.length === 0 ? (
            <p className="mt-2 text-xs text-ink/60">No themed feedback recorded in this period.</p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {data.feedbackThemes.map((t) => (
                <div key={t.Theme} className={`rounded-lg border px-3 py-2 text-xs ${t.hasLow ? "border-rust/30 bg-rust-100/40" : "border-sage/30 bg-sage-100/40"} print:bg-transparent`}>
                  <span className="font-semibold text-ink">“{t.Theme}”</span>
                  <span className="text-ink/60"> · {t.count}× · avg score {t.avgScore}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 5. previous actions */}
        <section className="mt-6">
          <h2 className="font-display text-base font-semibold text-ink">5 · Previous actions and their status</h2>
          {data.actions.length === 0 ? (
            <p className="mt-2 text-xs text-ink/60">No previous actions recorded.</p>
          ) : (
            <table className="mt-2 w-full border-collapse">
              <thead>
                <tr><Th>Created</Th><Th>Source</Th><Th>Action</Th><Th>Owner</Th><Th>Due</Th><Th>Status</Th></tr>
              </thead>
              <tbody>
                {data.actions.map((a) => (
                  <tr key={a.ActionID}>
                    <Td className="whitespace-nowrap">{fmt(a.CreatedDate)}</Td>
                    <Td>{a.Source}</Td>
                    <Td>{a.Description}</Td>
                    <Td>{a.Owner}</Td>
                    <Td className="whitespace-nowrap">{fmt(a.DueDate)}</Td>
                    <Td className={a.Status === "Overdue" ? "font-semibold text-rust-700" : ""}>{a.Status}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 6. blank agreed actions */}
        <section className="print-break mt-6">
          <h2 className="font-display text-base font-semibold text-ink">6 · Actions agreed in this supervision</h2>
          <table className="mt-2 w-full border-collapse">
            <thead>
              <tr><Th className="w-1/2">Agreed action</Th><Th>Owner</Th><Th>Due date</Th><Th>Review</Th></tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <Td><span className="block h-10" /></Td><Td>{""}</Td><Td>{""}</Td><Td>{""}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-10 grid grid-cols-2 gap-10 text-xs text-ink/70">
            <div>
              <div className="border-t border-ink/50 pt-1">Staff member signature · date</div>
            </div>
            <div>
              <div className="border-t border-ink/50 pt-1">Supervisor signature · date</div>
            </div>
          </div>
        </section>

        <footer className="mt-8 border-t border-ink/15 pt-3 text-[10px] text-ink/50">
          Aldanat Quality Intelligence · Confidential HR record - store in the staff member's supervision file ·
          Data minimised: no names of people we support appear in this document.
        </footer>
      </article>
    </div>
  );
}
