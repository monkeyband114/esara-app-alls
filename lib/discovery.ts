import { nameMatchScore, nameTokens } from "@/lib/names";
import { fetchOpenAlexPublications, openAlexGet } from "@/lib/openalex";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";
import { logAudit, upsertPublication } from "@/lib/repository";
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
  const name = (nameMatchScore(user.fullName, author.display_name) / 100) * 45;
  const institution = textScore(user.institution, author.last_known_institution?.display_name) * 20;
  const department = textScore(user.department, author.topics?.map((topic) => topic.display_name).join(" ")) * 10;
  const area = textScore(user.researchArea, author.topics?.map((topic) => topic.display_name).join(" ")) * 15;
  const orcid = user.orcidId && author.ids?.orcid?.toLowerCase().includes(user.orcidId.toLowerCase()) ? 10 : 0;
  return Math.round(name + institution + department + area + orcid);
}

export async function searchOpenAlexAuthors(fullName: string) {
  const term = nameTokens(fullName).join(" ");
  if (!term) return [];
  const body = await openAlexGet<{ results: OpenAlexAuthor[] }>("authors", new URLSearchParams({ search: term, per_page: "8" }));
  return body.results ?? [];
}

export async function runAcademicDiscovery(user: User): Promise<DiscoveryResult> {
  const authors = await searchOpenAlexAuthors(user.fullName).catch(() => []);
  const ranked = authors
    .map((author) => ({ author, confidence: matchConfidence(user, author) }))
    .sort((a, b) => b.confidence - a.confidence);
  const best = ranked[0];
  // An exact name match alone (45) is enough to start importing; each work is still filtered by author-name match.
  const matched = Boolean(best && best.confidence >= 40);
  const publications = matched ? await fetchOpenAlexPublications(user.id, user.fullName).catch(() => []) : [];
  await Promise.all(publications.map((publication) => upsertPublication(publication)));
  await recalculateInstitutionMetrics();
  await logAudit(
    `Signup discovery for ${user.fullName}: ${matched ? `matched OpenAlex author (${best?.confidence}%)` : "no confident OpenAlex match"}, imported ${publications.length} publications`,
    "system"
  );
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
