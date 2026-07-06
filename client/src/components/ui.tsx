import type { ReactNode } from "react";

export function Card({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" }) {
  return <Tag className={`rounded-xl bg-white shadow-card border border-line ${className}`}>{children}</Tag>;
}

export function SectionHeading({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
      <div>
        <h2 className="font-display text-[15.5px] font-semibold text-ink">{title}</h2>
        {sub && <p className="text-xs text-muted mt-0.5">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** A labelled group divider: petrol heading with a hairline rule filling the row. */
export function SectionDivider({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="font-display text-[17px] font-semibold text-petrol">{title}</h2>
      <span className="h-px flex-1 bg-line" aria-hidden="true" />
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const dims = size === "lg" ? "h-13 w-13 text-lg rounded-2xl" : size === "sm" ? "h-8 w-8 text-[11px] rounded-lg" : "h-9 w-9 text-xs rounded-xl";
  return (
    <span className={`flex shrink-0 items-center justify-center bg-avatar font-display font-semibold text-petrol ${dims}`} style={size === "lg" ? { height: 52, width: 52 } : undefined} aria-hidden="true">
      {initials}
    </span>
  );
}

const ACCENT: Record<string, string> = { petrol: "#0F5257", sage: "#5F9678", amber: "#D9A441", rust: "#BF4A36" };

export function KpiCard({
  label, value, sub, target, tone = "petrol",
}: {
  label: string;
  value: string | number;
  sub?: string;
  target?: string;
  /** drives the accent bar and pip colour */
  tone?: "petrol" | "sage" | "amber" | "rust";
}) {
  return (
    <div
      className="flex min-w-0 flex-col rounded-xl border border-line bg-white p-4 shadow-card"
      style={{ borderTop: `3px solid ${ACCENT[tone]}` }}
    >
      <div className="flex items-center justify-between gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-label">{label}</span>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ACCENT[tone] }} aria-hidden="true" />
      </div>
      <span className="mt-2 font-display text-[28px] font-semibold leading-none tabular text-ink">{value}</span>
      {sub && <span className="mt-1.5 text-[11.5px] leading-snug text-muted">{sub}</span>}
      {target && <span className="mt-px text-[11px] text-faint">{target}</span>}
    </div>
  );
}

// Softened, supervision-first RAG language (per the design system).
export const BAND_META: Record<string, { label: string; edge: string; badgeBg: string; badgeCol: string }> = {
  Red: { label: "Priority attention", edge: "#BF4A36", badgeBg: "#F6E1DD", badgeCol: "#96351F" },
  Amber: { label: "Review in supervision", edge: "#D9A441", badgeBg: "#F8EDD8", badgeCol: "#8a6113" },
  Green: { label: "Within expected range", edge: "#5F9678", badgeBg: "#E4EFE8", badgeCol: "#3d6b52" },
};

export function RagBadge({ band, suppressed }: { band: "Red" | "Amber" | "Green" | null; suppressed?: boolean }) {
  if (!band || suppressed) {
    return (
      <span
        className="inline-flex items-center rounded-full bg-[#EEF2F0] px-2.5 py-0.5 text-[11px] font-semibold text-muted"
        title="RAG banding is withheld: the sample is too small for a fair judgement"
      >
        Not rated
      </span>
    );
  }
  const m = BAND_META[band];
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: m.badgeBg, color: m.badgeCol }}>
      {m.label}
    </span>
  );
}

export function StrongReporterBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-petroltint px-2.5 py-0.5 text-[11px] font-semibold text-petrol-700 ${className}`}
      title="High incident volume with a low-severity mix and strong feedback. This pattern usually reflects a healthy reporting culture, not poor practice."
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Strong reporter
    </span>
  );
}

export function SmallSampleTag({ what, min }: { what: string; min: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-[#FBF3E1] px-2 py-0.5 text-[11px] font-semibold text-[#8a6113]"
      title={`Fewer than ${min} ${what} in this period - treat this figure with caution. RAG colouring is withheld on small samples.`}
    >
      Small sample
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-white px-6 py-12 text-center">
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-faint" aria-hidden="true">
        <path d="M4 19V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p className="font-display font-semibold text-moss">{title}</p>
      <p className="max-w-md text-sm text-muted">{hint}</p>
      {action}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-16 text-muted">
      <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-sm">{label}…</span>
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-lg border border-rust/30 bg-rust-100/60 px-4 py-3 text-sm text-rust-700">
      {message}
    </div>
  );
}

export function ProgressBar({ pct, tone = "petrol" }: { pct: number; tone?: "petrol" | "sage" | "amber" | "rust" }) {
  const colours = { petrol: "bg-petrol", sage: "bg-sage", amber: "bg-amber", rust: "bg-rust" };
  return (
    <div className="h-[9px] w-full overflow-hidden rounded-full bg-[#F0F1EF]" role="presentation">
      <div className={`h-full rounded-full ${colours[tone]}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

/** Small tinted callout used for interpretation / governance notes. */
export function Note({ tone = "petrol", title, children }: { tone?: "petrol" | "sage"; title?: string; children: ReactNode }) {
  const styles =
    tone === "sage"
      ? "border-line bg-sagetint text-[#2f4f4c]"
      : "border-[#BBD4D3] bg-petroltint text-[#2f4f4c]";
  return (
    <div role="note" className={`rounded-xl border px-4 py-3.5 ${styles}`}>
      {title && <p className="text-[13.5px] font-semibold text-petrol-700">{title}</p>}
      <div className={`text-[12.5px] leading-relaxed ${title ? "mt-1" : ""}`}>{children}</div>
    </div>
  );
}
