import { NextResponse } from "next/server";
import { OpenAlexError } from "@/lib/openalex";

/** Turns a thrown error into a JSON error response so clients never receive an empty body. */
export function apiErrorResponse(error: unknown, fallback = "Something went wrong. Please try again.") {
  if (error instanceof OpenAlexError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
