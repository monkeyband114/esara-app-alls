import { NextResponse } from "next/server";
import { globalSearch } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return NextResponse.json(await globalSearch(searchParams.get("q") ?? ""));
}
