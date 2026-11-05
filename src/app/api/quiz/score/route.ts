import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { buildDeck } from '@/features/quiz/data/questions';
import { clientIp, isRateLimited } from '@/features/quiz/lib/rateLimit';
import {
  ALL_TIME_KEY,
  leaderboardMember,
  validateScoreSubmission,
  weeklyKey,
  weeklyTtlSeconds,
  type ScorePayload,
} from '@/features/quiz/lib/leaderboard';
import { scoreAnswers } from '@/features/quiz/lib/scoring';
import { store } from '@/lib/abuse/store';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const MAX_SCORES_PER_MINUTE = 10;
const TOP_N = 100;
const ATTEMPT_TTL_SECONDS = 7 * 24 * 60 * 60;

interface RunRecord {
  seed: number;
  issuedAt: number;
  /** SHA-256 prefix of the issuing client IP; absent on legacy runs. */
  ipHash?: string;
}

/**
 * Saves a finished run: replaying the server-issued seed against the picked
 * answers derives the score, so the client cannot post an arbitrary one.
 * Then inserts into the all-time + weekly leaderboards (weekly key expires
 * at the next Monday 00:00 UTC), trims to the top 100, persists the attempt
 * record and returns the player's 0-based rank.
 */
export async function POST(request: NextRequest) {
  const limited = await isRateLimited('score', request, MAX_SCORES_PER_MINUTE);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const submission = validateScoreSubmission(body);
  if (!submission) {
    logger.warn({ body }, 'score validation failed');
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // One-shot run record: consuming it with getdel stops a replayed submission.
  const run = await store.getdel<RunRecord>(`quiz:run:${submission.runId}`);
  if (!run || !Number.isInteger(run.seed)) {
    logger.warn({ runId: submission.runId }, 'score submitted for an unknown run');
    return NextResponse.json({ error: 'Unknown or expired run' }, { status: 400 });
  }

  // Bind the run to the issuing client so a leaked runId+seed cannot be
  // redeemed from a different origin. Legacy records (no ipHash) are allowed.
  if (run.ipHash) {
    const requesterHash = createHash('sha256').update(clientIp(request)).digest('hex').slice(0, 16);
    if (requesterHash !== run.ipHash) {
      logger.warn({ runId: submission.runId }, 'score submitted from a different client');
      return NextResponse.json({ error: 'Unknown or expired run' }, { status: 400 });
    }
  }

  const deck = buildDeck(run.seed);
  if (submission.answers.length > deck.length) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { score, correct, total, maxStreak } = scoreAnswers(deck, submission.answers);
  const payload: ScorePayload = {
    displayName: submission.displayName,
    score,
    correct,
    total,
    maxStreak,
    durationMs: submission.durationMs,
  };

  const id = crypto.randomUUID();
  const member = leaderboardMember(payload, id);

  await store.zadd(ALL_TIME_KEY, score, member);
  await store.zadd(weeklyKey(), score, member, weeklyTtlSeconds());
  // Ranks are ascending (0 = lowest score), so drop the lowest ranks to keep
  // the highest `TOP_N` entries.
  await store.zremrangebyrank(ALL_TIME_KEY, 0, -(TOP_N + 1));
  await store.set(`quiz:attempt:${id}`, payload, { ex: ATTEMPT_TTL_SECONDS });

  const rank = await store.zrevrank(ALL_TIME_KEY, member);

  logger.info({ id, displayName: payload.displayName, score, rank }, 'score saved');

  return NextResponse.json({ ok: true, id, rank, saved: true });
}
