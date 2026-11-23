import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { stripTitles } from "@/lib/names";
import { fetchOpenAlexPublications } from "@/lib/openalex";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";
import { logAudit, savePublications } from "@/lib/repository";
import { requireApiUser, resolveTargetStaff } from "@/lib/session";

export const maxDuration = 60;

/** Imports every work on the staff member's matching OpenAlex author profiles. */
export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { userId } = (await request.json().catch(() => ({}))) as { userId?: string };
    const resolved = await resolveTargetStaff(auth.user, userId);
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    const { target } = resolved;

    const publications = await savePublications(await fetchOpenAlexPublications(target.id, target.fullName));
    await recalculateInstitutionMetrics();
    await logAudit(`Imported ${publications.length} publications for ${target.fullName}`, auth.user.id);
    return NextResponse.json({
      imported: publications.length,
      message: publications.length
        ? undefined
        : `OpenAlex has no author profile that clearly matches "${stripTitles(target.fullName)}". Search by a title, keyword, DOI, or another spelling of the name, then import the results.`
    });
  } catch (error) {
    return apiErrorResponse(error, "Import failed.");
  }
}
