import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/features/quiz/lib/rateLimit";
import { saveAttempt, validateAttemptPayload } from "@/features/quiz/lib/attempt";

export const runtime = "nodejs";

const MAX_ATTEMPTS_PER_MINUTE = 20;

/**
 * Full attempt detail log, sent via `sendBeacon` when a run ends.
 * Best-effort: a failed beacon never affects the player.
 */
export async function POST(request: NextRequest) {
  const limited = await isRateLimited("attempt", request, MAX_ATTEMPTS_PER_MINUTE);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = validateAttemptPayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await saveAttempt(payload);
  return NextResponse.json({ ok: true });
}
