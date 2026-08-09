import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/features/quiz/lib/rateLimit";
import { countReferralClick } from "@/features/quiz/lib/ratings";

export const runtime = "nodejs";

const MAX_CLICKS_PER_MINUTE = 10;

/**
 * Server-side referral click counter, fired via sendBeacon from the CTA.
 * Counts even when PostHog consent is declined (privacy-safe: no PII).
 */
export async function POST(request: NextRequest) {
  const limited = await isRateLimited("referral", request, MAX_CLICKS_PER_MINUTE);
  if (limited) return limited;

  await countReferralClick();
  return NextResponse.json({ ok: true });
}
