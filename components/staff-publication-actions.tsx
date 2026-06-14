"use client";

import { useState } from "react";
import { DatabaseZap, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StaffPublicationActions({ userId }: { userId: string }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<"all" | "one" | null>(null);

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

  async function importOne(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("one");
    setMessage("");
    const response = await fetch("/api/openalex/import-one", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, query })
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
      <form onSubmit={importOne} className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Paste DOI or publication title from OpenAlex" />
        <Button disabled={loading !== null || !query.trim()}>
          <PlusCircle className="h-4 w-4" />
          {loading === "one" ? "Adding..." : "Add Publication"}
        </Button>
      </form>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <p className="text-xs text-muted-foreground">Manual add still uses OpenAlex only; ESARA does not create custom or AI-generated publication records.</p>
    </div>
  );
}
