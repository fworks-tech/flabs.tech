import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { clientIp, isRateLimited } from '@/features/quiz/lib/rateLimit';
import { store } from '@/lib/abuse/store';

export const runtime = 'nodejs';

const MAX_STARTS_PER_MINUTE = 20;
/** A run must be submitted within this window (also the seed's TTL). */
export const RUN_TTL_SECONDS = 30 * 60;

/**
 * Starts a run: issues the deck seed and keeps it server-side, so
 * `/api/quiz/score` can replay the answers instead of trusting a score.
 * One-shot: the score route consumes the record with `getdel`.
 */
export async function POST(request: NextRequest) {
  const limited = await isRateLimited('quiz-start', request, MAX_STARTS_PER_MINUTE);
  if (limited) return limited;

  const runId = crypto.randomUUID();
  const seed = crypto.getRandomValues(new Uint32Array(1))[0] % 2 ** 31;

  const ipHash = createHash('sha256').update(clientIp(request)).digest('hex').slice(0, 16);
  await store.set(
    `quiz:run:${runId}`,
    { seed, issuedAt: Date.now(), ipHash },
    { ex: RUN_TTL_SECONDS },
  );

  return NextResponse.json({ runId, seed });
}
