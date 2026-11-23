import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-error";
import { recalculateInstitutionMetrics } from "@/lib/recalculate";
import { logAudit, updatePublication } from "@/lib/repository";
import { requireApiUser } from "@/lib/session";

const bodySchema = z.object({ status: z.enum(["VERIFIED", "REJECTED", "MANUAL_REVIEW"]) });

/** ICT verification decision on one publication. Rejected publications stop counting toward SRS. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiUser(["ICT_PERSONNEL", "SUPER_ADMIN"]);
    if (auth.response) return auth.response;
    const { id } = await params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ error: "Status must be VERIFIED, REJECTED, or MANUAL_REVIEW." }, { status: 400 });

    const publication = await updatePublication(decodeURIComponent(id), { verificationStatus: parsed.data.status, verifiedBy: auth.user.id });
    if (!publication) return NextResponse.json({ error: "Publication not found." }, { status: 404 });
    await recalculateInstitutionMetrics();
    await logAudit(`Marked publication ${parsed.data.status.replace("_", " ").toLowerCase()}: ${publication.title}`, auth.user.id);
    return NextResponse.json({ publication });
  } catch (error) {
    return apiErrorResponse(error, "Could not update the publication.");
  }
}
