"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, DatabaseZap, Download, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { callApi } from "@/lib/client-api";

type Candidate = {
  id: string;
  title: string;
  journal: string;
  publicationYear: number;
  doi?: string;
  authors: string[];
  matchedAuthor: string;
  matchScore: number;
  citations: number;
  researchArea: string;
  imported?: boolean;
};

type Status = { tone: "info" | "error" | "success"; text: string } | null;

const toneClass = { info: "text-muted-foreground", error: "text-danger", success: "text-success" };

export function StaffPublicationActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<"all" | "search" | "selected" | string | null>(null);

  function markImported(ids: string[]) {
    const done = new Set(ids);
    setCandidates((current) => current.map((candidate) => (done.has(candidate.id) ? { ...candidate, imported: true } : candidate)));
  }

  async function importAll() {
    setLoading("all");
    setStatus({ tone: "info", text: "Searching your OpenAlex author profile. This can take up to a minute..." });
    const { ok, body } = await callApi<{ imported?: number; message?: string }>("/api/openalex/import", { body: { userId } });
    setLoading(null);
    if (!ok) return setStatus({ tone: "error", text: body.error ?? "Import failed." });
    if (!body.imported) return setStatus({ tone: "info", text: body.message ?? "No new OpenAlex publications were found." });
    setStatus({ tone: "success", text: `Imported ${body.imported} OpenAlex publications.` });
    router.refresh();
  }

  async function searchOpenAlex(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) return setStatus({ tone: "error", text: "Enter a title, keyword, DOI, or name to search." });
    setLoading("search");
    setStatus(null);
    const { ok, body } = await callApi<{ candidates?: Candidate[] }>("/api/openalex/search", { body: { userId, query } });
    setLoading(null);
    const found = ok ? body.candidates ?? [] : [];
    setCandidates(found);
    if (!ok) return setStatus({ tone: "error", text: body.error ?? "OpenAlex search failed." });
    setStatus({
      tone: "info",
      text: found.length
        ? `${found.length} OpenAlex matches found. Add them one by one, or import all of them.`
        : "No OpenAlex works matched your name for that search. Try a title, DOI, or another spelling of your name."
    });
  }

  async function importIds(ids: string[], key: string) {
    setLoading(key);
    setStatus(null);
    const { ok, body } = await callApi<{ imported?: number }>("/api/openalex/import-selected", { body: { userId, ids } });
    setLoading(null);
    if (!ok) return setStatus({ tone: "error", text: body.error ?? "Import failed." });
    markImported(ids);
    setStatus({ tone: "success", text: `Imported ${body.imported ?? ids.length} publication${(body.imported ?? ids.length) === 1 ? "" : "s"}. Your scores have been updated.` });
    router.refresh();
  }

  const pending = candidates.filter((candidate) => !candidate.imported);

  return (
    <div className="space-y-4">
      <Button onClick={importAll} disabled={loading !== null} className="w-full sm:w-auto">
        <DatabaseZap className="h-4 w-4" />
        {loading === "all" ? "Importing..." : "Import My OpenAlex Publications"}
      </Button>
      <form onSubmit={searchOpenAlex} className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, DOI, journal, keyword, or name spelling"
          aria-label="Search OpenAlex"
        />
        <Button disabled={loading !== null}>
          <Search className="h-4 w-4" />
          {loading === "search" ? "Searching..." : "Search OpenAlex"}
        </Button>
      </form>
      {status ? <p role="status" className={`text-sm ${toneClass[status.tone]}`}>{status.text}</p> : null}
      {candidates.length ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{candidates.length} results · {candidates.length - pending.length} already in your profile</p>
            <Button
              className="h-9 px-3"
              disabled={loading !== null || !pending.length}
              onClick={() => importIds(pending.map((candidate) => candidate.id), "selected")}
            >
              <Download className="h-4 w-4" />
              {loading === "selected" ? "Importing..." : pending.length ? `Import all ${pending.length} matches` : "All imported"}
            </Button>
          </div>
          {candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-md border border-border bg-white p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold">{candidate.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {candidate.journal} · {candidate.publicationYear} · {candidate.citations} citations
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Matched author: {candidate.matchedAuthor || "No name match"} · {candidate.matchScore}% confidence
                  </p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">{candidate.authors.slice(0, 6).join(", ")}</p>
                </div>
                {candidate.imported ? (
                  <span className="inline-flex h-9 shrink-0 items-center gap-1 self-start rounded-md bg-success/10 px-3 text-sm font-semibold text-success">
                    <Check className="h-4 w-4" /> Added
                  </span>
                ) : (
                  <Button className="h-9 shrink-0 self-start px-3" disabled={loading !== null} onClick={() => importIds([candidate.id], candidate.id)}>
                    <PlusCircle className="h-4 w-4" />
                    {loading === candidate.id ? "Adding..." : "Add"}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Search and import use OpenAlex only. Imported works are checked against your name; uncertain matches go to the ICT verification queue.
      </p>
    </div>
  );
}
