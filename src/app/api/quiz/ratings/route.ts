import { NextResponse } from "next/server";

import { getRatingsAggregate } from "@/features/quiz/lib/ratings";

export const runtime = "nodejs";

/**
 * Aggregated recommendation counts for the start card
 * ("92% of players recommend this quiz"). Null when the store is
 * unreachable — the client hides the stat, never blocks the game.
 */
export async function GET() {
  const ratings = await getRatingsAggregate();
  if (!ratings) {
    return NextResponse.json({ ratings: null });
  }
  return NextResponse.json({ ratings });
}
