import { NextRequest, NextResponse } from "next/server";

import {
  ALL_TIME_KEY,
  parseMember,
  type LeaderboardEntry,
  weeklyKey,
} from "@/features/quiz/lib/leaderboard";
import { store } from "@/lib/abuse/store";

export const runtime = "nodejs";

const TOP_N = 10;
const ALLOWED_WEEKS = new Set(["current", "all"]);

/** Top 10 leaderboard entries. `?week=current` (default) or `?week=all`. */
export async function GET(request: NextRequest) {
  const week = request.nextUrl.searchParams.get("week") ?? "current";
  if (!ALLOWED_WEEKS.has(week)) {
    return NextResponse.json({ error: "Invalid week" }, { status: 400 });
  }

  const key = week === "all" ? ALL_TIME_KEY : weeklyKey();
  const members = await store.zrevrange(key, 0, TOP_N - 1);

  const entries: LeaderboardEntry[] = [];
  for (const [index, member] of members.entries()) {
    const parsed = parseMember(member);
    if (parsed) {
      entries.push({ rank: index, ...parsed });
    }
  }

  return NextResponse.json({ entries });
}
