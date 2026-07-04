import {
  Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart,
  ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { monthLabel, prefersReducedMotion, useApi } from "../api";
import { FilterBar } from "../components/Layout";
import { Card, EmptyState, ErrorNote, KpiCard, SectionHeading, Spinner } from "../components/ui";
import { useFilters } from "../store";
import type { OverviewData } from "../types";

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
  const { data, loading, error } = useApi<OverviewData>(`/api/overview?months=${months}&team=${encodeURIComponent(team)}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Quality overview</h1>
          <p className="text-sm text-ink/60">
            Incidents, complaints and feedback across {team === "All" ? "all Aldanat services" : team}, last {months} months
          </p>
        </div>
        <FilterBar />
      </div>

      {error && <ErrorNote message={error} />}
      {loading && <Spinner label="Loading overview" />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <KpiCard label="Incidents" value={data.kpis.incidents} sub={`${data.kpis.notifiable} CQC notifiable`} />
            <KpiCard label="High severity" value={data.kpis.highSeverity} warn={data.kpis.highSeverity > 0} sub="incidents in period" />
            <KpiCard
              label="Reported in 24h"
              value={data.kpis.reported24hPct !== null ? `${data.kpis.reported24hPct}%` : "—"}
              good={data.kpis.reported24hPct !== null ? data.kpis.reported24hPct >= data.targets.reportedWithin24hPct : undefined}
              target={`Target ${data.targets.reportedWithin24hPct}%`}
            />
            <KpiCard label="Complaints" value={data.kpis.complaints} sub="received in period" />
            <KpiCard
              label="Upheld rate"
              value={data.kpis.upheldPct !== null ? `${data.kpis.upheldPct}%` : "—"}
              good={data.kpis.upheldPct !== null ? data.kpis.upheldPct < 25 : undefined}
              sub="of decided complaints"
            />
            <KpiCard
              label="Avg feedback"
              value={data.kpis.avgFeedback ?? "—"}
              good={data.kpis.avgFeedback !== null ? data.kpis.avgFeedback >= data.targets.avgFeedback : undefined}
              target={`Target ${data.targets.avgFeedback.toFixed(1)} · ${data.kpis.feedbackCount} responses`}
            />
            <KpiCard
              label="Missed sessions"
              value={data.kpis.missedPct !== null ? `${data.kpis.missedPct}%` : "—"}
              good={data.kpis.missedPct !== null ? data.kpis.missedPct < 1.5 : undefined}
              sub={`${data.kpis.latePct ?? 0}% late · ${data.kpis.completedVisits.toLocaleString()} delivered`}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="p-4">
              <SectionHeading title="Incidents and complaints by month" sub="High severity incidents shown within the bars" />
              <div className="h-72" role="img" aria-label="Monthly trend of incidents and complaints">
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

            <Card className="p-4">
              <SectionHeading title="Average feedback score by month" sub={`Dashed line marks the ${data.targets.avgFeedback.toFixed(1)} target`} />
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
          </div>
        </>
      )}
    </div>
  );
}
