import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/features/quiz/lib/rateLimit";
import { addRating, validateRatingPayload } from "@/features/quiz/lib/ratings";

export const runtime = "nodejs";

const MAX_RATINGS_PER_MINUTE = 3;

/** "Do you recommend this test?" — thumbs up/down + optional comment. */
export async function POST(request: NextRequest) {
  const limited = await isRateLimited("rating", request, MAX_RATINGS_PER_MINUTE);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = validateRatingPayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await addRating(payload);
  return NextResponse.json({ ok: true });
}
