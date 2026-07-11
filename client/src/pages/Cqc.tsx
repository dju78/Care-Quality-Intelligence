import { Link } from "react-router-dom";
import { dateLabel, useApi } from "../api";
import { Card, EmptyState, ErrorNote, NetworkNote, ProgressBar, SectionDivider, SectionHeading, Spinner } from "../components/ui";
import { useFilters, useMeta } from "../store";
import type { CqcData } from "../types";

/** Maps CQI metrics to CQC single assessment framework quality statements. */
export function qualityStatements(d: CqcData, targets: { reportedWithin24hPct: number; avgFeedback: number; resolvedWithin28dPct: number }) {
  return [
    {
      key: "Safe",
      statements: [
        {
          title: "Learning culture",
          statement: "We have a proactive and positive culture of safety based on openness and honesty, in which concerns about safety are listened to, safety events are investigated and reported thoroughly, and lessons are learned to continually identify and embed good practices.",
          evidence: [
            { label: "Incidents reported within 24 hours", value: d.kpis.reported24hPct !== null ? `${d.kpis.reported24hPct}%` : "—", target: `target ${targets.reportedWithin24hPct}%`, met: d.kpis.reported24hPct !== null && d.kpis.reported24hPct >= targets.reportedWithin24hPct },
            { label: "Incidents logged in period", value: String(d.kpis.incidents), target: "all staff report through CQI", met: true },
            { label: "Learning actions completed", value: d.learning.completedPct !== null ? `${d.learning.completedPct}%` : "—", target: `${d.learning.completed} of ${d.learning.totalActions} actions`, met: d.learning.completedPct !== null && d.learning.completedPct >= 75 },
          ],
        },
        {
          title: "Safeguarding",
          statement: "We work with people to understand what being safe means to them and work with our partners to develop the best way to achieve this.",
          evidence: [
            { label: "CQC notifiable events (Reg 18)", value: String(d.notifiable.length), target: "full log with notification dates below", met: true },
            { label: "High severity incidents", value: String(d.kpis.highSeverity), target: "each triggers a management review", met: true },
          ],
        },
        {
          title: "Involving people to manage risks",
          statement: "We work with people to understand and manage risks by thinking holistically, so that care meets their needs in a way that is safe and supportive.",
          evidence: [
            { label: "Support sessions delivered", value: d.kpis.completedVisits.toLocaleString(), target: `${d.kpis.missedPct ?? 0}% missed`, met: (d.kpis.missedPct ?? 0) < 1.5 },
            { label: "Average feedback from people supported", value: d.kpis.avgFeedback !== null ? `${d.kpis.avgFeedback}/5` : "—", target: `target ${targets.avgFeedback.toFixed(1)}`, met: d.kpis.avgFeedback !== null && d.kpis.avgFeedback >= targets.avgFeedback },
          ],
        },
      ],
    },
    {
      key: "Well-led",
      statements: [
        {
          title: "Governance, management and sustainability",
          statement: "We have clear responsibilities, roles, systems of accountability and good governance to manage and deliver good quality, sustainable care.",
          evidence: [
            { label: "Complaints resolved within 28 days", value: d.complaintHandling.within28Pct !== null ? `${d.complaintHandling.within28Pct}%` : "—", target: `target ${targets.resolvedWithin28dPct}% · avg ${d.complaintHandling.avgDays ?? "—"} days`, met: d.complaintHandling.within28Pct !== null && d.complaintHandling.within28Pct >= targets.resolvedWithin28dPct },
            { label: "Complaints upheld", value: d.kpis.upheldPct !== null ? `${d.kpis.upheldPct}%` : "—", target: "of decided complaints", met: d.kpis.upheldPct !== null && d.kpis.upheldPct < 40 },
            { label: "Staff-level quality monitoring", value: "QRI in place", target: "risk-banded, reviewed in supervision", met: true },
          ],
        },
        {
          title: "Learning, improvement and innovation",
          statement: "We focus on continuous learning, innovation and improvement across our organisation and the local system.",
          evidence: [
            { label: "Actions from incidents & complaints", value: String(d.learning.totalActions), target: `${d.learning.overdue} overdue`, met: d.learning.overdue === 0 },
            { label: "Audit trail of imports, edits and exports", value: "Complete", target: "see Admin › Audit log", met: true },
          ],
        },
      ],
    },
  ];
}

