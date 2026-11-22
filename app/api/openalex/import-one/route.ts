import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { fetchOpenAlexPublication } from "@/lib/openalex";
import { getUser, logAudit, upsertPublication } from "@/lib/repository";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";

export async function POST(request: Request) {
  try {
    const { userId, query } = (await request.json()) as { userId: string; query: string };
    if (!query?.trim()) return NextResponse.json({ error: "Enter a DOI, OpenAlex title, or publication title." }, { status: 400 });
    const user = await getUser(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    const publication = await fetchOpenAlexPublication(user.id, user.fullName, query);
    if (!publication) return NextResponse.json({ error: "No matching OpenAlex publication found." }, { status: 404 });
    await upsertPublication(publication);
    await recalculateInstitutionMetrics();
    await logAudit(`Added OpenAlex publication for ${user.fullName}: ${publication.title}`, user.id);
    return NextResponse.json({ imported: 1, publication });
  } catch (error) {
    return apiErrorResponse(error, "Publication import failed.");
  }
}
