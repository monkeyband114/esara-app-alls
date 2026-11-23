"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Download, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/client-api";

type Result = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  authors: string[];
  importable: boolean;
};

const MODES = [
  ["publication", "Search by Publication"],
  ["author", "Search by Author"],
  ["doi", "Search by DOI"],
  ["journal", "Search by Journal"],
  ["institution", "Search by Institution"]
] as const;

export function ResearchDiscoveryClient({ canImport }: { canImport: boolean }) {
  const [mode, setMode] = useState<string>("publication");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState<"search" | "import" | null>(null);
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  async function search(nextMode = mode, nextQuery = query) {
    if (!nextQuery.trim()) return;
    setLoading("search");
    setMessage(null);
    setSelected([]);
    const { ok, body } = await callApi<{ results?: Result[] }>(`/api/research-discovery?mode=${encodeURIComponent(nextMode)}&q=${encodeURIComponent(nextQuery)}`);
    setLoading(null);
    setResults(body.results ?? []);
    if (!ok || body.error) setMessage({ error: true, text: body.error ?? "OpenAlex search failed." });
    else if (!body.results?.length) setMessage({ error: false, text: "No OpenAlex results. Try different words or another search type." });
  }

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function importSelected() {
    setLoading("import");
    setMessage(null);
    const { ok, body } = await callApi<{ imported?: number }>("/api/openalex/import-selected", { body: { ids: selected } });
    setLoading(null);
    if (!ok) return setMessage({ error: true, text: body.error ?? "Import failed." });
    setSelected([]);
    setMessage({ error: false, text: `Imported ${body.imported} publication${body.imported === 1 ? "" : "s"} to your profile. Uncertain author matches go to the ICT verification queue.` });
  }

  return (
    <div className="space-y-5">
      <form
        className="grid gap-3 md:grid-cols-[200px_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <select aria-label="Search type" className="h-10 rounded-md border bg-white px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value)}>
          {MODES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search query" placeholder="Title, keyword, author name, DOI, journal, or institution" />
        <Button disabled={loading !== null || !query.trim()}><Search className="h-4 w-4" /> {loading === "search" ? "Searching..." : "Search"}</Button>
      </form>

      {message ? <p role="status" className={`text-sm ${message.error ? "text-danger" : "text-success"}`}>{message.text}</p> : null}

      <div className="space-y-3">
        {results.map((result) => {
          const isSelected = selected.includes(result.id);
          const selectable = canImport && result.importable;
          return (
            <div key={result.id} className={`rounded-lg border bg-white p-4 shadow-sm ${isSelected ? "border-primary ring-1 ring-primary" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge className="bg-primary/10 text-primary">{result.type}</Badge>
                  <h3 className="mt-2 break-words font-semibold">{result.title}</h3>
                  <p className="mt-1 break-words text-sm text-muted-foreground">{result.subtitle}</p>
                  {result.authors.length ? <p className="mt-1 break-words text-xs text-muted-foreground">{result.authors.join(", ")}</p> : null}
                  {result.type === "Author" ? (
                    <button
                      type="button"
                      className="mt-2 text-sm font-semibold text-primary"
                      onClick={() => {
                        setMode("publication");
                        setQuery(result.title);
                        search("publication", result.title);
                      }}
                    >
                      Find their publications
                    </button>
                  ) : null}
                </div>
                {selectable ? (
                  <button type="button" onClick={() => toggle(result.id)} aria-pressed={isSelected} aria-label={isSelected ? "Deselect publication" : "Select publication"} className="shrink-0 rounded-full p-1 text-primary">
                    {isSelected ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {canImport ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={!selected.length || loading !== null} onClick={importSelected}>
            <Download className="h-4 w-4" /> {loading === "import" ? "Importing..." : `Import ${selected.length || ""} selected to my profile`}
          </Button>
          <Link href="/dashboard/staff" className="text-sm font-semibold text-primary">Back to my dashboard</Link>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Importing is available to academic staff for their own profiles. ICT can import for any staff member from the <Link href="/dashboard/ict#bulk-import" className="font-semibold text-primary">ICT Center</Link>.
        </p>
      )}
      <p className="text-sm text-muted-foreground">Imported records are checked against your name automatically; lower-confidence matches are sent to the ICT verification queue.</p>
    </div>
  );
}
