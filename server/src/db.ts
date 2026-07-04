import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, "..", "data");
export const DB_PATH = path.join(DATA_DIR, "aqi.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initSchema() {
  db.exec(`
  CREATE TABLE IF NOT EXISTS staff (
    StaffID TEXT PRIMARY KEY,
    StaffName TEXT NOT NULL,
    Role TEXT NOT NULL,
    Team TEXT NOT NULL,
    StartDate TEXT NOT NULL,
    Status TEXT NOT NULL,
    ContractedHours REAL NOT NULL,
    ImportBatch INTEGER
  );
  CREATE TABLE IF NOT EXISTS clients (
    ClientID TEXT PRIMARY KEY,
    ClientRef TEXT NOT NULL,
    CarePackage TEXT NOT NULL,
    Area TEXT NOT NULL,
    FundingType TEXT NOT NULL,
    ImportBatch INTEGER
  );
  CREATE TABLE IF NOT EXISTS incidents (
    IncidentID TEXT PRIMARY KEY,
    IncidentDate TEXT NOT NULL,
    StaffID TEXT NOT NULL REFERENCES staff(StaffID),
    ClientID TEXT NOT NULL REFERENCES clients(ClientID),
    Category TEXT NOT NULL,
    Severity TEXT NOT NULL CHECK (Severity IN ('Low','Moderate','High')),
    ReportedWithin24h INTEGER NOT NULL,
    CQCNotifiable INTEGER NOT NULL,
    Status TEXT NOT NULL,
    DateClosed TEXT,
    ImportBatch INTEGER
  );
  CREATE TABLE IF NOT EXISTS complaints (
    ComplaintID TEXT PRIMARY KEY,
    DateReceived TEXT NOT NULL,
    StaffID TEXT NOT NULL REFERENCES staff(StaffID),
    ClientID TEXT NOT NULL REFERENCES clients(ClientID),
    Source TEXT NOT NULL,
    Category TEXT NOT NULL,
    Severity TEXT NOT NULL,
    Outcome TEXT NOT NULL CHECK (Outcome IN ('Upheld','Partially upheld','Not upheld','Pending')),
    DateResolved TEXT,
    ImportBatch INTEGER
  );
  CREATE TABLE IF NOT EXISTS feedback (
    FeedbackID TEXT PRIMARY KEY,
    FeedbackDate TEXT NOT NULL,
    ClientID TEXT NOT NULL REFERENCES clients(ClientID),
    StaffID TEXT NOT NULL REFERENCES staff(StaffID),
    Method TEXT NOT NULL,
    Score INTEGER NOT NULL CHECK (Score BETWEEN 1 AND 5),
    WouldRecommend INTEGER NOT NULL,
    Theme TEXT,
    ImportBatch INTEGER
  );
  CREATE TABLE IF NOT EXISTS visits (
    VisitID TEXT PRIMARY KEY,
    VisitDate TEXT NOT NULL,
    StaffID TEXT NOT NULL REFERENCES staff(StaffID),
    ClientID TEXT NOT NULL REFERENCES clients(ClientID),
    ScheduledStart TEXT NOT NULL,
    ActualStart TEXT,
    DurationMinutes INTEGER NOT NULL,
    Status TEXT NOT NULL CHECK (Status IN ('Completed','Late','Missed')),
    ImportBatch INTEGER
  );
  CREATE TABLE IF NOT EXISTS actions (
    ActionID TEXT PRIMARY KEY,
    StaffID TEXT NOT NULL REFERENCES staff(StaffID),
    CreatedDate TEXT NOT NULL,
    Source TEXT NOT NULL,
    Description TEXT NOT NULL,
    Owner TEXT NOT NULL,
    DueDate TEXT NOT NULL,
    Status TEXT NOT NULL,
    ImportBatch INTEGER
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    AuditID INTEGER PRIMARY KEY AUTOINCREMENT,
    Timestamp TEXT NOT NULL,
    User TEXT NOT NULL,
    Action TEXT NOT NULL,
    RecordRef TEXT,
    Details TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT NOT NULL UNIQUE,
    DisplayName TEXT NOT NULL,
    PasswordHash TEXT NOT NULL,
    Role TEXT NOT NULL CHECK (Role IN ('Director','Registered Manager','Team Leader')),
    Team TEXT,
    Active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS sessions (
    Token TEXT PRIMARY KEY,
    UserID INTEGER NOT NULL REFERENCES users(UserID),
    CreatedAt TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS config (
    Key TEXT PRIMARY KEY,
    Value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS import_batches (
    BatchID INTEGER PRIMARY KEY AUTOINCREMENT,
    TableName TEXT NOT NULL,
    ImportedAt TEXT NOT NULL,
    User TEXT NOT NULL,
    RowCount INTEGER NOT NULL,
    FileName TEXT,
    Active INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX IF NOT EXISTS idx_visits_staff_date ON visits(StaffID, VisitDate);
  CREATE INDEX IF NOT EXISTS idx_incidents_staff_date ON incidents(StaffID, IncidentDate);
  CREATE INDEX IF NOT EXISTS idx_complaints_staff_date ON complaints(StaffID, DateReceived);
  CREATE INDEX IF NOT EXISTS idx_feedback_staff_date ON feedback(StaffID, FeedbackDate);
  `);
}

export const DEFAULT_CONFIG: Record<string, unknown> = {
  qriWeights: {
    incidentsPer100Visits: 2,
    highSeverityIncident: 5,
    upheldComplaint: 4,
    lowFeedbackScore: 1,
  },
  ragBands: { red: 25, amber: 12 },
  smallSample: { minFeedback: 10, minVisits: 50 },
  targets: { reportedWithin24hPct: 95, avgFeedback: 4.0, resolvedWithin28dPct: 90 },
  strongReporter: {
    minIncidents: 3,
    maxHighSeverity: 0,
    maxModerateShare: 0.25,
    minAvgFeedback: 4.0,
  },
};

export function ensureDefaultConfig() {
  const insert = db.prepare("INSERT OR IGNORE INTO config (Key, Value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(DEFAULT_CONFIG)) {
    insert.run(key, JSON.stringify(value));
  }
}

export function getConfig<T = any>(key: string): T {
  const row = db.prepare("SELECT Value FROM config WHERE Key = ?").get(key) as { Value: string } | undefined;
  if (row) return JSON.parse(row.Value) as T;
  return DEFAULT_CONFIG[key] as T;
}

export function setConfig(key: string, value: unknown) {
  db.prepare("INSERT INTO config (Key, Value) VALUES (?, ?) ON CONFLICT(Key) DO UPDATE SET Value = excluded.Value").run(
    key,
    JSON.stringify(value)
  );
}

export function audit(user: string, action: string, recordRef: string | null, details: string) {
  db.prepare("INSERT INTO audit_log (Timestamp, User, Action, RecordRef, Details) VALUES (?, ?, ?, ?, ?)").run(
    new Date().toISOString(),
    user,
    action,
    recordRef,
    details
  );
}
