import { NextResponse } from "next/server";
import { searchOpenAlexPublicationCandidates } from "@/lib/openalex";
import { getUser } from "@/lib/repository";

export async function POST(request: Request) {
  const { userId, query } = (await request.json()) as { userId: string; query?: string };
  const user = await getUser(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const candidates = await searchOpenAlexPublicationCandidates(user.fullName, query, 12);
  return NextResponse.json({ candidates });
}
