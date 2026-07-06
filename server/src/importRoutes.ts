import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import crypto from "node:crypto";
import { db, audit } from "./db.js";
import { requireAuth, requireAdmin } from "./auth.js";

export const importRouter = Router();
importRouter.use(requireAuth, requireAdmin);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

type ColType = "text" | "date" | "dateOptional" | "time" | "timeOptional" | "bool" | "int" | "number";
interface ColSpec {
  name: string;
  type: ColType;
  enum?: string[];
  fk?: "staff" | "clients";
  min?: number;
  max?: number;
  optional?: boolean;
}
interface TableSpec {
  pk: string;
  columns: ColSpec[];
}

const SPECS: Record<string, TableSpec> = {
  staff: {
    pk: "StaffID",
    columns: [
      { name: "StaffID", type: "text" },
      { name: "StaffName", type: "text" },
      { name: "Role", type: "text" },
      { name: "Team", type: "text" },
      { name: "StartDate", type: "date" },
      { name: "Status", type: "text", enum: ["Active", "Inactive", "Left"] },
      { name: "ContractedHours", type: "number", min: 0, max: 60 },
    ],
  },
  clients: {
    pk: "ClientID",
    columns: [
      { name: "ClientID", type: "text" },
      { name: "ClientRef", type: "text" },
      { name: "CarePackage", type: "text" },
      { name: "Area", type: "text" },
      { name: "FundingType", type: "text" },
    ],
  },
  incidents: {
    pk: "IncidentID",
    columns: [
      { name: "IncidentID", type: "text" },
      { name: "IncidentDate", type: "date" },
      { name: "StaffID", type: "text", fk: "staff" },
      { name: "ClientID", type: "text", fk: "clients" },
      { name: "Category", type: "text" },
      { name: "Severity", type: "text", enum: ["Low", "Moderate", "High"] },
      { name: "ReportedWithin24h", type: "bool" },
      { name: "CQCNotifiable", type: "bool" },
      { name: "Status", type: "text", enum: ["Open", "Under review", "Closed"] },
      { name: "DateClosed", type: "dateOptional" },
    ],
  },
  complaints: {
    pk: "ComplaintID",
    columns: [
      { name: "ComplaintID", type: "text" },
      { name: "DateReceived", type: "date" },
      { name: "StaffID", type: "text", fk: "staff" },
      { name: "ClientID", type: "text", fk: "clients" },
      { name: "Source", type: "text" },
      { name: "Category", type: "text" },
      { name: "Severity", type: "text", enum: ["Low", "Moderate", "High"] },
      { name: "Outcome", type: "text", enum: ["Upheld", "Partially upheld", "Not upheld", "Pending"] },
      { name: "DateResolved", type: "dateOptional" },
    ],
  },
  feedback: {
    pk: "FeedbackID",
    columns: [
      { name: "FeedbackID", type: "text" },
      { name: "FeedbackDate", type: "date" },
      { name: "ClientID", type: "text", fk: "clients" },
      { name: "StaffID", type: "text", fk: "staff" },
      { name: "Method", type: "text" },
      { name: "Score", type: "int", min: 1, max: 5 },
      { name: "WouldRecommend", type: "bool" },
      { name: "Theme", type: "text", optional: true },
    ],
  },
  visits: {
    pk: "VisitID",
    columns: [
      { name: "VisitID", type: "text" },
      { name: "VisitDate", type: "date" },
      { name: "StaffID", type: "text", fk: "staff" },
      { name: "ClientID", type: "text", fk: "clients" },
      { name: "ScheduledStart", type: "time" },
      { name: "ActualStart", type: "timeOptional" },
      { name: "DurationMinutes", type: "int", min: 1, max: 1440 },
      { name: "Status", type: "text", enum: ["Completed", "Late", "Missed"] },
    ],
  },
  actions: {
    pk: "ActionID",
    columns: [
      { name: "ActionID", type: "text" },
      { name: "StaffID", type: "text", fk: "staff" },
      { name: "CreatedDate", type: "date" },
      { name: "Source", type: "text", enum: ["Supervision", "Incident review", "Complaint outcome"] },
      { name: "Description", type: "text" },
      { name: "Owner", type: "text" },
      { name: "DueDate", type: "date" },
      { name: "Status", type: "text", enum: ["Open", "In progress", "Completed", "Overdue"] },
    ],
  },
};

const TRUE_WORDS = new Set(["yes", "y", "true", "1"]);
const FALSE_WORDS = new Set(["no", "n", "false", "0"]);

function toISODate(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s.slice(0, 10) + "T00:00:00");
    return isNaN(d.getTime()) ? null : s.slice(0, 10);
  }
  const uk = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // DD/MM/YYYY
  if (uk) {
    const [, d, m, y] = uk;
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    if (date.getFullYear() === Number(y) && date.getMonth() === Number(m) - 1 && date.getDate() === Number(d)) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  return null;
}

