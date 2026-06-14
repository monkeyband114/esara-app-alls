import { NextResponse } from "next/server";
import { toCsv } from "@/lib/reports";
import { listPublications, listScores, listUsers } from "@/lib/repository";

export async function GET(_: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const [users, publications, scores] = await Promise.all([listUsers(), listPublications(), listScores()]);
  if (type !== "csv") return NextResponse.json({ error: "Only CSV export is implemented in the API route. PDF/Excel hooks are ready for renderer integration." }, { status: 400 });
  return new NextResponse(toCsv(users, publications, scores), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=esara-report.csv"
    }
  });
}
