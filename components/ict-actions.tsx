"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, DatabaseZap, FileUp, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { callApi } from "@/lib/client-api";

type Staff = { id: string; name: string };

/** Runs "Import My OpenAlex Publications" for every academic staff member, one at a time. */
export function OpenAlexSyncButton({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  async function sync() {
    setRunning(true);
    setLog([]);
    let total = 0;
    for (const [index, member] of staff.entries()) {
      setLog((lines) => [...lines, `${index + 1}/${staff.length} ${member.name}: importing...`]);
      const { ok, body } = await callApi<{ imported?: number }>("/api/openalex/import", { body: { userId: member.id } });
      total += ok ? body.imported ?? 0 : 0;
      const result = ok ? `${body.imported ?? 0} imported` : `failed: ${body.error ?? "unknown error"}`;
      setLog((lines) => [...lines.slice(0, -1), `${index + 1}/${staff.length} ${member.name}: ${result}`]);
    }
    setLog((lines) => [...lines, `Done. ${total} publications imported.`]);
    setRunning(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button onClick={sync} disabled={running || !staff.length}>
        <DatabaseZap className="h-4 w-4" /> {running ? "Syncing..." : "OpenAlex Sync"}
      </Button>
      {log.length ? (
        <div className="max-h-48 overflow-y-auto rounded-md border bg-white p-3 text-xs text-muted-foreground">
          {log.map((line, index) => <p key={index}>{line}</p>)}
        </div>
      ) : null}
    </div>
  );
}

/** Imports a pasted list of DOIs / OpenAlex ids for one staff member. */
export function BulkImportForm({ staff }: { staff: Staff[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const ids = String(form.get("ids") ?? "").split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
    if (!ids.length) return setMessage({ error: true, text: "Paste at least one DOI or OpenAlex id." });
    setLoading(true);
    setMessage(null);
    const { ok, body } = await callApi<{ imported?: number; notFound?: number }>("/api/openalex/import-selected", { body: { userId: form.get("userId"), ids } });
    setLoading(false);
    if (!ok) return setMessage({ error: true, text: body.error ?? "Import failed." });
    setMessage({ error: false, text: `Imported ${body.imported} publications${body.notFound ? `; ${body.notFound} were not found in OpenAlex` : ""}.` });
    router.refresh();
  }

  return (
    <form id="bulk-import" onSubmit={submit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Academic staff member</span>
        <select name="userId" required className="h-10 w-full rounded-md border bg-white px-3 text-sm">
          {staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">DOIs or OpenAlex ids</span>
        <textarea
          name="ids"
          rows={5}
          placeholder={"10.1234/example.2024.001\nhttps://doi.org/10.5678/abc\nW4393196039"}
          className="w-full rounded-md border bg-white p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-primary/25"
        />
      </label>
      {message ? <p role="status" className={`text-sm ${message.error ? "text-danger" : "text-success"}`}>{message.text}</p> : null}
      <Button disabled={loading || !staff.length}>
        <FileUp className="h-4 w-4" /> {loading ? "Importing..." : "Import from OpenAlex"}
      </Button>
    </form>
  );
}

/** Verify / reject / reopen a publication in the ICT queue. */
export function VerificationButtons({ publicationId, status }: { publicationId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function set(next: "VERIFIED" | "REJECTED" | "MANUAL_REVIEW") {
    setBusy(true);
    setError("");
    const { ok, body } = await callApi(`/api/publications/${encodeURIComponent(publicationId)}`, { method: "PATCH", body: { status: next } });
    setBusy(false);
    if (!ok) return setError(body.error ?? "Update failed.");
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        {status === "VERIFIED" || status === "REJECTED" ? (
          <Button className="h-8 bg-white px-2 text-primary ring-1 ring-border" disabled={busy} onClick={() => set("MANUAL_REVIEW")} title="Send back to review" aria-label="Send back to review">
            <RotateCcw className="h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button className="h-8 px-2" disabled={busy} onClick={() => set("VERIFIED")} title="Verify" aria-label="Verify publication"><Check className="h-4 w-4" /></Button>
            <Button className="h-8 bg-white px-2 text-danger ring-1 ring-border" disabled={busy} onClick={() => set("REJECTED")} title="Reject" aria-label="Reject publication"><X className="h-4 w-4" /></Button>
          </>
        )}
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