function toTime(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
  }
  if (typeof value === "number" && value >= 0 && value < 1) {
    const mins = Math.round(value * 24 * 60);
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  }
  const m = String(value).trim().match(/^(\d{1,2}):(\d{2})(:\d{2})?$/);
  if (m && Number(m[1]) < 24 && Number(m[2]) < 60) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return null;
}

interface RowError {
  row: number;
  column: string;
  value: string;
  message: string;
}

function convertCell(spec: ColSpec, raw: unknown): { value: string | number | null } | { error: string } {
  const empty = raw === null || raw === undefined || String(raw).trim() === "";
  if (empty) {
    if (spec.optional || spec.type === "dateOptional" || spec.type === "timeOptional") return { value: null };
    return { error: "Value is required" };
  }
  switch (spec.type) {
    case "text": {
      const s = String(raw).trim();
      if (spec.enum && !spec.enum.includes(s)) return { error: `Must be one of: ${spec.enum.join(", ")}` };
      return { value: s };
    }
    case "date":
    case "dateOptional": {
      const iso = toISODate(raw);
      return iso ? { value: iso } : { error: "Not a valid date (use YYYY-MM-DD or DD/MM/YYYY)" };
    }
    case "time":
    case "timeOptional": {
      const t = toTime(raw);
      return t ? { value: t } : { error: "Not a valid time (use HH:MM)" };
    }
    case "bool": {
      const s = String(raw).trim().toLowerCase();
      if (TRUE_WORDS.has(s)) return { value: 1 };
      if (FALSE_WORDS.has(s)) return { value: 0 };
      return { error: "Must be Yes/No, True/False or 1/0" };
    }
    case "int": {
      const n = Number(raw);
      if (!Number.isInteger(n)) return { error: "Must be a whole number" };
      if ((spec.min !== undefined && n < spec.min) || (spec.max !== undefined && n > spec.max))
        return { error: `Must be between ${spec.min} and ${spec.max}` };
      return { value: n };
    }
    case "number": {
      const n = Number(raw);
      if (!Number.isFinite(n)) return { error: "Must be a number" };
      if ((spec.min !== undefined && n < spec.min) || (spec.max !== undefined && n > spec.max))
        return { error: `Must be between ${spec.min} and ${spec.max}` };
      return { value: n };
    }
  }
}

interface PendingImport {
  table: string;
  fileName: string;
  rows: Record<string, string | number | null>[];
  user: string;
  createdAt: number;
}
const pending = new Map<string, PendingImport>();
const prunePending = () => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  for (const [k, v] of pending) if (v.createdAt < cutoff) pending.delete(k);
};

