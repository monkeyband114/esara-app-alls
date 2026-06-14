import type { Publication } from "@/lib/types";
import { attachVerification } from "@/lib/verification";

type OpenAlexWork = {
  id: string;
  doi?: string;
  title: string;
  publication_year: number;
  cited_by_count: number;
  concepts?: { display_name: string; score: number }[];
  topics?: { display_name: string; score?: number }[];
  authorships: { author: { display_name: string } }[];
  primary_location?: { source?: { display_name?: string; host_organization_lineage_names?: string[] } };
  type_crossref?: string;
};

function quartileFromCitations(citations: number): Publication["quartile"] {
  if (citations >= 80) return "Q1";
  if (citations >= 35) return "Q2";
  if (citations >= 12) return "Q3";
  return "Q4";
}

function researchAreaFromWork(work: OpenAlexWork) {
  return work.topics?.[0]?.display_name ?? work.concepts?.[0]?.display_name ?? "OpenAlex Indexed Research";
}

export async function fetchOpenAlexPublications(userId: string, staffName: string) {
  const params = new URLSearchParams({
    search: staffName,
    per_page: "50",
    sort: "cited_by_count:desc"
  });
  if (process.env.OPENALEX_MAILTO) params.set("mailto", process.env.OPENALEX_MAILTO);
  const response = await fetch(`https://api.openalex.org/works?${params.toString()}`, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`OpenAlex request failed with ${response.status}`);
  const body = (await response.json()) as { results: OpenAlexWork[] };

  return body.results.map((work): Publication => {
    return openAlexWorkToPublication(work, userId, staffName);
  });
}

function openAlexWorkToPublication(work: OpenAlexWork, userId: string, staffName: string): Publication {
    const citations = work.cited_by_count ?? 0;
    const impactFactor = Math.max(1, Math.round(Math.log10(citations + 10) * 25) / 10);
    return attachVerification(
      {
        id: work.id.replace("https://openalex.org/", "openalex-"),
        userId,
        title: work.title,
        authors: work.authorships.map((authorship) => authorship.author.display_name),
        journal: work.primary_location?.source?.display_name ?? "Unindexed OpenAlex venue",
        publicationYear: work.publication_year,
        doi: work.doi ?? work.id,
        category: work.type_crossref ?? "OpenAlex Work",
        researchArea: researchAreaFromWork(work),
        citations,
        hContribution: citations > 0 ? 1 : 0,
        quartile: quartileFromCitations(citations),
        impactFactor,
        impactScore: Number((impactFactor * (citations / 25 + 1)).toFixed(2)),
        source: "openalex",
        verificationStatus: "MANUAL_REVIEW",
        verificationScore: 0
      },
      staffName
    );
}

export async function fetchOpenAlexPublication(userId: string, staffName: string, query: string) {
  const trimmed = query.trim();
  const params = new URLSearchParams({ per_page: "1", sort: "cited_by_count:desc" });
  if (process.env.OPENALEX_MAILTO) params.set("mailto", process.env.OPENALEX_MAILTO);
  if (/^10\.\S+\/\S+/i.test(trimmed) || trimmed.includes("doi.org/")) {
    const doi = trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    params.set("filter", `doi:${doi}`);
  } else {
    params.set("search", trimmed);
  }
  const response = await fetch(`https://api.openalex.org/works?${params.toString()}`, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`OpenAlex request failed with ${response.status}`);
  const body = (await response.json()) as { results: OpenAlexWork[] };
  const work = body.results?.[0];
  return work ? openAlexWorkToPublication(work, userId, staffName) : null;
}
