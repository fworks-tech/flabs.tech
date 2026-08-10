import { NextRequest, NextResponse } from 'next/server';

import { markFeedbackRead } from '@/features/quiz/lib/feedback';

export const runtime = 'nodejs';

const MAX_ID = 64;
const MAX_IDS = 200;

/** Marks feedback entries as reviewed (admin only by route placement). */
export async function POST(request: NextRequest) {
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
  const id = typeof raw.id === 'string' ? raw.id : undefined;
  const ids = Array.isArray(raw.ids) ? raw.ids : undefined;

  const targets =
    ids !== undefined
      ? ids.filter((v): v is string => typeof v === 'string')
      : id !== undefined
        ? [id]
        : [];

  if (
    targets.length === 0 ||
    targets.length > MAX_IDS ||
    targets.some((t) => t.length === 0 || t.length > MAX_ID)
  ) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  await Promise.all(targets.map((t) => markFeedbackRead(t)));
  return NextResponse.json({ ok: true, count: targets.length });
}
