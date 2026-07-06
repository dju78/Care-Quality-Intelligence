/**
 * Seed script: 12 months (July 2025 - June 2026) of synthetic quality data for
 * the provider's four services. Deterministic (seeded RNG) so re-seeding
 * reproduces the same dataset. Run with `npm run seed` (forces a re-seed).
 */
import { db, initSchema, ensureDefaultConfig, audit } from "./db.js";
import { hashPassword } from "./auth.js";

// ---------- deterministic RNG ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260704);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const weighted = <T,>(items: [T, number][]): T => {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1][0];
};
const normal = (mean: number, sd: number) => {
  const u = Math.max(rand(), 1e-9);
  const v = Math.max(rand(), 1e-9);
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const pad = (n: number, w: number) => String(n).padStart(w, "0");

// ---------- period ----------
const MONTHS: { y: number; m: number }[] = [];
for (let i = 0; i < 12; i++) {
  const y = i < 6 ? 2025 : 2026;
  const m = i < 6 ? 7 + i : i - 5;
  MONTHS.push({ y, m });
}
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
const iso = (y: number, m: number, d: number) => `${y}-${pad(m, 2)}-${pad(d, 2)}`;
const randomDate = (y: number, m: number) => iso(y, m, 1 + Math.floor(rand() * daysInMonth(y, m)));
const addDays = (dateISO: string, days: number) => {
  const d = new Date(dateISO + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const DATA_END = "2026-06-30";

// ---------- services (Teams) ----------
const SERVICES = [
  { name: "The Retreat", package: "Residential", area: "Weeley" },
  { name: "Peter House", package: "Residential", area: "Clacton-on-Sea" },
  { name: "Senna House", package: "Supported Living", area: "Colchester" },
  { name: "Community Outreach", package: "Outreach", area: "Tendring" },
];

// ---------- staff ----------
interface StaffSeed {
  id: string; name: string; role: string; team: string; start: string;
  hours: number; profile: "weak" | "elevated" | "strong-reporter" | "normal" | "lead";
}
const FIRST = ["Amara", "Ben", "Chloe", "Daniel", "Esther", "Femi", "Grace", "Hannah", "Ionut", "Jade", "Kwame", "Lauren", "Marek", "Naomi", "Oliver", "Patience", "Ruth", "Samuel", "Tunde", "Verity", "Wiktor", "Yusuf", "Zainab", "Callum", "Dami", "Eve"];
const LAST = ["Adeyemi", "Barnes", "Clarke", "Dziedzic", "Eze", "Fletcher", "Gichuru", "Howells", "Ilie", "Jarvis", "Kamara", "Lawson", "Mensah", "Novak", "Okafor", "Price", "Quinn", "Reid", "Sowah", "Turner", "Umar", "Vasile", "Webb", "Yeboah"];

const STAFF: StaffSeed[] = [];
{
  const teams: [string, number][] = [
    ["The Retreat", 8],
    ["Peter House", 8],
    ["Senna House", 6],
    ["Community Outreach", 6],
  ];
  const leaders: Record<string, string> = {
    "The Retreat": "Priya Nair",
    "Peter House": "Marcus Bell",
    "Senna House": "Sofia Keane",
    "Community Outreach": "Tom Aldous",
  };
  let idx = 1;
  const usedNames = new Set<string>(Object.values(leaders));
  const nextName = () => {
    for (let i = 0; i < 200; i++) {
      const n = `${pick(FIRST)} ${pick(LAST)}`;
      if (!usedNames.has(n)) { usedNames.add(n); return n; }
    }
    return `Staff ${idx}`;
  };
  for (const [team, count] of teams) {
    for (let i = 0; i < count; i++) {
      const id = `S${pad(idx, 3)}`;
      const isLead = i === 0;
      const isSenior = i === 1 && count >= 8;
      const role = isLead ? "Team Leader" : isSenior ? "Senior Support Worker" : idx === 12 ? "PBS Practitioner" : "Support Worker";
      const startYear = 2015 + Math.floor(rand() * 10);
      STAFF.push({
        id,
        name: isLead ? leaders[team] : nextName(),
        role,
        team,
        start: iso(startYear, 1 + Math.floor(rand() * 12), 1 + Math.floor(rand() * 27)),
        hours: isLead ? 37.5 : pick([37.5, 37.5, 37.5, 30, 22.5]),
        profile: isLead ? "lead" : "normal",
      });
      idx++;
    }
  }
  // Three deliberately weaker performers and one strong reporter, spread across services.
  const byId = (id: string) => STAFF.find((s) => s.id === id)!;
  byId("S005").profile = "weak"; // The Retreat support worker
  byId("S012").profile = "weak"; // Peter House (PBS role reassigned below)
  byId("S012").role = "Support Worker";
  byId("S014").role = "PBS Practitioner";
  byId("S026").profile = "weak"; // Community Outreach support worker
  byId("S019").profile = "strong-reporter"; // Senna House support worker
  byId("S004").profile = "elevated"; // The Retreat - mid-level concern (Amber territory)
  byId("S021").profile = "elevated"; // Senna House - mid-level concern
}

// ---------- clients (people we support) ----------
// Realistic mix of adult social care service types, lightly weighted by service.
// All synthetic — no real people, service users or addresses.
const PACKAGE_MIX: Record<string, [string, number][]> = {
  "The Retreat": [["Residential Care", 0.55], ["Complex Support", 0.25], ["Supported Living", 0.2]],
  "Peter House": [["Residential Care", 0.4], ["Supported Living", 0.4], ["Complex Support", 0.2]],
  "Senna House": [["Supported Living", 0.5], ["Day Support", 0.25], ["Complex Support", 0.25]],
  "Community Outreach": [["Community Outreach", 0.45], ["Day Support", 0.3], ["Supported Living", 0.25]],
};
interface ClientSeed { id: string; ref: string; pkg: string; area: string; funding: string; team: string }
const CLIENTS: ClientSeed[] = [];
{
  const alloc: [string, string, number][] = [
    ["The Retreat", "RT", 8],
    ["Peter House", "PH", 10],
    ["Senna House", "SH", 7],
    ["Community Outreach", "CO", 9],
  ];
  let n = 1;
  for (const [team, prefix, count] of alloc) {
    const svc = SERVICES.find((s) => s.name === team)!;
    for (let i = 1; i <= count; i++) {
      CLIENTS.push({
        id: `C${pad(n, 3)}`,
        ref: `${prefix}-${pad(i, 2)}`,
        pkg: weighted(PACKAGE_MIX[team]),
        area: svc.area,
        funding: weighted([
          ["Local Authority", 0.55],
          ["NHS Continuing Healthcare", 0.2],
          ["ICB Joint Funding", 0.15],
          ["Personal Budget", 0.1],
        ]),
        team,
      });
      n++;
    }
  }
}
const clientsForTeam = (team: string) => CLIENTS.filter((c) => c.team === team);

// ---------- domain vocabularies ----------
const INCIDENT_CATEGORIES: [string, number][] = [
  ["Behaviour that challenges", 0.28],
  ["Medication error", 0.14],
  ["Fall", 0.1],
  ["Physical intervention used", 0.1],
  ["Safeguarding concern", 0.07],
  ["Self-harm", 0.06],
  ["Health emergency", 0.06],
  ["Missing person", 0.04],
  ["Injury (unexplained)", 0.05],
  ["Environment / health & safety", 0.1],
];
const COMPLAINT_SOURCES: [string, number][] = [
  ["Family / relative", 0.38],
  ["Person supported", 0.16],
  ["Local authority / commissioner", 0.14],
  ["Advocate", 0.1],
  ["Other professional", 0.12],
  ["Anonymous", 0.1],
];
const COMPLAINT_CATEGORIES = ["Staff conduct", "Communication with family", "Quality of support", "Medication", "Dignity and respect", "Activity provision", "Environment", "Record keeping"];
const FEEDBACK_METHODS = ["Easy-read survey", "Keyworker session", "Family survey", "Advocate review", "Annual review meeting"];
const LOW_THEMES = ["Communication with family", "Consistency of staff", "Being listened to", "Activity choice", "Dignity and respect", "Medication support", "Responsiveness"];
const HIGH_THEMES = ["Kind and caring staff", "Knows me well", "Supports my independence", "Good communication", "Enjoyable activities", "Feels safe at home", "Respects my choices"];

// ---------- generate ----------
function seed() {
  initSchema();
  const wipe = ["actions", "feedback", "complaints", "incidents", "visits", "clients", "staff", "audit_log", "sessions", "users", "import_batches", "config"];
  const tx = db.transaction(() => {
    for (const t of wipe) db.prepare(`DELETE FROM ${t}`).run();
    ensureDefaultConfig();

    // staff + clients
    const insStaff = db.prepare("INSERT INTO staff (StaffID, StaffName, Role, Team, StartDate, Status, ContractedHours) VALUES (?,?,?,?,?,?,?)");
    for (const s of STAFF) insStaff.run(s.id, s.name, s.role, s.team, s.start, "Active", s.hours);
    const insClient = db.prepare("INSERT INTO clients (ClientID, ClientRef, CarePackage, Area, FundingType) VALUES (?,?,?,?,?)");
    for (const c of CLIENTS) insClient.run(c.id, c.ref, c.pkg, c.area, c.funding);

    // visits (support sessions): roughly 60-90 per staff member per month
    const insVisit = db.prepare("INSERT INTO visits (VisitID, VisitDate, StaffID, ClientID, ScheduledStart, ActualStart, DurationMinutes, Status) VALUES (?,?,?,?,?,?,?,?)");
    let visitN = 0;
    const visitTotals = new Map<string, number>(); // completed visits per staff (whole year), used to sanity-check rates
    for (const s of STAFF) {
      const base = s.hours >= 37.5 ? 78 : s.hours >= 30 ? 70 : 62;
      const [lateP, missP] = s.profile === "weak" ? [0.1, 0.028] : [0.05, 0.008];
      const pool = clientsForTeam(s.team);
      for (const { y, m } of MONTHS) {
        const count = base + Math.floor(rand() * 13) - 6;
        for (let i = 0; i < count; i++) {
          visitN++;
          const date = randomDate(y, m);
          const client = pick(pool);
          const hour = 7 + Math.floor(rand() * 13);
          const min = pick([0, 0, 15, 30, 30, 45]);
          const sched = `${pad(hour, 2)}:${pad(min, 2)}`;
          const r = rand();
          let status: string, actual: string | null;
          if (r < missP) {
            status = "Missed";
            actual = null;
          } else if (r < missP + lateP) {
            status = "Late";
            const lateBy = 16 + Math.floor(rand() * 40);
            const t = hour * 60 + min + lateBy;
            actual = `${pad(Math.floor(t / 60) % 24, 2)}:${pad(t % 60, 2)}`;
          } else {
            status = "Completed";
            const jitter = Math.floor(rand() * 21) - 10;
            const t = Math.max(0, hour * 60 + min + jitter);
            actual = `${pad(Math.floor(t / 60) % 24, 2)}:${pad(t % 60, 2)}`;
          }
          if (status !== "Missed") visitTotals.set(s.id, (visitTotals.get(s.id) ?? 0) + 1);
          insVisit.run(`V${pad(visitN, 6)}`, date, s.id, client.id, sched, actual, pick([30, 45, 60, 60, 90, 120]), status);
        }
      }
    }

    // incidents
    const insInc = db.prepare("INSERT INTO incidents (IncidentID, IncidentDate, StaffID, ClientID, Category, Severity, ReportedWithin24h, CQCNotifiable, Status, DateClosed) VALUES (?,?,?,?,?,?,?,?,?,?)");
    let incN = 0;
    for (const s of STAFF) {
      const monthlyRate =
        s.profile === "weak" ? 1.15
        : s.profile === "strong-reporter" ? 1.0
        : s.profile === "elevated" ? 0.65
        : s.profile === "lead" ? 0.15
        : 0.2 + rand() * 0.35;
      const sev: [string, number][] =
        s.profile === "weak"
          ? [["Low", 0.45], ["Moderate", 0.35], ["High", 0.2]]
          : s.profile === "elevated"
            ? [["Low", 0.55], ["Moderate", 0.32], ["High", 0.13]]
            : s.profile === "strong-reporter"
              ? [["Low", 0.92], ["Moderate", 0.08]]
              : [["Low", 0.62], ["Moderate", 0.3], ["High", 0.08]];
      const on24h = s.profile === "weak" ? 0.82 : s.profile === "elevated" ? 0.9 : 0.97;
      const pool = clientsForTeam(s.team);
      for (const { y, m } of MONTHS) {
        let n = Math.floor(monthlyRate) + (rand() < monthlyRate % 1 ? 1 : 0);
        while (n-- > 0) {
          incN++;
          const date = randomDate(y, m);
          const category = weighted(INCIDENT_CATEGORIES);
          const severity = weighted(sev);
          const notifiable = severity === "High" || category === "Safeguarding concern" || category === "Missing person" ? 1 : rand() < 0.03 ? 1 : 0;
          const ageDays = (new Date(DATA_END).getTime() - new Date(date).getTime()) / 86400000;
          let status = "Closed";
          let closed: string | null = addDays(date, 2 + Math.floor(rand() * 30));
          if (ageDays < 45 && rand() < 0.5) {
            status = rand() < 0.5 ? "Open" : "Under review";
            closed = null;
          }
          if (closed && closed > DATA_END) closed = DATA_END;
          insInc.run(`INC${pad(incN, 4)}`, date, s.id, pick(pool).id, category, severity, rand() < on24h ? 1 : 0, notifiable, status, closed);
        }
      }
    }

    // complaints (~55)
    const insCmp = db.prepare("INSERT INTO complaints (ComplaintID, DateReceived, StaffID, ClientID, Source, Category, Severity, Outcome, DateResolved) VALUES (?,?,?,?,?,?,?,?,?)");
    let cmpN = 0;
    const staffWeights: [StaffSeed, number][] = STAFF.map((s) => [
      s,
      s.profile === "weak" ? 6 : s.profile === "elevated" ? 2.5 : s.profile === "lead" ? 0.2 : s.profile === "strong-reporter" ? 0.4 : 0.6 + rand(),
    ]);
    for (let k = 0; k < 55; k++) {
      const s = weighted(staffWeights);
      const pool = clientsForTeam(s.team);
      {
        cmpN++;
        const { y, m } = pick(MONTHS);
        const date = randomDate(y, m);
        const recent = date > addDays(DATA_END, -60);
        const outcome =
          recent && rand() < 0.6
            ? "Pending"
            : s.profile === "weak"
              ? weighted<string>([["Upheld", 0.45], ["Partially upheld", 0.25], ["Not upheld", 0.3]])
              : s.profile === "elevated"
                ? weighted<string>([["Upheld", 0.3], ["Partially upheld", 0.25], ["Not upheld", 0.45]])
                : weighted<string>([["Upheld", 0.15], ["Partially upheld", 0.15], ["Not upheld", 0.7]]);
        let resolved: string | null = null;
        if (outcome !== "Pending") {
          const days = rand() < 0.75 ? 8 + Math.floor(rand() * 20) : 29 + Math.floor(rand() * 25);
          resolved = addDays(date, days);
          if (resolved > DATA_END) resolved = DATA_END;
        }
        insCmp.run(`CMP${pad(cmpN, 3)}`, date, s.id, pick(pool).id, weighted(COMPLAINT_SOURCES), pick(COMPLAINT_CATEGORIES), weighted([["Low", 0.4], ["Moderate", 0.45], ["High", 0.15]]), outcome, resolved);
      }
    }

    // feedback (~420)
    const insFb = db.prepare("INSERT INTO feedback (FeedbackID, FeedbackDate, ClientID, StaffID, Method, Score, WouldRecommend, Theme) VALUES (?,?,?,?,?,?,?,?)");
    let fbN = 0;
    for (const s of STAFF) {
      const mean = s.profile === "weak" ? 2.9 : s.profile === "elevated" ? 3.6 : s.profile === "strong-reporter" ? 4.7 : 4.05 + rand() * 0.55;
      const pool = clientsForTeam(s.team);
      for (const { y, m } of MONTHS) {
        const n = rand() < 0.25 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          fbN++;
          const score = Math.min(5, Math.max(1, Math.round(normal(mean, 0.85))));
          const recommend = score >= 4 ? rand() < 0.92 : score === 3 ? rand() < 0.55 : rand() < 0.15;
          insFb.run(`FB${pad(fbN, 4)}`, randomDate(y, m), pick(pool).id, s.id, pick(FEEDBACK_METHODS), score, recommend ? 1 : 0, score <= 3 ? pick(LOW_THEMES) : pick(HIGH_THEMES));
        }
      }
    }

    // actions
    const insAct = db.prepare("INSERT INTO actions (ActionID, StaffID, CreatedDate, Source, Description, Owner, DueDate, Status) VALUES (?,?,?,?,?,?,?,?)");
    let actN = 0;
    const leaderFor = (team: string) => STAFF.find((x) => x.team === team && x.role === "Team Leader")!.name;
    const ACTION_TEXT: Record<string, string[]> = {
      Supervision: [
        "Refresher training: medication administration and MAR recording",
        "Shadow shifts with senior support worker to embed PBS strategies",
        "Review communication passports for allocated keywork clients",
        "Agree reflective log after every physical intervention",
        "Complete safeguarding adults level 2 refresher",
      ],
      "Incident review": [
        "Debrief with PBS practitioner and update behaviour support plan",
        "Re-read and sign updated risk assessment for the person supported",
        "Attend epilepsy awareness and emergency protocol training",
        "Review lone working procedure before next outreach visit",
      ],
      "Complaint outcome": [
        "Written reflection on dignity in personal care, reviewed in supervision",
        "Family communication plan agreed with team leader",
        "Re-induction on record keeping standards",
        "Apology and learning summary shared with the person supported",
      ],
    };
    for (const s of STAFF) {
      const n = s.profile === "weak" ? 5 + Math.floor(rand() * 2) : rand() < 0.55 ? 1 + Math.floor(rand() * 2) : 0;
      for (let i = 0; i < n; i++) {
        actN++;
        const { y, m } = pick(MONTHS);
        const created = randomDate(y, m);
        const due = addDays(created, 14 + Math.floor(rand() * 42));
        const source = pick(["Supervision", "Incident review", "Complaint outcome"]);
        let status: string;
        if (due < DATA_END) status = rand() < (s.profile === "weak" ? 0.6 : 0.85) ? "Completed" : "Overdue";
        else status = rand() < 0.5 ? "In progress" : "Open";
        insAct.run(`ACT${pad(actN, 3)}`, s.id, created, source, pick(ACTION_TEXT[source]), rand() < 0.7 ? leaderFor(s.team) : "Registered Manager", due, status);
      }
    }

    // users
    const insUser = db.prepare("INSERT INTO users (Username, DisplayName, PasswordHash, Role, Team) VALUES (?,?,?,?,?)");
    insUser.run("director", "Margaret Osei", hashPassword("Director!2026"), "Director", null);
    insUser.run("manager", "Daniel Hartley", hashPassword("Manager!2026"), "Registered Manager", null);
    insUser.run("teamleader", "Priya Nair", hashPassword("TeamLead!2026"), "Team Leader", "The Retreat");

    // audit trail for the seed itself
    for (const [table, count] of [
      ["staff", STAFF.length],
      ["clients", CLIENTS.length],
      ["visits", visitN],
      ["incidents", incN],
      ["complaints", cmpN],
      ["feedback", fbN],
      ["actions", actN],
    ] as [string, number][]) {
      audit("system", "Data import", table, `Seed import: ${count} rows into ${table}`);
    }
    console.log(`Seeded: ${STAFF.length} staff, ${CLIENTS.length} clients, ${visitN} support sessions, ${incN} incidents, ${cmpN} complaints, ${fbN} feedback, ${actN} actions.`);
  });
  tx();
}

export function seedIfEmpty() {
  initSchema();
  ensureDefaultConfig();
  const row = db.prepare("SELECT COUNT(*) AS n FROM staff").get() as { n: number };
  if (row.n === 0) {
    console.log("Empty database detected - seeding synthetic data...");
    seed();
  }
}

const isDirectRun = process.argv[1] && /seed\.(ts|js)$/.test(process.argv[1]);
if (isDirectRun) {
  seed();
}
