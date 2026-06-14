"use client";

import { useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Result = {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  confidence?: number;
};

export function ResearchDiscoveryClient() {
  const [mode, setMode] = useState("author");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function search() {
    setLoading(true);
    const response = await fetch(`/api/research-discovery?mode=${encodeURIComponent(mode)}&q=${encodeURIComponent(query)}`);
    const body = await response.json();
    setResults(body.results ?? []);
    setLoading(false);
  }

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-[180px_1fr_auto]">
        <select className="h-10 rounded-md border bg-white px-3 text-sm" value={mode} onChange={(event) => setMode(event.target.value)}>
          <option value="author">Search by Author</option>
          <option value="publication">Search by Publication</option>
          <option value="doi">Search by DOI</option>
          <option value="journal">Search by Journal</option>
          <option value="institution">Search by Institution</option>
        </select>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, title, DOI, journal, institution, keyword" />
        <Button onClick={search} disabled={loading || !query}><Search className="h-4 w-4" /> {loading ? "Searching..." : "Search"}</Button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {["Full Name", "Institution", "Department", "Research Area", "Publication Title", "DOI", "ORCID", "Publication Year", "Keywords"].map((field) => (
          <Input key={field} placeholder={field} />
        ))}
      </div>
      <div className="space-y-3">
        {results.map((result) => (
          <button key={result.id} type="button" onClick={() => toggle(result.id)} className="w-full rounded-lg border bg-white p-4 text-left shadow-sm hover:border-primary">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><Badge className="bg-primary/10 text-primary">{result.type}</Badge>{result.confidence ? <Badge className="bg-emerald-100 text-emerald-800">{result.confidence}% confidence</Badge> : null}</div>
                <h3 className="mt-2 font-semibold">{result.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{result.subtitle}</p>
              </div>
              {selected.includes(result.id) ? <CheckCircle2 className="h-5 w-5 text-success" /> : null}
            </div>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button disabled={!selected.length}>Import Selected Publications</Button>
        <Button className="bg-white text-primary ring-1 ring-border" disabled={!selected.length}>Submit Publication Claim</Button>
      </div>
      <p className="text-sm text-muted-foreground">Claims above the confidence threshold are auto-approved. Lower-confidence claims are sent to the ICT verification queue.</p>
    </div>
  );
}
