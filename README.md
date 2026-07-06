# Care Quality Intelligence (CQI)

A staff quality performance platform for care providers — designed around residential care, supported living and
community outreach services for adults with learning disabilities (the sample data models four services: The
Retreat, Peter House, Senna House, and Community Outreach).

CQI monitors incidents, complaints and feedback at organisation, service and individual staff level, and turns
that monitoring into **supervision packs** and **CQC inspection evidence**. It is built to be fair by design:
every staff-level metric is normalised per 100 delivered support sessions, small samples suppress judgement,
and conscientious reporters are flagged as a strength rather than a risk.

## Quick start

Requires Node.js 20+ (tested on Node 24).

```bash
npm install
npm run dev
```

- Web app: http://localhost:5173
- API: http://localhost:4001

On first run the server creates `server/data/cqi.db` and seeds **12 months of synthetic data**
(July 2025 – June 2026): 28 staff across four services, 34 people supported, ~24,000 support sessions,
~160 incidents, 55 complaints and ~420 feedback records. The people supported span a realistic mix of
adult social care package types — **Supported Living, Residential Care, Community Outreach, Complex
Support and Day Support** — shown across the app as service context only (care package is never part of
the Quality Risk Index or any staff judgement). Re-seed at any time with `npm run seed`
(deterministic — the same data is regenerated).

> All demo data is **synthetic**. It does not represent real people, real service users, real staff
> performance or real addresses. Provider and service names in the sample data are fictitious.

### Demo accounts

| Username     | Password        | Role               | Scope                          |
| ------------ | --------------- | ------------------ | ------------------------------ |
| `director`   | `Director!2026` | Director           | Everything + admin             |
| `manager`    | `Manager!2026`  | Registered Manager | Everything + admin             |
| `teamleader` | `TeamLead!2026` | Team Leader        | The Retreat only (API-enforced) |

Change these before any real use (Admin → User accounts).

## What to demo first

1. Sign in as `director`, open **Staff risk board**, click the top Red tile.
2. Click **Generate supervision pack** — a print-ready pack with the period summary, the exact QRI arithmetic,
   event log, feedback themes, previous actions and a blank agreed-actions section. Print → *Save as PDF*.
3. Open **CQC evidence** → **Export evidence pack** for the Safe/Well-led mapping, the Regulation 18
   notifiable log and complaint-handling timeliness.

## Architecture

```
├── client/   React 18 + TypeScript + Vite + Tailwind + Recharts + Zustand
└── server/   Express + better-sqlite3 (SQLite), TypeScript via tsx
```

- **Single command dev**: `npm run dev` runs both workspaces (Vite proxies `/api` to the server).
- **Data model** (exact column names, matching the organisation's existing extracts): `staff`, `clients`,
  `incidents`, `complaints`, `feedback`, `visits` (support sessions/shifts — the denominator for all
  rate-based metrics), `actions`, `audit_log`, plus `users`, `config` and `import_batches`.
- **People we support are never named** — only `ClientRef` codes appear anywhere in the system.

## The analytics rules

- **Normalisation.** No raw count is ever presented alone as a judgement; every staff metric shows the raw
  count *and* the rate per 100 completed sessions.
- **Quality Risk Index (QRI)** per carer, per rolling period:
  `(incidents per 100 sessions × 2) + (high severity × 5) + (upheld or partially upheld complaints × 4) + (scores of 1–2 × 1)`.
  All four weights are editable in **Admin → Weights & thresholds**; every change is written to the audit log
  and immediately re-ranks the risk board.
- **RAG bands**: Red ≥ 25, Amber 12–25, Green < 12 (editable in the same screen).
- **Reporting culture guard**: high incident volume + low severity mix + feedback ≥ 4.0 ⇒ flagged
  **Strong reporter**, not a risk — stated explicitly in the UI and in supervision packs.
- **Statistical honesty**: fewer than 10 feedback responses or 50 completed sessions ⇒ small-sample warning
  and RAG colouring suppressed.

## Role-based access — enforced server-side

Team Leaders are restricted to their own service **in the API layer**, not just the UI: the team filter is
overridden on every query, and direct requests for another team's staff return `403`. Verify it:

```bash
curl -s -X POST localhost:4001/api/login -H "Content-Type: application/json" \
  -d '{"username":"teamleader","password":"TeamLead!2026"}'
# then with that token:
curl -s "localhost:4001/api/staff?team=Peter%20House" -H "Authorization: Bearer <token>"
# → returns The Retreat staff only
curl -s "localhost:4001/api/staff/S012" -H "Authorization: Bearer <token>"   # Peter House staff member
# → 403
```

## Data manager

Upload CSV or `.xlsx` extracts per table (Admin roles only). Every row is validated before anything is
committed — missing columns, bad dates (accepts `YYYY-MM-DD` and `DD/MM/YYYY`), unknown Staff/Client IDs,
invalid enums and duplicate IDs are reported **row by row** with spreadsheet-matching row numbers. Valid files
show a preview and commit as a batch; the most recent batch can be rolled back with one click. Template CSVs
are downloadable per table. `Yes/No` booleans from the organisation's existing Excel workbook are accepted.

## PDF export

Supervision packs and CQC evidence packs are dedicated print-first pages (A4 print stylesheet, page-break
control). Click **Print / Save as PDF** and use the browser's *Save as PDF* destination — this keeps the
export pixel-identical to what's reviewed on screen and requires no native PDF dependencies.

## Scripts

| Command                     | What it does                                  |
| --------------------------- | --------------------------------------------- |
| `npm run dev`               | API + web app in watch mode                   |
| `npm run seed`              | Force re-seed the database (deterministic)    |
| `npm run build`             | Typecheck + build both workspaces             |
| `npm start`                 | Serve the production build (API serves `client/dist`) |
| `npm run lint`              | ESLint over both workspaces                   |

## Deployment

1. `npm install && npm run build`
2. `npm start` (set `PORT` if needed; default 4001). The Express server serves the built client and the API
   from one process — put it behind HTTPS (e.g. Caddy/nginx or an internal IIS reverse proxy).
3. The SQLite database lives at `server/data/cqi.db`; back it up on your normal schedule. WAL mode is enabled.
4. Before go-live: change the demo passwords, create real accounts, and import real extracts through the
   Data manager (which validates before committing and is fully audited).

## Governance

- No client names anywhere — ClientRef codes only.
- The risk board carries a permanent interpretation note: the tool prioritises supervision conversations and
  is **not** an automated performance judgement.
- Every import, edit, export, sign-in and configuration change is written to an append-only audit log
  (Admin → Audit log).
- The in-app **Data protection** page documents minimisation, retention and access control for a care
  provider audience.
