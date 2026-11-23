import { listPublications, listUsers } from "@/lib/repository";

export type SearchResult = { type: "Staff" | "Publication"; title: string; subtitle: string; href?: string };

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  const [users, publications] = await Promise.all([listUsers(), listPublications()]);
  const names = new Map(users.map((user) => [user.id, user.fullName]));
  const staff: SearchResult[] = users
    .filter((user) => [user.fullName, user.email, user.department, user.faculty].some((field) => field?.toLowerCase().includes(normalized)))
    .map((user) => ({
      type: "Staff",
      title: user.fullName,
      subtitle: `${user.department} · ${user.email}`,
      href: user.role === "ACADEMIC_STAFF" ? `/dashboard/staff/${user.id}` : undefined
    }));
  const works: SearchResult[] = publications
    .filter((publication) => [publication.title, publication.journal, ...publication.authors].some((field) => field?.toLowerCase().includes(normalized)))
    .map((publication) => ({
      type: "Publication",
      title: publication.title,
      subtitle: `${publication.journal} · ${publication.publicationYear} · ${names.get(publication.userId) ?? "Unknown staff"}`,
      href: `/dashboard/staff/${publication.userId}`
    }));
  return [...staff, ...works].slice(0, 50);
}
