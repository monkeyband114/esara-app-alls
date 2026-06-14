import { NextResponse } from "next/server";

function mapWork(work: {
  id: string;
  title?: string;
  display_name?: string;
  publication_year?: number;
  cited_by_count?: number;
  works_count?: number;
  last_known_institution?: { display_name?: string };
  primary_location?: { source?: { display_name?: string } };
}) {
  return {
    id: work.id,
    title: work.title ?? work.display_name ?? "Untitled result",
    subtitle: work.title
      ? `${work.primary_location?.source?.display_name ?? "Unknown venue"} · ${work.publication_year ?? "n.d."} · ${work.cited_by_count ?? 0} citations`
      : `${work.last_known_institution?.display_name ?? "Institution unknown"} · ${work.works_count ?? 0} works`,
    type: work.title ? "Publication" : "Author",
    confidence: work.display_name ? 82 : undefined
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "author";
  const query = searchParams.get("q") ?? "";
  if (!query.trim()) return NextResponse.json({ results: [] });
  const params = new URLSearchParams({ search: query, per_page: "10" });
  if (process.env.OPENALEX_MAILTO) params.set("mailto", process.env.OPENALEX_MAILTO);
  const endpoint = mode === "author" ? "authors" : mode === "institution" ? "institutions" : mode === "journal" ? "sources" : "works";
  if (mode === "doi") {
    params.delete("search");
    params.set("filter", `doi:${query}`);
  }
  try {
    const response = await fetch(`https://api.openalex.org/${endpoint}?${params.toString()}`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("OpenAlex search failed.");
    const body = await response.json();
    return NextResponse.json({ results: (body.results ?? []).map(mapWork) });
  } catch {
    return NextResponse.json({
      results: [],
      error: "OpenAlex search is unavailable. ESARA is configured to use OpenAlex only, so no fallback records were generated."
    });
  }
}
