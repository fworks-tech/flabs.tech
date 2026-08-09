import { NextRequest, NextResponse } from "next/server";

import { isRateLimited } from "@/features/quiz/lib/rateLimit";
import {
  addFeedback,
  validateFeedbackPayload,
  type FeedbackItem,
} from "@/features/quiz/lib/feedback";

export const runtime = "nodejs";

const MAX_FEEDBACK_PER_MINUTE = 10;

/** Reports an issue with a question (reason enum + optional message). */
export async function POST(request: NextRequest) {
  const limited = await isRateLimited("fb", request, MAX_FEEDBACK_PER_MINUTE);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = validateFeedbackPayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const item: FeedbackItem = {
    id: crypto.randomUUID(),
    ...payload,
    at: Date.now(),
    uid: crypto.randomUUID(),
  };
  await addFeedback(item);

  return NextResponse.json({ ok: true });
}
