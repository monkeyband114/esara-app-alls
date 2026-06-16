import { Redis } from "@upstash/redis";
import { readNonEmptyEnv } from "@/lib/env";

const redisUrl = readNonEmptyEnv("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL");
const redisToken = readNonEmptyEnv("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN");

export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken
      })
    : null;

export function requireRedis() {
  if (!redis) {
    throw new Error("Upstash Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN, or KV_REST_API_URL and KV_REST_API_TOKEN.");
  }
  return redis;
}

export function key(prefix: string, id: string) {
  return `${prefix}:${id}`;
}
