import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { db, audit } from "./db.js";

export interface AuthedUser {
  UserID: number;
  Username: string;
  DisplayName: string;
  Role: "Director" | "Registered Manager" | "Team Leader";
  Team: string | null;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthedUser;
  }
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

export function login(username: string, password: string): { token: string; user: AuthedUser } | null {
  const row = db
    .prepare("SELECT UserID, Username, DisplayName, PasswordHash, Role, Team FROM users WHERE Username = ? AND Active = 1")
    .get(username) as (AuthedUser & { PasswordHash: string }) | undefined;
  if (!row || !verifyPassword(password, row.PasswordHash)) return null;
  const token = crypto.randomBytes(32).toString("hex");
  db.prepare("INSERT INTO sessions (Token, UserID, CreatedAt) VALUES (?,?,?)").run(token, row.UserID, new Date().toISOString());
  audit(row.Username, "Login", null, `${row.DisplayName} signed in (${row.Role})`);
  const user: AuthedUser = {
    UserID: row.UserID,
    Username: row.Username,
    DisplayName: row.DisplayName,
    Role: row.Role,
    Team: row.Team,
  };
  return { token, user };
}

export function logout(token: string) {
  db.prepare("DELETE FROM sessions WHERE Token = ?").run(token);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  const row = db
    .prepare(
      `SELECT u.UserID, u.Username, u.DisplayName, u.Role, u.Team
       FROM sessions s JOIN users u ON u.UserID = s.UserID
       WHERE s.Token = ? AND u.Active = 1`
    )
    .get(token) as AuthedUser | undefined;
  if (!row) return res.status(401).json({ error: "Session expired - please sign in again" });
  req.user = row;
  next();
}

/** Directors and the Registered Manager may administer the system. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  if (req.user.Role === "Team Leader") return res.status(403).json({ error: "Requires Director or Registered Manager role" });
  next();
}

/**
 * Server-side row scoping. Team Leaders are ALWAYS restricted to their own
 * team regardless of what the query string asks for; other roles may filter
 * freely. Returns null for "all teams".
 */
export function effectiveTeam(req: Request): string | null {
  if (req.user?.Role === "Team Leader") return req.user.Team;
  const q = req.query.team;
  if (typeof q === "string" && q && q !== "All") return q;
  return null;
}

/** True if this user is allowed to see the given team's data. */
export function canSeeTeam(req: Request, team: string): boolean {
  if (!req.user) return false;
  return req.user.Role !== "Team Leader" || req.user.Team === team;
}
