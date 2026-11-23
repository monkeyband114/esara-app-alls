import { NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { legacyPublicationId, publicationId, searchOpenAlexPublicationCandidates } from "@/lib/openalex";
import { listPublications } from "@/lib/repository";
import { requireApiUser, resolveTargetStaff } from "@/lib/session";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const auth = await requireApiUser();
    if (auth.response) return auth.response;
    const { userId, query } = (await request.json()) as { userId?: string; query?: string };
    const resolved = await resolveTargetStaff(auth.user, userId);
    if ("error" in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    const { target } = resolved;

    const [candidates, existing] = await Promise.all([searchOpenAlexPublicationCandidates(target.fullName, query, 50), listPublications(target.id)]);
    const owned = new Set(existing.map((publication) => publication.id));
    return NextResponse.json({
      candidates: candidates.map((candidate) => ({
        ...candidate,
        imported: owned.has(publicationId(target.id, candidate.id)) || owned.has(legacyPublicationId(candidate.id))
      }))
    });
  } catch (error) {
    return apiErrorResponse(error, "OpenAlex search failed.");
  }
}
