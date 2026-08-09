import { store } from "@/lib/abuse/store";

export const ATTEMPT_TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_ATTEMPT_ID = 64;
const MAX_QUESTION_ID = 64;
const MAX_ANSWERS = 20;
const MAX_TIME_MS = 60_000;

export interface AttemptAnswer {
  questionId: string;
  correct: boolean;
  timeMs: number;
}

export interface AttemptPayload {
  attemptId: string;
  answers: AttemptAnswer[];
  durationMs: number;
}

/** Validates a raw `/api/quiz/attempt` beacon body. */
export function validateAttemptPayload(raw: unknown): AttemptPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const attemptId =
    typeof r.attemptId === "string" ? r.attemptId.slice(0, MAX_ATTEMPT_ID) : "";
  if (attemptId.length === 0) return null;

  if (!Array.isArray(r.answers) || r.answers.length > MAX_ANSWERS) return null;
  const answers: AttemptAnswer[] = [];
  for (const a of r.answers.slice(0, MAX_ANSWERS)) {
    if (!a || typeof a !== "object") return null;
    const item = a as Record<string, unknown>;
    const questionId =
      typeof item.questionId === "string" ? item.questionId.slice(0, MAX_QUESTION_ID) : "";
    if (questionId.length === 0) return null;
    const correct = item.correct;
    if (typeof correct !== "boolean") return null;
    const timeMs = typeof item.timeMs === "number" && Number.isFinite(item.timeMs) ? item.timeMs : NaN;
    if (!Number.isFinite(timeMs) || timeMs < 0 || timeMs > MAX_TIME_MS) return null;
    answers.push({ questionId, correct, timeMs });
  }

  const durationMs = typeof r.durationMs === "number" ? r.durationMs : NaN;
  if (!Number.isFinite(durationMs) || durationMs < 0) return null;

  return { attemptId, answers, durationMs };
}

/** Persists a full attempt record for analytics (TTL 7d). */
export async function saveAttempt(payload: AttemptPayload): Promise<void> {
  await store.set(`quiz:attempt:${payload.attemptId}`, payload, { ex: ATTEMPT_TTL_SECONDS });
}
