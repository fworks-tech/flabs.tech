import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimiter";
import { EVENT_TYPES_SET, recordEvent, type TrackedEvent } from "@/lib/tracking-store";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const MAX_BATCH = 25;
const MAX_STRING_LEN = 200;
const MAX_REFERRER_LEN = 300;
const MAX_EVENTS_PER_MINUTE = 120;

/**
 * Ingest endpoint for the self-hosted analytics. Receives a JSON array of
 * events via `sendBeacon`. Validates and aggregates into Redis.
 *
 * Privacy: no IPs are stored; visitor ids are pseudonymous UUIDs.
 */
export async function POST(request: NextRequest) {
  const xff = request.headers.get("x-forwarded-for");
  const ip = xff ? (xff.split(",").pop() ?? "").trim() : "unknown";
  const limited = rateLimit(`analytics:${ip}`, MAX_EVENTS_PER_MINUTE, 60_000);
  if (!limited.allowed) {
    logger.warn({ ip, retryAfter: limited.retryAfter }, "analytics ingest rate-limited");
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logger.warn({ ip }, "analytics ingest invalid JSON");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body)) {
    logger.warn({ ip }, "analytics ingest expected array");
    return NextResponse.json({ error: "Expected an array of events" }, { status: 400 });
  }

  const incoming = body.slice(0, MAX_BATCH);
  let stored = 0;
  let rejected = 0;
  for (const raw of incoming) {
    const event = validateEvent(raw);
    if (event) {
      await recordEvent(event);
      stored++;
    } else {
      rejected++;
    }
  }

  logger.info({ stored, rejected, total: incoming.length }, "analytics ingest");
  return NextResponse.json({ ok: true, stored });
}

function validateEvent(raw: unknown): TrackedEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const ty = typeof r.ty === "string" ? r.ty.slice(0, 64) : "";
  if (!EVENT_TYPES_SET.has(ty)) return null;

  const t = typeof r.t === "number" && Number.isFinite(r.t) ? Math.floor(r.t) : Date.now();
  const uid = typeof r.uid === "string" ? r.uid.slice(0, 64) : undefined;
  const sid = typeof r.sid === "string" ? r.sid.slice(0, 64) : undefined;
  if (!uid && !sid) return null;

  return {
    t,
    ty,
    p: typeof r.p === "string" ? r.p.slice(0, MAX_STRING_LEN) : undefined,
    uid,
    sid,
    d: typeof r.d === "string" ? r.d.slice(0, 20) : undefined,
    b: typeof r.b === "string" ? r.b.slice(0, 20) : undefined,
    r: typeof r.r === "string" ? r.r.slice(0, MAX_REFERRER_LEN) : undefined,
    v: typeof r.v === "number" && Number.isFinite(r.v) ? r.v : undefined,
  };
}
