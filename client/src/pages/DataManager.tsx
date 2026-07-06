import { useRef, useState } from "react";
import { api, dateLabel, useApi } from "../api";
import { Card, EmptyState, SectionHeading, Spinner } from "../components/ui";
import { useAuth } from "../store";
import type { ImportValidation } from "../types";

const TABLES = ["staff", "clients", "incidents", "complaints", "feedback", "visits", "actions"];

interface Batch {
  BatchID: number;
  TableName: string;
  ImportedAt: string;
  User: string;
  RowCount: number;
  FileName: string | null;
  Active: number;
}

export default function DataManager() {
  const token = useAuth((s) => s.token);
  const [table, setTable] = useState("incidents");
  const [file, setFile] = useState<File | null>(null);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<ImportValidation | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: batches } = useApi<Batch[]>("/api/import/batches", refresh);

  const reset = () => {
    setResult(null);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const downloadTemplate = async (t: string) => {
    const res = await fetch(`/api/import/template/${t}`, { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aqi_${t}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const validate = async () => {
    if (!file) return;
    setValidating(true);
    setMessage(null);
    setResult(null);
    try {
      const form = new FormData();
      form.append("table", table);
      form.append("file", file);
      const res = await api.post<ImportValidation>("/api/import/validate", form);
      setResult(res);
    } catch (e) {
      setMessage({ tone: "err", text: (e as Error).message });
    } finally {
      setValidating(false);
    }
  };

  const commit = async () => {
    if (!result?.uploadId) return;
    try {
      const res = await api.post<{ rowCount: number; batchId: number }>("/api/import/commit", { uploadId: result.uploadId });
      setMessage({ tone: "ok", text: `Imported ${res.rowCount} rows into ${table} (batch #${res.batchId}). You can roll this back below if needed.` });
      reset();
      setRefresh((r) => r + 1);
    } catch (e) {
      setMessage({ tone: "err", text: (e as Error).message });
    }
  };

  const rollback = async () => {
    if (!window.confirm("Roll back the most recent import? The rows it added will be permanently removed.")) return;
    try {
      const res = await api.post<{ removed: number; table: string }>("/api/import/rollback");
      setMessage({ tone: "ok", text: `Rolled back ${res.removed} rows from ${res.table}.` });
      setRefresh((r) => r + 1);
    } catch (e) {
      setMessage({ tone: "err", text: (e as Error).message });
    }
  };

  const lastActive = batches?.find((b) => b.Active === 1);

  return (
    <div className="space-y-5">
      {message && (
        <div
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${message.tone === "ok" ? "border border-sage/40 bg-sage-100 text-sage-600" : "border border-rust/40 bg-rust-100 text-rust-700"}`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <SectionHeading title="1 · Upload an extract" sub="CSV or .xlsx - the header row must match the template exactly" />
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-ink">
              Target table
              <select
                value={table}
                onChange={(e) => { setTable(e.target.value); reset(); }}
                className="mt-1 block rounded-lg border border-ink/20 bg-white px-3 py-2 text-sm"
              >
                {TABLES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <button onClick={() => downloadTemplate(table)} className="rounded-lg border border-petrol/40 px-3 py-2 text-sm font-medium text-petrol hover:bg-petrol-50">
              Download {table} template
            </button>
          </div>
          <label htmlFor="import-file" className="mt-4 block text-sm font-medium text-ink">File</label>
          <input
            id="import-file"
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); }}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-petrol file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-petrol-700"
          />
          <button
            onClick={validate}
            disabled={!file || validating}
            className="mt-4 rounded-lg bg-petrol px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {validating ? "Validating…" : "Validate file"}
          </button>
        </Card>

        <Card className="p-4">
          <SectionHeading title="Rollback" sub="Undo the most recent committed import" />
          {lastActive ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-mist px-3 py-2 text-sm">
              <div>
                <p className="font-medium text-ink">
                  Batch #{lastActive.BatchID}: {lastActive.RowCount} rows into <span className="tabular">{lastActive.TableName}</span>
                </p>
                <p className="text-xs text-ink/55">
                  {lastActive.FileName} · {dateLabel(lastActive.ImportedAt.slice(0, 10))} by {lastActive.User}
                </p>
              </div>
              <button onClick={rollback} className="shrink-0 rounded-lg border border-rust/40 px-3 py-1.5 text-sm font-medium text-rust-700 hover:bg-rust-100">
                Roll back
              </button>
            </div>
          ) : (
            <EmptyState title="Nothing to roll back" hint="Once you commit an import, the most recent batch can be undone here." />
          )}
          {batches && batches.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-wide text-ink/55">Import history</p>
              <ul className="mt-1 space-y-1 text-xs text-ink/70">
                {batches.slice(0, 8).map((b) => (
                  <li key={b.BatchID} className="flex justify-between gap-2">
                    <span>#{b.BatchID} · {b.TableName} · {b.RowCount} rows · {b.User}</span>
                    <span className={b.Active ? "text-sage-600" : "text-ink/40 line-through"}>{b.Active ? "active" : "rolled back"}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      {validating && <Spinner label="Checking every row" />}

      {result && !result.ok && (
        <Card className="p-4">
          <SectionHeading
            title={`Validation failed: ${result.errorCount ?? result.errors?.length} problem(s) in ${result.rowCount} rows`}
            sub="Nothing has been imported. Fix the rows below and upload again - row numbers match your spreadsheet."
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-ink/30 text-left text-xs uppercase tracking-wide text-ink/60">
                  <th className="px-2 py-2">Row</th><th className="px-2 py-2">Column</th><th className="px-2 py-2">Value</th><th className="px-2 py-2">Problem</th>
                </tr>
              </thead>
              <tbody>
                {result.errors?.map((e, i) => (
                  <tr key={i} className="border-b border-ink/10">
                    <td className="px-2 py-1.5 tabular font-semibold text-rust-700">{e.row}</td>
                    <td className="px-2 py-1.5 tabular">{e.column}</td>
                    <td className="px-2 py-1.5 max-w-40 truncate text-ink/70">{e.value || <em className="text-ink/40">empty</em>}</td>
                    <td className="px-2 py-1.5">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {result && result.ok && (
        <Card className="p-4">
          <SectionHeading
            title={`Ready to import: ${result.rowCount} valid rows`}
            sub="Preview of the first rows as they will be stored. Nothing is committed until you confirm."
            action={
              <div className="flex gap-2">
                <button onClick={reset} className="rounded-lg border border-ink/20 px-3 py-1.5 text-sm font-medium text-ink/70">Cancel</button>
                <button onClick={commit} className="rounded-lg bg-sage px-4 py-1.5 text-sm font-semibold text-white hover:bg-sage-600">
                  Commit {result.rowCount} rows
                </button>
              </div>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-ink/30 text-left uppercase tracking-wide text-ink/60">
                  {result.columns?.map((c) => <th key={c} className="px-2 py-2">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {result.preview.map((row, i) => (
                  <tr key={i} className="border-b border-ink/10">
                    {result.columns?.map((c) => <td key={c} className="px-2 py-1.5 whitespace-nowrap">{row[c] === null ? <em className="text-ink/35">—</em> : String(row[c])}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
