import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { fetchOpenAlexPublication } from "@/lib/openalex";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";
import { logAudit, upsertPublication } from "@/lib/repository";
import { requireApiUser, resolveTargetStaff } from "@/lib/session";

export const maxDuration = 60;

/** Imports one work by DOI, OpenAlex id, or best title/keyword match. */
export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { userId, query } = (await request.json().catch(() => ({}))) as { userId?: string; query?: string };
    if (!query?.trim()) return NextResponse.json({ error: "Enter a DOI, OpenAlex title, or publication title." }, { status: 400 });
    const resolved = await resolveTargetStaff(auth.user, userId);
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    const { target } = resolved;

    const found = await fetchOpenAlexPublication(target.id, target.fullName, query);
    if (!found) return NextResponse.json({ error: "No matching OpenAlex publication found." }, { status: 404 });
    const publication = await upsertPublication(found);
    await recalculateInstitutionMetrics();
    await logAudit(`Added OpenAlex publication for ${target.fullName}: ${publication.title}`, auth.user.id);
    return NextResponse.json({ imported: 1, publication });
  } catch (error) {
    return apiErrorResponse(error, "Publication import failed.");
  }
}
