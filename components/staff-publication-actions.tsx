"use client";

import { useState } from "react";
import { DatabaseZap, PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
};

export function StaffPublicationActions({ userId }: { userId: string }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<"all" | "search" | string | null>(null);

  async function importAll() {
    setLoading("all");
    setMessage("");
    const response = await fetch("/api/openalex/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    const body = await response.json();
    setLoading(null);
    setMessage(response.ok ? `Imported ${body.imported} OpenAlex publications. Refreshing...` : body.error ?? "Import failed.");
    if (response.ok) window.location.reload();
  }

  async function searchOpenAlex(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("search");
    setMessage("");
    const response = await fetch("/api/openalex/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, query })
    });
    const body = await response.json();
    setLoading(null);
    setCandidates(response.ok ? body.candidates ?? [] : []);
    setMessage(response.ok ? `${body.candidates?.length ?? 0} OpenAlex matches found.` : body.error ?? "OpenAlex search failed.");
  }

  async function importCandidate(candidate: Candidate) {
    setLoading(candidate.id);
    setMessage("");
    const response = await fetch("/api/openalex/import-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, query: candidate.id })
    });
    const body = await response.json();
    setLoading(null);
    setMessage(response.ok ? "Added OpenAlex publication. Refreshing..." : body.error ?? "Publication was not found in OpenAlex.");
    if (response.ok) window.location.reload();
  }

  return (
    <div className="space-y-4">
      <Button onClick={importAll} disabled={loading !== null}>
        <DatabaseZap className="h-4 w-4" />
        {loading === "all" ? "Importing..." : "Import My OpenAlex Publications"}
      </Button>
      <form onSubmit={searchOpenAlex} className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search author name, partial name, title, DOI, journal, or keyword"
        />
        <Button disabled={loading !== null}>
          <Search className="h-4 w-4" />
          {loading === "search" ? "Searching..." : "Search OpenAlex"}
        </Button>
      </form>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {candidates.length ? (
        <div className="space-y-2">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-md border border-border bg-white p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{candidate.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {candidate.journal} - {candidate.publicationYear} - {candidate.citations} citations
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Matched author: {candidate.matchedAuthor || "Unknown"} - {candidate.matchScore}% confidence
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{candidate.authors.slice(0, 6).join(", ")}</p>
                </div>
                <Button className="h-9 px-3" disabled={loading !== null} onClick={() => importCandidate(candidate)}>
                  <PlusCircle className="h-4 w-4" />
                  {loading === candidate.id ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">Search and import use OpenAlex only; ESARA filters results by the staff name or partial author-name match before saving.</p>
    </div>
  );
}
