import type { ReactNode } from "react";

export function Card({ children, className = "", as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" }) {
  return <Tag className={`rounded-xl bg-white shadow-card border border-petrol-100/60 ${className}`}>{children}</Tag>;
}

export function SectionHeading({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2 mb-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        {sub && <p className="text-sm text-ink/60">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({
  label, value, sub, target, good, warn,
}: {
  label: string;
  value: string | number;
  sub?: string;
  target?: string;
  /** true = meeting expectation, false = off target, undefined = neutral */
  good?: boolean;
  warn?: boolean;
}) {
  const tone = good === undefined && !warn ? "text-ink" : warn ? "text-amber-700" : good ? "text-sage-600" : "text-rust-700";
  return (
    <Card className="p-4 flex flex-col gap-1 min-w-0">
      <span className="text-xs font-medium uppercase tracking-wide text-ink/55">{label}</span>
      <span className={`font-display text-2xl md:text-3xl font-semibold tabular ${tone}`}>{value}</span>
      <span className="text-xs text-ink/55 leading-snug">
        {sub}
        {target && <span className="block">{target}</span>}
      </span>
    </Card>
  );
}

const BAND_STYLES: Record<string, string> = {
  Red: "bg-rust-100 text-rust-700 ring-1 ring-rust/30",
  Amber: "bg-amber-100 text-amber-700 ring-1 ring-amber/40",
  Green: "bg-sage-100 text-sage-600 ring-1 ring-sage/30",
};

export function RagBadge({ band, suppressed }: { band: "Red" | "Amber" | "Green" | null; suppressed?: boolean }) {
  if (!band || suppressed) {
    return (
      <span className="inline-flex items-center rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink/50 ring-1 ring-ink/15" title="RAG banding suppressed: sample too small for a fair judgement">
        Not rated
      </span>
    );
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BAND_STYLES[band]}`}>{band}</span>;
}

export function StrongReporterBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-petrol-50 px-2.5 py-0.5 text-xs font-semibold text-petrol-700 ring-1 ring-petrol/25 ${className}`}
      title="High incident volume with a low-severity mix and strong feedback. This pattern usually reflects a healthy reporting culture, not poor practice."
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
      className="inline-flex items-center gap-1 rounded bg-amber-100/70 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
      title={`Fewer than ${min} ${what} in this period - treat this figure with caution. RAG colouring is withheld on small samples.`}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Small sample
    </span>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 bg-white/60 px-6 py-12 text-center">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-ink/30" aria-hidden="true">
        <path d="M4 19V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M9 13h6M9 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p className="font-display font-semibold text-ink/80">{title}</p>
      <p className="max-w-md text-sm text-ink/60">{hint}</p>
      {action}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 py-16 text-ink/60">
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
    <div className="h-2 w-full overflow-hidden rounded-full bg-mist" role="presentation">
      <div className={`h-full rounded-full ${colours[tone]}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}