importRouter.get("/template/:table", (req, res) => {
  const spec = SPECS[req.params.table];
  if (!spec) return res.status(404).json({ error: "Unknown table" });
  const example: Record<string, string> = {
    staff: "S029,Jane Example,Support Worker,The Retreat,2024-03-01,Active,37.5",
    clients: "C035,RT-09,Residential,Weeley,Local Authority",
    incidents: "INC0999,2026-06-15,S001,C001,Fall,Low,Yes,No,Closed,2026-06-20",
    complaints: "CMP099,2026-06-10,S001,C001,Family / relative,Communication with family,Moderate,Pending,",
    feedback: "FB0999,2026-06-12,C001,S001,Easy-read survey,4,Yes,Kind and caring staff",
    visits: "V099999,2026-06-14,S001,C001,09:00,09:05,60,Completed",
    actions: "ACT099,S001,2026-06-01,Supervision,Refresher training agreed,Priya Nair,2026-07-01,Open",
  };
  const csv = spec.columns.map((c) => c.name).join(",") + "\r\n" + example[req.params.table] + "\r\n";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="cqi_${req.params.table}_template.csv"`);
  res.send(csv);
});

importRouter.post("/validate", upload.single("file"), (req, res) => {
  prunePending();
  const table = String(req.body?.table ?? "");
  const spec = SPECS[table];
  if (!spec) return res.status(400).json({ error: "Choose a valid target table" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  let sheetRows: Record<string, unknown>[];
  let headers: string[];
  try {
    const wb = XLSX.read(req.file.buffer, { cellDates: true });
    // Prefer a sheet named after the table (matches the organisation's Excel workbook), else the first sheet.
    const sheetName =
      wb.SheetNames.find((n) => n.toLowerCase() === table.toLowerCase()) ?? wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    sheetRows = XLSX.utils.sheet_to_json(ws, { defval: null });
    const headerRow = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] as unknown[] | undefined;
    headers = (headerRow ?? []).map((h) => String(h ?? "").trim());
  } catch {
    return res.status(400).json({ error: "Could not read the file. Upload a .csv or .xlsx file." });
  }

  const missing = spec.columns.filter((c) => !headers.includes(c.name)).map((c) => c.name);
  if (missing.length) {
    return res.json({
      ok: false,
      errors: [{ row: 1, column: missing.join(", "), value: "", message: `Missing required column(s): ${missing.join(", ")}. Download the template for the exact header row.` }],
      rowCount: sheetRows.length,
      preview: [],
    });
  }
  if (!sheetRows.length) {
    return res.json({ ok: false, errors: [{ row: 2, column: "", value: "", message: "The file contains headers but no data rows." }], rowCount: 0, preview: [] });
  }

  const staffIds = new Set((db.prepare("SELECT StaffID FROM staff").all() as any[]).map((r) => r.StaffID));
  const clientIds = new Set((db.prepare("SELECT ClientID FROM clients").all() as any[]).map((r) => r.ClientID));
  const existingPks = new Set((db.prepare(`SELECT ${spec.pk} AS pk FROM ${table}`).all() as any[]).map((r) => String(r.pk)));
  const seenPks = new Set<string>();

  const errors: RowError[] = [];
  const rows: Record<string, string | number | null>[] = [];
  sheetRows.forEach((raw, idx) => {
    const rowNum = idx + 2; // 1-based + header row, matches what the user sees in Excel
    const converted: Record<string, string | number | null> = {};
    for (const col of spec.columns) {
      const result = convertCell(col, raw[col.name]);
      if ("error" in result) {
        errors.push({ row: rowNum, column: col.name, value: String(raw[col.name] ?? ""), message: result.error });
        continue;
      }
      const value = result.value;
      if (col.fk && value !== null) {
        const known = col.fk === "staff" ? staffIds : clientIds;
        // Staff/clients being imported in the same file are acceptable references.
        if (!known.has(String(value)) && !(table === col.fk)) {
          errors.push({ row: rowNum, column: col.name, value: String(value), message: `Unknown ${col.name} - no matching record in ${col.fk}` });
        }
      }
      if (col.name === spec.pk && value !== null) {
        const pk = String(value);
        if (existingPks.has(pk)) errors.push({ row: rowNum, column: col.name, value: pk, message: `${spec.pk} already exists in the database` });
        else if (seenPks.has(pk)) errors.push({ row: rowNum, column: col.name, value: pk, message: `Duplicate ${spec.pk} within this file` });
        seenPks.add(pk);
      }
      converted[col.name] = value;
    }
    rows.push(converted);
  });

  if (errors.length) {
    return res.json({ ok: false, errors: errors.slice(0, 200), errorCount: errors.length, rowCount: sheetRows.length, preview: rows.slice(0, 8) });
  }
  const uploadId = crypto.randomUUID();
  pending.set(uploadId, { table, fileName: req.file.originalname, rows, user: req.user!.Username, createdAt: Date.now() });
  res.json({ ok: true, uploadId, rowCount: rows.length, preview: rows.slice(0, 8), columns: spec.columns.map((c) => c.name) });
});

importRouter.post("/commit", (req, res) => {
  const item = pending.get(String(req.body?.uploadId ?? ""));
  if (!item) return res.status(400).json({ error: "Upload not found or expired - validate the file again" });
  const spec = SPECS[item.table];
  const tx = db.transaction(() => {
    const info = db
      .prepare("INSERT INTO import_batches (TableName, ImportedAt, User, RowCount, FileName) VALUES (?,?,?,?,?)")
      .run(item.table, new Date().toISOString(), req.user!.Username, item.rows.length, item.fileName);
    const batchId = Number(info.lastInsertRowid);
    const cols = spec.columns.map((c) => c.name);
    const ins = db.prepare(
      `INSERT INTO ${item.table} (${cols.join(",")}, ImportBatch) VALUES (${cols.map(() => "?").join(",")}, ?)`
    );
    for (const row of item.rows) ins.run(...cols.map((c) => row[c]), batchId);
    return batchId;
  });
  try {
    const batchId = tx();
    pending.delete(String(req.body.uploadId));
    audit(req.user!.Username, "Data import", `batch:${batchId}`, `Imported ${item.rows.length} rows into ${item.table} from ${item.fileName}`);
    res.json({ ok: true, batchId, rowCount: item.rows.length });
  } catch (e: any) {
    res.status(409).json({ error: `Import failed and was rolled back: ${e.message}` });
  }
});

importRouter.post("/rollback", (req, res) => {
  const batch = db
    .prepare("SELECT * FROM import_batches WHERE Active = 1 ORDER BY BatchID DESC LIMIT 1")
    .get() as any;
  if (!batch) return res.status(404).json({ error: "There is no import to roll back" });
  const tx = db.transaction(() => {
    const del = db.prepare(`DELETE FROM ${batch.TableName} WHERE ImportBatch = ?`).run(batch.BatchID);
    db.prepare("UPDATE import_batches SET Active = 0 WHERE BatchID = ?").run(batch.BatchID);
    return del.changes;
  });
  try {
    const removed = tx();
    audit(req.user!.Username, "Data import", `batch:${batch.BatchID}`, `Rolled back import of ${removed} rows from ${batch.TableName} (${batch.FileName})`);
    res.json({ ok: true, removed, table: batch.TableName });
  } catch (e: any) {
    res.status(409).json({ error: `Rollback failed: ${e.message}. Rows from this batch may be referenced by newer data.` });
  }
});

importRouter.get("/batches", (_req, res) => {
  res.json(db.prepare("SELECT * FROM import_batches ORDER BY BatchID DESC LIMIT 20").all());
});
