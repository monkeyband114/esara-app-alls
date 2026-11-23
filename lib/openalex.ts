import { readNonEmptyEnv } from "@/lib/env";
import { nameMatchScore, nameTokens } from "@/lib/names";
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
  authorships: { author: { id?: string; display_name: string }; raw_author_name?: string }[];
  primary_location?: { source?: { display_name?: string; host_organization_lineage_names?: string[]; type?: string } };
  type_crossref?: string;
};

type OpenAlexAuthor = {
  id: string;
  display_name: string;
  works_count?: number;
  cited_by_count?: number;
};

export type OpenAlexPublicationCandidate = {
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

/** Minimum author-name match for a work to be shown as a candidate. */
export const MATCH_THRESHOLD_DISPLAY = 50;
/** Minimum author-name match for "Import My OpenAlex Publications" to save a work without the user picking it. */
export const MATCH_THRESHOLD_AUTO_IMPORT = 60;
const MAX_IDS_PER_REQUEST = 50;
// Only the fields ESARA uses. Full work records (abstracts etc.) are ~100 KB each, which made a 25-result search
// 2.5 MB: slow, and too large for Next's 2 MB fetch cache.
export const WORK_FIELDS = "id,doi,title,publication_year,cited_by_count,topics,authorships,primary_location,type_crossref";

function worksParams(params: Record<string, string>) {
  return new URLSearchParams({ ...params, select: WORK_FIELDS });
}

export class OpenAlexError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "OpenAlexError";
  }
}

const MAX_RATE_LIMIT_RETRIES = 1;
const MAX_RETRY_WAIT_MS = 15_000;

function retryDelayMs(response: Response) {
  const seconds = Number(response.headers.get("retry-after"));
  return Math.min((Number.isFinite(seconds) && seconds > 0 ? seconds : 2) * 1000, MAX_RETRY_WAIT_MS);
}

export async function openAlexGet<T>(path: string, params: URLSearchParams) {
  const mailto = readNonEmptyEnv("OPENALEX_MAILTO");
  const apiKey = readNonEmptyEnv("OPENALEX_API_KEY");
  if (mailto) params.set("mailto", mailto);
  if (apiKey) params.set("api_key", apiKey);
  const url = `https://api.openalex.org/${path}?${params.toString()}`;

  for (let attempt = 0; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, { next: { revalidate: 86400 } });
    } catch {
      throw new OpenAlexError("Could not reach OpenAlex. Check your internet connection and try again.", 502);
    }

    if (response.ok) return (await response.json()) as T;

    if (response.status === 429) {
      if (attempt < MAX_RATE_LIMIT_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs(response)));
        continue;
      }
      if (!apiKey) console.warn("[openalex] Rate limited. Set OPENALEX_API_KEY (free at https://openalex.org/settings/api) for a dedicated quota.");
      throw new OpenAlexError("OpenAlex is limiting requests right now. Please wait a minute and try again.", 429);
    }

    throw new OpenAlexError(`OpenAlex request failed (HTTP ${response.status}). Please try again later.`, 502);
  }
}

function quartileFromCitations(citations: number): Publication["quartile"] {
  if (citations >= 80) return "Q1";
  if (citations >= 35) return "Q2";
  if (citations >= 12) return "Q3";
  return "Q4";
}

function researchAreaFromWork(work: OpenAlexWork) {
  return work.topics?.[0]?.display_name ?? work.concepts?.[0]?.display_name ?? "OpenAlex Indexed Research";
}

function workAuthors(work: OpenAlexWork) {
  return (work.authorships ?? []).map((authorship) => authorship.raw_author_name ?? authorship.author.display_name).filter(Boolean);
}

function bestAuthorMatch(staffName: string, authors: string[]) {
  let best = { author: "", score: 0 };
  for (const author of authors) {
    const score = nameMatchScore(staffName, author);
    if (score > best.score) best = { author, score };
  }
  return best;
}

/** Search terms for a staff name, without titles such as "Dr" (OpenAlex returns nothing for "Dr Patrick Ejeh"). */
function authorSearchTerms(staffName: string) {
  const parts = nameTokens(staffName);
  const terms = new Set<string>();
  if (parts.length) terms.add(parts.join(" "));
  if (parts.length >= 3) terms.add(`${parts[0]} ${parts[parts.length - 1]}`);
  return [...terms].filter((term) => term.length >= 3);
}

