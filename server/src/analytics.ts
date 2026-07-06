import { db, getConfig } from "./db.js";

export interface Period {
  start: string; // inclusive ISO date
  end: string; // inclusive ISO date
  months: number;
  monthKeys: string[]; // ["2026-01", ...]
}

/** Anchor the reporting window to the latest data on file, not the wall clock. */
export function getPeriod(months: number): Period {
  const row = db.prepare("SELECT MAX(VisitDate) AS d FROM visits").get() as { d: string | null };
  const endDate = row.d ?? new Date().toISOString().slice(0, 10);
  const [ey, em] = endDate.split("-").map(Number);
  const monthKeys: string[] = [];
  let y = ey;
  let m = em - (months - 1);
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  for (let i = 0; i < months; i++) {
    monthKeys.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return { start, end: endDate, months, monthKeys };
}

const teamClause = (team: string | null, alias: string) => (team ? ` AND ${alias}.StaffID IN (SELECT StaffID FROM staff WHERE Team = @team)` : "");

export interface StaffMetrics {
  StaffID: string;
  StaffName: string;
  Role: string;
  Team: string;
  Status: string;
  visits: { total: number; completed: number; late: number; missed: number; latePct: number; missedPct: number };
  incidents: {
    count: number; per100: number | null; high: number; moderate: number; low: number;
    within24hPct: number | null; notifiable: number;
  };
  complaints: { count: number; per100: number | null; upheld: number; pending: number };
  feedback: { count: number; avg: number | null; low: number; recommendPct: number | null };
  openActions: number;
  qri: number | null;
  qriBreakdown: { label: string; value: number; detail: string }[] | null;
  band: "Red" | "Amber" | "Green" | null;
  strongReporter: boolean;
  smallSample: { visits: boolean; feedback: boolean };
}

interface Weights {
  incidentsPer100Visits: number;
  highSeverityIncident: number;
  upheldComplaint: number;
  lowFeedbackScore: number;
}

export function computeStaffMetrics(period: Period, team: string | null, opts?: { includeInactive?: boolean }): StaffMetrics[] {
  const weights = getConfig<Weights>("qriWeights");
  const bands = getConfig<{ red: number; amber: number }>("ragBands");
  const small = getConfig<{ minFeedback: number; minVisits: number }>("smallSample");
  const sr = getConfig<{ minIncidents: number; maxHighSeverity: number; maxModerateShare: number; minAvgFeedback: number }>("strongReporter");

  const p = { start: period.start, end: period.end, team };
  const staff = db
    .prepare(
      `SELECT StaffID, StaffName, Role, Team, Status FROM staff
       WHERE (@team IS NULL OR Team = @team) ${opts?.includeInactive ? "" : "AND Status = 'Active'"}
       ORDER BY StaffName`
    )
    .all({ team }) as { StaffID: string; StaffName: string; Role: string; Team: string; Status: string }[];

  const v = db
    .prepare(
      `SELECT StaffID,
              COUNT(*) AS total,
              SUM(Status = 'Completed') AS completed,
              SUM(Status = 'Late') AS late,
              SUM(Status = 'Missed') AS missed
       FROM visits v WHERE VisitDate BETWEEN @start AND @end ${teamClause(team, "v")}
       GROUP BY StaffID`
    )
    .all(p) as any[];
  const i = db
    .prepare(
      `SELECT StaffID, COUNT(*) AS count,
              SUM(Severity = 'High') AS high, SUM(Severity = 'Moderate') AS moderate, SUM(Severity = 'Low') AS low,
              SUM(ReportedWithin24h) AS on24, SUM(CQCNotifiable) AS notifiable
       FROM incidents v WHERE IncidentDate BETWEEN @start AND @end ${teamClause(team, "v")}
       GROUP BY StaffID`
    )
    .all(p) as any[];
  const c = db
    .prepare(
      `SELECT StaffID, COUNT(*) AS count,
              SUM(Outcome IN ('Upheld','Partially upheld')) AS upheld,
              SUM(Outcome = 'Pending') AS pending
       FROM complaints v WHERE DateReceived BETWEEN @start AND @end ${teamClause(team, "v")}
       GROUP BY StaffID`
    )
    .all(p) as any[];
  const f = db
    .prepare(
      `SELECT StaffID, COUNT(*) AS count, AVG(Score) AS avg, SUM(Score <= 2) AS low, AVG(WouldRecommend) * 100 AS recommendPct
       FROM feedback v WHERE FeedbackDate BETWEEN @start AND @end ${teamClause(team, "v")}
       GROUP BY StaffID`
    )
    .all(p) as any[];
  const a = db
    .prepare(
      `SELECT StaffID, COUNT(*) AS open FROM actions v
       WHERE Status IN ('Open','In progress','Overdue') ${teamClause(team, "v")}
       GROUP BY StaffID`
    )
    .all({ team }) as any[];

  const byId = <T extends { StaffID: string }>(rows: T[]) => new Map(rows.map((r) => [r.StaffID, r]));
  const vm = byId(v), im = byId(i), cm = byId(c), fm = byId(f), am = byId(a);

  const results: StaffMetrics[] = staff.map((s) => {
    const vv = vm.get(s.StaffID) ?? { total: 0, completed: 0, late: 0, missed: 0 };
    const ii = im.get(s.StaffID) ?? { count: 0, high: 0, moderate: 0, low: 0, on24: 0, notifiable: 0 };
    const cc = cm.get(s.StaffID) ?? { count: 0, upheld: 0, pending: 0 };
    const ff = fm.get(s.StaffID) ?? { count: 0, avg: null, low: 0, recommendPct: null };
    const completed = vv.completed + vv.late; // a late session was still delivered
    const per100 = (n: number) => (completed > 0 ? (n / completed) * 100 : null);

    const smallVisits = completed < small.minVisits;
    const smallFeedback = ff.count < small.minFeedback;

    const incRate = per100(ii.count);
    let qri: number | null = null;
    let breakdown: StaffMetrics["qriBreakdown"] = null;
    if (completed > 0) {
      const parts = [
        {
          label: "Incident rate",
          value: (incRate ?? 0) * weights.incidentsPer100Visits,
          detail: `${ii.count} incidents over ${completed} completed sessions = ${(incRate ?? 0).toFixed(2)} per 100 x weight ${weights.incidentsPer100Visits}`,
        },
        {
          label: "High severity incidents",
          value: ii.high * weights.highSeverityIncident,
          detail: `${ii.high} high severity x weight ${weights.highSeverityIncident}`,
        },
        {
          label: "Upheld complaints",
          value: cc.upheld * weights.upheldComplaint,
          detail: `${cc.upheld} upheld or partially upheld x weight ${weights.upheldComplaint}`,
        },
        {
          label: "Low feedback scores",
          value: ff.low * weights.lowFeedbackScore,
          detail: `${ff.low} scores of 1-2 x weight ${weights.lowFeedbackScore}`,
        },
      ];
      breakdown = parts.map((x) => ({ ...x, value: Math.round(x.value * 100) / 100 }));
      qri = Math.round(parts.reduce((s2, x) => s2 + x.value, 0) * 10) / 10;
    }

    return {
      ...s,
      visits: {
        total: vv.total,
        completed,
        late: vv.late,
        missed: vv.missed,
        latePct: vv.total ? Math.round((vv.late / vv.total) * 1000) / 10 : 0,
        missedPct: vv.total ? Math.round((vv.missed / vv.total) * 1000) / 10 : 0,
      },
      incidents: {
        count: ii.count,
        per100: incRate === null ? null : Math.round(incRate * 100) / 100,
        high: ii.high,
        moderate: ii.moderate,
        low: ii.low,
        within24hPct: ii.count ? Math.round((ii.on24 / ii.count) * 1000) / 10 : null,
        notifiable: ii.notifiable,
      },
      complaints: {
        count: cc.count,
        per100: per100(cc.count) === null ? null : Math.round(per100(cc.count)! * 100) / 100,
        upheld: cc.upheld,
        pending: cc.pending,
      },
      feedback: {
        count: ff.count,
        avg: ff.avg === null ? null : Math.round(ff.avg * 100) / 100,
        low: ff.low,
        recommendPct: ff.recommendPct === null ? null : Math.round(ff.recommendPct),
      },
      openActions: am.get(s.StaffID)?.open ?? 0,
      qri,
      qriBreakdown: breakdown,
      // Small samples suppress the RAG judgement ("statistical honesty").
      band: qri === null || smallVisits ? null : qri >= bands.red ? "Red" : qri >= bands.amber ? "Amber" : "Green",
      strongReporter: false, // filled in below once rates are known for the cohort
      smallSample: { visits: smallVisits, feedback: smallFeedback },
    };
  });

  // Reporting culture guard: many incidents but a low-severity mix and strong
  // feedback marks a conscientious reporter, not a risk.
  const rates = results.filter((r) => !r.smallSample.visits && r.incidents.per100 !== null).map((r) => r.incidents.per100!) .sort((x, y) => x - y);
  const p75 = rates.length ? rates[Math.min(rates.length - 1, Math.floor(rates.length * 0.75))] : 0;
  for (const r of results) {
    const moderateShare = r.incidents.count ? r.incidents.moderate / r.incidents.count : 0;
    r.strongReporter =
      r.incidents.count >= sr.minIncidents &&
      r.incidents.per100 !== null &&
      r.incidents.per100 >= p75 &&
      r.incidents.high <= sr.maxHighSeverity &&
      moderateShare <= sr.maxModerateShare &&
      r.feedback.avg !== null &&
      r.feedback.avg >= sr.minAvgFeedback &&
      !r.smallSample.feedback;
  }
  return results;
}

export function computeOverview(period: Period, team: string | null) {
  const targets = getConfig("targets");
  const p = { start: period.start, end: period.end, team };

  const inc = db
    .prepare(
      `SELECT COUNT(*) AS count, SUM(Severity='High') AS high, AVG(ReportedWithin24h)*100 AS on24Pct,
              SUM(CQCNotifiable) AS notifiable
       FROM incidents v WHERE IncidentDate BETWEEN @start AND @end ${teamClause(team, "v")}`
    )
    .get(p) as any;
  const cmp = db
    .prepare(
      `SELECT COUNT(*) AS count,
              SUM(Outcome IN ('Upheld','Partially upheld')) AS upheld,
              SUM(Outcome != 'Pending') AS decided
       FROM complaints v WHERE DateReceived BETWEEN @start AND @end ${teamClause(team, "v")}`
    )
    .get(p) as any;
  const fb = db
    .prepare(
      `SELECT COUNT(*) AS count, AVG(Score) AS avg, SUM(Score<=2) AS low, AVG(WouldRecommend)*100 AS recommendPct
       FROM feedback v WHERE FeedbackDate BETWEEN @start AND @end ${teamClause(team, "v")}`
    )
    .get(p) as any;
  const vis = db
    .prepare(
      `SELECT COUNT(*) AS total, SUM(Status='Missed') AS missed, SUM(Status='Late') AS late,
              SUM(Status IN ('Completed','Late')) AS completed
       FROM visits v WHERE VisitDate BETWEEN @start AND @end ${teamClause(team, "v")}`
    )
    .get(p) as any;

  // monthly series
  const seriesRows = (sql: string) => db.prepare(sql).all(p) as any[];
  const incMonthly = seriesRows(
    `SELECT substr(IncidentDate,1,7) AS month, COUNT(*) AS incidents, SUM(Severity='High') AS high
     FROM incidents v WHERE IncidentDate BETWEEN @start AND @end ${teamClause(team, "v")} GROUP BY month`
  );
  const cmpMonthly = seriesRows(
    `SELECT substr(DateReceived,1,7) AS month, COUNT(*) AS complaints FROM complaints v
     WHERE DateReceived BETWEEN @start AND @end ${teamClause(team, "v")} GROUP BY month`
  );
  const fbMonthly = seriesRows(
    `SELECT substr(FeedbackDate,1,7) AS month, AVG(Score) AS avgScore FROM feedback v
     WHERE FeedbackDate BETWEEN @start AND @end ${teamClause(team, "v")} GROUP BY month`
  );
  const visMonthly = seriesRows(
    `SELECT substr(VisitDate,1,7) AS month, COUNT(*) AS total, SUM(Status='Missed') AS missed FROM visits v
     WHERE VisitDate BETWEEN @start AND @end ${teamClause(team, "v")} GROUP BY month`
  );
  const find = (rows: any[], month: string) => rows.find((r) => r.month === month);
  const monthly = period.monthKeys.map((month) => {
    const im = find(incMonthly, month), cm2 = find(cmpMonthly, month), fm2 = find(fbMonthly, month), vm2 = find(visMonthly, month);
    return {
      month,
      incidents: im?.incidents ?? 0,
      high: im?.high ?? 0,
      complaints: cm2?.complaints ?? 0,
      avgScore: fm2 ? Math.round(fm2.avgScore * 100) / 100 : null,
      missedPct: vm2?.total ? Math.round((vm2.missed / vm2.total) * 1000) / 10 : 0,
    };
  });

  const byCategory = seriesRows(
    `SELECT Category, SUM(Severity='Low') AS Low, SUM(Severity='Moderate') AS Moderate, SUM(Severity='High') AS High, COUNT(*) AS total
     FROM incidents v WHERE IncidentDate BETWEEN @start AND @end ${teamClause(team, "v")}
     GROUP BY Category ORDER BY total DESC`
  );
  const bySource = seriesRows(
    `SELECT Source, COUNT(*) AS count FROM complaints v
     WHERE DateReceived BETWEEN @start AND @end ${teamClause(team, "v")} GROUP BY Source ORDER BY count DESC`
  );
  const lowThemes = seriesRows(
    `SELECT Theme, COUNT(*) AS count FROM feedback v
     WHERE FeedbackDate BETWEEN @start AND @end AND Score <= 2 ${teamClause(team, "v")}
     GROUP BY Theme ORDER BY count DESC LIMIT 8`
  );
  // Contextual only: service mix by delivered support, never used in QRI or any judgement.
  const carePackageMix = seriesRows(
    `SELECT c.CarePackage AS name, COUNT(DISTINCT v.ClientID) AS clients, COUNT(*) AS sessions
     FROM visits v JOIN clients c ON c.ClientID = v.ClientID
     WHERE v.Status IN ('Completed','Late') AND v.VisitDate BETWEEN @start AND @end ${teamClause(team, "v")}
     GROUP BY c.CarePackage ORDER BY sessions DESC`
  );

  return {
    period,
    targets,
    kpis: {
      incidents: inc.count ?? 0,
      highSeverity: inc.high ?? 0,
      notifiable: inc.notifiable ?? 0,
      reported24hPct: inc.count ? Math.round(inc.on24Pct * 10) / 10 : null,
      complaints: cmp.count ?? 0,
      upheldPct: cmp.decided ? Math.round((cmp.upheld / cmp.decided) * 1000) / 10 : null,
      avgFeedback: fb.avg !== null ? Math.round(fb.avg * 100) / 100 : null,
      feedbackCount: fb.count ?? 0,
      recommendPct: fb.recommendPct !== null ? Math.round(fb.recommendPct) : null,
      missedPct: vis.total ? Math.round((vis.missed / vis.total) * 1000) / 10 : null,
      latePct: vis.total ? Math.round((vis.late / vis.total) * 1000) / 10 : null,
      completedVisits: vis.completed ?? 0,
    },
    monthly,
    byCategory,
    bySource,
    lowThemes,
    carePackageMix,
  };
}

export function computeCqc(period: Period, team: string | null) {
  const p = { start: period.start, end: period.end, team };
  const notifiable = db
    .prepare(
      `SELECT i.IncidentID, i.IncidentDate, i.Category, i.Severity, i.ReportedWithin24h, i.Status, i.DateClosed,
              s.StaffName, s.Team, c.ClientRef
       FROM incidents i JOIN staff s ON s.StaffID = i.StaffID JOIN clients c ON c.ClientID = i.ClientID
       WHERE i.CQCNotifiable = 1 AND i.IncidentDate BETWEEN @start AND @end ${team ? "AND s.Team = @team" : ""}
       ORDER BY i.IncidentDate DESC`
    )
    .all(p) as any[];

  const complaints = db
    .prepare(
      `SELECT cm.ComplaintID, cm.DateReceived, cm.DateResolved, cm.Source, cm.Category, cm.Outcome,
              s.Team, c.ClientRef,
              CASE WHEN cm.DateResolved IS NOT NULL
                   THEN CAST(julianday(cm.DateResolved) - julianday(cm.DateReceived) AS INTEGER)
                   ELSE NULL END AS daysToResolve
       FROM complaints cm JOIN staff s ON s.StaffID = cm.StaffID JOIN clients c ON c.ClientID = cm.ClientID
       WHERE cm.DateReceived BETWEEN @start AND @end ${team ? "AND s.Team = @team" : ""}
       ORDER BY cm.DateReceived DESC`
    )
    .all(p) as any[];
  const resolved = complaints.filter((c) => c.daysToResolve !== null);
  const within28 = resolved.filter((c) => c.daysToResolve <= 28).length;

  const actions = db
    .prepare(
      `SELECT a.ActionID, a.CreatedDate, a.Source, a.Description, a.Owner, a.DueDate, a.Status, s.StaffName, s.Team
       FROM actions a JOIN staff s ON s.StaffID = a.StaffID
       WHERE a.CreatedDate BETWEEN @start AND @end ${team ? "AND s.Team = @team" : ""}
       ORDER BY a.CreatedDate DESC`
    )
    .all(p) as any[];
  const completedActions = actions.filter((a) => a.Status === "Completed").length;

  const overview = computeOverview(period, team);

  return {
    period,
    notifiable,
    complaintHandling: {
      total: complaints.length,
      resolved: resolved.length,
      within28,
      within28Pct: resolved.length ? Math.round((within28 / resolved.length) * 1000) / 10 : null,
      avgDays: resolved.length ? Math.round(resolved.reduce((s, c) => s + c.daysToResolve, 0) / resolved.length) : null,
      complaints,
    },
    learning: {
      totalActions: actions.length,
      completed: completedActions,
      completedPct: actions.length ? Math.round((completedActions / actions.length) * 1000) / 10 : null,
      overdue: actions.filter((a) => a.Status === "Overdue").length,
      actions,
    },
    kpis: overview.kpis,
  };
}
