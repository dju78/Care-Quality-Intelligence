import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { monthLabel, prefersReducedMotion, useApi } from "../api";
import { CarePackageBars, Card, EmptyState, ErrorNote, KpiCard, NetworkNote, SectionHeading, Spinner } from "../components/ui";
import { Reveal, Stagger, StaggerItem } from "../components/anim";
import { useFilters } from "../store";
import type { OverviewData } from "../types";

/** Derive a short "what needs attention" list from the period KPIs. */
function attentionItems(d: OverviewData) {
  const items: { level: "Priority" | "Review" | "Watch" | "Assured"; text: string }[] = [];
  if (d.kpis.highSeverity > 0)
    items.push({ level: "Priority", text: `${d.kpis.highSeverity} high severity incident${d.kpis.highSeverity > 1 ? "s" : ""} and ${d.kpis.notifiable} CQC-notifiable events in the period — confirm each has a management review and notification date.` });
  if (d.kpis.upheldPct !== null && d.kpis.upheldPct >= 25)
    items.push({ level: "Review", text: `Complaint upheld rate of ${d.kpis.upheldPct}% sits above the 25% internal threshold — review complaint handling at the next governance meeting.` });
  if (d.kpis.reported24hPct !== null && d.kpis.reported24hPct < d.targets.reportedWithin24hPct)
    items.push({ level: "Review", text: `24-hour incident reporting is ${d.kpis.reported24hPct}% against a ${d.targets.reportedWithin24hPct}% target — reinforce timely reporting in supervision.` });
  if (d.kpis.missedPct !== null && d.kpis.missedPct >= 1.5)
    items.push({ level: "Watch", text: `Missed-session rate (${d.kpis.missedPct}%) is above the 1.5% target — check rota cover for the affected service.` });
  if (items.length === 0)
    items.push({ level: "Assured", text: "No priority quality concerns in this period. Use the risk board to plan routine supervision." });
  return items.slice(0, 4);
}

const LEVEL_TAG: Record<string, string> = {
  Priority: "bg-rust-100 text-rust-700",
  Review: "bg-amber-100 text-amber-700",
  Watch: "bg-[#E7EEEC] text-[#4a6560]",
  Assured: "bg-sage-100 text-sage-600",
};

const C = { petrol: "#0F5257", sage: "#5F9678", amber: "#D9A441", rust: "#BF4A36", ink: "#12333A" };
const animate = !prefersReducedMotion();

const tooltipStyle = {
  borderRadius: 8,
  border: "1px solid rgba(18,51,58,0.15)",
  fontSize: 12,
  fontFamily: "Inter, sans-serif",
};

