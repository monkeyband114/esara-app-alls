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

function quartileFromCitations(citations: number): Publication["quartile"] {
  if (citations >= 80) return "Q1";
  if (citations >= 35) return "Q2";
  if (citations >= 12) return "Q3";
  return "Q4";
}

function researchAreaFromWork(work: OpenAlexWork) {
  return work.topics?.[0]?.display_name ?? work.concepts?.[0]?.display_name ?? "OpenAlex Indexed Research";
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function bestAuthorMatch(staffName: string, authors: string[]) {
  const staffTokens = tokens(staffName);
  const staffFull = normalize(staffName);
  let best = { author: "", score: 0 };

  for (const author of authors) {
    const authorFull = normalize(author);
    const authorTokens = tokens(author);
    const shared = staffTokens.filter((token) => authorTokens.includes(token));
    const hasLastName = staffTokens.length > 0 && authorTokens.includes(staffTokens[staffTokens.length - 1]);
    const initialsMatch = staffTokens.some((token) => authorTokens.some((authorToken) => authorToken.startsWith(token[0])));
    const containsFull = staffFull.length > 0 && (authorFull.includes(staffFull) || staffFull.includes(authorFull));
    const tokenScore = staffTokens.length ? (shared.length / staffTokens.length) * 78 : 0;
    const score = Math.min(
      100,
      tokenScore + (hasLastName ? 14 : 0) + (initialsMatch ? 8 : 0) + (containsFull ? 24 : 0)
    );

    if (score > best.score) best = { author, score: Math.round(score) };
  }

  return best;
}

function authorSearchTerms(staffName: string) {
  const parts = tokens(staffName);
  const terms = new Set<string>([staffName]);
  if (parts.length >= 2) {
    terms.add(`${parts[parts.length - 1]} ${parts[0]}`);
    terms.add(`${parts[0]} ${parts[parts.length - 1]}`);
  }
  if (parts.length >= 3) terms.add(`${parts[0]} ${parts[1]} ${parts[parts.length - 1]}`);
  return [...terms].filter((term) => term.trim().length >= 3);
}

async function openAlexGet<T>(path: string, params: URLSearchParams) {
  if (process.env.OPENALEX_MAILTO) params.set("mailto", process.env.OPENALEX_MAILTO);
  const response = await fetch(`https://api.openalex.org/${path}?${params.toString()}`, { next: { revalidate: 86400 } });
  if (!response.ok) throw new Error(`OpenAlex request failed with ${response.status}`);
  return (await response.json()) as T;
}

async function fetchAuthorProfiles(staffName: string) {
  const authors = new Map<string, OpenAlexAuthor>();
  for (const term of authorSearchTerms(staffName)) {
    const params = new URLSearchParams({ search: term, per_page: "6", sort: "cited_by_count:desc" });
    const body = await openAlexGet<{ results: OpenAlexAuthor[] }>("authors", params);
    for (const author of body.results) {
      if (bestAuthorMatch(staffName, [author.display_name]).score >= 45) authors.set(author.id, author);
    }
  }
  return [...authors.values()].slice(0, 6);
}

function workAuthors(work: OpenAlexWork) {
  return work.authorships.map((authorship) => authorship.raw_author_name ?? authorship.author.display_name).filter(Boolean);
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

function uniqueWorks(works: OpenAlexWork[]) {
  return [...new Map(works.map((work) => [work.id, work])).values()];
}

async function searchWorksByAuthors(staffName: string, perAuthor = 25) {
  const works: OpenAlexWork[] = [];
  const authors = await fetchAuthorProfiles(staffName);
  for (const author of authors) {
    const authorId = author.id.replace("https://openalex.org/", "");
    const params = new URLSearchParams({
      filter: `authorships.author.id:${authorId}`,
      per_page: String(perAuthor),
      sort: "cited_by_count:desc"
    });
    const body = await openAlexGet<{ results: OpenAlexWork[] }>("works", params);
    works.push(...body.results);
  }
  return works;
}

async function searchWorksByText(query: string, perPage = 25) {
  const params = new URLSearchParams({ search: query, per_page: String(perPage), sort: "cited_by_count:desc" });
  const body = await openAlexGet<{ results: OpenAlexWork[] }>("works", params);
  return body.results;
}

async function fetchWorkByIdentifier(query: string) {
  const trimmed = query.trim();
  const params = new URLSearchParams({ per_page: "1" });
  if (/^https?:\/\/openalex\.org\/W\d+/i.test(trimmed) || /^W\d+$/i.test(trimmed)) {
    const id = trimmed.replace(/^https?:\/\/openalex\.org\//i, "");
    params.set("filter", `openalex:${id}`);
  } else if (/^10\.\S+\/\S+/i.test(trimmed) || trimmed.includes("doi.org/")) {
    const doi = trimmed.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    params.set("filter", `doi:${doi}`);
  } else {
    return null;
  }
  const body = await openAlexGet<{ results: OpenAlexWork[] }>("works", params);
  return body.results?.[0] ?? null;
}

export async function searchOpenAlexPublicationCandidates(staffName: string, query?: string, limit = 12) {
  const trimmed = query?.trim();
  const works: OpenAlexWork[] = [];

  if (trimmed) {
    const directWork = await fetchWorkByIdentifier(trimmed);
    if (directWork) works.push(directWork);
    works.push(...(await searchWorksByText(`${trimmed} ${staffName}`, 20)));
    works.push(...(await searchWorksByText(trimmed, 20)));
  } else {
    works.push(...(await searchWorksByAuthors(staffName, 30)));
    for (const term of authorSearchTerms(staffName).slice(0, 2)) {
      works.push(...(await searchWorksByText(term, 15)));
    }
  }

  return uniqueWorks(works)
    .map((work) => workToCandidate(work, staffName))
    .filter((candidate) => candidate.matchScore >= 45)
    .sort((a, b) => b.matchScore - a.matchScore || b.citations - a.citations || b.publicationYear - a.publicationYear)
    .slice(0, limit);
}

export async function fetchOpenAlexPublications(userId: string, staffName: string) {
  const candidates = await searchOpenAlexPublicationCandidates(staffName, undefined, 50);
  return candidates
    .filter((candidate) => candidate.matchScore >= 55)
    .map((candidate) =>
      openAlexWorkToPublication(
        {
          id: candidate.id,
          doi: candidate.doi,
          title: candidate.title,
          publication_year: candidate.publicationYear,
          cited_by_count: candidate.citations,
          authorships: candidate.authors.map((author) => ({ author: { display_name: author } })),
          primary_location: { source: { display_name: candidate.journal } },
          topics: [{ display_name: candidate.researchArea }]
        },
        userId,
        staffName
      )
    );
}

function openAlexWorkToPublication(work: OpenAlexWork, userId: string, staffName: string): Publication {
    const citations = work.cited_by_count ?? 0;
    const impactFactor = Math.max(1, Math.round(Math.log10(citations + 10) * 25) / 10);
    return attachVerification(
      {
        id: work.id.replace("https://openalex.org/", "openalex-"),
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

export async function fetchOpenAlexPublication(userId: string, staffName: string, query: string) {
  const trimmed = query.trim();
  const directWork = await fetchWorkByIdentifier(trimmed);
  if (directWork && bestAuthorMatch(staffName, workAuthors(directWork)).score >= 40) {
    return openAlexWorkToPublication(directWork, userId, staffName);
  }

  const candidates = await searchOpenAlexPublicationCandidates(staffName, trimmed, 1);
  const candidate = candidates[0];
  if (!candidate) return null;
  return openAlexWorkToPublication(
    {
      id: candidate.id,
      doi: candidate.doi,
      title: candidate.title,
      publication_year: candidate.publicationYear,
      cited_by_count: candidate.citations,
      authorships: candidate.authors.map((author) => ({ author: { display_name: author } })),
      primary_location: { source: { display_name: candidate.journal } },
      topics: [{ display_name: candidate.researchArea }]
    },
    userId,
    staffName
  );
}
