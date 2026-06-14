import { fetchOpenAlexPublications } from "@/lib/openalex";
import { getSettings, listPublications, listUsers, saveRankings, saveScores, upsertPublication } from "@/lib/repository";
import { calculateScores, calculateStaffRankings } from "@/lib/scoring";
import type { User } from "@/lib/types";

type OpenAlexAuthor = {
  id: string;
  display_name: string;
  works_count: number;
  cited_by_count: number;
  last_known_institution?: { display_name?: string };
  ids?: { orcid?: string };
  topics?: { display_name: string }[];
};

export type DiscoveryResult = {
  status: "matched" | "no_openalex_match";
  confidence: number;
  author?: OpenAlexAuthor;
  publicationsImported: number;
  steps: { label: string; status: "complete" | "needs_review" }[];
};

function textScore(needle?: string, haystack?: string) {
  if (!needle || !haystack) return 0;
  const left = needle.toLowerCase();
  const right = haystack.toLowerCase();
  if (right.includes(left) || left.includes(right)) return 1;
  const shared = left.split(/\s+/).filter((part) => part.length > 2 && right.includes(part)).length;
  return Math.min(0.8, shared / Math.max(1, left.split(/\s+/).length));
}

function matchConfidence(user: User, author: OpenAlexAuthor) {
  const name = textScore(user.fullName, author.display_name) * 45;
  const institution = textScore(user.institution, author.last_known_institution?.display_name) * 20;
  const department = textScore(user.department, author.topics?.map((topic) => topic.display_name).join(" ")) * 10;
  const area = textScore(user.researchArea, author.topics?.map((topic) => topic.display_name).join(" ")) * 15;
  const orcid = user.orcidId && author.ids?.orcid?.toLowerCase().includes(user.orcidId.toLowerCase()) ? 10 : 0;
  return Math.round(name + institution + department + area + orcid);
}

export async function searchOpenAlexAuthors(fullName: string) {
  const params = new URLSearchParams({ search: fullName, per_page: "8" });
  if (process.env.OPENALEX_MAILTO) params.set("mailto", process.env.OPENALEX_MAILTO);
  const response = await fetch(`https://api.openalex.org/authors?${params.toString()}`, { next: { revalidate: 3600 } });
  if (!response.ok) return [];
  const body = (await response.json()) as { results: OpenAlexAuthor[] };
  return body.results ?? [];
}

export async function runAcademicDiscovery(user: User): Promise<DiscoveryResult> {
  const authors = await searchOpenAlexAuthors(user.fullName).catch(() => []);
  const ranked = authors
    .map((author) => ({ author, confidence: matchConfidence(user, author) }))
    .sort((a, b) => b.confidence - a.confidence);
  const best = ranked[0];
  const matched = best && best.confidence >= 55;
  const publications = matched ? await fetchOpenAlexPublications(user.id, user.fullName).catch(() => []) : [];
  await Promise.all(publications.map((publication) => upsertPublication(publication)));
  const [users, allPublications, settings] = await Promise.all([listUsers(), listPublications(), getSettings()]);
  const scores = calculateScores(users, allPublications, settings);
  await saveScores(scores);
  await saveRankings(calculateStaffRankings(users, allPublications, scores));
  return {
    status: matched ? "matched" : "no_openalex_match",
    confidence: best?.confidence ?? 0,
    author: best?.author,
    publicationsImported: publications.length,
    steps: [
      { label: "Discovering Author Profile", status: matched ? "complete" : "needs_review" },
      { label: "Retrieving Publications", status: publications.length ? "complete" : "needs_review" },
      { label: "Analyzing Citations", status: publications.length ? "complete" : "needs_review" },
      { label: "Computing SRS", status: "complete" },
      { label: "Building Dashboard", status: "complete" }
    ]
  };
}
