# Prompt for Claude Code

Copy everything below this line into Claude Code in an empty project folder.

---

Build a production quality web application called **Aldanat Quality Intelligence (AQI)**, a staff quality performance platform for a domiciliary care provider in Essex, England. The audience is the registered manager, directors, and team leaders. The purpose is to monitor incidents, complaints, and client feedback at organisation, team, and individual carer level, and to turn that monitoring into supervision actions and CQC inspection evidence. This must feel like a commercial product, not a dashboard prototype.

## Tech stack

Use React with TypeScript and Vite, Tailwind CSS, Recharts for charts, Zustand for state, and SQLite via better-sqlite3 behind a small Express API (single repo, `client` and `server` workspaces). Include seed scripts, ESLint, and a README with setup and deployment instructions. Everything must run locally with `npm install` then `npm run dev`.

## Data model

Create these tables with the exact column names below, because the organisation already holds sample data in this schema and will import real extracts later.

1. `staff`: StaffID, StaffName, Role, Team, StartDate, Status, ContractedHours
2. `clients`: ClientID, ClientRef, CarePackage, Area, FundingType
3. `incidents`: IncidentID, IncidentDate, StaffID, ClientID, Category, Severity (Low, Moderate, High), ReportedWithin24h, CQCNotifiable, Status, DateClosed
4. `complaints`: ComplaintID, DateReceived, StaffID, ClientID, Source, Category, Severity, Outcome (Upheld, Partially upheld, Not upheld, Pending), DateResolved
5. `feedback`: FeedbackID, FeedbackDate, ClientID, StaffID, Method, Score (1 to 5), WouldRecommend, Theme
6. `visits`: VisitID, VisitDate, StaffID, ClientID, ScheduledStart, ActualStart, DurationMinutes, Status (Completed, Late, Missed). Generate realistic seed data for visits (roughly 60 to 90 visits per carer per month) because this table is what makes rate based metrics possible.
7. `actions`: ActionID, StaffID, CreatedDate, Source (Supervision, Incident review, Complaint outcome), Description, Owner, DueDate, Status
8. `audit_log`: every data import, edit, and export with user, timestamp, and record reference

Seed 12 months of realistic synthetic data (July 2025 to June 2026) for 28 staff across three teams (Colchester, Clacton, Harwich), 60 clients, about 160 incidents, 55 complaints, and 420 feedback records, with three deliberately weaker performers so risk features show variation.

## Core analytics rules

These rules are the analytical heart of the product. Implement them exactly.

1. **Normalised metrics.** Never present raw counts as a judgement on an individual. Every staff level metric must be available per 100 completed visits. Show raw count and rate side by side.
2. **Quality Risk Index (QRI).** Per carer, per rolling period: (incidents per 100 visits × 2) + (high severity incidents × 5) + (upheld or partially upheld complaints × 4) + (feedback scores of 1 or 2 × 1). Weights must live in a configuration screen editable by an admin, with changes recorded in the audit log.
3. **RAG banding.** Red at QRI 25 or above, Amber at 12 to below 25, Green below 12. Bands editable in the same configuration screen.
4. **Reporting culture guard.** If a carer has a high incident count but low severity mix and average feedback of 4.0 or above, flag them as "Strong reporter" rather than a risk, and say so in the interface. This distinction is what makes the tool fair and defensible.
5. **Statistical honesty.** Where a carer has fewer than 10 feedback responses or fewer than 50 visits in the selected period, display a small sample warning and suppress RAG colouring for that metric.

## Pages

1. **Overview.** KPI cards (incidents, high severity, 24 hour reporting rate against a 95 percent target, complaints, upheld rate, average feedback against a 4.0 target, missed visit rate), monthly trend charts, incidents by category and severity, complaints by source, low score themes. Global filters for team and period (3, 6, 12 months) that drive every page.
2. **Staff risk board.** Ranked tiles of all active carers coloured by RAG with QRI, click through to an individual profile: KPIs, feedback trend, event timeline, visits context, open actions, and the Strong reporter flag where it applies.
3. **Supervision pack generator.** From any carer profile, one click produces a printable PDF supervision pack: period summary, QRI breakdown showing exactly which components drove the score, event log, feedback verbatim themes, previous actions and their status, and a blank agreed actions section. This is the feature to demonstrate first in any pitch, because it converts monitoring into management practice.
4. **CQC evidence mode.** A page mapping the metrics to the CQC single assessment framework quality statements under Safe and Well led: notifiable incident log with notification dates, complaint handling timeliness (percentage resolved within 28 days), learning actions completed, and an export to PDF formatted as inspection ready evidence.
5. **Data manager.** Upload Excel or CSV extracts matching the schema, with validation (missing columns, bad dates, unknown StaffIDs reported row by row before commit), preview, and rollback of the last import. Include a template download.
6. **Admin.** Weight and threshold configuration, user accounts with three roles (Director sees everything, Registered Manager sees everything, Team Leader sees only their own team), and the audit log viewer.

## Design direction

Professional healthcare aesthetic with a distinct identity: deep petrol ink (#12333A), petrol teal primary (#0F5257), sage (#5F9678), amber (#D9A441), warning red (#BF4A36), cool mist background (#F3F6F5). Sora for display type, Inter for body. No purple gradients, no glassmorphism, no dark dashboards. Fully responsive, keyboard accessible, visible focus states, and reduced motion respected. Empty states must tell the user what to do next.

## Governance requirements

1. No client names anywhere in the interface, only ClientRef codes.
2. A visible interpretation note on the risk board stating that the tool prioritises supervision conversations and is not an automated performance judgement.
3. Role based access enforced server side, not just hidden in the UI.
4. GDPR page describing data minimisation, retention, and access control, written for a care provider audience.

## Build order

Work in phases and confirm each compiles and runs before moving on.
Phase 1: repo scaffold, database, seed data, API.
Phase 2: Overview page with filters.
Phase 3: Staff risk board and carer profile with QRI, normalisation, Strong reporter logic, and small sample suppression.
Phase 4: Supervision pack generator with PDF export.
Phase 5: CQC evidence mode with PDF export.
Phase 6: Data manager with validation and rollback.
Phase 7: Admin, roles, audit log, GDPR page, README, and a final accessibility and responsiveness pass.

## Acceptance criteria

The application is complete when: all seven phases run without errors; a Team Leader account cannot see or query other teams even via the API; the supervision pack for the highest risk carer generates a correct PDF; changing a QRI weight in Admin changes the risk board and writes an audit entry; importing a deliberately broken CSV reports the exact failing rows without committing anything; and every chart responds to the global team and period filters.
