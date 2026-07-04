import { Router } from "express";
import { db, audit, getConfig } from "./db.js";
import { login, logout, requireAuth, effectiveTeam, canSeeTeam } from "./auth.js";
import { computeOverview, computeStaffMetrics, computeCqc, getPeriod } from "./analytics.js";

export const router = Router();

const parseMonths = (q: unknown): number => {
  const n = Number(q);
  return n === 3 || n === 6 || n === 12 ? n : 12;
};

router.post("/login", (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Username and password required" });
  }
  const result = login(username.trim().toLowerCase(), password);
  if (!result) return res.status(401).json({ error: "Invalid username or password" });
  res.json(result);
});

router.post("/logout", requireAuth, (req, res) => {
  const token = (req.headers.authorization ?? "").slice(7);
  logout(token);
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => res.json(req.user));

router.get("/meta", requireAuth, (req, res) => {
  const teams =
    req.user!.Role === "Team Leader"
      ? [req.user!.Team]
      : (db.prepare("SELECT DISTINCT Team FROM staff ORDER BY Team").all() as { Team: string }[]).map((t) => t.Team);
  const range = db.prepare("SELECT MIN(VisitDate) AS min, MAX(VisitDate) AS max FROM visits").get();
  res.json({
    teams,
    range,
    ragBands: getConfig("ragBands"),
    targets: getConfig("targets"),
    smallSample: getConfig("smallSample"),
  });
});

router.get("/overview", requireAuth, (req, res) => {
  const period = getPeriod(parseMonths(req.query.months));
  res.json(computeOverview(period, effectiveTeam(req)));
});

router.get("/staff", requireAuth, (req, res) => {
  const period = getPeriod(parseMonths(req.query.months));
  const metrics = computeStaffMetrics(period, effectiveTeam(req));
  res.json({ period, staff: metrics });
});

function loadProfile(req: import("express").Request, res: import("express").Response) {
  const id = req.params.id;
  const staff = db.prepare("SELECT * FROM staff WHERE StaffID = ?").get(id) as any;
  if (!staff) {
    res.status(404).json({ error: "Staff member not found" });
    return null;
  }
  if (!canSeeTeam(req, staff.Team)) {
    res.status(403).json({ error: "You do not have access to this team member" });
    return null;
  }
  const period = getPeriod(parseMonths(req.query.months));
  // Cohort for percentile comparisons = everything this user is allowed to see.
  const cohort = computeStaffMetrics(period, req.user!.Role === "Team Leader" ? req.user!.Team : null);
  const metrics = cohort.find((m) => m.StaffID === id) ?? computeStaffMetrics(period, staff.Team, { includeInactive: true }).find((m) => m.StaffID === id);
  if (!metrics) {
    res.status(404).json({ error: "No metrics available for this staff member" });
    return null;
  }
  const p = { start: period.start, end: period.end, id };

  const feedbackTrend = db
    .prepare(
      `SELECT substr(FeedbackDate,1,7) AS month, AVG(Score) AS avgScore, COUNT(*) AS count
       FROM feedback WHERE StaffID = @id AND FeedbackDate BETWEEN @start AND @end GROUP BY month ORDER BY month`
    )
    .all(p) as any[];
  const visitsMonthly = db
    .prepare(
      `SELECT substr(VisitDate,1,7) AS month, COUNT(*) AS total, SUM(Status='Late') AS late, SUM(Status='Missed') AS missed
       FROM visits WHERE StaffID = @id AND VisitDate BETWEEN @start AND @end GROUP BY month ORDER BY month`
    )
    .all(p) as any[];

  const incidents = db
    .prepare(
      `SELECT i.IncidentID AS id, i.IncidentDate AS date, i.Category, i.Severity, i.Status, i.CQCNotifiable, i.ReportedWithin24h, c.ClientRef
       FROM incidents i JOIN clients c ON c.ClientID = i.ClientID
       WHERE i.StaffID = @id AND i.IncidentDate BETWEEN @start AND @end ORDER BY i.IncidentDate DESC`
    )
    .all(p) as any[];
  const complaints = db
    .prepare(
      `SELECT cm.ComplaintID AS id, cm.DateReceived AS date, cm.Source, cm.Category, cm.Outcome, cm.DateResolved, c.ClientRef
       FROM complaints cm JOIN clients c ON c.ClientID = cm.ClientID
       WHERE cm.StaffID = @id AND cm.DateReceived BETWEEN @start AND @end ORDER BY cm.DateReceived DESC`
    )
    .all(p) as any[];
  const lowFeedback = db
    .prepare(
      `SELECT f.FeedbackID AS id, f.FeedbackDate AS date, f.Method, f.Score, f.Theme, c.ClientRef
       FROM feedback f JOIN clients c ON c.ClientID = f.ClientID
       WHERE f.StaffID = @id AND f.Score <= 2 AND f.FeedbackDate BETWEEN @start AND @end ORDER BY f.FeedbackDate DESC`
    )
    .all(p) as any[];
  const feedbackThemes = db
    .prepare(
      `SELECT Theme, COUNT(*) AS count, ROUND(AVG(Score),1) AS avgScore, MIN(Score) <= 2 AS hasLow
       FROM feedback WHERE StaffID = @id AND FeedbackDate BETWEEN @start AND @end AND Theme IS NOT NULL
       GROUP BY Theme ORDER BY count DESC`
    )
    .all(p) as any[];
  const actions = db.prepare("SELECT * FROM actions WHERE StaffID = ? ORDER BY CreatedDate DESC").all(req.params.id) as any[];

  const events = [
    ...incidents.map((e) => ({ type: "Incident" as const, ...e })),
    ...complaints.map((e) => ({ type: "Complaint" as const, ...e })),
    ...lowFeedback.map((e) => ({ type: "Low feedback" as const, ...e })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));

  return { staff, period, metrics, feedbackTrend, visitsMonthly, events, feedbackThemes, actions };
}

router.get("/staff/:id", requireAuth, (req, res) => {
  const profile = loadProfile(req, res);
  if (profile) res.json(profile);
});

router.get("/staff/:id/pack", requireAuth, (req, res) => {
  const profile = loadProfile(req, res);
  if (!profile) return;
  audit(req.user!.Username, "Export", profile.staff.StaffID, `Supervision pack generated for ${profile.staff.StaffName} (${profile.period.months} months)`);
  res.json({ ...profile, generatedBy: req.user!.DisplayName, generatedAt: new Date().toISOString() });
});

router.post("/staff/:id/actions", requireAuth, (req, res) => {
  const staff = db.prepare("SELECT StaffID, StaffName, Team FROM staff WHERE StaffID = ?").get(req.params.id) as any;
  if (!staff) return res.status(404).json({ error: "Staff member not found" });
  if (!canSeeTeam(req, staff.Team)) return res.status(403).json({ error: "You do not have access to this team member" });
  const { description, source, dueDate } = req.body ?? {};
  if (!description || !dueDate) return res.status(400).json({ error: "Description and due date are required" });
  const last = db.prepare("SELECT COUNT(*) AS n FROM actions").get() as { n: number };
  const id = `ACT${String(last.n + 1).padStart(3, "0")}`;
  db.prepare("INSERT INTO actions (ActionID, StaffID, CreatedDate, Source, Description, Owner, DueDate, Status) VALUES (?,?,?,?,?,?,?,?)").run(
    id, staff.StaffID, new Date().toISOString().slice(0, 10),
    ["Supervision", "Incident review", "Complaint outcome"].includes(source) ? source : "Supervision",
    String(description).slice(0, 500), req.user!.DisplayName, String(dueDate).slice(0, 10), "Open"
  );
  audit(req.user!.Username, "Edit", id, `Action created for ${staff.StaffName}: ${String(description).slice(0, 120)}`);
  res.status(201).json({ ok: true, ActionID: id });
});

router.patch("/actions/:id", requireAuth, (req, res) => {
  const action = db
    .prepare("SELECT a.ActionID, s.Team, s.StaffName FROM actions a JOIN staff s ON s.StaffID = a.StaffID WHERE a.ActionID = ?")
    .get(req.params.id) as any;
  if (!action) return res.status(404).json({ error: "Action not found" });
  if (!canSeeTeam(req, action.Team)) return res.status(403).json({ error: "You do not have access to this team" });
  const status = req.body?.status;
  if (!["Open", "In progress", "Completed", "Overdue"].includes(status)) return res.status(400).json({ error: "Invalid status" });
  db.prepare("UPDATE actions SET Status = ? WHERE ActionID = ?").run(status, req.params.id);
  audit(req.user!.Username, "Edit", req.params.id, `Action for ${action.StaffName} set to ${status}`);
  res.json({ ok: true });
});

router.get("/cqc", requireAuth, (req, res) => {
  const period = getPeriod(parseMonths(req.query.months));
  const data = computeCqc(period, effectiveTeam(req));
  if (req.query.export === "1") {
    audit(req.user!.Username, "Export", null, `CQC evidence pack exported (${period.months} months${effectiveTeam(req) ? ", " + effectiveTeam(req) : ""})`);
  }
  res.json(data);
});
