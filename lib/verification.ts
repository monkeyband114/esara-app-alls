import type { Publication, VerificationStatus } from "@/lib/types";

function levenshtein(a: string, b: string) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
  for (let j = 0; j <= a.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i += 1) {
    for (let j = 1; j <= a.length; j += 1) {
      matrix[i][j] =
        b.charAt(i - 1) === a.charAt(j - 1)
          ? matrix[i - 1][j - 1]
          : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function jaroWinkler(first: string, second: string) {
  if (first === second) return 1;
  const matchDistance = Math.floor(Math.max(first.length, second.length) / 2) - 1;
  const firstMatches = new Array(first.length).fill(false);
  const secondMatches = new Array(second.length).fill(false);
  let matches = 0;
  for (let i = 0; i < first.length; i += 1) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, second.length);
    for (let j = start; j < end; j += 1) {
      if (secondMatches[j] || first[i] !== second[j]) continue;
      firstMatches[i] = true;
      secondMatches[j] = true;
      matches += 1;
      break;
    }
  }
  if (!matches) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < first.length; i += 1) {
    if (!firstMatches[i]) continue;
    while (!secondMatches[k]) k += 1;
    if (first[i] !== second[k]) transpositions += 1;
    k += 1;
  }
  const jaro = (matches / first.length + matches / second.length + (matches - transpositions / 2) / matches) / 3;
  const prefix = [...first].findIndex((char, index) => char !== second[index]);
  return jaro + Math.min(prefix === -1 ? 4 : prefix, 4) * 0.1 * (1 - jaro);
}

function normalize(name: string) {
  return name.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
}

export function verifyAuthorName(staffName: string, authors: string[]) {
  const target = normalize(staffName);
  const best = Math.max(
    ...authors.map((author) => {
      const candidate = normalize(author);
      const lev = 1 - levenshtein(target, candidate) / Math.max(target.length, candidate.length, 1);
      const jw = jaroWinkler(target, candidate);
      return Math.round(((lev * 0.45 + jw * 0.55) * 100 + Number.EPSILON) * 100) / 100;
    }),
    0
  );
  const verificationStatus: VerificationStatus = best >= 95 ? "VERIFIED" : best >= 80 ? "LIKELY_MATCH" : "MANUAL_REVIEW";
  return { verificationScore: best, verificationStatus };
}

export function attachVerification(publication: Publication, staffName: string): Publication {
  return { ...publication, ...verifyAuthorName(staffName, publication.authors) };
}
