import { NextResponse } from "next/server";
import { readNonEmptyEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const nextAuthSecret = readNonEmptyEnv("NEXTAUTH_SECRET");
  const authSecret = readNonEmptyEnv("AUTH_SECRET");
  const nextAuthUrl = readNonEmptyEnv("NEXTAUTH_URL");
  const vercelUrl = readNonEmptyEnv("VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL");

  return NextResponse.json({
    ok: Boolean(nextAuthSecret || authSecret),
    secrets: {
      NEXTAUTH_SECRET: Boolean(nextAuthSecret),
      AUTH_SECRET: Boolean(authSecret)
    },
    urls: {
      NEXTAUTH_URL: Boolean(nextAuthUrl),
      VERCEL_URL: Boolean(vercelUrl)
    },
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown"
  });
}
