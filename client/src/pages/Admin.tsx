import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api, useApi } from "../api";
import { Card, ErrorNote, SectionHeading, Spinner } from "../components/ui";
import { useMeta } from "../store";
import type { AuditRow, ConfigData, Meta } from "../types";

const WEIGHT_LABELS: Record<string, string> = {
  incidentsPer100Visits: "Incidents per 100 sessions (×)",
  highSeverityIncident: "Each high severity incident (+)",
  upheldComplaint: "Each upheld / partially upheld complaint (+)",
  lowFeedbackScore: "Each feedback score of 1-2 (+)",
};
// Configuration uses the classic RAG names; the interface shows supervision-focused labels.
const BAND_LABELS: Record<string, string> = { red: "Red band starts at QRI ≥", amber: "Amber band starts at QRI ≥" };
const RAG_MAPPING: { swatch: string; band: string; logic: string; shown: string }[] = [
  { swatch: "#BF4A36", band: "Red", logic: "QRI ≥ red threshold", shown: "Priority attention" },
  { swatch: "#D9A441", band: "Amber", logic: "QRI amber to below red", shown: "Review in supervision" },
  { swatch: "#5F9678", band: "Green", logic: "QRI below amber", shown: "Within expected range" },
  { swatch: "#c2cec9", band: "Grey / suppressed", logic: "sample below the minimums", shown: "Insufficient sample" },
];
const SAMPLE_LABELS: Record<string, string> = { minFeedback: "Minimum feedback responses", minVisits: "Minimum completed sessions" };
const TARGET_LABELS: Record<string, string> = {
  reportedWithin24hPct: "24-hour reporting target (%)",
  avgFeedback: "Average feedback target (1-5)",
  resolvedWithin28dPct: "Complaints resolved in 28 days target (%)",
};

function ConfigSection({
  title, sub, configKey, labels, values, onSaved, footer,
}: {
  title: string;
  sub: string;
  configKey: string;
  labels: Record<string, string>;
  values: Record<string, number>;
  onSaved: () => void;
  footer?: ReactNode;
}) {
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setDraft(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v)])));
  }, [values]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      await api.put(`/api/admin/config/${configKey}`, {
        value: Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, Number(v)])),
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <Card className="p-4">
      <SectionHeading title={title} sub={sub} />
      <form onSubmit={save} className="space-y-3">
        {Object.keys(labels).map((field) =>
          field in draft ? (
            <label key={field} className="flex items-center justify-between gap-3 text-sm text-ink/80">
              {labels[field]}
              <input
                type="number"
                step="any"
                min="0"
                required
                value={draft[field] ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
                className="w-28 rounded-lg border border-ink/20 px-3 py-1.5 text-sm tabular"
              />
            </label>
          ) : null
        )}
        {error && <ErrorNote message={error} />}
        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-petrol px-4 py-2 text-sm font-semibold text-white hover:bg-petrol-700">
            Save changes
          </button>
          {saved && <span role="status" className="text-sm font-medium text-sage-600">Saved - change recorded in the audit log</span>}
        </div>
      </form>
      {footer}
    </Card>
  );
}

interface UserRow { UserID: number; Username: string; DisplayName: string; Role: string; Team: string | null; Active: number }

