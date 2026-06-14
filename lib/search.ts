import { listPublications, listUsers } from "@/lib/repository";

export async function globalSearch(query: string) {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return [];
  const [users, publications] = await Promise.all([listUsers(), listPublications()]);
  return [
    ...users
      .filter((user) => [user.fullName, user.email, user.department, user.faculty].some((field) => field.toLowerCase().includes(normalized)))
      .map((user) => ({ type: "Staff", title: user.fullName, subtitle: `${user.department} · ${user.email}` })),
    ...publications
      .filter((publication) => [publication.title, publication.journal, ...publication.authors].some((field) => field.toLowerCase().includes(normalized)))
      .map((publication) => ({ type: "Publication", title: publication.title, subtitle: `${publication.journal} · ${publication.publicationYear}` }))
  ].slice(0, 20);
}
