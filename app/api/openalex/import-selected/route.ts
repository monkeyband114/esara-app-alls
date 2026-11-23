import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-error";
import { fetchOpenAlexPublicationsByIds } from "@/lib/openalex";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";
import { logAudit, savePublications } from "@/lib/repository";
import { requireApiUser, resolveTargetStaff } from "@/lib/session";

export const maxDuration = 60;

const bodySchema = z.object({
  userId: z.string().optional(),
  ids: z.array(z.string().trim().min(1)).min(1, "Choose at least one publication.").max(100, "Import at most 100 publications at a time.")
});

/** Imports the exact OpenAlex works (ids or DOIs) the user picked from search results or pasted in. */
export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid request." }, { status: 400 });
    const resolved = await resolveTargetStaff(auth.user, parsed.data.userId);
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    const { target } = resolved;

    const publications = await savePublications(await fetchOpenAlexPublicationsByIds(target.id, target.fullName, parsed.data.ids));
    if (!publications.length) return NextResponse.json({ error: "None of those publications were found in OpenAlex." }, { status: 404 });
    await recalculateInstitutionMetrics();
    await logAudit(`Imported ${publications.length} selected OpenAlex publications for ${target.fullName}`, auth.user.id);
    return NextResponse.json({ imported: publications.length, notFound: parsed.data.ids.length - publications.length });
  } catch (error) {
    return apiErrorResponse(error, "Import failed.");
  }
}