export default function Admin() {
  const [tab, setTab] = useState<"config" | "users" | "audit">("config");
  const [refresh, setRefresh] = useState(0);
  const { data: config, loading, error } = useApi<ConfigData>("/api/admin/config", refresh);
  const setMeta = useMeta((s) => s.setMeta);
  const reloadMeta = () => {
    setRefresh((r) => r + 1);
    api.get<Meta>("/api/meta").then(setMeta).catch(() => {});
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2" role="tablist" aria-label="Admin sections">
        {(["config", "users", "audit"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === t ? "bg-petrol text-white" : "bg-white text-ink/70 border border-ink/15 hover:bg-mist"}`}
          >
            {t === "config" ? "Weights & thresholds" : t === "users" ? "User accounts" : "Audit log"}
          </button>
        ))}
      </div>

      {tab === "config" && (
        <>
          {error && <ErrorNote message={error} />}
          {loading && <Spinner label="Loading configuration" />}
          {config && (
            <div className="grid gap-4 xl:grid-cols-2">
              <ConfigSection
                title="Quality Risk Index weights"
                sub="QRI = (incidents per 100 sessions × w₁) + (high severity × w₂) + (upheld complaints × w₃) + (low scores × w₄)"
                configKey="qriWeights"
                labels={WEIGHT_LABELS}
                values={config.qriWeights as unknown as Record<string, number>}
                onSaved={reloadMeta}
              />
              <ConfigSection
                title="RAG banding thresholds"
                sub="Classic RAG thresholds drive the logic; the interface shows supervision-focused labels. Green is anything below the Amber threshold."
                configKey="ragBands"
                labels={BAND_LABELS}
                values={config.ragBands as unknown as Record<string, number>}
                onSaved={reloadMeta}
                footer={
                  <div className="mt-4 border-t border-line pt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-label">How each band is shown to users</p>
                    <ul className="space-y-1.5">
                      {RAG_MAPPING.map((r) => (
                        <li key={r.band} className="flex items-center gap-2.5 text-[12.5px]">
                          <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: r.swatch }} aria-hidden="true" />
                          <span className="w-32 shrink-0 font-medium text-ink">{r.band}</span>
                          <span className="w-44 shrink-0 text-muted">{r.logic === "QRI ≥ red threshold" ? `QRI ≥ ${config.ragBands.red}` : r.logic === "QRI amber to below red" ? `QRI ${config.ragBands.amber} to <${config.ragBands.red}` : r.logic === "QRI below amber" ? `QRI < ${config.ragBands.amber}` : r.logic}</span>
                          <span className="text-faint">→</span>
                          <span className="font-medium text-petrol-700">“{r.shown}”</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                }
              />
              <ConfigSection
                title="Small sample thresholds"
                sub="Below these, metrics show a warning and RAG colouring is suppressed"
                configKey="smallSample"
                labels={SAMPLE_LABELS}
                values={config.smallSample as unknown as Record<string, number>}
                onSaved={reloadMeta}
              />
              <ConfigSection
                title="Targets"
                sub="Used on the Overview and CQC evidence pages"
                configKey="targets"
                labels={TARGET_LABELS}
                values={config.targets as unknown as Record<string, number>}
                onSaved={reloadMeta}
              />
            </div>
          )}
        </>
      )}

      {tab === "users" && <UsersTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}

function UsersTab() {
  const [refresh, setRefresh] = useState(0);
  const { data: users, loading, error } = useApi<UserRow[]>("/api/admin/users", refresh);
  const { meta } = useMeta();
  const [form, setForm] = useState({ username: "", displayName: "", password: "", role: "Team Leader", team: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setOk(null);
    try {
      await api.post("/api/admin/users", { ...form, team: form.role === "Team Leader" ? form.team : null });
      setOk(`Account '${form.username}' created.`);
      setForm({ username: "", displayName: "", password: "", role: "Team Leader", team: "" });
      setRefresh((r) => r + 1);
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  const toggleActive = async (u: UserRow) => {
    await api.put(`/api/admin/users/${u.UserID}`, { active: !u.Active });
    setRefresh((r) => r + 1);
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="p-4">
        <SectionHeading title="Accounts" sub="Directors and the Registered Manager see everything; Team Leaders see only their own service - enforced by the API, not just the interface." />
        {error && <ErrorNote message={error} />}
        {loading && <Spinner label="Loading users" />}
        <ul className="space-y-2">
          {users?.map((u) => (
            <li key={u.UserID} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-ink">{u.DisplayName} <span className="text-ink/50">({u.Username})</span></p>
                <p className="text-xs text-ink/55">{u.Role}{u.Team ? ` · ${u.Team}` : ""}</p>
              </div>
              <button
                onClick={() => toggleActive(u)}
                className={`rounded-lg border px-3 py-1 text-xs font-medium ${u.Active ? "border-ink/20 text-ink/70 hover:bg-mist" : "border-sage/40 text-sage-600 hover:bg-sage-100"}`}
              >
                {u.Active ? "Deactivate" : "Reactivate"}
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card className="p-4">
        <SectionHeading title="Create account" />
        {formError && <ErrorNote message={formError} />}
        {ok && <p role="status" className="mb-2 rounded-lg bg-sage-100 px-3 py-2 text-sm text-sage-600">{ok}</p>}
        <form onSubmit={create} className="space-y-3 text-sm">
          <label className="block">Username
            <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2" />
          </label>
          <label className="block">Display name
            <input required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2" />
          </label>
          <label className="block">Password <span className="text-ink/50">(min 8 characters)</span>
            <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2" />
          </label>
          <div className="flex gap-3">
            <label className="block flex-1">Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2">
                <option>Director</option>
                <option>Registered Manager</option>
                <option>Team Leader</option>
              </select>
            </label>
            {form.role === "Team Leader" && (
              <label className="block flex-1">Service
                <select required value={form.team} onChange={(e) => setForm({ ...form, team: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2">
                  <option value="" disabled>Choose…</option>
                  {meta?.teams.map((t) => <option key={t}>{t}</option>)}
                </select>
              </label>
            )}
          </div>
          <button type="submit" className="rounded-lg bg-petrol px-4 py-2 font-semibold text-white hover:bg-petrol-700">Create account</button>
        </form>
      </Card>
    </div>
  );
}

function AuditTab() {
  const [action, setAction] = useState("All");
  const { data, loading, error } = useApi<{ rows: AuditRow[]; actions: string[] }>(
    `/api/admin/audit?action=${encodeURIComponent(action)}&limit=200`
  );
  return (
    <Card className="p-4">
      <SectionHeading
        title="Audit log"
        sub="Every import, edit, export, sign-in and configuration change"
        action={
          <label className="text-sm text-ink/70">
            Filter
            <select value={action} onChange={(e) => setAction(e.target.value)} className="ml-2 rounded-lg border border-ink/20 px-2 py-1.5 text-sm">
              <option>All</option>
              {data?.actions.map((a) => <option key={a}>{a}</option>)}
            </select>
          </label>
        }
      />
      {error && <ErrorNote message={error} />}
      {loading && <Spinner label="Loading audit log" />}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-ink/30 text-left text-xs uppercase tracking-wide text-ink/60">
              <th className="px-2 py-2">When</th><th className="px-2 py-2">User</th><th className="px-2 py-2">Action</th>
              <th className="px-2 py-2">Record</th><th className="px-2 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {data?.rows.map((r) => (
              <tr key={r.AuditID} className="border-b border-ink/10 align-top">
                <td className="px-2 py-1.5 whitespace-nowrap tabular text-ink/70">{new Date(r.Timestamp).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
                <td className="px-2 py-1.5">{r.User}</td>
                <td className="px-2 py-1.5"><span className="rounded bg-mist px-1.5 py-0.5 text-xs font-medium">{r.Action}</span></td>
                <td className="px-2 py-1.5 tabular text-ink/60">{r.RecordRef ?? "—"}</td>
                <td className="px-2 py-1.5 text-ink/75">{r.Details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