function workKey(workId: string) {
  return workId.replace(/^https?:\/\/openalex\.org\//i, "");
}

/** Publications are stored per staff member, so co-authors can each hold the same OpenAlex work. */
export function publicationId(userId: string, workId: string) {
  return `${userId}:openalex-${workKey(workId)}`;
}

/** Id format used before records were stored per staff member (one record per work, shared by co-authors). */
export function legacyPublicationId(workId: string) {
  return `openalex-${workKey(workId)}`;
}

function parseIdentifier(value: string): { kind: "openalex" | "doi"; value: string } | null {
  const trimmed = value.trim();
  const openAlex = trimmed.match(/^(?:https?:\/\/openalex\.org\/)?(W\d+)$/i);
  if (openAlex) return { kind: "openalex", value: openAlex[1].toUpperCase() };
  const doi = trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
  if (/^10\.\d{4,9}\/\S+$/i.test(doi)) return { kind: "doi", value: doi.toLowerCase() };
  return null;
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

/** Fetches works by OpenAlex ids (W123, https://openalex.org/W123) or DOIs, up to 50 per request. */
export async function fetchWorksByIdentifiers(identifiers: string[]) {
  const parsed = identifiers.map(parseIdentifier).filter((item): item is NonNullable<typeof item> => item !== null);
  const groups = {
    openalex: [...new Set(parsed.filter((item) => item.kind === "openalex").map((item) => item.value))],
    doi: [...new Set(parsed.filter((item) => item.kind === "doi").map((item) => item.value))]
  };
  const requests = (Object.keys(groups) as Array<keyof typeof groups>).flatMap((kind) =>
    chunk(groups[kind], MAX_IDS_PER_REQUEST).map((values) =>
      openAlexGet<{ results: OpenAlexWork[] }>("works", worksParams({ filter: `${kind}:${values.join("|")}`, per_page: String(MAX_IDS_PER_REQUEST) }))
    )
  );
  const bodies = await Promise.all(requests);
  return uniqueWorks(bodies.flatMap((body) => body.results ?? []));
}

/**
 * OpenAlex author profiles found by searching `terms` that plausibly belong to the staff member
 * (their display name must match the staff name, so a search for "Akazue Maureen" finds "Dr Akazwe Maureen").
 */
async function fetchAuthorProfiles(staffName: string, terms = authorSearchTerms(staffName)) {
  const bodies = await Promise.all(
    terms.map((term) => openAlexGet<{ results: OpenAlexAuthor[] }>("authors", new URLSearchParams({ search: term, per_page: "10", sort: "works_count:desc" })))
  );
  const authors = new Map<string, OpenAlexAuthor>();
  for (const author of bodies.flatMap((body) => body.results ?? [])) {
    if (nameMatchScore(staffName, author.display_name) >= MATCH_THRESHOLD_AUTO_IMPORT) authors.set(author.id, author);
  }
  return [...authors.values()].sort((a, b) => (b.works_count ?? 0) - (a.works_count ?? 0)).slice(0, 5);
}

async function searchWorksByAuthors(staffName: string, perPage = 100, terms?: string[]) {
  const authors = await fetchAuthorProfiles(staffName, terms);
  if (!authors.length) return [];
  const ids = authors.map((author) => workKey(author.id)).join("|");
  const body = await openAlexGet<{ results: OpenAlexWork[] }>(
    "works",
    worksParams({ filter: `authorships.author.id:${ids}`, per_page: String(perPage), sort: "cited_by_count:desc" })
  );
  return body.results ?? [];
}

async function searchWorksByText(query: string, perPage = 25) {
  const body = await openAlexGet<{ results: OpenAlexWork[] }>("works", worksParams({ search: query, per_page: String(perPage), sort: "cited_by_count:desc" }));
  return body.results ?? [];
}

function uniqueWorks(works: OpenAlexWork[]) {
  return [...new Map(works.map((work) => [work.id, work])).values()];
}

function workToCandidate(work: OpenAlexWork, staffName: string): OpenAlexPublicationCandidate {
  const authors = workAuthors(work);
  const match = bestAuthorMatch(staffName, authors);
  return {
    id: work.id,
    title: work.title,
    journal: work.primary_location?.source?.display_name ?? "Unindexed OpenAlex venue",
    publicationYear: work.publication_year,
    doi: work.doi,
    authors,
    matchedAuthor: match.author,
    matchScore: match.score,
    citations: work.cited_by_count ?? 0,
    researchArea: researchAreaFromWork(work)
  };
}

function rankCandidates(candidates: OpenAlexPublicationCandidate[]) {
  return candidates.sort((a, b) => b.matchScore - a.matchScore || b.citations - a.citations || b.publicationYear - a.publicationYear);
}

/**
 * Finds OpenAlex works for a staff member. With a query (title, keyword, DOI, OpenAlex id) the query is searched;
 * without one, the staff member's OpenAlex author profiles are used.
 */
async function collectWorks(staffName: string, query?: string) {
  const trimmed = query?.trim();
  const cleanName = nameTokens(staffName).join(" ");

  if (trimmed) {
    if (parseIdentifier(trimmed)) {
      const byId = await fetchWorksByIdentifiers([trimmed]);
      return { works: byId, directIds: new Set(byId.map((work) => work.id)) };
    }
    // The query may be a title/keyword, or the staff member's name as OpenAlex spells it; try both.
    const [byAuthorName, withName, plain] = await Promise.all([
      searchWorksByAuthors(staffName, 50, [trimmed]),
      searchWorksByText(`${trimmed} ${cleanName}`.trim(), 25),
      searchWorksByText(trimmed, 25)
    ]);
    return { works: uniqueWorks([...byAuthorName, ...withName, ...plain]), directIds: new Set<string>() };
  }

  const [byAuthor, byName] = await Promise.all([searchWorksByAuthors(staffName, 100), cleanName ? searchWorksByText(cleanName, 25) : Promise.resolve([])]);
  return { works: uniqueWorks([...byAuthor, ...byName]), directIds: new Set<string>() };
}

export async function searchOpenAlexPublicationCandidates(staffName: string, query?: string, limit = 12) {
  const { works, directIds } = await collectWorks(staffName, query);
  return rankCandidates(
    works
      .map((work) => workToCandidate(work, staffName))
      // A work looked up by its exact DOI/OpenAlex id is always shown; ICT verification handles weak name matches.
      .filter((candidate) => candidate.matchScore >= MATCH_THRESHOLD_DISPLAY || directIds.has(candidate.id))
  ).slice(0, limit);
}

function openAlexWorkToPublication(work: OpenAlexWork, userId: string, staffName: string): Publication {
  const citations = work.cited_by_count ?? 0;
  const impactFactor = Math.max(1, Math.round(Math.log10(citations + 10) * 25) / 10);
  return attachVerification(
    {
      id: publicationId(userId, work.id),
      userId,
      title: work.title,
      authors: workAuthors(work),
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

/** "Import My OpenAlex Publications": every work on the staff member's matching OpenAlex author profiles. */
export async function fetchOpenAlexPublications(userId: string, staffName: string) {
  const { works } = await collectWorks(staffName);
  return works
    .filter((work) => bestAuthorMatch(staffName, workAuthors(work)).score >= MATCH_THRESHOLD_AUTO_IMPORT)
    .map((work) => openAlexWorkToPublication(work, userId, staffName));
}

/** Imports the exact works a user picked (OpenAlex ids or DOIs). */
export async function fetchOpenAlexPublicationsByIds(userId: string, staffName: string, identifiers: string[]) {
  if (!identifiers.length) return [];
  const works = await fetchWorksByIdentifiers(identifiers);
  return works.map((work) => openAlexWorkToPublication(work, userId, staffName));
}

/** Imports one work from a DOI, OpenAlex id, or title/keyword search (best match). */
export async function fetchOpenAlexPublication(userId: string, staffName: string, query: string) {
  if (parseIdentifier(query)) return (await fetchOpenAlexPublicationsByIds(userId, staffName, [query]))[0] ?? null;
  const [best] = await searchOpenAlexPublicationCandidates(staffName, query, 1);
  return best ? (await fetchOpenAlexPublicationsByIds(userId, staffName, [best.id]))[0] ?? null : null;
}
