import { Card } from "../components/ui";

const SECTIONS = [
  {
    title: "What this system holds, and what it deliberately does not",
    body: [
      "Aldanat Quality Intelligence (AQI) processes quality and safety data about our services: incidents, complaints, feedback, support sessions and supervision actions. It links these to staff members so that patterns can be discussed in supervision.",
      "People we support are never identified by name. Every record uses a reference code (for example RT-03), and the interface, supervision packs and CQC exports show only that code. The key linking codes to people is held separately in the care planning system, on a need-to-know basis.",
      "AQI does not hold care plans, health records, photographs, or any special category data about the people we support beyond the fact that a quality event occurred.",
    ],
  },
  {
    title: "Lawful basis",
    body: [
      "Staff quality data is processed under legitimate interests (monitoring the safety and quality of regulated care) and legal obligation (Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, including Regulations 12, 13, 16, 17 and 18, and our duty to notify CQC).",
      "Supervision records created from this system form part of the staff member's employment record.",
    ],
  },
  {
    title: "Data minimisation in practice",
    body: [
      "Only the fields needed to answer 'is support safe and improving?' are collected. Free-text is limited to short themes and agreed actions - not narrative accounts, which stay in the incident management system.",
      "Team Leaders can only see their own service. This is enforced by the server on every request, not just hidden in the interface, so a Team Leader account cannot query another team's data even directly against the API.",
      "Individual metrics are normalised and carry small-sample warnings so that data is not over-interpreted - a fairness safeguard as well as a statistical one.",
    ],
  },
  {
    title: "Retention",
    body: [
      "Quality event data (incidents, complaints, feedback) is retained for 3 years from the end of the year it relates to, in line with CQC evidential expectations, then deleted from AQI.",
      "Supervision packs and agreed actions are retained in the staff member's supervision file for the duration of employment plus 6 years.",
      "The audit log (who imported, changed or exported what, and when) is retained for 6 years.",
      "Rolled-back imports are physically deleted immediately; the audit log keeps only the fact that the import and rollback happened.",
    ],
  },
  {
    title: "Access control and security",
    body: [
      "Three roles exist. Directors and the Registered Manager see the whole organisation and administer the system; Team Leaders see only their own service. Account changes and deactivations take effect immediately.",
      "Passwords are stored using salted scrypt hashing. Sessions are revocable server-side. Every sign-in, import, edit, export and configuration change is written to a tamper-evident, append-only audit log.",
      "The database is held on the organisation's own infrastructure; no quality data leaves it to third-party analytics services.",
    ],
  },
  {
    title: "Individual rights",
    body: [
      "Staff may request a copy of the data held about them (subject access), and corrections of factual errors, via the Registered Manager. Because metrics are calculated from source records, correcting a source record automatically corrects the metrics.",
      "People we support (or their representatives) exercising their rights should contact the Registered Manager; the reference-code design means AQI itself rarely holds their personal data.",
      "Concerns about how data is used can be raised with the Registered Manager, our Data Protection Lead, or the ICO (ico.org.uk).",
    ],
  },
];

export default function Gdpr() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {SECTIONS.map((s) => (
        <Card key={s.title} as="section" className="p-5">
          <h2 className="font-display text-base font-semibold text-ink">{s.title}</h2>
          {s.body.map((p, i) => (
            <p key={i} className="mt-2 text-sm leading-relaxed text-moss">{p}</p>
          ))}
        </Card>
      ))}
      <p className="text-xs text-faint">
        Review annually. Last reviewed July 2026. This page is guidance for a care provider audience and does not replace
        the organisation's full data protection policy.
      </p>
    </div>
  );
}
