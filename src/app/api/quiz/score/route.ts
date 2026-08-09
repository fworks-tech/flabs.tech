import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/features/quiz/lib/rateLimit";
import {
  ALL_TIME_KEY,
  leaderboardMember,
  validateScorePayload,
  weeklyKey,
  weeklyTtlSeconds,
} from "@/features/quiz/lib/leaderboard";
import { store } from "@/lib/abuse/store";

export const runtime = "nodejs";

const MAX_SCORES_PER_MINUTE = 10;
const TOP_N = 100;
const ATTEMPT_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Saves a finished run: inserts into the all-time + weekly leaderboards
 * (weekly key expires at the next Monday 00:00 UTC), trims to the top
 * 100, persists the attempt record and returns the player's 0-based rank.
 *
 * Note: the leaderboard is a growth surface, not a rigorous benchmark —
 * the validation floors (duration sanity, caps) mitigate obvious forgery
 * only.
 */
export async function POST(request: NextRequest) {
  const limited = await isRateLimited("score", request, MAX_SCORES_PER_MINUTE);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = validateScorePayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const member = leaderboardMember(payload, id);

  await store.zadd(ALL_TIME_KEY, payload.score, member);
  await store.zadd(weeklyKey(), payload.score, member, weeklyTtlSeconds());
  await store.zremrangebyrank(ALL_TIME_KEY, TOP_N, -1);
  await store.set(`quiz:attempt:${id}`, payload, { ex: ATTEMPT_TTL_SECONDS });

  const rank = await store.zrevrank(ALL_TIME_KEY, member);
  return NextResponse.json({ ok: true, id, rank });
}
