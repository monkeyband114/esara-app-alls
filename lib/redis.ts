import { Redis } from "@upstash/redis";

export const redis =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN
      })
    : null;

export function requireRedis() {
  if (!redis) {
    throw new Error("Upstash Redis is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN.");
  }
  return redis;
}

export function key(prefix: string, id: string) {
  return `${prefix}:${id}`;
}
