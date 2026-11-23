import { NextResponse } from "next/server";
import { toCsv } from "@/lib/reports";
import { listPublications, listScores, listUsers } from "@/lib/repository";
import { requireApiUser } from "@/lib/session";

export async function GET(_: Request, { params }: { params: Promise<{ type: string }> }) {
  const auth = await requireApiUser(["SUPER_ADMIN", "ICT_PERSONNEL"]);
  if (auth.response) return auth.response;
  const { type } = await params;
  if (type !== "csv") return NextResponse.json({ error: "Only CSV export is implemented in the API route. PDF/Excel hooks are ready for renderer integration." }, { status: 400 });
  const [users, publications, scores] = await Promise.all([listUsers(), listPublications(), listScores()]);
  return new NextResponse(toCsv(users, publications, scores), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=esara-report-${new Date().toISOString().slice(0, 10)}.csv`
    }
  });
}
