import { NextRequest, NextResponse } from "next/server";

import { markFeedbackRead } from "@/features/quiz/lib/feedback";

export const runtime = "nodejs";

const MAX_ID = 64;

/** Marks a feedback entry as reviewed (admin only by route placement). */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const id = (body as Record<string, unknown>).id;
  if (typeof id !== "string" || id.length === 0 || id.length > MAX_ID) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await markFeedbackRead(id);
  return NextResponse.json({ ok: true });
}
