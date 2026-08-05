import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimiter";
import { EVENT_TYPES, recordEvent, type TrackedEvent } from "@/lib/tracking-store";

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
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: "Expected an array of events" }, { status: 400 });
  }

  let stored = 0;
  for (const raw of body.slice(0, MAX_BATCH)) {
    const event = validateEvent(raw);
    if (event) {
      await recordEvent(event);
      stored++;
    }
  }

  return NextResponse.json({ ok: true, stored });
}

function validateEvent(raw: unknown): TrackedEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const ty = typeof r.ty === "string" ? r.ty.slice(0, 64) : "";
  if (!EVENT_TYPES.has(ty)) return null;

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