export default function Overview() {
  const { team, months } = useFilters();
  const { data, loading, waking, error, isNetwork, retry } = useApi<OverviewData>(`/api/overview?months=${months}&team=${encodeURIComponent(team)}`);

  const belowFeedback = data && data.kpis.avgFeedback !== null && data.kpis.avgFeedback < data.targets.avgFeedback;
  const below24h = data && data.kpis.reported24hPct !== null && data.kpis.reported24hPct < data.targets.reportedWithin24hPct;

  return (
    <div className="space-y-5">
      {loading && <Spinner label={waking ? "Waking the demo server and loading synthetic data" : "Loading overview"} />}
      {error && (isNetwork ? <NetworkNote onRetry={retry} /> : <ErrorNote message={error} />)}

      {data && (
        <>
          <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <StaggerItem className="h-full"><KpiCard label="Incidents" value={data.kpis.incidents} sub={`${data.kpis.notifiable} CQC notifiable`} tone="petrol" /></StaggerItem>
            <StaggerItem className="h-full"><KpiCard label="High severity" value={data.kpis.highSeverity} sub="incidents in period" tone={data.kpis.highSeverity > 0 ? "amber" : "sage"} /></StaggerItem>
            <StaggerItem className="h-full"><KpiCard
              label="Reported in 24h"
              value={data.kpis.reported24hPct !== null ? `${data.kpis.reported24hPct}%` : "—"}
              tone={below24h ? "amber" : "sage"}
              target={`Target ${data.targets.reportedWithin24hPct}%${below24h ? "" : " · met"}`}
            /></StaggerItem>
            <StaggerItem className="h-full"><KpiCard label="Complaints" value={data.kpis.complaints} sub="received in period" tone="petrol" /></StaggerItem>
            <StaggerItem className="h-full"><KpiCard
              label="Upheld rate"
              value={data.kpis.upheldPct !== null ? `${data.kpis.upheldPct}%` : "—"}
              sub="of decided complaints"
              tone={data.kpis.upheldPct !== null && data.kpis.upheldPct >= 25 ? "amber" : "sage"}
            /></StaggerItem>
            <StaggerItem className="h-full"><KpiCard
              label="Avg feedback"
              value={data.kpis.avgFeedback ?? "—"}
              tone={belowFeedback ? "amber" : "sage"}
              target={`Target ${data.targets.avgFeedback.toFixed(1)} · ${data.kpis.feedbackCount} responses`}
            /></StaggerItem>
            <StaggerItem className="h-full"><KpiCard
              label="Missed sessions"
              value={data.kpis.missedPct !== null ? `${data.kpis.missedPct}%` : "—"}
              tone={data.kpis.missedPct !== null && data.kpis.missedPct >= 1.5 ? "amber" : "sage"}
              sub={`${data.kpis.latePct ?? 0}% late · ${data.kpis.completedVisits.toLocaleString()} delivered`}
            /></StaggerItem>
          </Stagger>

          {/* attention summary + trend, 1.4fr / 2fr on wide screens */}
          <Reveal className="grid gap-4 [grid-template-columns:1fr] xl:[grid-template-columns:1.4fr_2fr]">
            <Card className="flex flex-col p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-petrol text-sm font-bold text-white">!</span>
                <h2 className="font-display text-base font-semibold text-ink">What needs attention?</h2>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Summary for {team === "All" ? "all services" : team}, last {months} months. Priorities for the next supervision cycle.
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {attentionItems(data).map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`mt-px inline-flex shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${LEVEL_TAG[a.level]}`}>{a.level}</span>
                    <span className="text-[13px] leading-snug text-moss">{a.text}</span>
                  </li>
                ))}
              </ul>
              {!belowFeedback && !below24h && (
                <div className="-mx-4 -mb-4 mt-3.5 flex items-start gap-2.5 rounded-b-xl border-t border-sage/20 bg-sagetint px-4 py-3">
                  <span className="mt-px inline-flex shrink-0 rounded-full bg-avatar px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-sage-600">Evidence ready</span>
                  <span className="text-[13px] leading-snug text-sage-600">
                    24-hour reporting and feedback are both above target — strong evidence for the CQC <strong className="font-semibold">Safe</strong> and <strong className="font-semibold">Well-led</strong> statements.
                  </span>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <SectionHeading title="Incidents and complaints by month" sub="High severity incidents shown within the bars" />
              <div className="h-[250px]" role="img" aria-label="Monthly trend of incidents and complaints">
                <ResponsiveContainer>
                  <ComposedChart data={data.monthly} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(18,51,58,0.08)" />
                    <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: C.ink }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.ink }} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={(m) => monthLabel(String(m))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="incidents" name="Incidents" stackId="a" fill={C.petrol} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                    <Bar dataKey="high" name="of which high severity" stackId="b" fill={C.rust} radius={[3, 3, 0, 0]} isAnimationActive={animate} />
                    <Line type="monotone" dataKey="complaints" name="Complaints" stroke={C.amber} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={animate} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Reveal>

          <Reveal className="grid gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <SectionHeading title="Average feedback score by month" sub={`Dashed line marks the ${data.targets.avgFeedback.toFixed(1)} target · people we support`} />
              <div className="h-72" role="img" aria-label="Monthly average feedback score against target">
                <ResponsiveContainer>
                  <LineChart data={data.monthly} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(18,51,58,0.08)" />
                    <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: C.ink }} />
                    <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: C.ink }} />
                    <Tooltip contentStyle={tooltipStyle} labelFormatter={(m) => monthLabel(String(m))} />
                    <ReferenceLine y={data.targets.avgFeedback} stroke={C.sage} strokeDasharray="6 4" />
                    <Line type="monotone" dataKey="avgScore" name="Avg score" stroke={C.petrol} strokeWidth={2.5} dot={{ r: 3 }} connectNulls isAnimationActive={animate} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-4">
              <SectionHeading title="Incidents by category and severity" />
              {data.byCategory.length === 0 ? (
                <EmptyState title="No incidents in this period" hint="Widen the period filter, or celebrate a quiet quarter. New incidents appear here as soon as they are imported." />
              ) : (
                <div className="h-80" role="img" aria-label="Incidents by category, split by severity">
                  <ResponsiveContainer>
                    <BarChart data={data.byCategory} layout="vertical" margin={{ top: 0, right: 12, left: 40, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(18,51,58,0.08)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.ink }} />
                      <YAxis type="category" dataKey="Category" width={150} tick={{ fontSize: 11, fill: C.ink }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Low" stackId="s" fill={C.sage} isAnimationActive={animate} />
                      <Bar dataKey="Moderate" stackId="s" fill={C.amber} isAnimationActive={animate} />
                      <Bar dataKey="High" stackId="s" fill={C.rust} radius={[0, 3, 3, 0]} isAnimationActive={animate} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            <div className="grid gap-4">
              <Card className="p-4">
                <SectionHeading title="Complaints by source" />
                {data.bySource.length === 0 ? (
                  <EmptyState title="No complaints in this period" hint="Complaints appear here once logged through the data manager." />
                ) : (
                  <div className="h-44" role="img" aria-label="Complaints by source">
                    <ResponsiveContainer>
                      <BarChart data={data.bySource} layout="vertical" margin={{ top: 0, right: 12, left: 40, bottom: 0 }}>
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: C.ink }} />
                        <YAxis type="category" dataKey="Source" width={160} tick={{ fontSize: 11, fill: C.ink }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Bar dataKey="count" name="Complaints" fill={C.petrol} radius={[0, 3, 3, 0]} isAnimationActive={animate} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
              <Card className="p-4">
                <SectionHeading title="What drives low feedback scores" sub="Themes attached to scores of 1-2" />
                {data.lowThemes.length === 0 ? (
                  <EmptyState title="No low scores in this period" hint="Themes from 1-2 star feedback will appear here to show what to fix first." />
                ) : (
                  <ul className="space-y-2">
                    {data.lowThemes.map((t) => {
                      const max = data.lowThemes[0].count;
                      return (
                        <li key={t.Theme} className="flex items-center gap-3 text-sm">
                          <span className="w-44 shrink-0 truncate text-ink/75">{t.Theme}</span>
                          <span className="h-2.5 rounded-full bg-rust/70" style={{ width: `${(t.count / max) * 60}%` }} aria-hidden="true" />
                          <span className="tabular font-semibold text-ink/80">{t.count}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>
          </Reveal>

          {/* Secondary service context — care package mix. Not part of any risk measure. */}
          <Reveal>
            <Card className="p-4">
              <SectionHeading
                title="Service mix context"
                sub="Share of delivered support by care package type. Context only — not a performance measure."
              />
              <div className="grid gap-x-8 gap-y-2 md:grid-cols-2">
                <CarePackageBars rows={data.carePackageMix} metric="sessions" />
                <CarePackageBars rows={data.carePackageMix} metric="clients" />
              </div>
            </Card>
          </Reveal>
        </>
      )}
    </div>
  );
}
