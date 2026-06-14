import { NextResponse } from "next/server";
import { fetchOpenAlexPublications } from "@/lib/openalex";
import { getUser, logAudit, upsertPublication } from "@/lib/repository";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";

export async function POST(request: Request) {
  const { userId } = (await request.json()) as { userId: string };
  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const publications = await fetchOpenAlexPublications(user.id, user.fullName);
  await Promise.all(publications.map((publication) => upsertPublication(publication)));
  await recalculateInstitutionMetrics();
  await logAudit(`Imported ${publications.length} publications for ${user.fullName}`, "system");
  return NextResponse.json({ imported: publications.length, publications });
}