export default function Cqc() {
  const { team, months } = useFilters();
  const { meta } = useMeta();
  const { data, loading, waking, error, isNetwork, retry } = useApi<CqcData>(`/api/cqc?months=${months}&team=${encodeURIComponent(team)}`);

  return (
    <div className="space-y-5">
      {/* inspection-ready banner (carries the export action) */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#BBD4D3] bg-petroltint px-4 py-4">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-petrol text-white">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <div>
            <p className="text-[13.5px] font-semibold text-petrol-700">Inspection-ready evidence</p>
            <p className="mt-0.5 max-w-2xl text-[12.5px] leading-snug text-[#2f4f4c]">
              CQI metrics are mapped to the CQC single assessment framework quality statements for <strong className="font-semibold">Safe</strong> and <strong className="font-semibold">Well-led</strong>. Every figure is drawn from source records and is exportable as a dated evidence pack.
            </p>
          </div>
        </div>
        <Link
          to={`/cqc/export?months=${months}&team=${encodeURIComponent(team)}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-petrol px-[18px] py-[11px] text-[13.5px] font-semibold text-white hover:bg-petrol-700"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Export evidence pack
        </Link>
      </div>

      {loading && !data && <Spinner label={waking ? "Waking the demo server and loading synthetic data" : "Compiling evidence"} />}
      {error && !data && (isNetwork ? <NetworkNote onRetry={retry} /> : <ErrorNote message={error} />)}

      {data && meta && (
        <>
          {qualityStatements(data, meta.targets).map((kq) => (
            <section key={kq.key}>
              <SectionDivider title={kq.key} />
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                {kq.statements.map((st) => (
                  <Card key={st.title} className="p-4">
                    <h3 className="font-display font-semibold text-ink">{st.title}</h3>
                    <p className="mt-1 text-xs italic text-ink/55">“{st.statement}”</p>
                    <ul className="mt-3 space-y-2">
                      {st.evidence.map((ev) => (
                        <li key={ev.label} className="flex items-start justify-between gap-2 text-sm">
                          <div>
                            <p className="text-ink/80">{ev.label}</p>
                            <p className="text-xs text-ink/50">{ev.target}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular ${ev.met ? "bg-sage-100 text-sage-600" : "bg-amber-100 text-amber-700"}`}>
                            {ev.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </section>
          ))}

          <Card className="p-4">
            <SectionHeading
              title={`Notifiable incident log (${data.notifiable.length})`}
              sub="Events notifiable to CQC under Regulation 18, with reporting timeliness"
            />
            {data.notifiable.length === 0 ? (
              <EmptyState title="No notifiable events in this period" hint="Notifiable incidents will be listed here with their notification dates." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-ink/30 text-left text-xs uppercase tracking-wide text-ink/60">
                      <th className="px-2 py-2">Date</th><th className="px-2 py-2">Ref</th><th className="px-2 py-2">Category</th>
                      <th className="px-2 py-2">Severity</th><th className="px-2 py-2">Service</th><th className="px-2 py-2">Person</th>
                      <th className="px-2 py-2">Notified in 24h</th><th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.notifiable.map((n) => (
                      <tr key={n.IncidentID} className="border-b border-ink/10">
                        <td className="px-2 py-1.5 whitespace-nowrap">{dateLabel(n.IncidentDate)}</td>
                        <td className="px-2 py-1.5 tabular">{n.IncidentID}</td>
                        <td className="px-2 py-1.5">{n.Category}</td>
                        <td className="px-2 py-1.5">{n.Severity}</td>
                        <td className="px-2 py-1.5">{n.Team}</td>
                        <td className="px-2 py-1.5">{n.ClientRef}</td>
                        <td className={`px-2 py-1.5 font-medium ${n.ReportedWithin24h ? "text-sage-600" : "text-rust-700"}`}>{n.ReportedWithin24h ? "Yes" : "No"}</td>
                        <td className="px-2 py-1.5">{n.Status}{n.DateClosed ? ` (${dateLabel(n.DateClosed)})` : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <SectionHeading title="Complaint handling timeliness" sub="Percentage of resolved complaints closed within 28 days" />
              <div className="flex items-center gap-4">
                <span className="font-display text-3xl font-bold tabular text-ink">
                  {data.complaintHandling.within28Pct !== null ? `${data.complaintHandling.within28Pct}%` : "—"}
                </span>
                <div className="flex-1">
                  <ProgressBar
                    pct={data.complaintHandling.within28Pct ?? 0}
                    tone={data.complaintHandling.within28Pct !== null && data.complaintHandling.within28Pct >= meta.targets.resolvedWithin28dPct ? "sage" : "amber"}
                  />
                  <p className="mt-1 text-xs text-ink/55">
                    {data.complaintHandling.within28} of {data.complaintHandling.resolved} resolved within 28 days · target {meta.targets.resolvedWithin28dPct}% ·
                    average {data.complaintHandling.avgDays ?? "—"} days · {data.complaintHandling.total - data.complaintHandling.resolved} still open
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <SectionHeading title="Learning actions" sub="Actions raised from incidents, complaints and supervision" />
              <div className="flex items-center gap-4">
                <span className="font-display text-3xl font-bold tabular text-ink">
                  {data.learning.completedPct !== null ? `${data.learning.completedPct}%` : "—"}
                </span>
                <div className="flex-1">
                  <ProgressBar pct={data.learning.completedPct ?? 0} tone={data.learning.overdue > 0 ? "amber" : "sage"} />
                  <p className="mt-1 text-xs text-ink/55">
                    {data.learning.completed} of {data.learning.totalActions} completed · {data.learning.overdue} overdue
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
