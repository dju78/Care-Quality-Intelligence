import { Router } from "express";
import { db, audit, getConfig, setConfig, DEFAULT_CONFIG } from "./db.js";
import { requireAuth, requireAdmin, hashPassword } from "./auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

const CONFIG_KEYS = ["qriWeights", "ragBands", "smallSample", "targets", "strongReporter"] as const;

adminRouter.get("/config", (_req, res) => {
  const all: Record<string, unknown> = {};
  for (const key of CONFIG_KEYS) all[key] = getConfig(key);
  res.json(all);
});

adminRouter.put("/config/:key", (req, res) => {
  const key = req.params.key as (typeof CONFIG_KEYS)[number];
  if (!CONFIG_KEYS.includes(key)) return res.status(400).json({ error: "Unknown configuration key" });
  const incoming = req.body?.value;
  const current = getConfig<Record<string, number>>(key);
  if (typeof incoming !== "object" || incoming === null) return res.status(400).json({ error: "Value must be an object" });
  // Only accept known numeric fields; reject anything negative or non-finite.
  const next: Record<string, number> = { ...current };
  for (const [field, raw] of Object.entries(incoming)) {
    if (!(field in current)) return res.status(400).json({ error: `Unknown field '${field}' for ${key}` });
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) return res.status(400).json({ error: `Field '${field}' must be a non-negative number` });
    next[field] = num;
  }
  if (key === "ragBands" && next.amber >= next.red) {
    return res.status(400).json({ error: "Amber threshold must be below the Red threshold" });
  }
  setConfig(key, next);
  audit(req.user!.Username, "Config change", key, `${key} changed from ${JSON.stringify(current)} to ${JSON.stringify(next)}`);
  res.json({ ok: true, value: next });
});

adminRouter.post("/config/reset", (req, res) => {
  for (const key of CONFIG_KEYS) setConfig(key, DEFAULT_CONFIG[key]);
  audit(req.user!.Username, "Config change", "all", "All configuration restored to defaults");
  res.json({ ok: true });
});

// ---- users ----
adminRouter.get("/users", (_req, res) => {
  res.json(db.prepare("SELECT UserID, Username, DisplayName, Role, Team, Active FROM users ORDER BY Username").all());
});

adminRouter.post("/users", (req, res) => {
  const { username, displayName, password, role, team } = req.body ?? {};
  if (!username || !displayName || !password || !role) return res.status(400).json({ error: "username, displayName, password and role are required" });
  if (!["Director", "Registered Manager", "Team Leader"].includes(role)) return res.status(400).json({ error: "Invalid role" });
  if (role === "Team Leader" && !team) return res.status(400).json({ error: "Team Leaders must be assigned a team" });
  if (String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
  try {
    const info = db
      .prepare("INSERT INTO users (Username, DisplayName, PasswordHash, Role, Team) VALUES (?,?,?,?,?)")
      .run(String(username).trim().toLowerCase(), displayName, hashPassword(password), role, role === "Team Leader" ? team : null);
    audit(req.user!.Username, "Edit", `user:${info.lastInsertRowid}`, `User '${username}' created with role ${role}${team ? ` (${team})` : ""}`);
    res.status(201).json({ ok: true });
  } catch {
    res.status(409).json({ error: "That username already exists" });
  }
});

adminRouter.put("/users/:id", (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE UserID = ?").get(req.params.id) as any;
  if (!user) return res.status(404).json({ error: "User not found" });
  const { role, team, active, password } = req.body ?? {};
  const nextRole = role && ["Director", "Registered Manager", "Team Leader"].includes(role) ? role : user.Role;
  const nextTeam = nextRole === "Team Leader" ? (team ?? user.Team) : null;
  if (nextRole === "Team Leader" && !nextTeam) return res.status(400).json({ error: "Team Leaders must be assigned a team" });
  db.prepare("UPDATE users SET Role = ?, Team = ?, Active = ? WHERE UserID = ?").run(
    nextRole, nextTeam, active === undefined ? user.Active : active ? 1 : 0, user.UserID
  );
  if (password) {
    if (String(password).length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
    db.prepare("UPDATE users SET PasswordHash = ? WHERE UserID = ?").run(hashPassword(password), user.UserID);
    db.prepare("DELETE FROM sessions WHERE UserID = ?").run(user.UserID);
  }
  audit(req.user!.Username, "Edit", `user:${user.UserID}`, `User '${user.Username}' updated (role ${nextRole}${nextTeam ? ", " + nextTeam : ""}${password ? ", password reset" : ""})`);
  res.json({ ok: true });
});

// ---- audit log viewer ----
adminRouter.get("/audit", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const action = typeof req.query.action === "string" && req.query.action !== "All" ? req.query.action : null;
  const rows = db
    .prepare(
      `SELECT AuditID, Timestamp, User, Action, RecordRef, Details FROM audit_log
       WHERE (@action IS NULL OR Action = @action)
       ORDER BY AuditID DESC LIMIT @limit`
    )
    .all({ action, limit });
  const actions = (db.prepare("SELECT DISTINCT Action FROM audit_log ORDER BY Action").all() as { Action: string }[]).map((a) => a.Action);
  res.json({ rows, actions });
});
