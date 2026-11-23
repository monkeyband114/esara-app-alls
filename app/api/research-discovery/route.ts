import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { fetchWorksByIdentifiers, openAlexGet, WORK_FIELDS } from "@/lib/openalex";
import { requireApiUser } from "@/lib/session";

export const maxDuration = 30;

const ENDPOINTS = { author: "authors", publication: "works", doi: "works", journal: "sources", institution: "institutions" } as const;
type Endpoint = (typeof ENDPOINTS)[keyof typeof ENDPOINTS];

type Entity = {
  id: string;
  title?: string;
  display_name?: string;
  publication_year?: number;
  cited_by_count?: number;
  works_count?: number;
  country_code?: string;
  host_organization_name?: string;
  last_known_institution?: { display_name?: string };
  last_known_institutions?: { display_name?: string }[];
  primary_location?: { source?: { display_name?: string } };
  authorships?: { author: { display_name: string }; raw_author_name?: string }[];
};

function mapResult(entity: Entity, endpoint: Endpoint) {
  const name = entity.title ?? entity.display_name ?? "Untitled result";
  if (endpoint === "works") {
    return {
      id: entity.id,
      title: name,
      subtitle: `${entity.primary_location?.source?.display_name ?? "Unknown venue"} · ${entity.publication_year ?? "n.d."} · ${entity.cited_by_count ?? 0} citations`,
      authors: (entity.authorships ?? []).slice(0, 6).map((item) => item.raw_author_name ?? item.author.display_name),
      type: "Publication",
      importable: true
    };
  }
  const counts = `${entity.works_count ?? 0} works · ${entity.cited_by_count ?? 0} citations`;
  const context =
    endpoint === "authors"
      ? entity.last_known_institutions?.[0]?.display_name ?? entity.last_known_institution?.display_name ?? "Institution unknown"
      : endpoint === "sources"
        ? entity.host_organization_name ?? "Publisher unknown"
        : entity.country_code ?? "Country unknown";
  const type = endpoint === "authors" ? "Author" : endpoint === "sources" ? "Journal" : "Institution";
  return { id: entity.id, title: name, subtitle: `${context} · ${counts}`, authors: [] as string[], type, importable: false };
}

export async function GET(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get("mode") ?? "author") as keyof typeof ENDPOINTS;
    const query = (searchParams.get("q") ?? "").trim();
    const endpoint = ENDPOINTS[mode] ?? "authors";
    if (!query) return NextResponse.json({ results: [] });

    if (mode === "doi") {
      const works = await fetchWorksByIdentifiers([query]);
      if (!works.length) return NextResponse.json({ results: [], error: "No OpenAlex publication has that DOI. Use the format 10.xxxx/yyyy." });
      return NextResponse.json({ results: works.map((work) => mapResult(work as Entity, "works")) });
    }

    const params = new URLSearchParams({ search: query, per_page: "15" });
    if (endpoint === "works") params.set("select", WORK_FIELDS);
    const body = await openAlexGet<{ results: Entity[] }>(endpoint, params);
    return NextResponse.json({ results: (body.results ?? []).map((entity) => mapResult(entity, endpoint)) });
  } catch (error) {
    return apiErrorResponse(error, "OpenAlex search is unavailable right now. Please try again shortly.");
  }
}
