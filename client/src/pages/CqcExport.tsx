import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, dateLabel, useApi } from "../api";
import { ErrorNote, Spinner } from "../components/ui";
import { useMeta } from "../store";
import { qualityStatements } from "./Cqc";
import type { CqcData, Meta } from "../types";

export default function CqcExport() {
  const [params] = useSearchParams();
  const months = params.get("months") ?? "12";
  const team = params.get("team") ?? "All";
  const { meta, setMeta } = useMeta();
  // This page renders outside the app shell (for printing), so it loads its own config.
  useEffect(() => {
    if (!meta) api.get<Meta>("/api/meta").then(setMeta).catch(() => {});
  }, [meta, setMeta]);
  const { data, loading, error } = useApi<CqcData>(
    `/api/cqc?months=${months}&team=${encodeURIComponent(team)}&export=1`
  );

  if (loading) return <Spinner label="Preparing evidence pack" />;
  if (error) return <div className="p-8"><ErrorNote message={error} /></div>;
  if (!data || !meta) return null;

  const targets = meta.targets;

  return (
    <div className="min-h-screen bg-mist print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-ink/10 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/cqc" className="text-sm font-medium text-petrol hover:underline">← Back to CQC evidence</Link>
          <button onClick={() => window.print()} className="rounded-lg bg-petrol px-4 py-2 text-sm font-semibold text-white hover:bg-petrol-700">
            Print / Save as PDF
          </button>
        </div>
      </div>

      <article className="print-page mx-auto my-6 max-w-4xl rounded-xl bg-white p-8 shadow-card print:my-0">
        <header className="border-b-4 border-petrol pb-4">
          <p className="font-display text-xs font-semibold uppercase tracking-widest text-petrol">Aldanat Care · Inspection-ready evidence</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">Quality evidence pack: Safe & Well-led</h1>
          <p className="mt-1 text-sm text-ink/70">
            {team === "All" ? "All services" : team} · {dateLabel(data.period.start)} – {dateLabel(data.period.end)} ·
            prepared from the Aldanat Quality Intelligence system
          </p>
        </header>

        {qualityStatements(data, targets).map((kq) => (
          <section key={kq.key} className="mt-6">
            <h2 className="font-display text-lg font-bold text-ink">{kq.key} key question</h2>
            {kq.statements.map((st) => (
              <div key={st.title} className="avoid-break mt-3 rounded-lg border border-ink/15 p-4">
                <h3 className="font-display text-sm font-semibold text-petrol-700">Quality statement: {st.title}</h3>
                <p className="mt-1 text-[11px] italic text-ink/55">“{st.statement}”</p>
                <table className="mt-2 w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b-2 border-ink/50 text-left text-[10px] uppercase tracking-wide">
                      <th className="py-1 pr-2">Evidence measure</th><th className="py-1 pr-2">Result</th><th className="py-1">Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {st.evidence.map((ev) => (
                      <tr key={ev.label} className="border-b border-ink/10">
                        <td className="py-1.5 pr-2">{ev.label}</td>
                        <td className={`py-1.5 pr-2 font-semibold tabular ${ev.met ? "text-sage-600" : "text-amber-700"}`}>{ev.value}</td>
                        <td className="py-1.5 text-ink/60">{ev.target}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        ))}

        <section className="print-break mt-6">
          <h2 className="font-display text-lg font-bold text-ink">Appendix A · Notifiable incident log ({data.notifiable.length})</h2>
          <p className="text-[11px] text-ink/60">Statutory notifications under Regulation 18, with notification timeliness.</p>
          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-ink/50 text-left text-[10px] uppercase tracking-wide">
                <th className="py-1 pr-2">Date</th><th className="py-1 pr-2">Ref</th><th className="py-1 pr-2">Category</th>
                <th className="py-1 pr-2">Severity</th><th className="py-1 pr-2">Service</th><th className="py-1 pr-2">Person</th>
                <th className="py-1 pr-2">In 24h</th><th className="py-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.notifiable.map((n) => (
                <tr key={n.IncidentID} className="border-b border-ink/10">
                  <td className="py-1 pr-2 whitespace-nowrap">{dateLabel(n.IncidentDate)}</td>
                  <td className="py-1 pr-2 tabular">{n.IncidentID}</td>
                  <td className="py-1 pr-2">{n.Category}</td>
                  <td className="py-1 pr-2">{n.Severity}</td>
                  <td className="py-1 pr-2">{n.Team}</td>
                  <td className="py-1 pr-2">{n.ClientRef}</td>
                  <td className={`py-1 pr-2 font-semibold ${n.ReportedWithin24h ? "text-sage-600" : "text-rust-700"}`}>{n.ReportedWithin24h ? "Yes" : "No"}</td>
                  <td className="py-1">{n.Status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-6 avoid-break">
          <h2 className="font-display text-lg font-bold text-ink">Appendix B · Complaint handling ({data.complaintHandling.total})</h2>
          <p className="text-[11px] text-ink/60">
            {data.complaintHandling.within28Pct ?? "—"}% of resolved complaints closed within 28 days (target {targets.resolvedWithin28dPct}%) ·
            average {data.complaintHandling.avgDays ?? "—"} days to resolution.
          </p>
          <table className="mt-2 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b-2 border-ink/50 text-left text-[10px] uppercase tracking-wide">
                <th className="py-1 pr-2">Received</th><th className="py-1 pr-2">Ref</th><th className="py-1 pr-2">Source</th>
                <th className="py-1 pr-2">Category</th><th className="py-1 pr-2">Outcome</th><th className="py-1">Days to resolve</th>
              </tr>
            </thead>
            <tbody>
              {data.complaintHandling.complaints.map((c) => (
                <tr key={c.ComplaintID} className="border-b border-ink/10">
                  <td className="py-1 pr-2 whitespace-nowrap">{dateLabel(c.DateReceived)}</td>
                  <td className="py-1 pr-2 tabular">{c.ComplaintID}</td>
                  <td className="py-1 pr-2">{c.Source}</td>
                  <td className="py-1 pr-2">{c.Category}</td>
                  <td className="py-1 pr-2">{c.Outcome}</td>
                  <td className={`py-1 tabular ${c.daysToResolve !== null && c.daysToResolve > 28 ? "font-semibold text-rust-700" : ""}`}>{c.daysToResolve ?? "open"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="mt-8 border-t border-ink/15 pt-3 text-[10px] text-ink/50">
          Generated by Aldanat Quality Intelligence · People we support are identified by reference code only ·
          This export is recorded in the system audit log.
        </footer>
      </article>
    </div>
  );
}
