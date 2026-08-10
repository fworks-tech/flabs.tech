import { store } from "@/lib/abuse/store";
import { sanitizeInput } from "./leaderboard";

export const FEEDBACK_REASONS = ["wrong-answer", "unclear", "typo", "other"] as const;
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number];

export interface FeedbackItem {
  id: string;
  questionId: string;
  reason: FeedbackReason;
  message: string;
  at: number;
  uid: string;
}

export const FEEDBACK_KEY = "quiz:feedback";
export const FEEDBACK_TTL_SECONDS = 30 * 24 * 60 * 60;
export const MAX_FEEDBACK = 500;
const MAX_QUESTION_ID = 64;
const MAX_MESSAGE = 200;

/** Validates a raw `/api/quiz/feedback` body. */
export function validateFeedbackPayload(raw: unknown): Omit<FeedbackItem, "id" | "at" | "uid"> | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const questionId = typeof r.questionId === "string" ? r.questionId.slice(0, MAX_QUESTION_ID) : "";
  if (questionId.length === 0) return null;

  const reason = typeof r.reason === "string" ? r.reason : "";
  if (!FEEDBACK_REASONS.includes(reason as FeedbackReason)) return null;

  const message =
    typeof r.message === "string" ? sanitizeInput(r.message).slice(0, MAX_MESSAGE) : "";

  return { questionId, reason: reason as FeedbackReason, message };
}

/** Appends feedback to the bounded list (last 500, 30d TTL). */
export async function addFeedback(item: FeedbackItem): Promise<void> {
  const list = (await store.get<FeedbackItem[]>(FEEDBACK_KEY)) ?? [];
  list.push(item);
  await store.set(FEEDBACK_KEY, list.slice(-MAX_FEEDBACK), { ex: FEEDBACK_TTL_SECONDS });
}

export async function listFeedback(): Promise<FeedbackItem[]> {
  const list = (await store.get<FeedbackItem[]>(FEEDBACK_KEY)) ?? [];
  return list.slice().reverse();
}

export async function markFeedbackRead(id: string): Promise<void> {
  await store.set(`quiz:feedback:read:${id}`, true, { ex: FEEDBACK_TTL_SECONDS });
}

export async function isFeedbackRead(id: string): Promise<boolean> {
  return (await store.get<boolean>(`quiz:feedback:read:${id}`)) === true;
}
