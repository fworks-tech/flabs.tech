import { NextResponse } from "next/server";

import { store } from "@/lib/abuse/store";

/**
 * Client IP from the rightmost `X-Forwarded-For` entry: the trusted proxy
 * appends its own hop last, so the leftmost value is spoofable and must
 * never be used (see docs/adr/002-abuse-prevention.mdx).
 */
export function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff ? (xff.split(",").pop() ?? "").trim() : "unknown";
}

/**
 * Durable per-IP rate limit backed by the store adapter (survives cold
 * starts, unlike the in-memory rateLimiter). Returns a 429 response when
 * the caller exceeded `max` requests in the 60s window, or null.
 */
export async function isRateLimited(
  namespace: string,
  request: Request,
  max: number,
): Promise<NextResponse | null> {
  const count = await store.incr(`quiz:rl:${namespace}:${clientIp(request)}`, 60);
  if (count > max) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }
  return null;
}
