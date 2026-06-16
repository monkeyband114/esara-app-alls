import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!redis) {
    return NextResponse.json(
      {
        ok: false,
        error: "Redis is not configured",
        requiredEnv: [
          "UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN",
          "KV_REST_API_URL + KV_REST_API_TOKEN"
        ]
      },
      { status: 503 }
    );
  }

  const result = await redis.ping();
  return NextResponse.json({ ok: result === "PONG", result });
}
