import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api, dateLabel, monthLabel, prefersReducedMotion, useApi } from "../api";
import { Card, EmptyState, ErrorNote, RagBadge, SectionHeading, SmallSampleTag, Spinner, StrongReporterBadge } from "../components/ui";
import { useFilters, useMeta } from "../store";
import type { StaffProfile as Profile, TimelineEvent } from "../types";

const animate = !prefersReducedMotion();

function EventRow({ e }: { e: TimelineEvent }) {
  const tone =
    e.type === "Incident"
      ? e.Severity === "High" ? "bg-rust" : e.Severity === "Moderate" ? "bg-amber" : "bg-sage"
      : e.type === "Complaint" ? "bg-petrol" : "bg-rust/70";
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${tone}`} aria-hidden="true" />
      <div className="min-w-0 text-sm">
        <p className="font-medium text-ink">
          {e.type === "Incident" && `${e.Category} · ${e.Severity} severity`}
          {e.type === "Complaint" && `Complaint from ${e.Source} · ${e.Outcome}`}
          {e.type === "Low feedback" && `Feedback score ${e.Score}/5 · ${e.Theme}`}
        </p>
        <p className="text-xs text-ink/60">
          {dateLabel(e.date)} · {e.ClientRef}
          {e.type === "Incident" && e.CQCNotifiable ? " · CQC notifiable" : ""}
          {e.type === "Incident" && !e.ReportedWithin24h ? " · reported late" : ""}
          {e.type === "Incident" && e.Status ? ` · ${e.Status}` : ""}
        </p>
      </div>
    </li>
  );
}

const STATUS_STYLE: Record<string, string> = {
  Completed: "bg-sage-100 text-sage-600",
  "In progress": "bg-petrol-50 text-petrol-700",
  Open: "bg-mist text-ink/70",
  Overdue: "bg-rust-100 text-rust-700",
};

export default function StaffProfile() {
  const { id } = useParams();
  const { months } = useFilters();
  const { meta } = useMeta();
  const [refresh, setRefresh] = useState(0);
  const { data, loading, error } = useApi<Profile>(id ? `/api/staff/${id}?months=${months}` : null, refresh);
  const [showActionForm, setShowActionForm] = useState(false);
  const [actionText, setActionText] = useState("");
  const [actionDue, setActionDue] = useState("");
  const [actionSource, setActionSource] = useState("Supervision");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const addAction = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await api.post(`/api/staff/${id}/actions`, { description: actionText, dueDate: actionDue, source: actionSource });
      setActionText("");
      setActionDue("");
      setShowActionForm(false);
      setRefresh((r) => r + 1);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const setActionStatus = async (actionId: string, status: string) => {
    try {
      await api.patch(`/api/actions/${actionId}`, { status });
      setRefresh((r) => r + 1);
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  if (loading) return <Spinner label="Loading profile" />;
  if (error) return <ErrorNote message={error} />;
  if (!data) return null;

  const m = data.metrics;
  const openActions = data.actions.filter((a) => a.Status !== "Completed");

  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="text-sm text-ink/60">
        <Link to="/risk" className="text-petrol hover:underline">Staff risk board</Link> / {data.staff.StaffName}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{data.staff.StaffName}</h1>
          <p className="text-sm text-ink/60">
            {data.staff.Role} · {data.staff.Team} · started {dateLabel(data.staff.StartDate)} · {data.staff.ContractedHours}h contracted
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RagBadge band={m.band} />
            {m.strongReporter && <StrongReporterBadge />}
            {m.smallSample.visits && meta && <SmallSampleTag what="sessions" min={meta.smallSample.minVisits} />}
          </div>
        </div>
        <Link
          to={`/staff/${data.staff.StaffID}/pack?months=${months}`}
          className="rounded-lg bg-petrol px-4 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-petrol-700"
        >
          Generate supervision pack
        </Link>
      </div>

      {m.strongReporter && (
        <div role="note" className="rounded-xl border border-petrol/25 bg-petrol-50 px-4 py-3 text-sm text-petrol-800">
          <strong className="font-semibold">Strong reporter, not a risk.</strong> {data.staff.StaffName.split(" ")[0]} logs
          more incidents than most colleagues, but almost all are low severity and their feedback average is{" "}
          {m.feedback.avg}. This pattern usually reflects a conscientious reporting culture - recognise it in supervision
          rather than treating the volume as a concern.
        </div>
      )}

      {/* KPI strip: raw count and rate side by side, never a raw count alone */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Incidents", raw: `${m.incidents.count}`, rate: `${m.incidents.per100 ?? "—"} per 100 sessions`, extra: `${m.incidents.high} high · ${m.incidents.moderate} moderate · ${m.incidents.low} low` },
          { label: "Complaints", raw: `${m.complaints.count}`, rate: `${m.complaints.per100 ?? "—"} per 100 sessions`, extra: `${m.complaints.upheld} upheld / partially upheld` },
          { label: "Feedback", raw: m.feedback.avg !== null ? `${m.feedback.avg}/5` : "—", rate: `${m.feedback.count} responses`, extra: `${m.feedback.low} low scores (1-2)`, warnSample: m.smallSample.feedback },
          { label: "Support sessions", raw: m.visits.completed.toLocaleString(), rate: `${m.visits.latePct}% late · ${m.visits.missedPct}% missed`, extra: `${m.visits.total.toLocaleString()} scheduled in period` },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/55">{k.label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular text-ink">{k.raw}</p>
            <p className="text-xs text-ink/60">{k.rate}</p>
            <p className="text-xs text-ink/50">{k.extra}</p>
            {"warnSample" in k && k.warnSample && meta && (
              <div className="mt-1"><SmallSampleTag what="feedback responses" min={meta.smallSample.minFeedback} /></div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <SectionHeading
            title={`Quality Risk Index: ${m.qri ?? "—"}`}
            sub="Exactly which components drive the score"
          />
          {m.qriBreakdown ? (
            <ul className="space-y-3">
              {m.qriBreakdown.map((b) => {
                const max = Math.max(...m.qriBreakdown!.map((x) => x.value), 1);
                return (
                  <li key={b.label} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{b.label}</span>
                      <span className="tabular font-semibold text-ink">{b.value}</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-mist">
                      <div className="h-full rounded-full bg-petrol" style={{ width: `${(b.value / max) * 100}%` }} />
                    </div>
                    <p className="mt-0.5 text-xs text-ink/55">{b.detail}</p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState title="No sessions in this period" hint="A QRI needs delivered support sessions as its denominator. Import visit data or widen the period." />
          )}
          {m.smallSample.visits && (
            <p className="mt-3 rounded-lg bg-amber-100/60 px-3 py-2 text-xs text-amber-700">
              Fewer than {meta?.smallSample.minVisits ?? 50} completed sessions in this period - the score is shown for
              transparency but RAG colouring is withheld because the sample is too small to be fair.
            </p>
          )}
        </Card>

        <Card className="p-4">
          <SectionHeading title="Feedback trend" sub={`Monthly average score · target ${meta?.targets.avgFeedback.toFixed(1) ?? "4.0"}`} />
          {data.feedbackTrend.length === 0 ? (
            <EmptyState title="No feedback recorded" hint="Feedback for this staff member will chart here once collected." />
          ) : (
            <div className="h-64" role="img" aria-label="Monthly average feedback score for this staff member">
              <ResponsiveContainer>
                <LineChart data={data.feedbackTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(18,51,58,0.08)" />
                  <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11 }} />
                  <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(v) => monthLabel(String(v))} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={meta?.targets.avgFeedback ?? 4} stroke="#5F9678" strokeDasharray="6 4" />
                  <Line type="monotone" dataKey="avgScore" name="Avg score" stroke="#0F5257" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={animate} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-3">
            <p className="text-xs font-medium uppercase tracking-wide text-ink/55 mb-1.5">Sessions delivered (context for the rates)</p>
            <div className="flex flex-wrap gap-1.5">
              {data.visitsMonthly.map((v) => (
                <span key={v.month} className="rounded bg-mist px-2 py-1 text-[11px] tabular text-ink/70" title={`${v.late} late, ${v.missed} missed`}>
                  {monthLabel(v.month)}: {v.total}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <SectionHeading title="Event timeline" sub="Incidents, complaints and low feedback in the selected period" />
          {data.events.length === 0 ? (
            <EmptyState title="A clean period" hint="No incidents, complaints or low feedback scores recorded in this window." />
          ) : (
            <ul className="max-h-96 overflow-y-auto pr-2">
              {data.events.map((e) => <EventRow key={`${e.type}-${e.id}`} e={e} />)}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <SectionHeading
            title={`Actions (${openActions.length} open)`}
            sub="From supervision, incident reviews and complaint outcomes"
            action={
              <button
                onClick={() => setShowActionForm((v) => !v)}
                className="rounded-lg border border-petrol/40 px-3 py-1.5 text-sm font-medium text-petrol hover:bg-petrol-50"
              >
                {showActionForm ? "Cancel" : "Add action"}
              </button>
            }
          />
          {saveError && <ErrorNote message={saveError} />}
          {showActionForm && (
            <form onSubmit={addAction} className="mb-4 space-y-2 rounded-lg bg-mist p-3">
              <label htmlFor="action-desc" className="block text-xs font-medium text-ink/70">Agreed action</label>
              <textarea
                id="action-desc"
                required
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <label className="text-xs font-medium text-ink/70">
                  Source
                  <select value={actionSource} onChange={(e) => setActionSource(e.target.value)} className="ml-2 rounded-lg border border-ink/20 px-2 py-1.5 text-sm">
                    <option>Supervision</option>
                    <option>Incident review</option>
                    <option>Complaint outcome</option>
                  </select>
                </label>
                <label className="text-xs font-medium text-ink/70">
                  Due
                  <input type="date" required value={actionDue} onChange={(e) => setActionDue(e.target.value)} className="ml-2 rounded-lg border border-ink/20 px-2 py-1.5 text-sm" />
                </label>
                <button type="submit" disabled={saving} className="ml-auto rounded-lg bg-petrol px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
                  {saving ? "Saving…" : "Save action"}
                </button>
              </div>
            </form>
          )}
          {data.actions.length === 0 && !showActionForm ? (
            <EmptyState title="No actions yet" hint="Record agreed actions from supervision here so progress is evidenced for CQC." />
          ) : (
            <ul className="space-y-2">
              {data.actions.map((a) => (
                <li key={a.ActionID} className="flex items-start justify-between gap-3 rounded-lg border border-ink/10 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-ink">{a.Description}</p>
                    <p className="text-xs text-ink/55">
                      {a.Source} · created {dateLabel(a.CreatedDate)} · due {dateLabel(a.DueDate)} · owner {a.Owner}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[a.Status] ?? "bg-mist"}`}>{a.Status}</span>
                    {a.Status !== "Completed" && (
                      <button onClick={() => setActionStatus(a.ActionID, "Completed")} className="text-xs font-medium text-petrol hover:underline">
                        Mark complete
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
