import { NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/repository";
import { verifyAuthorName } from "@/lib/verification";

const claimSchema = z.object({
  staffName: z.string().min(2),
  institution: z.string().optional(),
  researchArea: z.string().optional(),
  publicationTitle: z.string().min(2),
  authors: z.array(z.string()).default([]),
  doi: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = claimSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid claim." }, { status: 400 });
  const author = verifyAuthorName(parsed.data.staffName, parsed.data.authors.length ? parsed.data.authors : [parsed.data.staffName]);
  const metadataBoost = (parsed.data.institution ? 8 : 0) + (parsed.data.researchArea ? 7 : 0) + (parsed.data.doi ? 5 : 0);
  const confidence = Math.min(100, Math.round(author.verificationScore * 0.8 + metadataBoost));
  const status = confidence >= 80 ? "AUTO_APPROVED" : "ICT_REVIEW";
  await logAudit(`Publication claim ${status}: ${parsed.data.publicationTitle}`, "claim-system");
  return NextResponse.json({ status, confidence });
}
