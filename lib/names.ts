// Shared name handling for OpenAlex search and author matching.
// Stored staff names often carry honorifics ("Dr Patrick Ejeh"), which OpenAlex never indexes,
// so they must be removed before searching or comparing names.

const TITLES = new Set([
  "dr", "doctor", "prof", "professor", "mr", "mrs", "ms", "miss", "mx", "engr", "eng", "rev", "sir", "dame",
  "assoc", "associate", "asst", "assistant", "phd", "msc", "mphil", "bsc", "jr", "sr", "chief", "hon"
]);

export function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Name tokens without honorifics. Single letters (initials) are kept only when `keepInitials` is set. */
export function nameTokens(value: string, keepInitials = false) {
  return normalizeName(value)
    .split(" ")
    .filter((token) => token && !TITLES.has(token) && (keepInitials || token.length > 1));
}

/** "Dr Patrick Ejeh" -> "Patrick Ejeh" */
export function stripTitles(value: string) {
  return nameTokens(value, true).map((token) => token[0].toUpperCase() + token.slice(1)).join(" ");
}

function withinOneEdit(a: string, b: string) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
      continue;
    }
    edits += 1;
    if (edits > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else {
      i += 1;
      j += 1;
    }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

/**
 * Scores how well an author name matches a staff name (0-100), ignoring word order and titles.
 * A full or near-identical token (one typo, e.g. "Akazwe"/"Akazue") counts fully; an initial counts half.
 * At least one full-token match plus enough other evidence is required, so a shared first name alone scores 0.
 */
export function nameMatchScore(staffName: string, authorName: string) {
  const staff = nameTokens(staffName);
  const author = nameTokens(authorName, true);
  if (!staff.length || !author.length) return 0;

  const used = new Set<number>();
  let full = 0;
  let initials = 0;
  for (const token of staff) {
    const exact = author.findIndex((candidate, index) => !used.has(index) && candidate.length > 1 && candidate === token);
    const fuzzy = exact >= 0 ? exact : author.findIndex((candidate, index) => !used.has(index) && candidate.length >= 5 && token.length >= 5 && withinOneEdit(candidate, token));
    if (fuzzy >= 0) {
      used.add(fuzzy);
      full += exact >= 0 ? 1 : 0.9;
      continue;
    }
    const initial = author.findIndex((candidate, index) => !used.has(index) && candidate.length === 1 && candidate === token[0]);
    if (initial >= 0) {
      used.add(initial);
      initials += 1;
    }
  }

  const needed = Math.min(2, staff.length);
  const evidence = Math.ceil(full) + initials;
  if (full < 0.9 || evidence < needed) return 0;
  return Math.round(Math.min(100, ((full + initials * 0.5) / staff.length) * 100));
}
