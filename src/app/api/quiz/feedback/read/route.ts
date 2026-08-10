import { NextRequest, NextResponse } from 'next/server';

import { isRateLimited } from '@/features/quiz/lib/rateLimit';
import { listFeedback, markFeedbackRead, MAX_FEEDBACK } from '@/features/quiz/lib/feedback';

export const runtime = 'nodejs';

const MAX_ID = 64;
const MAX_IDS = MAX_FEEDBACK;
const MAX_READS_PER_MINUTE = 30;

/** Marks feedback entries as reviewed (admin only by route placement). */
export async function POST(request: NextRequest) {
  const limited = await isRateLimited('fb-read', request, MAX_READS_PER_MINUTE);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const id = raw.id;
  const ids = raw.ids;

  // `id` and `ids` are mutually exclusive; `ids` must be all strings (mixed
  // arrays are rejected rather than silently filtered).
  if (id !== undefined && ids !== undefined) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  let targets: string[];
  if (ids !== undefined) {
    if (!Array.isArray(ids) || !ids.every((v) => typeof v === 'string')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    targets = [...new Set(ids)];
  } else if (typeof id === 'string') {
    targets = [id];
  } else {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  if (
    targets.length === 0 ||
    targets.length > MAX_IDS ||
    targets.some((t) => t.length === 0 || t.length > MAX_ID)
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // Only mark entries that actually exist — unknown ids are dropped, and a
  // request that names none gets rejected (also keeps the read-marker keyspace
  // bounded by real feedback ids).
  const known = new Set((await listFeedback()).map((f) => f.id));
  const validTargets = targets.filter((t) => known.has(t));
  if (validTargets.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await Promise.all(validTargets.map((t) => markFeedbackRead(t)));
  return NextResponse.json({ ok: true, count: validTargets.length });
}
