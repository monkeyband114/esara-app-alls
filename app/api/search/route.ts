import { NextResponse } from "next/server";
import { globalSearch } from "@/lib/search";
import { requireApiUser } from "@/lib/session";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (auth.response) return auth.response;
  const { searchParams } = new URL(request.url);
  return NextResponse.json(await globalSearch(searchParams.get("q") ?? ""));
}
